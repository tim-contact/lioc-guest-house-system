<?php

namespace App\Http\Controllers;

use App\Models\Barge;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OperationController extends Controller
{
    public function index(): Response
    {
        $mapOrder = fn (Order $order): array => [
            ...OrderService::toRow($order),
            'barge_id' => $order->barge_id,
        ];

        $pendingOrders = OrderService::pending()->map($mapOrder);

        $completedOrders = OrderService::completedWithin()->map($mapOrder);

        return Inertia::render('operations/dashboard', [
            'pendingOrders' => $pendingOrders,
            'completedOrders' => $completedOrders,
            'barges' => Barge::orderBy('name')->get(['imo', 'name']),
            ...$this->agentContactProps(),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
        ]);
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'eta' => ['nullable', 'date'],
            'delivery_location_id' => ['nullable', $this->supplyLocationRule($order->port_id)],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'vlsfo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'mgo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'hsfo_final_qty' => ['nullable', 'numeric', 'min:0'],
            'agent_id' => ['nullable', 'exists:agents,id'],
            'agent_pic_id' => ['nullable', $this->agentPicRule($request)],
            'mobile_no' => ['nullable', 'string', 'max:255'],
        ]);

        $order->update(OrderService::withAgentSnapshot($validated));

        return $this->toast('Order updated.');
    }
}
