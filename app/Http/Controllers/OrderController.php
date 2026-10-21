<?php

namespace App\Http\Controllers;

use App\Enums\ActionStatus;
use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\DisputeType;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\ProposedActionPlan;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\Port;
use App\Services\DisputeService;
use App\Services\OrderService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        $mapOrder = fn (Order $order): array => [
            ...OrderService::toRow($order),
            'order_date' => $order->order_date,
            'customer_id' => $order->customer_id,
            'port_id' => $order->port_id,
            'vlsfo_rate' => $order->vlsfo_rate,
            'mgo_rate' => $order->mgo_rate,
            'hsfo_rate' => $order->hsfo_rate,
            'delivery_mode' => $order->delivery_mode?->value,
            'laycan_to' => $order->laycan_to,
            'disputes' => $order->disputes->map(fn (Dispute $dispute): array => DisputeService::toRow($dispute, $order)),
        ];

        $pendingOrders = OrderService::pending()->load('disputes');

        $completedOrders = OrderService::completedWithin(30, keepOpenDisputes: true, useBdnCompletionDate: true)->load('disputes');

        return Inertia::render('orders/dashboard', [
            'pendingOrders' => $pendingOrders->map($mapOrder),
            'completedOrders' => $completedOrders->map($mapOrder),
            'summaryPendingOrders' => $pendingOrders
                ->filter(fn (Order $order): bool => ($order->eta ?? $order->laycan_from)?->betweenIncluded($monthStart, $monthEnd) === true)
                ->map($mapOrder)
                ->values(),
            'summaryCompletedOrders' => $completedOrders
                ->filter(fn (Order $order): bool => $order->bdn?->completionDate()?->betweenIncluded($monthStart, $monthEnd) === true)
                ->map($mapOrder)
                ->values(),
            'customers' => Customer::orderBy('name')->get(['sap_id', 'name']),
            'ports' => Port::orderBy('name')->get(['id', 'name']),
            ...$this->agentContactProps(),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'disputeTypeOptions' => $this->enumOptions(DisputeType::cases()),
            'proposedActionPlanOptions' => $this->enumOptions(ProposedActionPlan::cases()),
            'actionStatusOptions' => $this->enumOptions(ActionStatus::cases()),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $rules = [
            'customer_id' => ['nullable', 'exists:customers,sap_id'],
            'vessel_name' => ['nullable', 'string', 'max:255'],
            'vessel_id' => ['nullable', 'string', 'max:255'],
            'port_id' => ['nullable', 'exists:ports,id'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'agent_pic_id' => ['nullable', $this->agentPicRule($request)],
            'mobile_no' => ['nullable', 'string', 'max:255'],
            'delivery_mode' => ['nullable', Rule::enum(DeliveryMode::class)],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($request->input('port_id', $order->port_id))],
            'compliance_checked' => ['boolean'],
            'eta' => ['nullable', 'date'],
            'etb' => ['nullable', 'date', 'after_or_equal:eta'],
            'etd' => ['nullable', 'date', 'after_or_equal:etb'],
            'ata' => ['nullable', 'date'],
            'atb' => ['nullable', 'date', 'after_or_equal:ata'],
            'atd' => ['nullable', 'date', 'after_or_equal:atb'],
            'bunker_started_at' => ['nullable', 'date'],
            'bunker_completed_at' => ['nullable', 'date', 'after_or_equal:bunker_started_at'],
            'laycan_from' => ['nullable', 'date'],
            'laycan_to' => ['nullable', 'date', 'after_or_equal:laycan_from'],
        ];

        foreach (FuelGrade::keys() as $product) {
            foreach (['quantity_low', 'quantity_high', 'rate', 'final_qty'] as $field) {
                $rules["{$product}_{$field}"] = ['nullable', 'numeric', 'min:0'];
            }
        }

        $validated = $request->validate($rules);

        foreach (FuelGrade::keys() as $product) {
            $validated["{$product}_qty_range"] = OrderService::formatQtyRange(
                $validated["{$product}_quantity_low"] ?? null,
                $validated["{$product}_quantity_high"] ?? null,
            );
        }

        $order->update(OrderService::withAgentSnapshot($validated));
        OrderService::reprice($order);

        return $this->toast('Order updated.');
    }

    public function cancel(Request $request, Order $order): RedirectResponse
    {
        abort_unless($order->status === OrderStatus::Pending, 403);

        $validated = $request->validate([
            'cancellation_charge' => ['required', 'numeric', 'min:0'],
            'cancellation_reason' => ['required', 'string', 'max:2000'],
        ]);

        $order->update([
            ...$validated,
            'status' => OrderStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $this->toast('Order cancelled.');
    }

    public function table(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $vesselSearch = trim((string) $request->input('vessel', ''));
        $sortKey = (string) $request->input('sort', 'id');
        $direction = $request->input('dir') === 'desc' ? 'desc' : 'asc';

        if (! in_array($sortKey, self::orderTableSortableColumns(), true)) {
            $sortKey = 'id';
            $direction = 'asc';
        }

        return Inertia::render('orders/table', [
            'orders' => Order::with('deliveryLocation')
                ->when($vesselSearch !== '', fn ($query) => $query->where('vessel_name', 'like', '%'.$vesselSearch.'%'))
                ->tap(fn (Builder $query) => self::applyOrderTableSort($query, $sortKey, $direction))
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn (Order $order): array => [
                    ...$order->toArray(),
                    ...OrderService::timingMetrics($order),
                    'delivery_location' => $order->deliveryLocation?->name,
                ]),
            'filters' => [
                'vessel' => $vesselSearch,
                'sort' => $sortKey,
                'dir' => $direction,
            ],
            ...$this->agentContactProps(),
            'statusOptions' => $this->enumOptions(OrderStatus::cases()),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'productTypeOptions' => $this->enumOptions(ProductType::cases()),
            'creditTermsOptions' => $this->enumOptions(CreditTerms::cases()),
        ]);
    }

    /**
     * @return list<string>
     */
    private static function orderTableSortableColumns(): array
    {
        return [
            'id',
            'order_number',
            'order_date',
            'customer_id',
            'vessel_name',
            'vessel_id',
            'port_id',
            'eta',
            'laycan_from',
            'laycan_to',
            'delivery_mode',
            'delivery_location_id',
            'product_type',
            'barge_id',
            'agent_id',
            'agent_name',
            'agent_pic_id',
            'pic',
            'mobile_no',
            'credit_terms',
            'vlsfo_qty_range',
            'vlsfo_rate',
            'vlsfo_final_qty',
            'vlsfo_bdn_qty',
            'mgo_qty_range',
            'mgo_rate',
            'mgo_final_qty',
            'mgo_bdn_qty',
            'hsfo_qty_range',
            'hsfo_rate',
            'hsfo_final_qty',
            'hsfo_bdn_qty',
            'barging_cost',
            'agent_fees',
            'invoice_value',
            'invoice_date',
            'payment_due_date',
            'amount_received',
            'payment_receipt_date',
            'balance_amount',
            'status',
            'created_at',
            'updated_at',
        ];
    }

    private static function applyOrderTableSort(Builder $query, string $sort, string $direction): void
    {
        $textColumns = [
            'order_number',
            'customer_id',
            'vessel_name',
            'vessel_id',
            'delivery_mode',
            'product_type',
            'barge_id',
            'agent_name',
            'pic',
            'mobile_no',
            'credit_terms',
            'vlsfo_qty_range',
            'mgo_qty_range',
            'hsfo_qty_range',
            'status',
        ];

        if ($sort === 'balance_amount') {
            $query->orderByRaw("(COALESCE(orders.invoice_value, 0) - COALESCE(orders.amount_received, 0)) {$direction}");
        } elseif (in_array($sort, $textColumns, true)) {
            $query->orderByRaw("LOWER(orders.{$sort}) {$direction} NULLS LAST");
        } else {
            $query->orderByRaw("orders.{$sort} {$direction} NULLS LAST");
        }

        if ($sort !== 'id') {
            $query->orderBy('orders.id');
        }
    }

    /**
     * Full edit of every order field from the admin table, unlike the narrower
     * update() above that backs the sales dashboard's inline dialog.
     */
    public function tableUpdate(Request $request, Order $order): RedirectResponse
    {
        $rules = [
            'order_number' => ['required', 'string', 'max:255', Rule::unique('orders', 'order_number')->ignore($order)],
            'order_date' => ['nullable', 'date'],
            'enquiry_id' => ['required', 'integer', 'min:1'],
            'customer_id' => ['required', 'exists:customers,sap_id'],
            'vessel_id' => ['nullable', 'string', 'max:255'],
            'vessel_name' => ['nullable', 'string', 'max:255'],
            'port_id' => ['nullable', 'exists:ports,id'],
            'eta' => ['nullable', 'date'],
            'etb' => ['nullable', 'date', 'after_or_equal:eta'],
            'etd' => ['nullable', 'date', 'after_or_equal:etb'],
            'ata' => ['nullable', 'date'],
            'atb' => ['nullable', 'date', 'after_or_equal:ata'],
            'atd' => ['nullable', 'date', 'after_or_equal:atb'],
            'bunker_started_at' => ['nullable', 'date'],
            'bunker_completed_at' => ['nullable', 'date', 'after_or_equal:bunker_started_at'],
            'laycan_from' => ['nullable', 'date'],
            'laycan_to' => ['nullable', 'date', 'after_or_equal:laycan_from'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'agent_pic_id' => ['nullable', $this->agentPicRule($request)],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'mobile_no' => ['nullable', 'string', 'max:255'],
            'delivery_mode' => ['nullable', Rule::enum(DeliveryMode::class)],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($request->input('port_id', $order->port_id))],
            'barging_cost' => ['nullable', 'numeric', 'min:0'],
            'agent_fees' => ['nullable', 'numeric', 'min:0'],
            'product_type' => ['nullable', Rule::enum(ProductType::class)],
            'compliance_checked' => ['boolean'],
            'nomination_received' => ['boolean'],
            'credit_terms' => ['nullable', Rule::enum(CreditTerms::class)],
            'status' => ['required', Rule::enum(OrderStatus::class)],
            'invoice_date' => ['nullable', 'date'],
            'payment_due_date' => ['nullable', 'date', 'after_or_equal:invoice_date'],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
            'payment_receipt_date' => ['nullable', 'date'],
        ];

        foreach (FuelGrade::keys() as $product) {
            $rules["{$product}_quantity_low"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_quantity_high"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_rate"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_final_qty"] = ['nullable', 'numeric', 'min:0'];
            $rules["{$product}_bdn_qty"] = ['nullable', 'numeric', 'min:0'];
        }

        $validated = $request->validate($rules);

        foreach (FuelGrade::keys() as $product) {
            $validated["{$product}_qty_range"] = OrderService::formatQtyRange(
                $validated["{$product}_quantity_low"] ?? null,
                $validated["{$product}_quantity_high"] ?? null,
            );
        }

        $order->update(OrderService::withAgentSnapshot($validated));
        OrderService::reprice($order);

        return $this->toast('Order updated.');
    }
}
