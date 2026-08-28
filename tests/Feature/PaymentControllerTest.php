<?php

use App\Enums\PaymentType;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the payments page', function () {
    $this->get(route('payments.index'))->assertForbidden();
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
            ->has('payments', 1)
            ->where('payments.0.order_number', 'ORD-PAY-1')
            ->where('payments.0.customer_name', 'Blue Ocean Ltd')
            ->where('payments.0.type', 'credit_note')
            ->has('paymentTypeOptions'));
});

test('guests cannot update a payment', function () {
    $payment = Payment::factory()->create();

    $this->put(route('payments.update', $payment))->assertForbidden();
});

test('update recomputes the order amount received and payment receipt date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['invoice_value' => 1000]);
    $payment = Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 400,
        'date' => '2026-07-10',
    ]);
    Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 100,
        'date' => '2026-07-05',
    ]);

    $this->put(route('payments.update', $payment), [
        'amount' => 700,
        'date' => '2026-07-20',
        'type' => PaymentType::WriteOffApproved->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order->refresh();

    expect($payment->fresh()->type)->toBe(PaymentType::WriteOffApproved);
    expect((float) $order->amount_received)->toBe(800.0);
    expect($order->payment_receipt_date->toDateString())->toBe('2026-07-20');
});

test('update rejects a negative amount, a missing date and an unknown type', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $payment = Payment::factory()->create();

    $this->put(route('payments.update', $payment), [
        'amount' => -5,
        'date' => '2026-07-20',
        'type' => PaymentType::Regular->value,
    ])->assertSessionHasErrors('amount');

    $this->put(route('payments.update', $payment), [
        'amount' => 100,
        'type' => PaymentType::Regular->value,
    ])->assertSessionHasErrors('date');

    $this->put(route('payments.update', $payment), [
        'amount' => 100,
        'date' => '2026-07-20',
        'type' => 'not-a-type',
    ])->assertSessionHasErrors('type');
});

test('guests cannot delete a payment', function () {
    $payment = Payment::factory()->create();

    $this->delete(route('payments.destroy', $payment))->assertForbidden();
});

test('destroy removes the payment and recomputes the order totals', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['invoice_value' => 1000]);
    $kept = Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 300,
        'date' => '2026-07-05',
    ]);
    $removed = Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 400,
        'date' => '2026-07-10',
    ]);

    $this->delete(route('payments.destroy', $removed))->assertRedirect();

    expect(Payment::find($removed->id))->toBeNull();
    expect(Payment::find($kept->id))->not->toBeNull();

    $order->refresh();

    expect((float) $order->amount_received)->toBe(300.0);
    expect($order->payment_receipt_date->toDateString())->toBe('2026-07-05');
});

test('destroy nulls the payment receipt date when the last payment is removed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['invoice_value' => 1000]);
    $payment = Payment::factory()->create([
        'order_number' => $order->order_number,
        'amount' => 400,
        'date' => '2026-07-10',
    ]);

    $this->delete(route('payments.destroy', $payment))->assertRedirect();

    $order->refresh();

    expect((float) $order->amount_received)->toBe(0.0);
    expect($order->payment_receipt_date)->toBeNull();
});
