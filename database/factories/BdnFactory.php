<?php

namespace Database\Factories;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bdn>
 */
class BdnFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $alongside = fake()->dateTimeBetween('-5 days', 'now');

        $order = Order::factory()->create();

        $attributes = [
            'order_id' => $order->id,
            'bdn_number' => 'BDN-'.fake()->unique()->numberBetween(10000, 99999),
            'delivery_date' => $alongside,
            'delivery_location_id' => $order->delivery_location_id,
            'vessel_flag' => fake()->country(),
            'grt' => fake()->randomFloat(2, 1000, 90000),
            'pi_club' => fake()->company(),
            'agent_id' => Agent::factory(),
            'owner_operator' => fake()->company(),
            'last_port_of_call' => fake()->city(),
            'destination_port' => fake()->city(),
            'delivery_method' => fake()->randomElement(DeliveryMode::cases()),
            'barge_id' => Barge::factory(),
            'barge_alongside_at' => $alongside,
            'chief_engineer_invited' => fake()->boolean(),
            'chief_engineer_witnessed' => fake()->boolean(),
            'retained_samples_handed_over' => fake()->boolean(),
            'sampling_location' => fake()->randomElement(Sampling::cases()),
            'sampling_method' => fake()->randomElement(SamplingMethod::cases()),
        ];

        foreach (FuelGrade::keys() as $grade) {
            $connected = fake()->dateTimeBetween($alongside, '+2 hours');

            $attributes["{$grade}_hose_connected_at"] = $connected;
            $attributes["{$grade}_pumping_started_at"] = fake()->dateTimeBetween($connected, '+3 hours');
            $attributes["{$grade}_pumping_ended_at"] = fake()->dateTimeBetween($connected, '+6 hours');
            $attributes["{$grade}_hose_disconnected_at"] = fake()->dateTimeBetween($connected, '+7 hours');
            $attributes["{$grade}_docs_completed_at"] = fake()->dateTimeBetween($connected, '+8 hours');
            $attributes["{$grade}_cast_off_at"] = fake()->dateTimeBetween($connected, '+9 hours');
            $attributes["{$grade}_density_15"] = fake()->randomFloat(4, 0.8, 1);
            $attributes["{$grade}_sulphur_pct"] = fake()->randomFloat(3, 0, 3.5);
            $attributes["{$grade}_viscosity_50"] = fake()->randomFloat(1, 2, 380);
            $attributes["{$grade}_flash_point"] = fake()->randomFloat(1, 60, 120);
            $attributes["{$grade}_kilo_liter"] = fake()->randomFloat(3, 10, 5000);
            $attributes["{$grade}_metric_ton"] = fake()->randomFloat(3, 10, 5000);
        }

        foreach (['marpol', 'vessel', 'barge', 'retention'] as $sample) {
            $attributes["{$sample}_seal_number"] = (string) fake()->numberBetween(100000, 999999);
            $attributes["{$sample}_counter_seal_number"] = (string) fake()->numberBetween(100000, 999999);
        }

        return $attributes;
    }
}
