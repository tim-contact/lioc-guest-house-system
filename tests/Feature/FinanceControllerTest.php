<?php

use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Enums\UserType;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function createFinanceOrder(array $attributes = []): Order
{
    static $sequence = 0;
    $sequence++;

    $port = Port::factory()->create(['name' => 'Colombo']);
    $location = SupplyLocation::factory(['port_id' => $port->id])->create(['name' => 'BERTH']);

    return Order::create([
        'enquiry_id' => Enquiry::factory()->create()->id,
        'order_number' => 'ORD-FIN-'.$sequence,
        'customer_id' => Customer::factory()->create()->sap_id,
        'port_id' => $port->id,
        'delivery_location_id' => $location->id,
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
            ->has('completedOrders.data', 2)
            ->where('completedOrders.total', 2));
});

test('finance dashboard lists cancelled orders separately with cancellation balances', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    createFinanceOrder([
        'order_number' => 'ORD-FIN-CANCELLED',
        'vessel_name' => 'MV Cancelled',
        'status' => OrderStatus::Cancelled,
        'cancellation_charge' => 1500,
        'cancellation_reason' => 'Customer withdrew the nomination.',
        'cancelled_at' => '2026-10-20 10:30:00',
        'amount_received' => 500,
    ]);

    $this->get(route('finance'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders.data', 0)
            ->has('cancelledOrders.data', 1)
            ->where('cancelledOrders.data.0.order_number', 'ORD-FIN-CANCELLED')
            ->where('cancelledOrders.data.0.cancellation_charge', '1500.00')
            ->where('cancelledOrders.data.0.cancellation_reason', 'Customer withdrew the nomination.')
            ->where('cancelledOrders.data.0.amount_remaining', 1000)
            ->where('cancelledOrders.data.0.paid_in_full', false));
});

test('finance users can record payments against cancellation charges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    $order = createFinanceOrder([
        'status' => OrderStatus::Cancelled,
        'cancellation_charge' => 750,
        'cancellation_reason' => 'Customer cancelled.',
        'cancelled_at' => now(),
    ]);

    $this->post(route('finance.payments.store', $order), [
        'amount' => 750,
        'date' => '2026-10-21',
        'type' => PaymentType::Regular->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh()->amount_received)->toBe('750.00');
});

test('paid_in_full is true only when amount received covers the invoice', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);

    createFinanceOrder([
        'customer_id' => $customer->sap_id,
        'order_number' => 'ORD-FIN-PAID',
        'vessel_name' => 'MV Paid',
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
            ->has('completedOrders.data', 2)
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-PAID')
            ->where('completedOrders.data.0.customer_name', 'Blue Ocean Ltd')
            ->where('completedOrders.data.0.port', 'Colombo')
            ->where('completedOrders.data.0.location', 'BERTH')
            ->where('completedOrders.data.0.invoice_value', '1000.00')
            ->where('completedOrders.data.0.status', 'Delivered')
            ->where('completedOrders.data.0.paid_in_full', true)
            ->where('completedOrders.data.1.order_number', 'ORD-FIN-PARTIAL')
            ->where('completedOrders.data.1.paid_in_full', false)
            ->where('filters.search', ''));
});

test('finance marks outstanding orders past their due date as overdue', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createFinanceOrder([
        'order_number' => 'ORD-FIN-OVERDUE',
        'invoice_value' => 1000,
        'amount_received' => 400,
        'payment_due_date' => now()->subDays(2),
    ]);
    createFinanceOrder([
        'order_number' => 'ORD-FIN-PAID-PAST-DUE',
        'invoice_value' => 1000,
        'amount_received' => 1000,
        'payment_due_date' => now()->subDay(),
    ]);
    createFinanceOrder([
        'order_number' => 'ORD-FIN-DUE-TODAY',
        'invoice_value' => 1000,
        'amount_received' => 0,
        'payment_due_date' => now(),
    ]);

    $this->get(route('finance'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-OVERDUE')
            ->where('completedOrders.data.0.is_overdue', true)
            ->where('completedOrders.data.1.order_number', 'ORD-FIN-PAID-PAST-DUE')
            ->where('completedOrders.data.1.is_overdue', false)
            ->where('completedOrders.data.2.order_number', 'ORD-FIN-DUE-TODAY')
            ->where('completedOrders.data.2.is_overdue', false));
});

