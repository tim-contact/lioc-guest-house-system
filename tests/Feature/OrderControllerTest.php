<?php

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\DisputeStatus;
use App\Enums\OrderStatus;
use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Barge;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function createOrder(array $attributes = []): Order
{
    static $sequence = 0;
    $sequence++;

    return Order::create([
        'enquiry_id' => Enquiry::factory()->create()->id,
        'order_number' => 'ORD-'.$sequence,
        'customer_id' => Customer::factory()->create()->sap_id,
        'port_id' => Port::factory()->create(['name' => 'Colombo'])->id,
        'eta' => now(),
        'agent_id' => Agent::factory()->create()->id,
        'barge_id' => Barge::factory()->create()->imo,
        'status' => OrderStatus::Pending,
        ...$attributes,
    ]);
}

test('guests are redirected from the orders page', function () {
    $this->get(route('orders'))->assertRedirect(route('login'));
});

test('index renders pending and last thirty days completed orders grouped by port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder([
        'vessel_name' => 'MV Pending',
        'vlsfo_rate' => 520,
        'mgo_rate' => 650.25,
        'compliance_checked' => true,
        'nomination_received' => false,
        'status' => OrderStatus::Pending,
    ]);

    $recent = createOrder([
        'vessel_name' => 'MV Delivered Recently',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
        'vlsfo_final_qty' => 375,
        'vlsfo_bdn_qty' => 360,
        'vlsfo_rate' => 510,
    ]);
    $recent->bdn()->create(['delivery_date' => now()->toDateString()]);

    createOrder([
        'vessel_name' => 'MV Delivered Previous Month',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(45),
    ]);

    createOrder([
        'vessel_name' => 'MV Cancelled',
        'status' => OrderStatus::Cancelled,
        'laycan_to' => now()->subDays(5),
    ]);

    $this->get(route('orders'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV Pending')
            ->where('pendingOrders.0.vlsfo_rate', '520.00')
            ->where('pendingOrders.0.mgo_rate', '650.25')
            ->where('pendingOrders.0.hsfo_rate', null)
            ->where('pendingOrders.0.compliance_checked', true)
            ->where('pendingOrders.0.nomination_received', false)
            ->has('completedOrders', 1)
            ->where('completedOrders.0.vessel_name', 'MV Delivered Recently')
            ->where('completedOrders.0.port', 'Colombo')
            ->where('completedOrders.0.vlsfo_final_qty', '375.000')
            ->where('completedOrders.0.vlsfo_rate', '510.00')
            ->where('completedOrders.0.vlsfo_bdn_qty', '360.000'));
});

test('sales and operations show rolling thirty day completed orders and retain open disputes', function (string $routeName) {
    $this->travelTo(now()->setDate(2026, 10, 5)->setTime(12, 0));
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach ([
        ['MV Today', OrderStatus::Delivered, 0],
        ['MV Previous Month Recent', OrderStatus::Delivered, 29],
        ['MV Boundary', OrderStatus::Delivered, 30],
        ['MV Closed Recent', OrderStatus::Closed, 10],
        ['MV Closed Outside Window', OrderStatus::Closed, 31],
        ['MV Outside Window', OrderStatus::Delivered, 31],
        ['MV Future Delivery', OrderStatus::Delivered, -1],
        ['MV Pending', OrderStatus::Pending, 0],
        ['MV Cancelled', OrderStatus::Cancelled, 0],
    ] as [$vesselName, $status, $daysAgo]) {
        $order = createOrder([
            'vessel_name' => $vesselName,
            'status' => $status,
            'invoice_date' => $daysAgo <= 30 ? now()->subDays(90) : now(),
            'created_at' => now()->subMonths(2),
        ]);
        $order->bdn()->create(['delivery_date' => now()->subDays($daysAgo)->toDateString()]);
    }

    $disputed = createOrder([
        'vessel_name' => 'MV Old Open Dispute',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(45),
    ]);
    Dispute::factory()->create(['order_id' => $disputed->id, 'dispute_status' => DisputeStatus::Open]);
    $disputed->bdn()->create(['delivery_date' => now()->subDays(45)->toDateString()]);

    $closedDisputed = createOrder([
        'vessel_name' => 'MV Closed Old Open Dispute',
        'status' => OrderStatus::Closed,
    ]);
    $closedDisputed->bdn()->create(['delivery_date' => now()->subDays(45)->toDateString()]);
    Dispute::factory()->create(['order_id' => $closedDisputed->id, 'dispute_status' => DisputeStatus::Open]);

    createOrder(['vessel_name' => 'MV No BDN', 'status' => OrderStatus::Delivered, 'invoice_date' => now()]);
    $undated = createOrder(['vessel_name' => 'MV Undated BDN', 'status' => OrderStatus::Delivered, 'invoice_date' => now()]);
    $undated->bdn()->create(['delivery_date' => null]);

    $this->get(route($routeName))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pendingOrders', 1)
            ->has('completedOrders', 6)
            ->where('completedOrders', fn ($orders): bool => collect($orders)->pluck('vessel_name')->sort()->values()->all()
                === ['MV Boundary', 'MV Closed Old Open Dispute', 'MV Closed Recent', 'MV Old Open Dispute', 'MV Previous Month Recent', 'MV Today']));
})->with(['sales' => 'orders', 'operations' => 'operations']);

