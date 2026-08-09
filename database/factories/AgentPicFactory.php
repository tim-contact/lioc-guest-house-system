<?php

namespace Database\Factories;

use App\Models\Agent;
use App\Models\AgentPic;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AgentPic>
 */
class AgentPicFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'agent_id' => Agent::factory(),
            'name' => fake()->name(),
            'mobile' => fake()->phoneNumber(),
        ];
    }
}
