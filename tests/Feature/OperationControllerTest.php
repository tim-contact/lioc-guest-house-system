<?php

use App\Enums\DeliveryMode;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Barge;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the operations page', function () {
    $this->get(route('operations'))->assertRedirect(route('login'));
});

test('index exposes barge, agency and PIC options alongside the edit fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create(['name' => 'Dynamic Operations Port']);
    $supplyLocation = SupplyLocation::factory()->create([
        'port_id' => $port->id,
        'name' => 'INNER ANCHORAGE',
    ]);
    AgentPic::factory()->create();

    Order::factory()->create([
        'order_number' => 'ORD-OPS',
        'port_id' => $port->id,
        'delivery_location_id' => $supplyLocation->id,
        'agent_name' => 'Direct Agent',
        'delivery_mode' => DeliveryMode::Pipeline,
        'product_type' => ProductType::Bonded,
        'compliance_checked' => true,
        'nomination_received' => false,
        'status' => OrderStatus::Pending,
    ]);

    $this->get(route('operations'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('operations/dashboard')
            ->where('ports', fn ($ports): bool => collect($ports)->contains('Dynamic Operations Port'))
            ->has('barges')
            ->has('agents')
            ->has('agentPics', 1)
            ->where('pendingOrders.0.agent_name', 'Direct Agent')
            ->where('pendingOrders.0.delivery_mode', DeliveryMode::Pipeline->value)
            ->where('pendingOrders.0.product_type', ProductType::Bonded->value)
            ->where('pendingOrders.0.compliance_checked', true)
            ->where('pendingOrders.0.nomination_received', false)
            ->has('pendingOrders.0.agent_pic_id')
            ->where('pendingOrders.0.delivery_location', 'INNER ANCHORAGE')
            ->has('pendingOrders.0.mgo_final_qty'));
});

test('index exposes the ordered quantity bounds', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Order::factory()->create([
        'status' => OrderStatus::Pending,
        'vlsfo_quantity_low' => 100,
        'vlsfo_quantity_high' => 250,
    ]);

    $this->get(route('operations'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('pendingOrders.0.vlsfo_quantity_low', '100.000')
            ->where('pendingOrders.0.vlsfo_quantity_high', '250.000'));
});

test('operations includes assigned barge names and vessel IMOs for pending and completed orders', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['name' => 'MT Assigned Barge']);

    foreach ([OrderStatus::Pending, OrderStatus::Delivered] as $status) {
        $order = Order::factory()->create([
            'status' => $status,
            'invoice_date' => now(),
            'barge_id' => $barge->imo,
            'vessel_id' => '1234567',
            'vlsfo_rate' => 520,
            'mgo_rate' => 650.25,
            'hsfo_rate' => null,
        ]);
        if ($status === OrderStatus::Delivered) {
            $order->bdn()->create(['delivery_date' => now()->toDateString()]);
        }
    }

    $this->get(route('operations'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('pendingOrders.0.barge_name', $barge->name)
            ->where('pendingOrders.0.barge_id', $barge->imo)
            ->where('pendingOrders.0.vessel_id', '1234567')
            ->where('pendingOrders.0.vlsfo_rate', '520.00')
            ->where('pendingOrders.0.mgo_rate', '650.25')
            ->where('pendingOrders.0.hsfo_rate', null)
            ->where('completedOrders.0.barge_name', $barge->name)
            ->where('completedOrders.0.barge_id', $barge->imo)
            ->where('completedOrders.0.vlsfo_rate', '520.00')
            ->where('completedOrders.0.mgo_rate', '650.25')
            ->where('completedOrders.0.vessel_id', '1234567'));
});

test('index exposes last thirty days completed orders with their port and final quantities', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create(['name' => 'Galle']);

    $order = Order::factory()->create([
        'port_id' => $port->id,
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
        'vlsfo_final_qty' => 812.5,
        'vlsfo_bdn_qty' => 799.75,
    ]);
    $order->bdn()->create(['delivery_date' => now()->toDateString()]);

    $this->get(route('operations'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 1)
            ->where('completedOrders.0.port', 'Galle')
            ->where('completedOrders.0.vlsfo_final_qty', '812.500')
            ->where('completedOrders.0.vlsfo_bdn_qty', '799.750'));
});

test('guests cannot update an operations order', function () {
    $order = Order::factory()->create();

    $this->patch(route('operations.update', $order))->assertRedirect(route('login'));
});