test('sales and operations expose BDN delivery dates without substituting ETA', function (string $routeName) {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $delivered = Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
        'eta' => now()->subDays(5),
    ]);
    $delivered->bdn()->create([
        'delivery_date' => now()->subDays(2)->toDateString(),
    ]);
    $missingDate = Order::factory()->create(['status' => OrderStatus::Delivered, 'invoice_date' => now()]);
    Dispute::factory()->create(['order_id' => $missingDate->id, 'dispute_status' => DisputeStatus::Open]);
    $pending = Order::factory()->create(['status' => OrderStatus::Pending, 'eta' => now()->addDay()->startOfSecond()]);

    $this->get(route($routeName))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 2)
            ->where('completedOrders', function ($orders) use ($delivered, $missingDate): bool {
                $rows = collect($orders)->keyBy('id');

                return $rows[$delivered->id]['delivery_date'] === now()->subDays(2)->toDateString()
                    && $rows[$delivered->id]['has_bdn'] === true
                    && $rows[$missingDate->id]['delivery_date'] === null
                    && $rows[$missingDate->id]['has_bdn'] === false;
            })
            ->where('pendingOrders.0.id', $pending->id)
            ->where('pendingOrders.0.delivery_date', null)
            ->where('pendingOrders.0.eta', $pending->eta->toJSON()));
})->with(['sales' => 'orders', 'operations' => 'operations']);

