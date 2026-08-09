<?php

namespace App\Services;

use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;

class CreditService
{
    /**
     * Credit still available per customer, keyed by SAP ID: the credit limit less
     * open invoices (delivered, not yet settled) and open orders (not yet delivered).
     *
     * Customers that don't exist are absent from the result — enquiry customer refs
     * can dangle.
     *
     * @param  array<int, string>  $customerIds
     * @return array<string, float>
     */
    public static function availableByCustomer(array $customerIds): array
    {
        if ($customerIds === []) {
            return [];
        }

        $limits = Customer::whereIn('sap_id', $customerIds)->pluck('credit_limit', 'sap_id');

        $exposure = Order::whereIn('customer_id', $limits->keys())
            ->whereIn('status', [...OrderStatus::pendingStatuses(), ...OrderStatus::completedStatuses()])
            ->get()
            ->groupBy('customer_id')
            ->map(fn ($orders): float => $orders->sum(self::exposure(...)));

        return $limits
            ->map(fn ($limit, string $sapId): float => (float) $limit - (float) ($exposure[$sapId] ?? 0))
            ->all();
    }

    /**
     * What one order ties up: its outstanding invoice balance once invoiced,
     * otherwise the value of the stem still to be delivered.
     */
    private static function exposure(Order $order): float
    {
        if ((float) $order->invoice_value > 0) {
            // An overpayment settles that invoice; it doesn't free up extra credit.
            return max($order->balance_amount, 0);
        }

        return self::openOrderValue($order);
    }

    /**
     * Rate times the final quantity — or the maximum quantity while the final one
     * is still unknown — summed across every grade on the order.
     */
    private static function openOrderValue(Order $order): float
    {
        return collect(FuelGrade::keys())->sum(fn (string $grade): float => (float) $order->{"{$grade}_rate"}
            * (float) ($order->{"{$grade}_final_qty"} ?? $order->{"{$grade}_quantity_high"}));
    }
}
