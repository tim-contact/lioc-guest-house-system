<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\CreditService;
use Inertia\Inertia;
use Inertia\Response;

class CreditManagementController extends Controller
{
    public function index(): Response
    {
        $customers = Customer::orderBy('name')->get(['sap_id', 'name', 'credit_limit']);

        $creditAvailable = CreditService::availableByCustomer($customers->pluck('sap_id')->all());
        $pendingOrders = $this->orderCounts(OrderStatus::pendingStatuses());
        $openInvoices = $this->orderCounts(OrderStatus::completedStatuses());

        return Inertia::render('sales/credit-management', [
            'customers' => $customers->map(fn (Customer $customer): array => [
                'sap_id' => $customer->sap_id,
                'name' => $customer->name,
                'credit_limit' => $customer->credit_limit,
                'credit_available' => $creditAvailable[$customer->sap_id] ?? null,
                'pending_orders' => $pendingOrders[$customer->sap_id] ?? 0,
                'open_invoices' => $openInvoices[$customer->sap_id] ?? 0,
            ]),
        ]);
    }

    /**
     * Order counts per customer for the given statuses, keyed by customer_id.
     *
     * @param  array<int, OrderStatus>  $statuses
     * @return array<string, int>
     */
    private function orderCounts(array $statuses): array
    {
        return Order::whereIn('status', $statuses)
            ->selectRaw('customer_id, count(*) as total')
            ->groupBy('customer_id')
            ->pluck('total', 'customer_id')
            ->all();
    }
}