test('sales and operations summaries use pending fallbacks and BDN completion dates', function (string $routeName) {
    $this->travelTo(now()->setDate(2026, 10, 15)->setTime(12, 0));
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach ([
        ['MV Pending This Month', now()->addDays(2), null],
        ['MV Pending Next Month', now()->addMonth(), now()->toDateString()],
        ['MV Pending From Laycan', null, now()->addDays(3)->toDateString()],
        ['MV Pending Without Date', null, null],
    ] as [$vesselName, $eta, $laycanFrom]) {
        createOrder([
            'vessel_name' => $vesselName,
            'status' => OrderStatus::Pending,
            'eta' => $eta,
            'laycan_from' => $laycanFrom,
        ]);
    }

    foreach ([
        [
            'MV Completed By Hose',
            OrderStatus::Delivered,
            now()->subDays(20),
            ['vlsfo_hose_disconnected_at' => now()->subDays(15), 'mgo_hose_disconnected_at' => now()->subDays(2)],
            100,
            95,
        ],
        ['MV Completed By Delivery Fallback', OrderStatus::Closed, now()->subDay(), [], 200, 190],
        [
            'MV Delivery Date Ignored',
            OrderStatus::Delivered,
            now()->subDays(2),
            ['vlsfo_hose_disconnected_at' => now()->subDays(15)],
            300,
            285,
        ],
        ['MV Previous Completion', OrderStatus::Delivered, now()->subDays(20), [], 400, 380],
    ] as [$vesselName, $status, $deliveryDate, $timesheet, $finalQuantity, $bdnQuantity]) {
        $order = createOrder([
            'vessel_name' => $vesselName,
            'status' => $status,
            'invoice_date' => now(),
            'vlsfo_final_qty' => $finalQuantity,
            'vlsfo_bdn_qty' => $bdnQuantity,
        ]);
        $order->bdn()->create([
            'delivery_date' => $deliveryDate->toDateString(),
            ...$timesheet,
        ]);
    }

    $this->get(route($routeName))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pendingOrders', 4)
            ->has('completedOrders', 4)
            ->has('summaryPendingOrders', 2)
            ->where('summaryPendingOrders', fn ($orders): bool => collect($orders)
                ->pluck('vessel_name')
                ->sort()
                ->values()
                ->all() === ['MV Pending From Laycan', 'MV Pending This Month'])
            ->has('summaryCompletedOrders', 2)
            ->where('summaryCompletedOrders', fn ($orders): bool => collect($orders)
                ->pluck('vessel_name')
                ->sort()
                ->values()
                ->all() === ['MV Completed By Delivery Fallback', 'MV Completed By Hose'])
            ->where('summaryCompletedOrders', function ($orders): bool {
                $rows = collect($orders)->keyBy('vessel_name');

                return $rows['MV Completed By Hose']['vlsfo_final_qty'] === '100.000'
                    && $rows['MV Completed By Hose']['vlsfo_bdn_qty'] === '95.000'
                    && $rows['MV Completed By Hose']['delivery_date'] === now()->subDays(2)->toDateString()
                    && $rows['MV Completed By Delivery Fallback']['delivery_date'] === now()->subDay()->toDateString();
            }));
})->with(['sales' => 'orders', 'operations' => 'operations']);

test('old delivered orders stay on the completed list while a dispute is open', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $disputed = createOrder([
        'vessel_name' => 'MV Disputed',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(45),
    ]);

    Dispute::factory()->create([
        'order_id' => $disputed->id,
        'dispute_status' => DisputeStatus::Open,
    ]);

    $settled = createOrder([
        'vessel_name' => 'MV Settled',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(45),
    ]);

    Dispute::factory()->create([
        'order_id' => $settled->id,
        'dispute_status' => DisputeStatus::Closed,
    ]);

    $this->get(route('orders'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 1)
            ->where('completedOrders.0.vessel_name', 'MV Disputed'));
});

test('order rows include port, customer and fuel grade quantities', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Blue Ocean Ltd']);

    createOrder([
        'customer_id' => $customer->sap_id,
        'vessel_name' => 'MV Test',
        'vlsfo_qty_range' => '500 - 600',
        'mgo_qty_range' => '100 - 150',
    ]);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('pendingOrders.0.customer_name', 'Blue Ocean Ltd')
            ->where('pendingOrders.0.port', 'Colombo')
            ->where('pendingOrders.0.vlsfo_qty', '500 - 600')
            ->where('pendingOrders.0.mgo_qty', '100 - 150'));
});

test('order rows show the final quantity once set, falling back to the range', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder([
        'vlsfo_qty_range' => '500 - 600',
        'vlsfo_final_qty' => 550,
        'mgo_qty_range' => '100 - 150',
        'mgo_final_qty' => null,
    ]);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('pendingOrders.0.vlsfo_qty', '550.000')
            ->where('pendingOrders.0.mgo_qty', '100 - 150'));
});

test('order rows expose operational timing calculations', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder([
        'eta' => '2026-08-01 10:00:00',
        'etb' => '2026-08-01 12:00:00',
        'etd' => '2026-08-02 06:00:00',
        'ata' => '2026-08-01 10:30:00',
        'atb' => '2026-08-01 12:15:00',
        'atd' => '2026-08-02 07:00:00',
        'bunker_started_at' => '2026-08-01 13:00:00',
        'bunker_completed_at' => '2026-08-01 18:30:00',
    ]);

    $this->get(route('orders'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('pendingOrders.0.estimated_port_stay_minutes', 1200)
            ->where('pendingOrders.0.actual_port_stay_minutes', 1230)
            ->where('pendingOrders.0.estimated_berth_stay_minutes', 1080)
            ->where('pendingOrders.0.actual_berth_stay_minutes', 1125)
            ->where('pendingOrders.0.arrival_to_berth_wait_minutes', 105)
            ->where('pendingOrders.0.bunkering_duration_minutes', 330));
});

