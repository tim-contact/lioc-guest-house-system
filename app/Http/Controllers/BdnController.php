<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SurveyorAssignment;
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
    public function index(): Response
    {
        /** @var User $user */
        $user = request()->user();
        $assignment = SurveyorAssignment::resolve($user);

        $query = Bdn::with(['order.customer', 'deliveryLocation', 'agent', 'barge'])->latest();

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

        $bdns = $query->get()
            ->map(fn (Bdn $bdn): array => [
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
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
            'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
        ]);
    }

    public function ebdn(Order $order): PdfBuilder
    {
        SurveyorAssignment::authorizeOrder(request()->user(), $order);

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
            ->name("eBDN-{$order->order_number}.pdf");
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
            'barge_alongside_at' => ['nullable', 'date'],
            'chief_engineer_invited' => ['nullable', 'boolean'],
            'chief_engineer_witnessed' => ['nullable', 'boolean'],
            'retained_samples_handed_over' => ['nullable', 'boolean'],
            'sampling_location' => ['nullable', Rule::enum(Sampling::class)],
            'sampling_method' => ['nullable', Rule::enum(SamplingMethod::class)],
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
}
