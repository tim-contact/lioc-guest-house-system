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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(): Response
    {
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

        $pendingOrders = OrderService::pending()->load('disputes')->map($mapOrder);

        $completedOrders = OrderService::completedWithin(keepOpenDisputes: true)->load('disputes')->map($mapOrder);

        return Inertia::render('orders/dashboard', [
            'pendingOrders' => $pendingOrders,
            'completedOrders' => $completedOrders,
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

    public function cancel(Order $order): RedirectResponse
    {
        $order->update(['status' => OrderStatus::Cancelled]);

        return $this->toast('Order cancelled.');
    }

    public function table(Request $request): Response
    {
        $perPage = (int) $request->input('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        return Inertia::render('orders/table', [
            'orders' => Order::with('deliveryLocation')
                ->orderBy('id')
                ->paginate($perPage)
                ->withQueryString()
                ->through(fn (Order $order): array => [
                    ...$order->toArray(),
                    'delivery_location' => $order->deliveryLocation?->name,
                ]),
            ...$this->agentContactProps(),
            'statusOptions' => $this->enumOptions(OrderStatus::cases()),
            'deliveryModeOptions' => $this->enumOptions(DeliveryMode::cases()),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'productTypeOptions' => $this->enumOptions(ProductType::cases()),
            'creditTermsOptions' => $this->enumOptions(CreditTerms::cases()),
        ]);
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
            'laycan_from' => ['nullable', 'date'],
            'laycan_to' => ['nullable', 'date', 'after_or_equal:laycan_from'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'agent_pic_id' => ['nullable', $this->agentPicRule($request)],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'mobile_no' => ['nullable', 'string', 'max:255'],
            'delivery_mode' => ['nullable', Rule::enum(DeliveryMode::class)],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($request->input('port_id', $order->port_id))],
            'barging_cost' => ['nullable', 'numeric', 'min:0'],
            'product_type' => ['nullable', Rule::enum(ProductType::class)],
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
