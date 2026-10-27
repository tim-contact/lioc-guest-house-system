<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Models\Barge;
use App\Models\Order;
use App\Models\Port;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OperationController extends Controller
{
    public function index(): Response
    {
        $monthStart = now()->startOfMonth();
        $monthEnd = now()->endOfMonth();
        $nextMonthStart = $monthStart->copy()->addMonthNoOverflow();
        $nextMonthEnd = $nextMonthStart->copy()->endOfMonth();
        $mapOrder = fn (Order $order): array => [
            ...OrderService::toRow($order),
            'product_type' => $order->product_type?->value,
            'delivery_mode' => $order->delivery_mode?->value,
            'barge_id' => $order->barge_id,
            'barge_name' => $order->barge?->name,
            'vlsfo_rate' => $order->vlsfo_rate,
            'mgo_rate' => $order->mgo_rate,
            'hsfo_rate' => $order->hsfo_rate,
            'vlsfo_bdn_qty' => $order->vlsfo_bdn_qty,
            'mgo_bdn_qty' => $order->mgo_bdn_qty,
            'hsfo_bdn_qty' => $order->hsfo_bdn_qty,
        ];

        $pendingOrders = OrderService::pending()->load('barge');

        $completedOrders = OrderService::completedWithin(30, keepOpenDisputes: true, useBdnCompletionDate: true)->load('barge');

        return Inertia::render('operations/dashboard', [
            'pendingOrders' => $pendingOrders->map($mapOrder),
            'completedOrders' => $completedOrders->map($mapOrder),
            'summaryPendingOrders' => $pendingOrders
                ->filter(fn (Order $order): bool => ($order->eta ?? $order->laycan_from)?->betweenIncluded($monthStart, $monthEnd) === true)
                ->map($mapOrder)
                ->values(),
            'summaryNextMonthPendingOrders' => $pendingOrders
                ->filter(fn (Order $order): bool => ($order->eta ?? $order->laycan_from)?->betweenIncluded($nextMonthStart, $nextMonthEnd) === true)
                ->map($mapOrder)
                ->values(),
            'summaryCompletedOrders' => $completedOrders
                ->filter(fn (Order $order): bool => $order->bdn?->completionDate()?->betweenIncluded($monthStart, $monthEnd) === true)
                ->map($mapOrder)
                ->values(),
            'ports' => Port::query()->orderBy('name')->pluck('name')->all(),
            'barges' => Barge::orderBy('name')->get(['imo', 'name']),
            ...$this->agentContactProps(),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'eta' => ['nullable', 'date'],
            'etb' => ['nullable', 'date', 'after_or_equal:eta'],
            'etd' => ['nullable', 'date', 'after_or_equal:etb'],
            'ata' => ['nullable', 'date'],
            'atb' => ['nullable', 'date', 'after_or_equal:ata'],
            'atd' => ['nullable', 'date', 'after_or_equal:atb'],
            'bunker_started_at' => ['nullable', 'date'],
            'bunker_completed_at' => ['nullable', 'date', 'after_or_equal:bunker_started_at'],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($order->port_id)],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'vlsfo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'mgo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'hsfo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'agent_pic_id' => ['nullable', $this->agentPicRule($request)],
            'mobile_no' => ['nullable', 'string', 'max:255'],
            'nomination_received' => ['boolean'],
        ]);

        if ($order->delivery_mode !== null && $order->delivery_mode !== DeliveryMode::Barge) {
            $validated['barge_id'] = null;
        }

        $order->update(OrderService::withAgentSnapshot($validated));

        return $this->toast('Order updated.');
    }
}
