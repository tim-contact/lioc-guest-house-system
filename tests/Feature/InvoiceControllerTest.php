<?php

use App\Enums\OrderStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the invoices page', function () {
    $this->get(route('invoices.index'))->assertRedirect(route('login'));
});

test('index lists only orders that have been invoiced', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);

    Order::factory()->create([
        'customer_id' => $customer->sap_id,
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
        'invoice_value' => 1000,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Pending,
        'invoice_date' => null,
        'invoice_value' => null,
    ]);

    $this->get(route('invoices.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices', 1)
            ->where('invoices.0.customer_name', 'Blue Ocean Ltd'));
});

test('guests cannot update an invoice', function () {
    $order = Order::factory()->create(['invoice_date' => now()]);

    $this->put(route('invoices.update', $order))->assertRedirect(route('login'));
});

test('update saves the invoice value, invoice date and payment due date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'invoice_date' => '2026-07-01',
        'invoice_value' => 1000,
        'payment_due_date' => '2026-07-31',
    ]);

    $this->put(route('invoices.update', $order), [
        'invoice_value' => 1500,
        'invoice_date' => '2026-07-05',
        'payment_due_date' => '2026-08-05',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order->refresh();

    expect((float) $order->invoice_value)->toBe(1500.0);
    expect($order->invoice_date->toDateString())->toBe('2026-07-05');
    expect($order->payment_due_date->toDateString())->toBe('2026-08-05');
});

test('invoices cannot be deleted', function () {
    expect(Route::has('invoices.destroy'))->toBeFalse();
});

test('update rejects a payment due date before the invoice date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['invoice_date' => '2026-07-05']);

    $this->put(route('invoices.update', $order), [
        'invoice_date' => '2026-07-05',
        'payment_due_date' => '2026-07-01',
    ])->assertSessionHasErrors('payment_due_date');
});
