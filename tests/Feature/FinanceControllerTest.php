<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Enums\UserType;
use App\Enums\SupplyLocation;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function createFinanceOrder(array $attributes = []): Order
{
    static $sequence = 0;
    $sequence++;

    return Order::create([
        'enquiry_id' => Enquiry::factory()->create()->id,
        'order_number' => 'ORD-FIN-'.$sequence,
        'customer_id' => Customer::factory()->create()->sap_id,
        'port_id' => Port::factory()->create(['name' => 'Colombo'])->id,
        'eta' => now(),
        'agent_id' => Agent::factory()->create()->id,
        'barge_id' => Barge::factory()->create()->imo,
        'status' => OrderStatus::Delivered,
        ...$attributes,
    ]);
}

test('guests are redirected from the finance page', function () {
    $this->get(route('finance'))->assertRedirect(route('login'));
});

test('index lists only delivered orders regardless of age', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createFinanceOrder([
        'vessel_name' => 'MV Delivered Recent',
        'status' => OrderStatus::Delivered,
        'laycan_to' => now()->subDays(5),
    ]);

    createFinanceOrder([
        'vessel_name' => 'MV Delivered Old',
        'status' => OrderStatus::Delivered,
        'laycan_to' => now()->subDays(45),
    ]);

    createFinanceOrder([
        'vessel_name' => 'MV Confirmed',
        'status' => OrderStatus::Pending,
    ]);

    createFinanceOrder([
        'vessel_name' => 'MV Cancelled',
        'status' => OrderStatus::Cancelled,
    ]);

    $this->get(route('finance'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->has('completedOrders', 2));
});

test('paid_in_full is true only when amount received covers the invoice', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);

    createFinanceOrder([
        'customer_id' => $customer->sap_id,
        'order_number' => 'ORD-FIN-PAID',
        'vessel_name' => 'MV Paid',
        'delivery_location' => SupplyLocation::Berth->value,
        'invoice_value' => 1000,
        'amount_received' => 1000,
        'payment_due_date' => now()->addDays(1),
    ]);

    createFinanceOrder([
        'order_number' => 'ORD-FIN-PARTIAL',
        'vessel_name' => 'MV Partial',
        'invoice_value' => 1000,
        'amount_received' => 400,
        'payment_due_date' => now()->addDays(2),
    ]);

    $this->get(route('finance'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 2)
            ->where('completedOrders.0.order_number', 'ORD-FIN-PAID')
            ->where('completedOrders.0.customer_name', 'Blue Ocean Ltd')
            ->where('completedOrders.0.location', 'Berth')
            ->where('completedOrders.0.invoice_value', '1000.00')
            ->where('completedOrders.0.status', 'Delivered')
            ->where('completedOrders.0.paid_in_full', true)
            ->where('completedOrders.1.order_number', 'ORD-FIN-PARTIAL')
            ->where('completedOrders.1.paid_in_full', false));
});

test('guests cannot add a payment', function () {
    $order = createFinanceOrder();

    $this->post(route('finance.payments.store', $order))->assertRedirect(route('login'));
});

test('adding payments totals the amount received and records the latest date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'order_number' => 'ORD-FIN-PAY',
        'invoice_value' => 1000,
    ]);

    $this->post(route('finance.payments.store', $order), [
        'amount' => 400,
        'date' => '2026-07-10',
        'type' => PaymentType::Regular->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->post(route('finance.payments.store', $order), [
        'amount' => 350.5,
        'date' => '2026-07-20',
        'type' => PaymentType::Regular->value,
    ])->assertRedirect();

    $order->refresh();

    expect($order->payments()->count())->toBe(2);
    expect((float) $order->amount_received)->toBe(750.5);
    expect($order->payment_receipt_date->toDateString())->toBe('2026-07-20');
});

test('credit note and write-off payments count toward the amount received', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'order_number' => 'ORD-FIN-SETTLED',
        'invoice_value' => 1000,
    ]);

    $this->post(route('finance.payments.store', $order), [
        'amount' => 600,
        'date' => '2026-07-10',
        'type' => PaymentType::CreditNote->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->post(route('finance.payments.store', $order), [
        'amount' => 400,
        'date' => '2026-07-12',
        'type' => PaymentType::WriteOffApproved->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order->refresh();

    expect($order->payments()->pluck('type')->all())
        ->toEqualCanonicalizing([PaymentType::CreditNote, PaymentType::WriteOffApproved]);
    expect((float) $order->amount_received)->toBe(1000.0);
    expect($order->isPaidInFull())->toBeTrue();
});

test('the dashboard lists an order\'s payments newest first', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'order_number' => 'ORD-FIN-HISTORY',
        'invoice_value' => 1000,
    ]);

    $this->post(route('finance.payments.store', $order), [
        'amount' => 400,
        'date' => '2026-07-10',
        'type' => PaymentType::Regular->value,
    ]);

    $this->post(route('finance.payments.store', $order), [
        'amount' => 350.5,
        'date' => '2026-07-20',
        'type' => PaymentType::CreditNote->value,
    ]);

    $this->get(route('finance'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders.0.payments', 2)
            ->where('completedOrders.0.payments.0.date', '2026-07-20')
            ->where('completedOrders.0.payments.0.amount', '350.50')
            ->where('completedOrders.0.payments.0.type', 'credit_note')
            ->where('completedOrders.0.payments.1.date', '2026-07-10')
            ->where('completedOrders.0.payments.1.amount', '400.00')
            ->where('completedOrders.0.payments.1.type', 'regular')
            ->has('paymentTypeOptions'));
});

test('add payment requires a non-negative amount, a date and a valid type', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder();

    $this->post(route('finance.payments.store', $order), [
        'amount' => -5,
        'date' => '2026-07-20',
        'type' => PaymentType::Regular->value,
    ])->assertSessionHasErrors('amount');

    $this->post(route('finance.payments.store', $order), [
        'amount' => 100,
        'type' => PaymentType::Regular->value,
    ])->assertSessionHasErrors('date');

    $this->post(route('finance.payments.store', $order), [
        'amount' => 100,
        'date' => '2026-07-20',
        'type' => 'not-a-type',
    ])->assertSessionHasErrors('type');
});

test('guests cannot close a finance order', function () {
    $order = createFinanceOrder();

    $this->patch(route('finance.close', $order))->assertRedirect(route('login'));
});

test('closing a delivered order that is paid in full sets it to closed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'status' => OrderStatus::Delivered,
        'invoice_value' => 1000,
        'amount_received' => 1000,
    ]);

    $this->patch(route('finance.close', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Closed);
});

test('a delivered order that is not paid in full cannot be closed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'status' => OrderStatus::Delivered,
        'invoice_value' => 1000,
        'amount_received' => 400,
    ]);

    $this->patch(route('finance.close', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Delivered);
});

test('closed orders do not appear on the finance dashboard', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createFinanceOrder([
        'vessel_name' => 'MV Closed',
        'status' => OrderStatus::Closed,
        'invoice_value' => 1000,
        'amount_received' => 1000,
    ]);

    $this->get(route('finance'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 0));
});