test('finance dashboard paginates completed orders', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 26) as $number) {
        createFinanceOrder([
            'order_number' => 'ORD-FIN-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'invoice_value' => 1000,
            'amount_received' => 100,
            'payment_due_date' => now()->addDays($number),
        ]);
    }

    $this->get(route('finance', ['per_page' => 10]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->has('completedOrders.data', 10)
            ->where('completedOrders.current_page', 1)
            ->where('completedOrders.per_page', 10)
            ->where('completedOrders.total', 26)
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-001')
            ->where('financeSummary.0.count', 26)
            ->where('financeSummary.0.amount', 23400));

    $this->get(route('finance', ['page' => 2, 'per_page' => 25]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->has('completedOrders.data', 1)
            ->where('completedOrders.current_page', 2)
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-026'));
});

test('finance export applies the current vessel search', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));
    Order::factory()->create(['status' => OrderStatus::Delivered, 'vessel_name' => 'MV Searchable']);
    Order::factory()->create(['status' => OrderStatus::Delivered, 'vessel_name' => 'MV Other']);

    $this->getJson(route('finance.export', ['search' => 'searchable']))
        ->assertOk()->assertJsonCount(1, 'rows')
        ->assertJsonPath('rows.0.vessel_name', 'MV Searchable');
});

test('finance export returns all matching rows filtered by order and eta date ranges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    foreach (range(1, 26) as $number) {
        createFinanceOrder([
            'order_number' => 'ORD-FIN-EXP-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
            'order_date' => '2026-09-10',
            'eta' => '2026-09-15 08:00:00',
            'invoice_value' => 1000,
            'amount_received' => 100,
        ]);
    }

    createFinanceOrder([
        'order_number' => 'ORD-FIN-OUTSIDE-ORDER-DATE',
        'order_date' => '2026-08-31',
        'eta' => '2026-09-15 08:00:00',
    ]);

    createFinanceOrder([
        'order_number' => 'ORD-FIN-OUTSIDE-ETA',
        'order_date' => '2026-09-10',
        'eta' => '2026-10-01 08:00:00',
    ]);

    $this->getJson(route('finance.export', [
        'order_date_from' => '2026-09-01',
        'order_date_to' => '2026-09-30',
        'eta_from' => '2026-09-01',
        'eta_to' => '2026-09-30',
    ]))
        ->assertOk()
        ->assertJsonCount(26, 'rows')
        ->assertJsonPath('rows.0.order_number', 'ORD-FIN-EXP-001')
        ->assertJsonMissing(['order_number' => 'ORD-FIN-OUTSIDE-ORDER-DATE'])
        ->assertJsonMissing(['order_number' => 'ORD-FIN-OUTSIDE-ETA']);
});

