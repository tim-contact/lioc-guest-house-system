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
            ->has('invoices.data', 1)
            ->where('invoices.data.0.customer_name', 'Blue Ocean Ltd')
            ->where('invoices.per_page', 25)
            ->where('invoices.total', 1)
            ->where('filters.sort', 'payment_due_date')
            ->where('filters.dir', 'asc'));
});

test('index paginates invoices', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 26) as $number) {
        Order::factory()->create([
            'order_number' => 'INV-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'invoice_date' => now()->subDays(2),
            'payment_due_date' => now()->addDays($number),
        ]);
    }

    $this->get(route('invoices.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 25)
            ->where('invoices.current_page', 1)
            ->where('invoices.per_page', 25)
            ->where('invoices.total', 26)
            ->where('invoices.data.0.order_number', 'INV-001'));

    $this->get(route('invoices.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 1)
            ->where('invoices.current_page', 2)
            ->where('invoices.data.0.order_number', 'INV-026'));
});

test('index sorts invoices server-side by invoice value', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach ([800, 200, 500] as $value) {
        Order::factory()->create([
            'invoice_date' => now(),
            'invoice_value' => $value,
        ]);
    }

    $this->get(route('invoices.index', ['sort' => 'invoice_value', 'dir' => 'asc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 3)
            ->where('invoices.data.0.invoice_value', '200.00')
            ->where('invoices.data.1.invoice_value', '500.00')
            ->where('invoices.data.2.invoice_value', '800.00')
            ->where('filters.sort', 'invoice_value')
            ->where('filters.dir', 'asc'));

    $this->get(route('invoices.index', ['sort' => 'invoice_value', 'dir' => 'desc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 3)
            ->where('invoices.data.0.invoice_value', '800.00')
            ->where('invoices.data.2.invoice_value', '200.00'));
});

test('index sorts invoices server-side by customer name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (['Zulu Marine', 'alpha marine', 'Mike Marine'] as $name) {
        $customer = Customer::factory()->create(['name' => $name]);

        Order::factory()->create([
            'customer_id' => $customer->sap_id,
            'invoice_date' => now(),
        ]);
    }

    $this->get(route('invoices.index', ['sort' => 'customer_name', 'dir' => 'asc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 3)
            ->where('invoices.data.0.customer_name', 'alpha marine')
            ->where('invoices.data.1.customer_name', 'Mike Marine')
            ->where('invoices.data.2.customer_name', 'Zulu Marine')
            ->where('filters.sort', 'customer_name'));
});

test('index sorts invoices server-side by balance', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Order::factory()->create([
        'order_number' => 'INV-BAL-2',
        'invoice_date' => now(),
        'invoice_value' => 1000,
        'amount_received' => 300,
    ]);

    Order::factory()->create([
        'order_number' => 'INV-BAL-1',
        'invoice_date' => now(),
        'invoice_value' => 500,
        'amount_received' => 100,
    ]);

    Order::factory()->create([
        'order_number' => 'INV-BAL-3',
        'invoice_date' => now(),
        'invoice_value' => 700,
        'amount_received' => 0,
    ]);

    $this->get(route('invoices.index', ['sort' => 'balance_amount', 'dir' => 'asc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 3)
            ->where('invoices.data.0.order_number', 'INV-BAL-1')
            ->where('invoices.data.1.order_number', 'INV-BAL-2')
            ->where('invoices.data.2.order_number', 'INV-BAL-3')
            ->where('filters.sort', 'balance_amount'));
});

test('index falls back to nearest due date for an unknown sort key', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Order::factory()->create([
        'order_number' => 'INV-LATE',
        'invoice_date' => now(),
        'payment_due_date' => now()->addDays(5),
    ]);

    Order::factory()->create([
        'order_number' => 'INV-SOON',
        'invoice_date' => now(),
        'payment_due_date' => now()->addDays(1),
    ]);

    $this->get(route('invoices.index', ['sort' => 'not_a_column', 'dir' => 'desc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('invoices/index')
            ->has('invoices.data', 2)
            ->where('filters.sort', 'payment_due_date')
            ->where('filters.dir', 'asc')
            ->where('invoices.data.0.order_number', 'INV-SOON'));
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
