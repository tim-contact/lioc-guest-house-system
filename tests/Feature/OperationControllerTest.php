<?php

use App\Enums\OrderStatus;
use App\Enums\SupplyLocation;
use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Barge;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the operations page', function () {
    $this->get(route('operations'))->assertRedirect(route('login'));
});

test('index exposes barge, agency and PIC options alongside the edit fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    AgentPic::factory()->create();

    Order::factory()->create([
        'order_number' => 'ORD-OPS',
        'agent_name' => 'Direct Agent',
        'status' => OrderStatus::Pending,
    ]);

    $this->get(route('operations'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('operations/dashboard')
            ->has('barges')
            ->has('agents')
            ->has('agentPics', 1)
            ->where('pendingOrders.0.agent_name', 'Direct Agent')
            ->has('pendingOrders.0.agent_pic_id')
            ->has('pendingOrders.0.delivery_location')
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
    ]);

    $barge = Barge::factory()->create();
    $agent = Agent::factory()->create(['name' => 'Direct Entry Agent']);
    $pic = AgentPic::factory()->create(['agent_id' => $agent->id, 'name' => 'Jane Roe']);

    $this->patch(route('operations.update', $order), [
        'eta' => '2026-08-01T14:30',
        'delivery_location' => SupplyLocation::Anchorage->value,
        'barge_id' => $barge->imo,
        'vlsfo_final_qty' => 812.5,
        'mgo_final_qty' => 140.25,
        'hsfo_final_qty' => 60,
        'agent_id' => $agent->id,
        'agent_pic_id' => $pic->id,
        'mobile_no' => '+94 77 123 4567',
    ])->assertRedirect();

    $order->refresh();

    expect($order->delivery_location)->toBe(SupplyLocation::Anchorage);
    expect($order->barge_id)->toBe($barge->imo);
    expect($order->agent_id)->toBe($agent->id);
    expect($order->agent_name)->toBe('Direct Entry Agent');
    expect($order->agent_pic_id)->toBe($pic->id);
    expect($order->pic)->toBe('Jane Roe');
    expect($order->mobile_no)->toBe('+94 77 123 4567');
    expect((float) $order->vlsfo_final_qty)->toBe(812.5);
    expect((float) $order->mgo_final_qty)->toBe(140.25);
    expect($order->eta->format('Y-m-d H:i'))->toBe('2026-08-01 14:30');

    expect($order->order_number)->toBe('ORD-KEEP');
    expect($order->vessel_name)->toBe('MV Fixed');
    expect($order->vessel_id)->toBe('1000001');
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
