<?php

namespace Database\Factories;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $enquiry = Enquiry::factory()->create();
        $orderDate = fake()->dateTimeBetween('-10 days', 'now');

        $attributes = [
            'enquiry_id' => $enquiry->id,
            'order_number' => 'ORD-'.fake()->unique()->numberBetween(10000, 99999),
            'order_date' => $orderDate,
            'customer_id' => Customer::factory(),
            'vessel_id' => $enquiry->imo,
            'vessel_name' => $enquiry->vessel_name,
            'port_id' => $enquiry->port_id,
            'eta' => fake()->dateTimeBetween('now', '+30 days'),
            'laycan_from' => $enquiry->laycan_from,
            'laycan_to' => $enquiry->laycan_to,
            'delivery_mode' => fake()->randomElement(DeliveryMode::cases()),
            'delivery_location_id' => $enquiry->supply_location_id,
            'barging_cost' => 0,
            'product_type' => fake()->randomElement(ProductType::cases()),
            'barge_id' => Barge::factory(),
            'agent_id' => Agent::factory(),
            'pic' => fake()->name(),
            'mobile_no' => fake()->phoneNumber(),
            'invoice_value' => fake()->randomFloat(2, 10000, 1000000),
            'invoice_date' => fake()->dateTimeBetween($orderDate, '+5 days'),
            'payment_due_date' => fake()->dateTimeBetween('+5 days', '+35 days'),
            'amount_received' => fake()->randomFloat(2, 0, 1000000),
            'payment_receipt_date' => fake()->optional()->dateTimeBetween('now', '+35 days'),
            'status' => fake()->randomElement(OrderStatus::cases()),
        ];

        foreach (FuelGrade::keys() as $product) {
            $low = fake()->randomFloat(3, 10, 5000);
            $high = fake()->randomFloat(3, $low, $low + 5000);

            $attributes["{$product}_quantity_low"] = $low;
            $attributes["{$product}_quantity_high"] = $high;
            $attributes["{$product}_qty_range"] = "{$low} - {$high}";
            $attributes["{$product}_rate"] = fake()->randomFloat(2, 100, 1000);
            $attributes["{$product}_final_qty"] = fake()->randomFloat(3, $low, $high);
            $attributes["{$product}_bdn_qty"] = fake()->randomFloat(3, $low, $high);
        }

        return $attributes;
    }
}
