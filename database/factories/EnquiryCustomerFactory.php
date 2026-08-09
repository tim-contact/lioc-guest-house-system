<?php

namespace Database\Factories;

use App\Enums\EnquiryCustomerStatus;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\EnquiryCustomer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EnquiryCustomer>
 */
class EnquiryCustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'enquiry_id' => Enquiry::factory(),
            'customer_id' => fn () => Customer::factory()->create()->sap_id,
            'status' => EnquiryCustomerStatus::Pending,
        ];
    }
}
