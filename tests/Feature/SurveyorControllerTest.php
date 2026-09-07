<?php

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\OrderStatus;
use App\Enums\QualityClaim;
use App\Enums\Sampling;
use App\Enums\UserType;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\Surveyor;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

function createSurveyorOrder(array $attributes = []): Order
{
    static $sequence = 0;
    $sequence++;

    $port = Port::factory()->create(['name' => 'Colombo']);
    $location = SupplyLocation::factory(['port_id' => $port->id])->create(['name' => 'BERTH']);

    return Order::create([
        'enquiry_id' => Enquiry::factory()->create()->id,
        'order_number' => 'ORD-SUR-'.$sequence,
        'customer_id' => Customer::factory()->create()->sap_id,
        'port_id' => $port->id,
        'delivery_location_id' => $location->id,
        'eta' => now(),
        'agent_id' => Agent::factory()->create()->id,
        'barge_id' => Barge::factory()->create()->imo,
        'status' => OrderStatus::Pending,
        ...$attributes,
    ]);
}

test('guests are redirected from the surveyor page', function () {
    $this->get(route('surveyor'))->assertRedirect(route('login'));
});

test('index returns no orders when no barge is selected', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    createSurveyorOrder(['status' => OrderStatus::Pending]);

    $this->get(route('surveyor'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 0)
            ->has('completedOrders', 0)
            ->has('barges'));
});

test('index renders pending orders with location and fuel grade quantities for the selected barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'vessel_name' => 'MV Pending',
        'vessel_id' => '1234567',
        'vlsfo_final_qty' => 500,
        'mgo_final_qty' => 100,
        'status' => OrderStatus::Pending,
    ]);

    createSurveyorOrder(['status' => OrderStatus::Pending]);

    $this->get(route('surveyor', ['barge' => $order->barge_id]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV Pending')
            ->where('pendingOrders.0.vessel_id', '1234567')
            ->where('pendingOrders.0.port', 'Colombo')
            ->where('pendingOrders.0.location', 'BERTH')
            ->where('pendingOrders.0.vlsfo_qty', '500.000')
            ->where('pendingOrders.0.mgo_qty', '100.000')
            ->has('pendingOrders.0.order_number')
            ->has('pendingOrders.0.vlsfo_bdn_qty'));
});

test('index renders the operational instructions from the pending order enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create([
        'sampling' => Sampling::VesselManifold,
        'quality_claim' => QualityClaim::ThirtyDays,
        'instructions' => 'Deliver port side, two hoses.',
    ]);

    $order = createSurveyorOrder([
        'enquiry_id' => $enquiry->id,
        'pic' => 'Nimal Perera',
        'mobile_no' => '+94 77 123 4567',
    ]);

    $this->get(route('surveyor', ['barge' => $order->barge_id]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->where('pendingOrders.0.pic', 'Nimal Perera')
            ->where('pendingOrders.0.mobile_no', '+94 77 123 4567')
            ->where('pendingOrders.0.sampling', 'Vessel Manifold')
            ->where('pendingOrders.0.quality_claim', '30 days')
            ->where('pendingOrders.0.instructions', 'Deliver port side, two hoses.')
            ->missing('pendingOrders.0.barging_cost'));
});

test('index lists pending orders due within seven days and overdue ones', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();

    createSurveyorOrder([
        'barge_id' => $barge->imo,
        'vessel_name' => 'MV Overdue',
        'eta' => now()->subDay(),
    ]);
    createSurveyorOrder([
        'barge_id' => $barge->imo,
        'vessel_name' => 'MV Soon',
        'eta' => now()->addDays(2),
    ]);
    createSurveyorOrder([
        'barge_id' => $barge->imo,
        'vessel_name' => 'MV Later',
        'eta' => now()->addDays(5),
    ]);

    $this->get(route('surveyor', ['barge' => $barge->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 3)
            ->where('pendingOrders.0.vessel_name', 'MV Overdue')
            ->where('pendingOrders.1.vessel_name', 'MV Soon')
            ->where('pendingOrders.2.vessel_name', 'MV Later'));
});

test('guests cannot update a surveyor order', function () {
    $order = createSurveyorOrder();

    $this->patch(route('surveyor.update', $order))->assertRedirect(route('login'));
});

