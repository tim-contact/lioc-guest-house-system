<?php

namespace App\Http\Controllers;

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\QualityClaim;
use App\Enums\Sampling;
use App\Models\Agent;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\EnquiryCustomer;
use App\Models\Order;
use App\Models\Port;
use App\Services\CreditService;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EnquiryController extends Controller
{
    public function index(): Response
    {
        $enquiries = Enquiry::with(['port', 'supplyLocation', 'agent', 'enquiryCustomers.customer'])
            ->whereIn('status', EnquiryStatus::activeStatuses())
            ->latest()
            ->get();

        $creditAvailable = CreditService::availableByCustomer(
            $enquiries
                ->flatMap(fn (Enquiry $enquiry) => $enquiry->enquiryCustomers)
                ->map(fn (EnquiryCustomer $row): string => $row->customer_id)
                ->unique()
                ->all(),
        );

        $rows = $enquiries
            ->map(fn (Enquiry $enquiry): array => [
                'id' => $enquiry->id,
                'created_at' => $enquiry->created_at,
                'vessel_name' => $enquiry->vessel_name,
                'imo' => $enquiry->imo,
                'port_id' => $enquiry->port_id,
                'port' => $enquiry->port?->name,
                'laycan_from' => $enquiry->laycan_from,
                'laycan_to' => $enquiry->laycan_to,
                'status' => $enquiry->status->value,
                'agent_id' => $enquiry->agent_id,
                'sampling' => $enquiry->sampling->value,
                'supply_location_id' => $enquiry->supply_location_id,
                'supply_location' => $enquiry->supplyLocation?->name,
                'quality_claim' => $enquiry->quality_claim?->value,
                'instructions' => $enquiry->instructions,
                'barging_cost' => $enquiry->barging_cost,
                'vlsfo_quantity_low' => $enquiry->vlsfo_quantity_low,
                'vlsfo_quantity_high' => $enquiry->vlsfo_quantity_high,
                'vlsfo_product_type' => $enquiry->vlsfo_product_type?->value,
                'vlsfo_delivery_mode' => $enquiry->vlsfo_delivery_mode?->value,
                'mgo_quantity_low' => $enquiry->mgo_quantity_low,
                'mgo_quantity_high' => $enquiry->mgo_quantity_high,
                'mgo_product_type' => $enquiry->mgo_product_type?->value,
                'mgo_delivery_mode' => $enquiry->mgo_delivery_mode?->value,
                'hsfo_quantity_low' => $enquiry->hsfo_quantity_low,
                'hsfo_quantity_high' => $enquiry->hsfo_quantity_high,
                'hsfo_product_type' => $enquiry->hsfo_product_type?->value,
                'hsfo_delivery_mode' => $enquiry->hsfo_delivery_mode?->value,
                'customers' => $enquiry->enquiryCustomers->map(fn (EnquiryCustomer $row): array => [
                    'id' => $row->id,
                    'customer_id' => $row->customer_id,
                    'name' => $row->customer?->name,
                    'credit_limit' => $row->customer?->credit_limit,
                    'credit_available' => $creditAvailable[$row->customer_id] ?? null,
                    'credit_terms' => $row->credit_terms?->value,
                    'status' => $row->status->value,
                    'vlsfo_initial_offer' => $row->vlsfo_initial_offer,
                    'vlsfo_feedback_price' => $row->vlsfo_feedback_price,
                    'vlsfo_fixing_counter' => $row->vlsfo_fixing_counter,
                    'mgo_initial_offer' => $row->mgo_initial_offer,
                    'mgo_feedback_price' => $row->mgo_feedback_price,
                    'mgo_fixing_counter' => $row->mgo_fixing_counter,
                    'hsfo_initial_offer' => $row->hsfo_initial_offer,
                    'hsfo_feedback_price' => $row->hsfo_feedback_price,
                    'hsfo_fixing_counter' => $row->hsfo_fixing_counter,
                ])->all(),
            ]);

        return Inertia::render('enquiries/index', [
            'enquiries' => $rows,
            'customers' => Customer::orderBy('name')->get(['sap_id', 'name']),
            'ports' => Port::orderBy('name')->get(['id', 'name']),
            'agents' => Agent::orderBy('name')->get(['id', 'name', 'address']),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'productTypeOptions' => $this->enumOptions(ProductType::cases()),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'creditTermsOptions' => $this->enumOptions(CreditTerms::cases()),
            'samplingOptions' => $this->enumOptions(Sampling::cases()),
            'qualityClaimOptions' => $this->enumOptions(QualityClaim::cases()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Enquiry::create($request->validate($this->baseRules($request)));

        return $this->toast('Enquiry created.');
    }

    public function update(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $enquiry->update($request->validate([
            ...$this->baseRules($request),
            ...$this->productRules(),
        ]));

        return $this->toast('Enquiry saved.');
    }

    public function edit(): Response
    {
        return Inertia::render('enquiries/edit', [
            'enquiries' => Enquiry::with('supplyLocation')
                ->latest()
                ->get()
                ->map(fn (Enquiry $enquiry): array => [
                    ...$enquiry->toArray(),
                    'supply_location' => $enquiry->supplyLocation?->name,
                ]),
            'ports' => Port::orderBy('name')->get(['id', 'name']),
            'agents' => Agent::orderBy('name')->get(['id', 'name']),
            'statusOptions' => $this->enumOptions(EnquiryStatus::cases()),
            'samplingOptions' => $this->enumOptions(Sampling::cases()),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'qualityClaimOptions' => $this->enumOptions(QualityClaim::cases()),
            'productTypeOptions' => $this->enumOptions(ProductType::cases()),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
        ]);
    }

    public function editStore(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->editRules($request));
        $validated['barging_cost'] ??= 0;

        Enquiry::create($validated);

        return $this->toast('Enquiry created.');
    }

    public function editUpdate(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $validated = $request->validate($this->editRules($request, $enquiry));
        $validated['barging_cost'] ??= 0;

        $enquiry->update($validated);

        return $this->toast('Enquiry saved.');
    }

    public function destroy(Enquiry $enquiry): RedirectResponse
    {
        if ($enquiry->order()->exists()) {
            return $this->toast("Can't delete: an order references this enquiry.", 'error');
        }

        DB::transaction(function () use ($enquiry) {
            $enquiry->enquiryCustomers()->delete();
            $enquiry->delete();
        });

        return $this->toast('Enquiry deleted.');
    }

    /**
     * The core enquiry fields, shared by store(), update() and editRules().
     *
     * @return array<string, mixed>
     */
    private function baseRules(Request $request, ?Enquiry $enquiry = null): array
    {
        return [
            'vessel_name' => ['required', 'string', 'max:255'],
            'imo' => ['nullable', 'string', 'max:255'],
            'port_id' => ['nullable', 'exists:ports,id'],
            'supply_location_id' => $this->supplyLocationRules($request, $enquiry),
            'laycan_from' => ['nullable', 'date'],
            'laycan_to' => ['nullable', 'date', 'after_or_equal:laycan_from'],
        ];
    }

    /**
     * Validation rules for the admin enquiry edit page, covering the full fillable set.
     *
     * @return array<string, mixed>
     */
    private function editRules(Request $request, ?Enquiry $enquiry = null): array
    {
        return [
            ...$this->baseRules($request, $enquiry),
            'eta' => ['nullable', 'date'],
            'status' => ['required', Rule::enum(EnquiryStatus::class)],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'sampling' => ['required', Rule::enum(Sampling::class)],
            'quality_claim' => ['nullable', Rule::enum(QualityClaim::class)],
            'instructions' => ['nullable', 'string'],
            'barging_cost' => ['nullable', 'numeric', 'min:0'],
            ...$this->productRules(),
            ...$this->lostRules(),
        ];
    }

    /**
     * Per-product (VLSFO/MGO/HSFO) quantity, type and delivery-mode rules,
     * shared by the workflow update() and the admin editRules().
     *
     * @return array<string, mixed>
     */
    private function productRules(): array
    {
        $rules = [];

        foreach (FuelGrade::keys() as $product) {
            $rules["{$product}_quantity_low"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_quantity_high"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_product_type"] = ['nullable', Rule::enum(ProductType::class)];
            $rules["{$product}_delivery_mode"] = ['nullable', Rule::enum(DeliveryMode::class)];
        }

        return $rules;
    }

    /**
     * Who the enquiry was lost to, at what price and where — all optional.
     *
     * @return array<string, mixed>
     */
    private function lostRules(): array
    {
        $rules = [
            'lost_to' => ['nullable', 'string', 'max:255'],
            'lost_port' => ['nullable', 'string', 'max:255'],
        ];

        foreach (FuelGrade::keys() as $product) {
            $rules["{$product}_lost_price"] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }

    public function markLost(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $validated = $request->validate($this->lostRules());

        DB::transaction(function () use ($enquiry, $validated) {
            $enquiry->enquiryCustomers()->update(['status' => EnquiryCustomerStatus::Lost]);
            $enquiry->update([...$validated, 'status' => EnquiryStatus::Lost]);
        });

        return $this->toast('Enquiry marked lost.', 'info');
    }

    public function updateDetails(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $validated = $request->validate([
            'agent_id' => ['nullable', 'exists:agents,id'],
            'sampling' => ['required', Rule::enum(Sampling::class)],
            'supply_location_id' => $this->supplyLocationRules($request, $enquiry),
            'quality_claim' => ['nullable', Rule::enum(QualityClaim::class)],
            'instructions' => ['nullable', 'string'],
            'barging_cost' => ['nullable', 'numeric', 'min:0'],
            'generate_order' => ['boolean'],
        ]);

        $generateOrder = $validated['generate_order'] ?? false;

        DB::transaction(function () use ($enquiry, $validated, $generateOrder) {
            if ($generateOrder) {
                // Final submission: close out every customer that didn't win the stem.
                $enquiry->enquiryCustomers()
                    ->where('status', '!=', EnquiryCustomerStatus::Fixed)
                    ->update(['status' => EnquiryCustomerStatus::Lost]);
            }

            $enquiry->update([
                ...Arr::only($validated, ['agent_id', 'sampling', 'supply_location_id', 'quality_claim', 'instructions', 'barging_cost']),
                ...($generateOrder ? ['status' => EnquiryStatus::Won] : []),
            ]);

            if ($generateOrder) {
                $this->createOrderForEnquiry($enquiry);
            }
        });

        return $this->toast($generateOrder ? 'Order generated.' : 'Details saved.');
    }

    /**
     * Snapshot the won enquiry and its winning (fixed) customer into a new Order.
     * Idempotent: does nothing if an order already exists or no customer was fixed.
     */
    private function createOrderForEnquiry(Enquiry $enquiry): void
    {
        if ($enquiry->order()->exists()) {
            return;
        }

        $fixed = $enquiry->enquiryCustomers()
            ->where('status', EnquiryCustomerStatus::Fixed)
            ->first();

        if (! $fixed) {
            return;
        }

        $products = FuelGrade::keys();

        $productAttributes = collect($products)->flatMap(fn (string $product) => [
            "{$product}_quantity_low" => $enquiry->{"{$product}_quantity_low"},
            "{$product}_quantity_high" => $enquiry->{"{$product}_quantity_high"},
            "{$product}_qty_range" => OrderService::formatQtyRange(
                $enquiry->{"{$product}_quantity_low"},
                $enquiry->{"{$product}_quantity_high"},
            ),
            "{$product}_rate" => $fixed->{"{$product}_fixing_counter"},
        ])->all();

        $order = Order::create([
            'enquiry_id' => $enquiry->id,
            'order_number' => 'PENDING-'.Str::uuid(),
            'order_date' => now()->toDateString(),
            'customer_id' => $fixed->customer_id,
            'credit_terms' => $fixed->credit_terms,
            'vessel_id' => $enquiry->imo,
            'vessel_name' => $enquiry->vessel_name,
            'port_id' => $enquiry->port_id,
            'eta' => $enquiry->eta,
            'laycan_from' => $enquiry->laycan_from,
            'laycan_to' => $enquiry->laycan_to,
            'delivery_mode' => collect($products)->map(fn (string $p) => $enquiry->{"{$p}_delivery_mode"})->first(fn ($v) => $v !== null),
            'delivery_location_id' => $enquiry->supply_location_id,
            'product_type' => collect($products)->map(fn (string $p) => $enquiry->{"{$p}_product_type"})->first(fn ($v) => $v !== null),
            'agent_id' => $enquiry->agent_id,
            'status' => OrderStatus::Pending,
            ...$productAttributes,
        ]);

        // Numbered from the id the insert assigns, so a deletion can't free a number
        // for reuse and collide on the unique index.
        $order->update([
            'order_number' => 'ORD-'.str_pad((string) $order->id, 5, '0', STR_PAD_LEFT),
        ]);
    }

    /**
     * @return array<int, mixed>
     */
    private function supplyLocationRules(Request $request, ?Enquiry $enquiry = null): array
    {
        $portId = $request->input('port_id', $enquiry?->port_id);

        return [
            'nullable',
            $this->supplyLocationRule($portId),
        ];
    }
}
