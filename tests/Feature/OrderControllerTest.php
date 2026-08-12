<?php

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\OrderStatus;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Barge;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Enums\UserType;
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

test('index renders pending and completed orders grouped by port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder([
        'vessel_name' => 'MV Pending',
        'status' => OrderStatus::Pending,
    ]);

    createOrder([
        'vessel_name' => 'MV Delivered Recently',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(10),
    ]);

    createOrder([
        'vessel_name' => 'MV Delivered Long Ago',
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
            ->has('completedOrders', 1)
            ->where('completedOrders.0.vessel_name', 'MV Delivered Recently'));
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
        'laycan_from' => '2026-02-01',
        'laycan_to' => '2026-02-05',
    ])->assertRedirect();

    $order->refresh();

    expect($order->vessel_name)->toBe('MV New');
    expect($order->vessel_id)->toBe('9999999');
    expect($order->customer_id)->toBe($customer->sap_id);
    expect($order->port_id)->toBe($port->id);
    expect($order->delivery_mode)->toBe(DeliveryMode::Truck);
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
        'invoice_value' => 50000,
    ]);

    $this->patch(route('orders.update', $order), [
        'vlsfo_rate' => 600,
    ])->assertRedirect();

    expect((float) $order->refresh()->invoice_value)->toBe(60000.0);
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

    $this->patch(route('orders.cancel', $order))->assertRedirect();

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('pendingOrders', 0));

    $this->get(route('orders.table'))
        ->assertInertia(fn (AssertableInertia $page) => $page->has('orders', 1));
});

test('guests are redirected from the orders table page', function () {
    $this->get(route('orders.table'))->assertRedirect(route('login'));
});

test('table renders every order with all attributes', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createOrder(['vessel_name' => 'MV Alpha', 'order_number' => 'ORD-ALPHA']);
    createOrder(['vessel_name' => 'MV Beta', 'order_number' => 'ORD-BETA']);

    $this->get(route('orders.table'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('orders/table')
            ->has('orders', 2)
            ->where('orders.0.order_number', 'ORD-ALPHA')
            ->where('orders.0.status', OrderStatus::Pending->value)
            ->where('orders.1.order_number', 'ORD-BETA')
            ->has('agents')
            ->has('agentPics')
            ->has('statusOptions')
            ->has('deliveryModeOptions')
            ->has('supplyLocationOptions')
            ->has('productTypeOptions')
            ->has('creditTermsOptions'));
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
        'delivery_location' => 'berth',
        'product_type' => 'bonded',
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
    expect($fresh->vessel_name)->toBe('MV Renamed');
    expect($fresh->vlsfo_qty_range)->toBe('100 - 200');
    expect((float) $fresh->amount_received)->toBe(45000.0);
    expect($fresh->payment_receipt_date->toDateString())->toBe('2026-02-10');
    expect((float) $fresh->invoice_value)->toBe(75000.0);
});

test('table update ignores a submitted invoice value and recomputes it from bdn quantity and rate', function () {
    $this->actingAs(User::factory()->create());

    $order = createOrder([
        'status' => OrderStatus::Delivered,
        'vlsfo_bdn_qty' => 100,
        'vlsfo_rate' => 500,
        'invoice_value' => 50000,
    ]);

    $this->patch(route('orders.table.update', $order), [
        'order_number' => $order->order_number,
        'enquiry_id' => $order->enquiry_id,
        'customer_id' => $order->customer_id,
        'status' => OrderStatus::Delivered->value,
        'invoice_value' => 999999,
    ])->assertRedirect();

    expect((float) $order->refresh()->invoice_value)->toBe(50000.0);
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
