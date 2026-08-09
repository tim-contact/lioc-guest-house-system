<?php

use App\Enums\OrderStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

/**
 * An order with no value on any grade, so each test only sets what it cares about.
 *
 * @param  array<string, mixed>  $attributes
 */
function creditManagementOrderFor(Customer $customer, array $attributes): Order
{
    $blank = ['invoice_value' => null, 'amount_received' => null];

    foreach (['vlsfo', 'mgo', 'hsfo'] as $grade) {
        $blank["{$grade}_rate"] = null;
        $blank["{$grade}_final_qty"] = null;
        $blank["{$grade}_quantity_high"] = null;
    }

    return Order::factory()->create([
        'customer_id' => $customer->sap_id,
        ...$blank,
        ...$attributes,
    ]);
}

test('guests are redirected from the credit management page', function () {
    $this->get(route('credit-management'))->assertRedirect(route('login'));
});

test('index lists customers ordered by name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Customer::factory()->create(['name' => 'Zeta Shipping']);
    Customer::factory()->create(['name' => 'Alpha Marine']);

    $this->get(route('credit-management'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales/credit-management')
            ->has('customers', 2)
            ->where('customers.0.name', 'Alpha Marine')
            ->where('customers.1.name', 'Zeta Shipping'));
});

test('index reports credit available and pending/open order counts', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    creditManagementOrderFor($customer, [
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
        'vlsfo_quantity_high' => 200,
    ]);

    creditManagementOrderFor($customer, [
        'status' => OrderStatus::Delivered,
        'invoice_value' => 40000,
        'amount_received' => 15000,
    ]);

    $this->get(route('credit-management'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('sales/credit-management')
            ->where('customers.0.sap_id', $customer->sap_id)
            ->where('customers.0.credit_available', 375000)
            ->where('customers.0.pending_orders', 1)
            ->where('customers.0.open_invoices', 1));
});

test('cancelled and closed orders are excluded from the counts', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    creditManagementOrderFor($customer, ['status' => OrderStatus::Cancelled]);
    creditManagementOrderFor($customer, ['status' => OrderStatus::Closed]);

    $this->get(route('credit-management'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('customers.0.pending_orders', 0)
            ->where('customers.0.open_invoices', 0));
});