test('update persists BDN quantities and leaves vessel identifiers untouched', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'order_number' => 'ORD-KEEP',
        'vessel_name' => 'MV Fixed',
        'vessel_id' => '1000001',
    ]);

    $this->patch(route('surveyor.update', $order), [
        'vlsfo_bdn_qty' => 512.25,
        'mgo_bdn_qty' => 88,
        'hsfo_bdn_qty' => 40.5,
    ])->assertRedirect();

    $order->refresh();

    expect((float) $order->vlsfo_bdn_qty)->toBe(512.25);
    expect((float) $order->mgo_bdn_qty)->toBe(88.0);
    expect((float) $order->hsfo_bdn_qty)->toBe(40.5);

    expect($order->order_number)->toBe('ORD-KEEP');
    expect($order->vessel_name)->toBe('MV Fixed');
    expect($order->vessel_id)->toBe('1000001');
});

test('update reprices a delivered order\'s invoice value from the new BDN quantities', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'status' => OrderStatus::Delivered,
        'vlsfo_rate' => 500,
        'mgo_rate' => 0,
        'hsfo_rate' => 0,
        'barging_cost' => 1500,
        'agent_fees' => 250,
        'invoice_value' => 0,
    ]);

    $this->patch(route('surveyor.update', $order), [
        'vlsfo_bdn_qty' => 100,
    ])->assertRedirect();

    expect((float) $order->refresh()->invoice_value)->toBe(51750.0);
});

test('update leaves invoice value alone for a pending order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder(['status' => OrderStatus::Pending, 'vlsfo_rate' => 500]);

    $this->patch(route('surveyor.update', $order), [
        'vlsfo_bdn_qty' => 100,
    ])->assertRedirect();

    expect($order->refresh()->invoice_value)->toBeNull();
});

test('update rejects a negative BDN quantity', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder();

    $this->patch(route('surveyor.update', $order), [
        'vlsfo_bdn_qty' => -5,
    ])->assertSessionHasErrors('vlsfo_bdn_qty');
});

test('guests cannot complete a surveyor order', function () {
    $order = createSurveyorOrder();

    $this->patch(route('surveyor.complete', $order))->assertRedirect(route('login'));
});

test('complete delivers the order and stamps the invoice from BDN quantities and rates', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'status' => OrderStatus::Pending,
        'credit_terms' => CreditTerms::Days30,
        'vlsfo_bdn_qty' => 100,
        'vlsfo_rate' => 500,
        'mgo_bdn_qty' => 50,
        'mgo_rate' => 600,
        'hsfo_bdn_qty' => 0,
        'hsfo_rate' => 700,
        'barging_cost' => 2000,
        'agent_fees' => 500,
    ]);
    Bdn::factory()->create([
        'order_id' => $order->id,
        'delivery_date' => '2026-07-18',
    ]);

    $this->patch(route('surveyor.complete', $order))->assertRedirect();

    $order->refresh();

    expect($order->status)->toBe(OrderStatus::Delivered);
    expect((float) $order->invoice_value)->toBe(82500.0);
    expect($order->invoice_date->toDateString())->toBe('2026-07-18');
    expect($order->payment_due_date->toDateString())->toBe('2026-08-17');
});

test('complete with immediate credit terms makes payment due the same day', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'status' => OrderStatus::Pending,
        'credit_terms' => CreditTerms::Cod,
        'vlsfo_bdn_qty' => 10,
        'vlsfo_rate' => 100,
    ]);

    $this->patch(route('surveyor.complete', $order))->assertRedirect();

    expect($order->refresh()->payment_due_date->toDateString())->toBe(now()->toDateString());
});

test('completed orders show all fuel grade quantities in one row for the selected barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = createSurveyorOrder([
        'vessel_name' => 'MV Delivered Recently',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(10),
        'vlsfo_final_qty' => 500,
        'vlsfo_bdn_qty' => 510,
        'mgo_final_qty' => 75,
        'hsfo_final_qty' => 200,
    ]);

    createSurveyorOrder([
        'vessel_name' => 'MV Delivered Long Ago',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(45),
        'vlsfo_final_qty' => 300,
        'barge_id' => $order->barge_id,
    ]);

    createSurveyorOrder([
        'vessel_name' => 'MV Cancelled',
        'status' => OrderStatus::Cancelled,
        'invoice_date' => now()->subDays(5),
        'vlsfo_final_qty' => 900,
        'barge_id' => $order->barge_id,
    ]);

    createSurveyorOrder([
        'vessel_name' => 'MV Other Barge',
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subDays(10),
        'vlsfo_final_qty' => 700,
    ]);

    $this->get(route('surveyor', ['barge' => $order->barge_id]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 1)
            ->where('completedOrders.0.id', $order->id)
            ->where('completedOrders.0.vessel_name', 'MV Delivered Recently')
            ->where('completedOrders.0.vlsfo_qty', '510.000')
            ->where('completedOrders.0.mgo_qty', '75.000')
            ->where('completedOrders.0.hsfo_qty', '200.000'));
});

