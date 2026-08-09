<?php

namespace Database\Factories;

use App\Enums\EnquiryStatus;
use App\Models\Enquiry;
use App\Models\Port;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enquiry>
 */
class EnquiryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $laycanFrom = fake()->dateTimeBetween('now', '+30 days');

        return [
            'vessel_name' => fake()->words(3, true),
            'imo' => (string) fake()->unique()->numberBetween(1000000, 9999999),
            'port_id' => Port::factory(),
            'laycan_from' => $laycanFrom,
            'laycan_to' => fake()->dateTimeBetween($laycanFrom, (clone $laycanFrom)->modify('+5 days')),
            'status' => fake()->randomElement(EnquiryStatus::cases()),
        ];
    }
}
