<?php

namespace Database\Factories;

use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use App\Models\Barge;
use App\Models\Port;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $scope = fake()->randomElement(StockMovementScope::cases());
        $movementType = fake()->randomElement(
            $scope === StockMovementScope::Terminal
                ? [StockMovementType::Opening, StockMovementType::Loading, StockMovementType::RebondTransfer, StockMovementType::DeadStock]
                : [StockMovementType::Opening, StockMovementType::Loading],
        );

        return [
            'movement_date' => fake()->dateTimeBetween('-30 days', 'now'),
            'port_id' => Port::factory(),
            'barge_id' => $scope === StockMovementScope::Barge ? Barge::factory() : null,
            'movement_scope' => $scope,
            'movement_type' => $movementType,
            'counterparty_name' => fake()->optional()->company(),
            'mgo_qty' => fake()->randomFloat(3, 0, 1000),
            'vlsfo_qty' => fake()->randomFloat(3, 0, 5000),
            'hsfo_qty' => fake()->randomFloat(3, 0, 1000),
            'notes' => fake()->optional()->sentence(),
            'created_by' => User::factory(),
        ];
    }
}