test('update persists operations fields and leaves vessel and order identifiers untouched', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'order_number' => 'ORD-KEEP',
        'vessel_name' => 'MV Fixed',
        'vessel_id' => '1000001',
        'delivery_mode' => DeliveryMode::Barge,
    ]);

    $barge = Barge::factory()->create();
    $agent = Agent::factory()->create(['name' => 'Direct Entry Agent']);
    $pic = AgentPic::factory()->create(['agent_id' => $agent->id, 'name' => 'Jane Roe']);
    $location = SupplyLocation::firstOrCreate(['port_id' => $order->port_id, 'name' => 'ANCHORAGE']);

    $this->patch(route('operations.update', $order), [
        'eta' => '2026-08-01T14:30',
        'etb' => '2026-08-01T16:00',
        'etd' => '2026-08-02T06:30',
        'ata' => '2026-08-01T14:45',
        'atb' => '2026-08-01T16:20',
        'atd' => '2026-08-02T07:10',
        'bunker_started_at' => '2026-08-01T17:00',
        'bunker_completed_at' => '2026-08-01T22:45',
        'delivery_location_id' => $location->id,
        'barge_id' => $barge->imo,
        'vlsfo_final_qty' => 812.5,
        'mgo_final_qty' => 140.25,
        'hsfo_final_qty' => 60,
        'agent_id' => $agent->id,
        'agent_pic_id' => $pic->id,
        'mobile_no' => '+94 77 123 4567',
        'nomination_received' => true,
    ])->assertRedirect();

    $order->refresh();

    expect($order->delivery_location_id)->toBe($location->id);
    expect($order->barge_id)->toBe($barge->imo);
    expect($order->agent_id)->toBe($agent->id);
    expect($order->agent_name)->toBe('Direct Entry Agent');
    expect($order->agent_pic_id)->toBe($pic->id);
    expect($order->pic)->toBe('Jane Roe');
    expect($order->mobile_no)->toBe('+94 77 123 4567');
    expect($order->nomination_received)->toBeTrue();
    expect((float) $order->vlsfo_final_qty)->toBe(812.5);
    expect((float) $order->mgo_final_qty)->toBe(140.25);
    expect($order->eta->format('Y-m-d H:i'))->toBe('2026-08-01 14:30');
    expect($order->etb->format('Y-m-d H:i'))->toBe('2026-08-01 16:00');
    expect($order->etd->format('Y-m-d H:i'))->toBe('2026-08-02 06:30');
    expect($order->ata->format('Y-m-d H:i'))->toBe('2026-08-01 14:45');
    expect($order->atb->format('Y-m-d H:i'))->toBe('2026-08-01 16:20');
    expect($order->atd->format('Y-m-d H:i'))->toBe('2026-08-02 07:10');
    expect($order->bunker_started_at->format('Y-m-d H:i'))->toBe('2026-08-01 17:00');
    expect($order->bunker_completed_at->format('Y-m-d H:i'))->toBe('2026-08-01 22:45');

    expect($order->order_number)->toBe('ORD-KEEP');
    expect($order->vessel_name)->toBe('MV Fixed');
    expect($order->vessel_id)->toBe('1000001');
});

test('update clears barge assignment for truck and pipeline deliveries', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();
    $order = Order::factory()->create([
        'delivery_mode' => DeliveryMode::Pipeline,
        'barge_id' => $barge->imo,
    ]);

    $this->patch(route('operations.update', $order), [
        'vlsfo_final_qty' => 812.5,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh()->barge_id)->toBeNull();
});

test('update clears the agency and PIC snapshot when both are unset', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $pic = AgentPic::factory()->create();
    $order = Order::factory()->create([
        'agent_id' => $pic->agent_id,
        'agent_name' => $pic->agent->name,
        'agent_pic_id' => $pic->id,
        'pic' => $pic->name,
    ]);

    $this->patch(route('operations.update', $order), [
        'agent_id' => null,
        'agent_pic_id' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->refresh())
        ->agent_id->toBeNull()
        ->agent_name->toBeNull()
        ->agent_pic_id->toBeNull()
        ->pic->toBeNull();
});

test('update rejects an unknown agency or PIC', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->patch(route('operations.update', $order), [
        'agent_id' => 999,
        'agent_pic_id' => 999,
    ])->assertSessionHasErrors(['agent_id', 'agent_pic_id']);
});

test('update rejects an unknown barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->patch(route('operations.update', $order), [
        'barge_id' => 'NOT-A-BARGE',
    ])->assertSessionHasErrors('barge_id');
});