test('index provides customer, port, agency and PIC options and edit fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    AgentPic::factory()->create();
    createOrder(['vessel_name' => 'MV Options', 'order_number' => 'ORD-OPT']);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('customers')
            ->has('ports')
            ->has('agents')
            ->has('agentPics', 1)
            ->where('pendingOrders.0.order_number', 'ORD-OPT')
            ->has('pendingOrders.0.agent_pic_id')
            ->has('pendingOrders.0.pic')
            ->has('pendingOrders.0.vlsfo_quantity_high')
            ->has('pendingOrders.0.laycan_from'));
});

test('guests cannot update an order', function () {
    $order = createOrder();

    $this->patch(route('orders.update', $order))->assertRedirect(route('login'));
});

test('update persists editable fields and leaves order number and date untouched', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder([
        'order_number' => 'ORD-KEEP',
        'order_date' => '2026-01-01',
        'vessel_name' => 'MV Old',
        'status' => OrderStatus::Pending,
    ]);

    $customer = Customer::factory()->create();
    $port = Port::factory()->create(['name' => 'Galle']);
    $agent = Agent::factory()->create(['name' => 'Acme Shipping Agents']);
    $agentPic = AgentPic::factory()->create(['agent_id' => $agent->id, 'name' => 'Wile E Coyote']);

    $this->patch(route('orders.update', $order), [
        'customer_id' => $customer->sap_id,
        'vessel_name' => 'MV New',
        'vessel_id' => '9999999',
        'port_id' => $port->id,
        'vlsfo_quantity_low' => 600,
        'mgo_quantity_low' => 90,
        'hsfo_quantity_low' => 40,
        'vlsfo_quantity_high' => 750,
        'mgo_quantity_high' => 120,
        'hsfo_quantity_high' => 60,
        'vlsfo_rate' => 500.5,
        'mgo_rate' => 610.25,
        'hsfo_rate' => 480,
        'vlsfo_final_qty' => 720,
        'agent_id' => $agent->id,
        'agent_pic_id' => $agentPic->id,
        'mobile_no' => '+94771234567',
        'delivery_mode' => DeliveryMode::Truck->value,
        'compliance_checked' => true,
        'laycan_from' => '2026-02-01',
        'laycan_to' => '2026-02-05',
    ])->assertRedirect();

    $order->refresh();

    expect($order->vessel_name)->toBe('MV New');
    expect($order->vessel_id)->toBe('9999999');
    expect($order->customer_id)->toBe($customer->sap_id);
    expect($order->port_id)->toBe($port->id);
    expect($order->delivery_mode)->toBe(DeliveryMode::Truck);
    expect($order->compliance_checked)->toBeTrue();
    expect($order->status)->toBe(OrderStatus::Pending);
    expect((float) $order->vlsfo_quantity_low)->toBe(600.0);
    expect((float) $order->vlsfo_quantity_high)->toBe(750.0);
    expect((float) $order->vlsfo_rate)->toBe(500.5);
    expect((float) $order->vlsfo_final_qty)->toBe(720.0);
    expect($order->agent_id)->toBe($agent->id);
    expect($order->agent_name)->toBe('Acme Shipping Agents');
    expect($order->agent_pic_id)->toBe($agentPic->id);
    expect($order->pic)->toBe('Wile E Coyote');
    expect($order->mobile_no)->toBe('+94771234567');
    expect($order->laycan_from->toDateString())->toBe('2026-02-01');
    expect($order->laycan_to->toDateString())->toBe('2026-02-05');

    expect($order->order_number)->toBe('ORD-KEEP');
    expect($order->order_date->toDateString())->toBe('2026-01-01');
});

