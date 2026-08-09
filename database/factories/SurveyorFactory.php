<?php

namespace Database\Factories;

use App\Models\Surveyor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Surveyor>
 */
class SurveyorFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'survey_company' => fake()->company(),
            'name' => fake()->name(),
            'mail_id' => fake()->safeEmail(),
            'contact' => fake()->phoneNumber(),
            'barge_id' => null,
        ];
    }
}
