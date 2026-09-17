<?php

use App\Enums\PaymentType;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the payments page', function () {
    $this->get(route('payments.index'))->assertRedirect(route('login'));
});

test('index lists payments with their order and customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);
    $order = Order::factory()->create(['customer_id' => $customer->sap_id, 'order_number' => 'ORD-PAY-1']);
    Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 400,
        'type' => PaymentType::CreditNote,
    ]);

    $this->get(route('payments.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('payments/index')
            ->has('payments.data', 1)
            ->where('payments.data.0.order_number', 'ORD-PAY-1')
            ->where('payments.data.0.customer_name', 'Blue Ocean Ltd')
            ->where('payments.data.0.type', 'credit_note')
            ->where('payments.per_page', 25)
            ->where('payments.total', 1)
            ->where('canManagePayments', false)
            ->where('filters.search', '')
            ->has('paymentTypeOptions'));
});

test('finance users can view past payments without edit access', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    $customer = Customer::factory()->create(['name' => 'Read Only Customer']);
    $order = Order::factory()->create(['customer_id' => $customer->sap_id, 'order_number' => 'ORD-FIN-VIEW']);
    Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 250,
    ]);

    $this->get(route('payments.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('payments/index')
            ->has('payments.data', 1)
            ->where('payments.data.0.order_number', 'ORD-FIN-VIEW')
            ->where('canManagePayments', false));
});

test('index searches payments by order customer and vessel', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    $matchedCustomer = Customer::factory()->create(['name' => 'Searchable Marine']);
    $matchedOrder = Order::factory()->create([
        'customer_id' => $matchedCustomer->sap_id,
        'order_number' => 'ORD-PAY-SEARCH',
        'vessel_name' => 'MT Search Star',
    ]);
    Payment::factory()->create(['order_number' => $matchedOrder->order_number]);

    $otherCustomer = Customer::factory()->create(['name' => 'Other Marine']);
    $otherOrder = Order::factory()->create([
        'customer_id' => $otherCustomer->sap_id,
        'order_number' => 'ORD-PAY-OTHER',
        'vessel_name' => 'MT Other Star',
    ]);
    Payment::factory()->create(['order_number' => $otherOrder->order_number]);

    $this->get(route('payments.index', ['search' => 'searchable']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('payments/index')
            ->has('payments.data', 1)
            ->where('payments.data.0.order_number', 'ORD-PAY-SEARCH')
            ->where('filters.search', 'searchable'));
});

test('index paginates payments', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 26) as $number) {
        $orderNumber = 'ORD-PAY-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT);

        Order::factory()->create(['order_number' => $orderNumber]);

        Payment::factory()->create([
            'order_number' => $orderNumber,
            'date' => now()->subDays($number),
        ]);
    }

    $this->get(route('payments.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('payments/index')
            ->has('payments.data', 25)
            ->where('payments.current_page', 1)
            ->where('payments.per_page', 25)
            ->where('payments.total', 26)
            ->where('payments.data.0.order_number', 'ORD-PAY-001'));

    $this->get(route('payments.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('payments/index')
            ->has('payments.data', 1)
            ->where('payments.current_page', 2)
            ->where('payments.data.0.order_number', 'ORD-PAY-026'));
});

test('guests cannot update a payment', function () {
    $payment = Payment::factory()->create();

    $this->put(route('payments.update', $payment))->assertRedirect(route('login'));
});

test('authenticated users cannot update a past payment', function (UserType $type) {
    $this->actingAs(User::factory()->create(['type' => $type]));

    $payment = Payment::factory()->create();

    $this->put(route('payments.update', $payment), [
        'amount' => 700,
        'date' => '2026-07-20',
        'type' => PaymentType::Regular->value,
    ])->assertForbidden();
})->with([UserType::SuperAdmin, UserType::Master, UserType::Finance]);

test('guests cannot delete a payment', function () {
    $payment = Payment::factory()->create();

    $this->delete(route('payments.destroy', $payment))->assertRedirect(route('login'));
});

test('authenticated users cannot delete a past payment', function (UserType $type) {
    $this->actingAs(User::factory()->create(['type' => $type]));

    $payment = Payment::factory()->create();

    $this->delete(route('payments.destroy', $payment))->assertForbidden();
})->with([UserType::SuperAdmin, UserType::Master, UserType::Finance]);