test('update recomputes the fuel grade quantity ranges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder([
        'vlsfo_quantity_low' => 100,
        'vlsfo_quantity_high' => 200,
        'vlsfo_qty_range' => '100 - 200',
    ]);

    $this->patch(route('orders.update', $order), [
        'vlsfo_quantity_low' => 600,
        'vlsfo_quantity_high' => 750,
    ])->assertRedirect();

    $order->refresh();

    expect($order->vlsfo_qty_range)->toBe('600 - 750');
});

test('update clears fields submitted as empty strings', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['vlsfo_rate' => 500, 'vessel_name' => 'MV Named']);

    $this->patch(route('orders.update', $order), [
        'vlsfo_rate' => '',
        'vessel_name' => '',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order->refresh();

    expect($order->vlsfo_rate)->toBeNull();
    expect($order->vessel_name)->toBeNull();
});

test('update ignores a submitted status', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['status' => OrderStatus::Pending]);

    $this->patch(route('orders.update', $order), ['status' => OrderStatus::Delivered->value])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($order->refresh()->status)->toBe(OrderStatus::Pending);
});

test('update cannot close a delivered order, bypassing the finance paid-in-full guard', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['status' => OrderStatus::Delivered]);

    $this->patch(route('orders.update', $order), ['status' => OrderStatus::Closed->value])
        ->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Delivered);
});

test('update rejects a laycan end before its start', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder();

    $this->patch(route('orders.update', $order), [
        'laycan_from' => '2026-02-10',
        'laycan_to' => '2026-02-01',
    ])->assertSessionHasErrors('laycan_to');
});

test('update reprices the invoice value of a delivered order when a rate changes', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder([
        'status' => OrderStatus::Delivered,
        'vlsfo_bdn_qty' => 100,
        'vlsfo_rate' => 500,
        'barging_cost' => 2500,
        'invoice_value' => 50000,
    ]);

    $this->patch(route('orders.update', $order), [
        'vlsfo_rate' => 600,
    ])->assertRedirect();

    expect((float) $order->refresh()->invoice_value)->toBe(62500.0);
});

test('update leaves invoice value alone for a pending order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder([
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
    ]);

    $this->patch(route('orders.update', $order), [
        'vlsfo_rate' => 600,
    ])->assertRedirect();

    expect($order->refresh()->invoice_value)->toBeNull();
});

test('guests cannot cancel an order', function () {
    $order = createOrder();

    $this->patch(route('orders.cancel', $order))->assertRedirect(route('login'));
});

test('cancel marks the order cancelled, hiding it from the dashboard but not the table', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['vessel_name' => 'MV Doomed', 'status' => OrderStatus::Pending]);

    $this->patch(route('orders.cancel', $order), [
        'cancellation_charge' => 1250.50,
        'cancellation_reason' => 'Vessel schedule changed.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh())
        ->status->toBe(OrderStatus::Cancelled)
        ->cancellation_charge->toBe('1250.50')
        ->cancellation_reason->toBe('Vessel schedule changed.')
        ->cancelled_at->not->toBeNull();

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('pendingOrders', 0));

    $this->get(route('orders.table'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('orders.data', 1));
});

test('cancelling an order requires a charge and reason', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['status' => OrderStatus::Pending]);

    $this->patch(route('orders.cancel', $order), [])
        ->assertSessionHasErrors(['cancellation_charge', 'cancellation_reason']);

    expect($order->refresh()->status)->toBe(OrderStatus::Pending);
});

test('only pending orders can be cancelled', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['status' => OrderStatus::Delivered]);

    $this->patch(route('orders.cancel', $order), [
        'cancellation_charge' => 100,
        'cancellation_reason' => 'Invalid transition.',
    ])->assertForbidden();
});

test('guests are redirected from the orders table page', function () {
    $this->get(route('orders.table'))->assertRedirect(route('login'));
});

