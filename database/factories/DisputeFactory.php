<?php

namespace Database\Factories;

use App\Enums\ActionStatus;
use App\Enums\DisputeStatus;
use App\Enums\DisputeType;
use App\Enums\ProposedActionPlan;
use App\Models\Dispute;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dispute>
 */
class DisputeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'type_of_dispute' => fake()->randomElement(DisputeType::cases()),
            'dispute_value' => fake()->optional()->randomFloat(2, 100, 10000),
            'value_as_per_supply' => fake()->optional()->randomFloat(3, 0, 5),
            'value_as_per_claim' => fake()->optional()->randomFloat(3, 0, 5),
            'value_as_per_testing' => fake()->optional()->randomFloat(3, 0, 5),
            'testing_date' => fake()->optional()->date(),
            'proposed_action_plan' => fake()->randomElement(ProposedActionPlan::cases()),
            'action_status' => fake()->optional()->randomElement(ActionStatus::cases()),
            'dispute_closure_remark' => fake()->optional()->sentence(),
            'dispute_status' => fake()->randomElement(DisputeStatus::cases()),
        ];
    }
}
