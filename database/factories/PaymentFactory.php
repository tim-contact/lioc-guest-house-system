<?php

namespace Database\Factories;

use App\Enums\PaymentType;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_number' => Order::factory()->create()->order_number,
            'amount' => fake()->randomFloat(2, 100, 100000),
            'date' => fake()->dateTimeBetween('-30 days', 'now'),
            'type' => PaymentType::Regular,
        ];
    }
}