test('edit renders the surveyors edit page with barges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Surveyor::factory()->create(['name' => 'Jane Surveyor']);

    $this->get(route('surveyors.edit'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyors/edit')
            ->has('surveyors', 1)
            ->has('barges'));
});

test('store creates a surveyor', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();

    $this->post(route('surveyors.store'), [
        'survey_company' => 'Intertek',
        'name' => 'John Inspector',
        'mail_id' => 'john@intertek.test',
        'contact' => '+65 1234 5678',
        'barge_id' => $barge->imo,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Surveyor::sole())
        ->survey_company->toBe('Intertek')
        ->name->toBe('John Inspector')
        ->barge_id->toBe($barge->imo);
});

test('store creates a surveyor with multiple barges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $this->post(route('surveyors.store'), [
        'survey_company' => 'Intertek',
        'name' => 'John Inspector',
        'mail_id' => 'john@intertek.test',
        'contact' => '+65 1234 5678',
        'barge_ids' => [$bargeA->imo, $bargeB->imo],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor = Surveyor::sole();

    expect($surveyor->barge_id)->toBe($bargeA->imo);
    expect($surveyor->barges()->pluck('imo')->all())->toBe([
        $bargeA->imo,
        $bargeB->imo,
    ]);
});

test('store creates a surveyor with delivery mode assignments', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('surveyors.store'), [
        'survey_company' => 'Intertek',
        'name' => 'Pipeline Inspector',
        'mail_id' => 'pipeline@intertek.test',
        'contact' => '+65 1234 5678',
        'delivery_modes' => [DeliveryMode::Truck->value, DeliveryMode::Pipeline->value],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor = Surveyor::sole();

    expect($surveyor->barge_id)->toBeNull();
    expect($surveyor->deliveryModeAssignments()->pluck('delivery_mode')->all())->toBe([
        DeliveryMode::Truck,
        DeliveryMode::Pipeline,
    ]);
});

test('store requires survey company and name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('surveyors.store'), [])
        ->assertSessionHasErrors(['survey_company', 'name']);
});

test('update saves the surveyor', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $surveyor = Surveyor::factory()->create(['name' => 'Old Name']);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => 'SGS',
        'name' => 'New Name',
        'mail_id' => null,
        'contact' => null,
        'barge_id' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($surveyor->refresh())
        ->survey_company->toBe('SGS')
        ->name->toBe('New Name');
});

test('update replaces the surveyors assigned barges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();
    $bargeC = Barge::factory()->create();
    $surveyor = Surveyor::factory()->create(['barge_id' => $bargeA->imo]);
    $surveyor->barges()->sync([$bargeA->imo, $bargeB->imo]);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => 'SGS',
        'name' => 'New Name',
        'mail_id' => null,
        'contact' => null,
        'barge_ids' => [$bargeC->imo],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($surveyor->refresh()->barge_id)->toBe($bargeC->imo);
    expect($surveyor->barges()->pluck('imo')->all())->toBe([$bargeC->imo]);
});

test('update replaces the surveyors delivery mode assignments', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $surveyor = Surveyor::factory()->create(['barge_id' => null]);
    $surveyor->deliveryModeAssignments()->create([
        'delivery_mode' => DeliveryMode::Truck,
    ]);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => 'SGS',
        'name' => 'New Name',
        'mail_id' => null,
        'contact' => null,
        'delivery_modes' => [DeliveryMode::Pipeline->value],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($surveyor->deliveryModeAssignments()->pluck('delivery_mode')->all())->toBe([
        DeliveryMode::Pipeline,
    ]);
});

test('destroy deletes the surveyor', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $surveyor = Surveyor::factory()->create();

    $this->delete(route('surveyors.destroy', $surveyor))
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Surveyor::count())->toBe(0);
});
