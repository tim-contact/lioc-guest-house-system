<?php

namespace App\Services;

use App\Enums\DisputeStatus;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Order;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class OrderService
{
    /**
     * Pending orders for the port-grouped dashboards, customer + port loaded.
     *
     * $dueWithinDays caps the list at orders whose ETA falls within that many
     * days. There is no lower bound, so overdue orders — and orders with no ETA
     * yet — stay on the list rather than disappearing from it.
     *
     * @return Collection<int, Order>
     */
    public static function pending(?int $dueWithinDays = null): Collection
    {
        return Order::with(['customer', 'port', 'deliveryLocation'])
            ->whereIn('status', OrderStatus::pendingStatuses())
            ->when($dueWithinDays !== null, fn ($query) => $query->where(
                fn ($due) => $due->whereNull('eta')
                    ->orWhere('eta', '<=', Carbon::today()->addDays($dueWithinDays)->endOfDay()),
            ))
            ->orderBy('port_id')
            ->orderBy('eta')
            ->get();
    }

    /**
     * Orders completed within the last $days, same loading and ordering.
     *
     * With $keepOpenDisputes, orders carrying an unresolved dispute stay on the
     * list however old they are, so the dispute remains reachable.
     *
     * @return Collection<int, Order>
     */
    public static function completedWithin(int $days = 30, bool $keepOpenDisputes = false): Collection
    {
        return Order::with(['customer', 'port', 'deliveryLocation'])
            ->whereIn('status', OrderStatus::completedStatuses())
            ->where(fn ($query) => $query
                ->where('invoice_date', '>=', Carbon::now()->subDays($days))
                ->when($keepOpenDisputes, fn ($disputed) => $disputed->orWhereHas(
                    'disputes',
                    fn ($dispute) => $dispute->where('dispute_status', DisputeStatus::Open),
                )))
            ->orderBy('port_id')
            ->orderBy('eta')
            ->get();
    }

    /**
     * Mark an order delivered and stamp its invoice: value is the sum of each
     * grade's BDN quantity times its rate, due date is invoice date plus credit terms.
     */
    public static function complete(Order $order): void
    {
        $deliveryDate = $order->bdn()->value('delivery_date');
        $invoiceDate = $deliveryDate !== null ? Carbon::parse($deliveryDate) : Carbon::today();

        $order->update([
            'status' => OrderStatus::Delivered,
            'invoice_date' => $invoiceDate,
            'invoice_value' => self::invoiceValue($order),
            'payment_due_date' => $invoiceDate->copy()->addDays($order->credit_terms?->days() ?? 0),
        ]);
    }

    /**
     * Recompute a delivered order's invoice value after a rate or BDN quantity
     * correction. A no-op outside Delivered: pending orders have no invoice yet,
     * and closed orders are settled — repricing one would retroactively break
     * isPaidInFull().
     */
    public static function reprice(Order $order): void
    {
        if ($order->status !== OrderStatus::Delivered) {
            return;
        }

        $order->update(['invoice_value' => self::invoiceValue($order)]);
    }

    /**
     * Sum of each grade's BDN quantity times its rate, plus barging and agent fees.
     */
    private static function invoiceValue(Order $order): float
    {
        $fuelTotal = collect(FuelGrade::keys())->sum(
            fn (string $product): float => (float) $order->{"{$product}_bdn_qty"} * (float) $order->{"{$product}_rate"},
        );

        return $fuelTotal + (float) $order->barging_cost + (float) $order->agent_fees;
    }

    /**
     * The columns every order dashboard shows.
     *
     * @return array<string, mixed>
     */
    public static function toRow(Order $order): array
    {
        $row = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'customer_name' => $order->customer?->name,
            'vessel_name' => $order->vessel_name,
            'vessel_id' => $order->vessel_id,
            'port_id' => $order->port_id,
            'port' => $order->port?->name,
            'delivery_location_id' => $order->delivery_location_id,
            'delivery_location' => $order->deliveryLocation?->name,
            'barging_cost' => $order->barging_cost,
            'agent_fees' => $order->agent_fees,
            'vlsfo_qty' => $order->vlsfo_final_qty ?? $order->vlsfo_qty_range,
            'mgo_qty' => $order->mgo_final_qty ?? $order->mgo_qty_range,
            'hsfo_qty' => $order->hsfo_final_qty ?? $order->hsfo_qty_range,
            'vlsfo_final_qty' => $order->vlsfo_final_qty,
            'mgo_final_qty' => $order->mgo_final_qty,
            'hsfo_final_qty' => $order->hsfo_final_qty,
            'agent_id' => $order->agent_id,
            'agent_name' => $order->agent_name,
            'agent_pic_id' => $order->agent_pic_id,
            'pic' => $order->pic,
            'mobile_no' => $order->mobile_no,
            'eta' => $order->eta,
            'laycan_from' => $order->laycan_from,
            'status' => $order->status->value,
        ];

        foreach (FuelGrade::keys() as $grade) {
            $row["{$grade}_quantity_low"] = $order->{"{$grade}_quantity_low"};
            $row["{$grade}_quantity_high"] = $order->{"{$grade}_quantity_high"};
        }

        return $row;
    }

    /**
     * Copy the agency and PIC names onto the order so a later rename of either
     * record leaves it alone. Only touches a name when its id was submitted.
     *
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    public static function withAgentSnapshot(array $validated): array
    {
        if (array_key_exists('agent_id', $validated)) {
            $validated['agent_name'] = Agent::find($validated['agent_id'])?->name;
        }

        if (array_key_exists('agent_pic_id', $validated)) {
            $validated['pic'] = AgentPic::find($validated['agent_pic_id'])?->name;
        }

        return $validated;
    }

    /**
     * Format a low/high quantity pair into the range string shown on dashboards.
     * Falls back to the single bound when only one side is set.
     */
    public static function formatQtyRange(?float $low, ?float $high): ?string
    {
        if ($low !== null && $high !== null) {
            return "{$low} - {$high}";
        }

        $single = $low ?? $high;

        return $single === null ? null : (string) $single;
    }
}
