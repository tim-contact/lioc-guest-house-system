<?php

namespace Database\Factories;

use App\Models\ContactInformation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ContactInformation>
 */
class ContactInformationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kind' => 'phone',
            'value' => fake()->phoneNumber(),
            'is_primary' => true,
        ];
    }
}
