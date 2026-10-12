<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Enums\UserType;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SurveyorAssignment;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

class BdnController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = request()->user();
        $assignment = SurveyorAssignment::resolve($user);

        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $vesselSearch = trim((string) $request->input('vessel', ''));

        $sortKey = (string) $request->input('sort', 'created_at');
        $direction = $request->input('dir') === 'asc' ? 'asc' : 'desc';
        if (! in_array($sortKey, self::sortableColumns(), true)) {
            $sortKey = 'created_at';
            $direction = 'desc';
        }

        $query = Bdn::with(['order.customer', 'deliveryLocation', 'agent', 'barge'])
            ->select('bdns.*');

        if ($user->type->value === 'surveyor') {
            if ($assignment['denied']) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereHas('order', fn ($q) => $q
                    ->where(fn ($orders) => $orders
                        ->where(fn ($bargeOrders) => $bargeOrders
                            ->where('delivery_mode', DeliveryMode::Barge->value)
                            ->orWhereNull('delivery_mode'))
                        ->whereIn('barge_id', $assignment['barge_ids']))
                    ->orWhereIn('delivery_mode', $assignment['delivery_modes']));
            }
        }

        $query->when($vesselSearch !== '', fn ($query) => $query->whereHas('order', fn ($order) => $order
            ->where('vessel_name', 'like', '%'.$vesselSearch.'%')));

        self::applySort($query, $sortKey, $direction);

        $bdns = $query->paginate($perPage)
            ->withQueryString()
            ->through(fn (Bdn $bdn): array => [
                ...$bdn->toArray(),
                'order_number' => $bdn->order?->order_number,
                'customer_name' => $bdn->order?->customer?->name,
                'vessel_name' => $bdn->order?->vessel_name,
                'delivery_location' => $bdn->deliveryLocation?->name,
                'agent_name' => $bdn->agent?->name,
                'barge_name' => $bdn->barge?->name,
            ]);

        return Inertia::render('bdns/index', [
            'bdns' => $bdns,
            'filters' => [
                'vessel' => $vesselSearch,
                'sort' => $sortKey,
                'dir' => $direction,
            ],
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
            'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
        ]);
    }

    /**
     * @return list<string>
     */
    private static function sortableColumns(): array
    {
        return [
            'bdn_number',
            'order_number',
            'customer_name',
            'vessel_name',
            'delivery_date',
            'delivery_location',
            'barge_name',
            'agent_name',
            'vlsfo_metric_ton',
            'mgo_metric_ton',
            'hsfo_metric_ton',
            'sampling_method',
            'created_at',
        ];
    }

    /**
     * Apply a user-chosen sort. Relation columns use left joins so their names
     * can be ordered without switching to eager subqueries.
     */
    private static function applySort(Builder $query, string $sort, string $direction): void
    {
        match ($sort) {
            'order_number', 'vessel_name' => $query
                ->leftJoin('orders', 'orders.id', '=', 'bdns.order_id')
                ->orderByRaw("LOWER(orders.{$sort}) {$direction} NULLS LAST"),
            'customer_name' => $query
                ->leftJoin('orders', 'orders.id', '=', 'bdns.order_id')
                ->leftJoin('customers', 'orders.customer_id', '=', 'customers.sap_id')
                ->orderByRaw("LOWER(customers.name) {$direction} NULLS LAST"),
            'delivery_location' => $query
                ->leftJoin('supply_locations', 'supply_locations.id', '=', 'bdns.delivery_location_id')
                ->orderByRaw("LOWER(supply_locations.name) {$direction} NULLS LAST"),
            'agent_name' => $query
                ->leftJoin('agents', 'agents.id', '=', 'bdns.agent_id')
                ->orderByRaw("LOWER(agents.name) {$direction} NULLS LAST"),
            'barge_name' => $query
                ->leftJoin('barges', 'barges.imo', '=', 'bdns.barge_id')
                ->orderByRaw("LOWER(barges.name) {$direction} NULLS LAST"),
            'bdn_number', 'sampling_method' => $query->orderByRaw("LOWER(bdns.{$sort}) {$direction} NULLS LAST"),
            default => $query->orderByRaw("bdns.{$sort} {$direction} NULLS LAST"),
        };

        $query->orderBy('bdns.id', $direction);
    }

    public function ebdn(Order $order): PdfBuilder
    {
        $user = request()->user();

        if (in_array($user->type, [UserType::Sales, UserType::Operations], true)) {
            abort_unless(in_array($order->status, OrderStatus::completedStatuses(), true), 403);
            abort_unless($order->bdn()->exists(), 404);
        } else {
            SurveyorAssignment::authorizeOrder($user, $order);
        }

        $order->load(['port', 'bdn.deliveryLocation', 'bdn.agent', 'bdn.barge']);
        $bdn = $order->bdn;

        return Pdf::view('pdf.bdn', [
            'order' => $order,
            'bdn' => $bdn,
            'deliveryLocationLabel' => $bdn?->deliveryLocation?->name,
            'deliveryMethodLabel' => $bdn?->delivery_method !== null
                ? Str::headline($bdn->delivery_method->name)
                : null,
        ])
            ->format('a4')
            ->margins(20, 12, 20, 12)
            ->name("eBDN-{$order->order_number}.pdf")
            ->when(request()->boolean('download'), fn (PdfBuilder $pdf): PdfBuilder => $pdf->download());
    }

    /**
     * Upsert the order's Bunker Delivery Note. No flash toast: the surveyor
     * dialog autosaves, and its own status line reports the result.
     */
    public function update(Request $request, Order $order): RedirectResponse
    {
        // Non-privileged users cannot submit a barge_id different from the order's.
        if (! $request->user()->type->isPrivileged()) {
            $submitted = $request->input('barge_id');
            if ($submitted !== null && $submitted !== $order->barge_id) {
                abort(403);
            }
        }

        SurveyorAssignment::authorizeBdnBarge(
            $request->user(),
            $order,
        );

        $validated = $request->validate($this->rules($order));

        if (array_key_exists('product_sample_seals', $validated)) {
            $validated['product_sample_seals'] = $this->normaliseProductSampleSeals(
                $validated['product_sample_seals'] ?? [],
                $order,
            );
        }
        $effectiveDeliveryMethod = $validated['delivery_method'] ?? $order->delivery_mode;
        $effectiveDeliveryMethod = is_string($effectiveDeliveryMethod)
            ? DeliveryMode::tryFrom($effectiveDeliveryMethod)
            : $effectiveDeliveryMethod;

        // For surveyor users, force barge_id to the order's authorized barge.
        $assignment = SurveyorAssignment::resolve($request->user());
        if ($assignment['barge_ids'] !== [] && ! $request->user()->type->isPrivileged() && $order->barge_id !== null) {
            $validated['barge_id'] = $order->barge_id;
        }

        if ($effectiveDeliveryMethod !== null && $effectiveDeliveryMethod !== DeliveryMode::Barge) {
            $validated['barge_id'] = null;
        }

        if ($effectiveDeliveryMethod !== DeliveryMode::Truck) {
            $validated['truck_number'] = null;
        }

        $bdn = Bdn::updateOrCreate(
            ['order_id' => $order->id],
            [...$validated, 'bdn_number' => $order->bdn()->value('bdn_number') ?? "BDN-{$order->order_number}"],
        );

        $order->update(
            collect(FuelGrade::keys())
                ->mapWithKeys(fn (string $grade): array => [
                    "{$grade}_bdn_qty" => $bdn->{"{$grade}_metric_ton"},
                ])
                ->all(),
        );

        if ($order->status === OrderStatus::Delivered && $bdn->delivery_date !== null) {
            $order->update([
                'invoice_date' => $bdn->delivery_date,
                'payment_due_date' => $bdn->delivery_date->copy()->addDays($order->credit_terms?->days() ?? 0),
            ]);
        }

        OrderService::reprice($order);

        return back();
    }

    /**
     * Every field is optional: each autosave carries the whole form, however
     * little of the note has been filled in so far.
     *
     * @return array<string, array<int, mixed>>
     */
    private function rules(Order $order): array
    {
        $rules = [
            'delivery_date' => ['nullable', 'date'],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($order->port_id)],
            'vessel_flag' => ['nullable', 'string', 'max:255'],
            'grt' => ['nullable', 'numeric', 'min:0'],
            'pi_club' => ['nullable', 'string', 'max:255'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'owner_operator' => ['nullable', 'string', 'max:255'],
            'last_port_of_call' => ['nullable', 'string', 'max:255'],
            'destination_port' => ['nullable', 'string', 'max:255'],
            'delivery_method' => ['nullable', Rule::enum(DeliveryMode::class)],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'truck_number' => ['nullable', 'string', 'max:255'],
            'barge_alongside_at' => ['nullable', 'date'],
            'chief_engineer_invited' => ['nullable', 'boolean'],
            'chief_engineer_witnessed' => ['nullable', 'boolean'],
            'retained_samples_handed_over' => ['nullable', 'boolean'],
            'sampling_location' => ['nullable', Rule::enum(Sampling::class)],
            'sampling_method' => ['nullable', Rule::enum(SamplingMethod::class)],
            'product_sample_seals' => ['nullable', 'array'],
            'product_sample_seals.*' => ['nullable', 'array'],
            'product_sample_seals.*.*' => ['nullable', 'array'],
            'product_sample_seals.*.*.seal_number' => ['nullable', 'string', 'max:255'],
            'product_sample_seals.*.*.counter_seal_number' => ['nullable', 'string', 'max:255'],
        ];

        foreach (FuelGrade::keys() as $grade) {
            foreach (Bdn::TIMESHEET_FIELDS as $field) {
                $rules["{$grade}_{$field}"] = ['nullable', 'date'];
            }

            foreach (array_keys(Bdn::QUALITY_FIELDS) as $field) {
                $rules["{$grade}_{$field}"] = ['nullable', 'numeric', 'min:0'];
            }
        }

        foreach (Bdn::SAMPLE_TYPES as $sample) {
            $rules["{$sample}_seal_number"] = ['nullable', 'string', 'max:255'];
            $rules["{$sample}_counter_seal_number"] = ['nullable', 'string', 'max:255'];
        }

        return $rules;
    }

    /**
     * Keep only ordered products and known sample types in the nested seal map.
     *
     * @param  array<string, mixed>  $productSampleSeals
     * @return array<string, array<string, array{seal_number: string|null, counter_seal_number: string|null}>>
     */
    private function normaliseProductSampleSeals(array $productSampleSeals, Order $order): array
    {
        $orderedGrades = collect(FuelGrade::keys())
            ->filter(fn (string $grade): bool => (float) ($order->{"{$grade}_final_qty"} ?? 0) > 0)
            ->values();

        if ($orderedGrades->isEmpty()) {
            $orderedGrades = collect(FuelGrade::keys());
        }

        return $orderedGrades
            ->mapWithKeys(function (string $grade) use ($productSampleSeals): array {
                $samples = collect(Bdn::SAMPLE_TYPES)
                    ->mapWithKeys(function (string $sample) use ($productSampleSeals, $grade): array {
                        $values = $productSampleSeals[$grade][$sample] ?? [];

                        return [
                            $sample => [
                                'seal_number' => blank($values['seal_number'] ?? null) ? null : trim((string) $values['seal_number']),
                                'counter_seal_number' => blank($values['counter_seal_number'] ?? null) ? null : trim((string) $values['counter_seal_number']),
                            ],
                        ];
                    })
                    ->all();

                return [$grade => $samples];
            })
            ->all();
    }
}
