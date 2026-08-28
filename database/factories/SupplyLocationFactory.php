<?php

namespace Database\Factories;

use App\Models\Port;
use App\Models\SupplyLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplyLocation>
 */
class SupplyLocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'port_id' => Port::factory(),
            'name' => fake()->randomElement([
                'ANCHORAGE',
                'BQ BERTH',
                'OPL',
                'LIOC JETTY',
                'ROUND ISLAND',
            ]),
        ];
    }
}