test('table renders every order with all attributes', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $customer = Customer::factory()->create(['name' => 'Alpha Marine Fuels']);

    createOrder([
        'vessel_name' => 'MV Alpha',
        'order_number' => 'ORD-ALPHA',
        'customer_id' => $customer->sap_id,
        'compliance_checked' => true,
        'nomination_received' => true,
    ]);
    createOrder(['vessel_name' => 'MV Beta', 'order_number' => 'ORD-BETA']);

    $this->get(route('orders.table'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders.data', 2)
            ->where('orders.data.0.order_number', 'ORD-ALPHA')
            ->where('orders.data.0.customer_name', 'Alpha Marine Fuels')
            ->where('orders.data.0.status', OrderStatus::Pending->value)
            ->where('orders.data.0.compliance_checked', true)
            ->where('orders.data.0.nomination_received', true)
            ->where('orders.data.1.order_number', 'ORD-BETA')
            ->where('orders.per_page', 25)
            ->where('orders.total', 2)
            ->has('agents')
            ->has('agentPics')
            ->has('statusOptions')
            ->has('deliveryModeOptions')
            ->has('supplyLocationOptions')
            ->has('productTypeOptions')
            ->has('creditTermsOptions'));
});

test('orders table paginates orders', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 26) as $number) {
        createOrder(['order_number' => 'ORD-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT)]);
    }

    $this->get(route('orders.table'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders.data', 25)
            ->where('orders.current_page', 1)
            ->where('orders.per_page', 25)
            ->where('orders.total', 26)
            ->where('orders.data.0.order_number', 'ORD-001'));

    $this->get(route('orders.table', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders.data', 1)
            ->where('orders.current_page', 2)
            ->where('orders.data.0.order_number', 'ORD-026'));
});

test('orders table sorts the complete result before pagination', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 10) as $number) {
        createOrder([
            'order_number' => 'ORD-ZULU-'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'vessel_name' => 'MV Zulu '.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
        ]);
    }

    createOrder([
        'order_number' => 'ORD-ALPHA',
        'vessel_name' => 'MV Alpha',
    ]);

    $this->get(route('orders.table', [
        'per_page' => 10,
        'sort' => 'vessel_name',
        'dir' => 'asc',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders.data', 10)
            ->where('orders.data.0.order_number', 'ORD-ALPHA')
            ->where('orders.total', 11)
            ->where('filters.sort', 'vessel_name')
            ->where('filters.dir', 'asc'));
});

test('orders table sorts by customer name before pagination', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $zuluCustomer = Customer::factory()->create(['name' => 'Zulu Marine']);
    $alphaCustomer = Customer::factory()->create(['name' => 'Alpha Marine']);

    createOrder(['order_number' => 'ORD-ZULU', 'customer_id' => $zuluCustomer->sap_id]);
    createOrder(['order_number' => 'ORD-ALPHA', 'customer_id' => $alphaCustomer->sap_id]);

    $this->get(route('orders.table', [
        'sort' => 'customer_name',
        'dir' => 'asc',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('orders.data.0.order_number', 'ORD-ALPHA')
            ->where('orders.data.0.customer_name', 'Alpha Marine')
            ->where('orders.data.1.order_number', 'ORD-ZULU')
            ->where('filters.sort', 'customer_name'));
});

test('orders table can be searched by vessel name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder(['vessel_name' => 'MV Coral Star', 'order_number' => 'ORD-CORAL']);
    createOrder(['vessel_name' => 'MV Lagoon Wave', 'order_number' => 'ORD-LAGOON']);

    $this->get(route('orders.table', ['search' => 'coral']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'ORD-CORAL')
            ->where('orders.total', 1)
            ->where('filters.search', 'coral'));
});

test('orders table can be searched by customer name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $matchingCustomer = Customer::factory()->create(['name' => 'Coral Marine Fuels']);
    $otherCustomer = Customer::factory()->create(['name' => 'Lagoon Trading']);

    createOrder([
        'customer_id' => $matchingCustomer->sap_id,
        'order_number' => 'ORD-CORAL-CUSTOMER',
    ]);
    createOrder([
        'customer_id' => $otherCustomer->sap_id,
        'order_number' => 'ORD-LAGOON-CUSTOMER',
    ]);

    $this->get(route('orders.table', ['search' => 'coral marine']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'ORD-CORAL-CUSTOMER')
            ->where('orders.data.0.customer_name', 'Coral Marine Fuels')
            ->where('filters.search', 'coral marine'));
});

