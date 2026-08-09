<?php

namespace App\Services;

use App\Models\Dispute;
use App\Models\Order;

class DisputeService
{
    /**
     * The columns the disputes dashboard and orders dashboard both show.
     *
     * @return array<string, mixed>
     */
    public static function toRow(Dispute $dispute, Order $order): array
    {
        return [
            'id' => $dispute->id,
            'created_at' => $dispute->created_at,
            'type_of_dispute' => $dispute->type_of_dispute?->value,
            'type_of_dispute_label' => $dispute->type_of_dispute?->label(),
            'dispute_value' => $dispute->dispute_value,
            'value_as_per_supply' => $dispute->value_as_per_supply,
            'value_as_per_claim' => $dispute->value_as_per_claim,
            'value_as_per_testing' => $dispute->value_as_per_testing,
            'testing_date' => $dispute->testing_date?->toDateString(),
            'proposed_action_plan' => $dispute->proposed_action_plan?->value,
            'action_status' => $dispute->action_status?->value,
            'dispute_closure_remark' => $dispute->dispute_closure_remark,
            'dispute_status' => $dispute->dispute_status->value,
            'order_number' => $order->order_number,
            'order_date' => $order->order_date,
            'order_status' => $order->status->label(),
            'customer_name' => $order->customer?->name,
            'vessel_name' => $order->vessel_name,
            'vessel_id' => $order->vessel_id,
            'port' => $order->port?->name,
            'delivery_location' => $order->delivery_location?->label(),
            'vlsfo_qty' => $order->vlsfo_bdn_qty ?? $order->vlsfo_final_qty,
            'mgo_qty' => $order->mgo_bdn_qty ?? $order->mgo_final_qty,
            'hsfo_qty' => $order->hsfo_bdn_qty ?? $order->hsfo_final_qty,
            'invoice_value' => $order->invoice_value,
            'amount_received' => $order->amount_received,
            'balance_amount' => $order->balance_amount,
        ];
    }
}
