<?php

namespace Database\Factories;

use App\Enums\BargeStatus;
use App\Models\Barge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Barge>
 */
class BargeFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'imo' => (string) fake()->unique()->numberBetween(1000000, 9999999),
            'name' => fake()->words(2, true),
            'vlsfo_capacity' => fake()->randomFloat(3, 100, 5000),
            'mgo_capacity' => fake()->randomFloat(3, 100, 5000),
            'hsfo_capacity' => fake()->randomFloat(3, 100, 5000),
            'status' => fake()->randomElement(BargeStatus::cases()),
        ];
    }
}