test('orders export returns every order in the date range regardless of table pagination', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $customer = Customer::factory()->create(['name' => 'Export Customer']);

    foreach (range(1, 26) as $number) {
        createOrder([
            'customer_id' => $customer->sap_id,
            'order_number' => 'ORD-EXPORT-'.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'order_date' => '2026-09-15',
        ]);
    }

    createOrder([
        'customer_id' => $customer->sap_id,
        'order_number' => 'ORD-OUTSIDE-RANGE',
        'order_date' => '2026-10-01',
    ]);

    $this->getJson(route('orders.table.export', [
        'date_from' => '2026-09-01',
        'date_to' => '2026-09-30',
    ]))
        ->assertOk()
        ->assertJsonCount(26, 'orders')
        ->assertJsonPath('orders.0.order_number', 'ORD-EXPORT-01')
        ->assertJsonPath('orders.0.customer_name', 'Export Customer')
        ->assertJsonMissing(['order_number' => 'ORD-OUTSIDE-RANGE']);
});

test('orders export applies the current vessel or customer search', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $matchingCustomer = Customer::factory()->create(['name' => 'Coral Marine']);
    $otherCustomer = Customer::factory()->create(['name' => 'Lagoon Trading']);

    createOrder([
        'customer_id' => $matchingCustomer->sap_id,
        'order_number' => 'ORD-CUSTOMER-MATCH',
        'vessel_name' => 'MV Alpha',
        'order_date' => '2026-09-10',
    ]);
    createOrder([
        'customer_id' => $otherCustomer->sap_id,
        'order_number' => 'ORD-VESSEL-MATCH',
        'vessel_name' => 'MV Coral Star',
        'order_date' => '2026-09-11',
    ]);
    createOrder([
        'customer_id' => $otherCustomer->sap_id,
        'order_number' => 'ORD-NO-MATCH',
        'vessel_name' => 'MV Horizon',
        'order_date' => '2026-09-12',
    ]);

    $this->getJson(route('orders.table.export', [
        'date_from' => '2026-09-01',
        'date_to' => '2026-09-30',
        'search' => 'coral',
    ]))
        ->assertOk()
        ->assertJsonCount(2, 'orders')
        ->assertJsonPath('orders.0.order_number', 'ORD-CUSTOMER-MATCH')
        ->assertJsonPath('orders.1.order_number', 'ORD-VESSEL-MATCH')
        ->assertJsonMissing(['order_number' => 'ORD-NO-MATCH']);
});

test('orders export requires a valid date range', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->getJson(route('orders.table.export', [
        'date_from' => '2026-10-10',
        'date_to' => '2026-10-01',
    ]))->assertUnprocessable()->assertJsonValidationErrors('date_to');
});

test('guests cannot save an order from the admin table', function () {
    $order = createOrder();

    $this->patch(route('orders.table.update', $order))->assertRedirect(route('login'));
});

test('table update rejects a PIC belonging to another agency', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder();
    $strayPic = AgentPic::factory()->create();

    $this->patch(route('orders.table.update', $order), [
        'order_number' => $order->order_number,
        'enquiry_id' => $order->enquiry_id,
        'customer_id' => $order->customer_id,
        'status' => OrderStatus::Pending->value,
        'agent_id' => Agent::factory()->create()->id,
        'agent_pic_id' => $strayPic->id,
    ])->assertSessionHasErrors('agent_pic_id');
});

