<?php

namespace Database\Factories;

use App\Enums\AccountType;
use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sap_id' => fake()->unique()->numerify('SAP-#####'),
            'name' => fake()->company(),
            'address' => fake()->address(),
            'credit_limit' => fake()->randomFloat(2, 0, 1000000),
            'country' => fake()->country(),
            'account_type' => fake()->randomElement(AccountType::cases()),
            'contact_person' => fake()->name(),
            'contact_phone' => fake()->phoneNumber(),
            'mail_id' => fake()->safeEmail(),
            'invoice_mail_ids' => fake()->safeEmail().', '.fake()->safeEmail(),
        ];
    }
}