test('finance dashboard sorts the full paginated result set by customer name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range('A', 'J') as $letter) {
        $customer = Customer::factory()->create(['name' => "{$letter} Customer"]);

        createFinanceOrder([
            'customer_id' => $customer->sap_id,
            'order_number' => "ORD-FIN-{$letter}",
            'payment_due_date' => now()->addDays(ord($letter) - 63),
        ]);
    }

    $zulu = Customer::factory()->create(['name' => 'Zulu Marine']);
    createFinanceOrder([
        'customer_id' => $zulu->sap_id,
        'order_number' => 'ORD-FIN-ZULU',
        'payment_due_date' => now()->addDay(),
    ]);

    $this->get(route('finance', [
        'sort' => 'customer_name',
        'dir' => 'asc',
        'per_page' => 10,
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->where('completedOrders.total', 11)
            ->where('completedOrders.data.0.customer_name', 'A Customer')
            ->where('completedOrders.data.9.customer_name', 'J Customer')
            ->where('filters.sort', 'customer_name')
            ->where('filters.dir', 'asc'));

    $this->get(route('finance', [
        'sort' => 'customer_name',
        'dir' => 'asc',
        'per_page' => 10,
        'page' => 2,
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->where('completedOrders.data.0.customer_name', 'Zulu Marine'));
});

test('finance dashboard sorts by payment status in both directions', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createFinanceOrder([
        'order_number' => 'ORD-FIN-NOT-PAID',
        'invoice_value' => 1000,
        'amount_received' => 0,
        'payment_due_date' => now()->addDay(),
    ]);
    createFinanceOrder([
        'order_number' => 'ORD-FIN-PARTIALLY-PAID',
        'invoice_value' => 1000,
        'amount_received' => 400,
        'payment_due_date' => now()->addDay(),
    ]);
    createFinanceOrder([
        'order_number' => 'ORD-FIN-OVERDUE',
        'invoice_value' => 1000,
        'amount_received' => 400,
        'payment_due_date' => now()->subDay(),
    ]);
    createFinanceOrder([
        'order_number' => 'ORD-FIN-PAID',
        'invoice_value' => 1000,
        'amount_received' => 1000,
        'payment_due_date' => now()->subDay(),
    ]);

    $this->get(route('finance', ['sort' => 'payment_status', 'dir' => 'desc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-PAID')
            ->where('completedOrders.data.1.order_number', 'ORD-FIN-OVERDUE')
            ->where('completedOrders.data.2.order_number', 'ORD-FIN-PARTIALLY-PAID')
            ->where('completedOrders.data.3.order_number', 'ORD-FIN-NOT-PAID')
            ->where('filters.sort', 'payment_status')
            ->where('filters.dir', 'desc'));

    $this->get(route('finance', ['sort' => 'payment_status', 'dir' => 'asc']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-NOT-PAID')
            ->where('completedOrders.data.1.order_number', 'ORD-FIN-PARTIALLY-PAID')
            ->where('completedOrders.data.2.order_number', 'ORD-FIN-OVERDUE')
            ->where('completedOrders.data.3.order_number', 'ORD-FIN-PAID')
            ->where('filters.sort', 'payment_status')
            ->where('filters.dir', 'asc'));
});

test('finance dashboard filters completed orders by vessel or customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $colombo = Port::factory()->create(['name' => 'Colombo']);
    $galle = Port::factory()->create(['name' => 'Galle']);
    $blueOcean = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);
    $harborLine = Customer::factory()->create(['name' => 'Harbor Line']);

    createFinanceOrder([
        'customer_id' => $blueOcean->sap_id,
        'port_id' => $colombo->id,
        'order_number' => 'ORD-FIN-COL',
        'vessel_name' => 'MV Search Alpha',
        'invoice_value' => 1000,
        'amount_received' => 100,
        'payment_due_date' => now()->addDay(),
    ]);

    createFinanceOrder([
        'customer_id' => $blueOcean->sap_id,
        'port_id' => $galle->id,
        'order_number' => 'ORD-FIN-GAL',
        'vessel_name' => 'MV Search Alpha',
        'invoice_value' => 1000,
        'amount_received' => 100,
        'payment_due_date' => now()->addDays(2),
    ]);

    createFinanceOrder([
        'customer_id' => $harborLine->sap_id,
        'port_id' => $colombo->id,
        'order_number' => 'ORD-FIN-HAR',
        'vessel_name' => 'MV Other',
        'invoice_value' => 1000,
        'amount_received' => 100,
        'payment_due_date' => now()->addDays(3),
    ]);

    $this->get(route('finance', ['search' => 'blue']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->has('completedOrders.data', 2)
            ->where('completedOrders.total', 2)
            ->where('completedOrders.data.0.order_number', 'ORD-FIN-COL')
            ->where('filters.search', 'blue')
            ->where('financeSummary.0.count', 3));

    $this->get(route('finance', ['search' => 'search alpha']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->has('completedOrders.data', 2)
            ->where('completedOrders.total', 2));

    $this->get(route('finance', ['search' => '  search   alpha  ']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('finance/dashboard')
            ->where('completedOrders.total', 2)
            ->where('filters.search', 'search alpha'));
});

test('guests cannot add a payment', function () {
    $order = createFinanceOrder();

    $this->post(route('finance.payments.store', $order))->assertRedirect(route('login'));
});

test('finance users can update agent fees and reprice a delivered order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    $order = createFinanceOrder([
        'vlsfo_bdn_qty' => 100,
        'vlsfo_rate' => 500,
        'barging_cost' => 1200,
        'agent_fees' => 0,
        'invoice_value' => 51200,
    ]);

    $this->patch(route('finance.agent-fees.update', $order), [
        'agent_fees' => 750,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh())
        ->agent_fees->toBe('750.00')
        ->invoice_value->toBe('51950.00');
});

test('agent fees cannot be updated for a pending order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));

    $order = createFinanceOrder(['status' => OrderStatus::Pending]);

    $this->patch(route('finance.agent-fees.update', $order), [
        'agent_fees' => 750,
    ])->assertForbidden();
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
            ->has('completedOrders.data.0.payments', 2)
            ->where('completedOrders.data.0.payments.0.date', '2026-07-20')
            ->where('completedOrders.data.0.payments.0.amount', '350.50')
            ->where('completedOrders.data.0.payments.0.type', 'credit_note')
            ->where('completedOrders.data.0.payments.1.date', '2026-07-10')
            ->where('completedOrders.data.0.payments.1.amount', '400.00')
            ->where('completedOrders.data.0.payments.1.type', 'regular')
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

test('a delivered order with a zero-value invoice can be closed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'status' => OrderStatus::Delivered,
        'invoice_value' => 0,
        'amount_received' => null,
    ]);

    $this->get(route('finance'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completedOrders.data.0.paid_in_full', false)
            ->where('completedOrders.data.0.can_close', true));

    $this->patch(route('finance.close', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Closed);
});

test('a delivered order without an invoice cannot be closed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createFinanceOrder([
        'status' => OrderStatus::Delivered,
        'invoice_value' => null,
        'amount_received' => null,
    ]);

    $this->get(route('finance'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('completedOrders.data.0.can_close', false));

    $this->patch(route('finance.close', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Delivered);
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
            ->has('completedOrders.data', 0)
            ->where('completedOrders.total', 0));
});
