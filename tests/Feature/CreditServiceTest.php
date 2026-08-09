<?php

use App\Enums\OrderStatus;
use App\Models\Customer;
use App\Models\Order;
use App\Services\CreditService;

/**
 * An order with no value on any grade, so each test only sets what it cares about.
 *
 * @param  array<string, mixed>  $attributes
 */
function orderFor(Customer $customer, array $attributes): Order
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

it('returns the full credit limit for a customer with no orders', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 500000.0]);
});

it('values a pending order at its rate times the final quantity', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    orderFor($customer, [
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 200,
        'vlsfo_quantity_high' => 300,
        'mgo_rate' => 700,
        'mgo_final_qty' => 100,
    ]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 500000.0 - 100000.0 - 70000.0]);
});

it('falls back to the maximum quantity when the final quantity is unknown', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    orderFor($customer, [
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
        'vlsfo_quantity_high' => 300,
    ]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 350000.0]);
});

it('values a delivered order at its outstanding invoice balance', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    orderFor($customer, [
        'status' => OrderStatus::Delivered,
        'invoice_value' => 120000,
        'amount_received' => 50000,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 300,
    ]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 430000.0]);
});

it('values a delivered order at its order value while it is not yet invoiced', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    orderFor($customer, [
        'status' => OrderStatus::Delivered,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 300,
    ]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 350000.0]);
});

it('does not let an overpaid invoice free up extra credit', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    orderFor($customer, [
        'status' => OrderStatus::Delivered,
        'invoice_value' => 100000,
        'amount_received' => 150000,
    ]);

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 500000.0]);
});

it('ignores closed and cancelled orders', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    foreach ([OrderStatus::Closed, OrderStatus::Cancelled] as $status) {
        orderFor($customer, [
            'status' => $status,
            'invoice_value' => 100000,
            'amount_received' => 0,
            'vlsfo_rate' => 500,
            'vlsfo_final_qty' => 300,
        ]);
    }

    expect(CreditService::availableByCustomer([$customer->sap_id]))
        ->toBe([$customer->sap_id => 500000.0]);
});

it('keeps each customer to their own exposure and omits unknown ones', function () {
    $customer = Customer::factory()->create(['credit_limit' => 500000]);
    $other = Customer::factory()->create(['credit_limit' => 200000]);

    orderFor($customer, [
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 300,
    ]);

    $available = CreditService::availableByCustomer([$customer->sap_id, $other->sap_id, 'MISSING']);

    expect($available)->toHaveCount(2)
        ->and($available[$customer->sap_id])->toBe(350000.0)
        ->and($available[$other->sap_id])->toBe(200000.0);
});

it('returns nothing when given no customers', function () {
    expect(CreditService::availableByCustomer([]))->toBe([]);
});