test('table update saves every section of the order, unlike the narrower dashboard update', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder(['status' => OrderStatus::Pending]);
    $customer = Customer::factory()->create();
    $port = Port::factory()->create();
    $location = SupplyLocation::firstOrCreate(['port_id' => $port->id, 'name' => 'BERTH']);
    $agent = Agent::factory()->create();
    $agentPic = AgentPic::factory()->create(['agent_id' => $agent->id, 'name' => 'Jane PIC']);
    $barge = Barge::factory()->create();

    $this->patch(route('orders.table.update', $order), [
        'order_number' => 'ORD-RENUMBERED',
        'order_date' => '2026-01-15',
        'enquiry_id' => $order->enquiry_id,
        'customer_id' => $customer->sap_id,
        'vessel_id' => '9999999',
        'vessel_name' => 'MV Renamed',
        'port_id' => $port->id,
        'eta' => '2026-02-01T10:30',
        'laycan_from' => '2026-02-01',
        'laycan_to' => '2026-02-05',
        'agent_id' => $agent->id,
        'agent_pic_id' => $agentPic->id,
        'barge_id' => $barge->imo,
        'mobile_no' => '+94770000000',
        'credit_terms' => CreditTerms::Days30->value,
        'status' => OrderStatus::Delivered->value,
        'delivery_mode' => DeliveryMode::Pipeline->value,
        'delivery_location_id' => $location->id,
        'barging_cost' => 1250,
        'product_type' => 'bonded',
        'compliance_checked' => true,
        'nomination_received' => true,
        'vlsfo_quantity_low' => 100,
        'vlsfo_quantity_high' => 200,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 150,
        'vlsfo_bdn_qty' => 150,
        'mgo_quantity_low' => 10,
        'mgo_quantity_high' => 20,
        'mgo_rate' => 600,
        'hsfo_quantity_low' => 5,
        'hsfo_quantity_high' => 15,
        'hsfo_rate' => 400,
        'invoice_value' => 90000,
        'invoice_date' => '2026-02-06',
        'payment_due_date' => '2026-03-06',
        'amount_received' => 45000,
        'payment_receipt_date' => '2026-02-10',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $fresh = $order->refresh();

    expect($fresh->order_number)->toBe('ORD-RENUMBERED');
    expect($fresh->customer_id)->toBe($customer->sap_id);
    expect($fresh->port_id)->toBe($port->id);
    expect($fresh->agent_id)->toBe($agent->id);
    expect($fresh->agent_name)->toBe($agent->name);
    expect($fresh->agent_pic_id)->toBe($agentPic->id);
    expect($fresh->pic)->toBe('Jane PIC');
    expect($fresh->barge_id)->toBe($barge->imo);
    expect($fresh->status)->toBe(OrderStatus::Delivered);
    expect($fresh->credit_terms)->toBe(CreditTerms::Days30);
    expect($fresh->delivery_mode)->toBe(DeliveryMode::Pipeline);
    expect($fresh->delivery_location_id)->toBe($location->id);
    expect((float) $fresh->barging_cost)->toBe(1250.0);
    expect($fresh->compliance_checked)->toBeTrue();
    expect($fresh->nomination_received)->toBeTrue();
    expect($fresh->vessel_name)->toBe('MV Renamed');
    expect($fresh->vlsfo_qty_range)->toBe('100 - 200');
    expect((float) $fresh->amount_received)->toBe(45000.0);
    expect($fresh->payment_receipt_date->toDateString())->toBe('2026-02-10');
    expect((float) $fresh->invoice_value)->toBe(76250.0);
});

test('table update ignores a submitted invoice value and recomputes it from bdn quantity and rate', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createOrder([
        'status' => OrderStatus::Delivered,
        'vlsfo_bdn_qty' => 100,
        'vlsfo_rate' => 500,
        'barging_cost' => 750,
        'invoice_value' => 50000,
    ]);

    $this->patch(route('orders.table.update', $order), [
        'order_number' => $order->order_number,
        'enquiry_id' => $order->enquiry_id,
        'customer_id' => $order->customer_id,
        'status' => OrderStatus::Delivered->value,
        'invoice_value' => 999999,
    ])->assertRedirect();

    expect((float) $order->refresh()->invoice_value)->toBe(50750.0);
});

test('table update rejects a duplicate order number', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder(['order_number' => 'ORD-TAKEN']);
    $order = createOrder(['order_number' => 'ORD-FREE']);

    $this->patch(route('orders.table.update', $order), [
        'order_number' => 'ORD-TAKEN',
        'enquiry_id' => $order->enquiry_id,
        'customer_id' => $order->customer_id,
        'status' => OrderStatus::Pending->value,
    ])->assertSessionHasErrors('order_number');
});
