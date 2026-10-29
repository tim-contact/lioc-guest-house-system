<?php

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\QualityClaim;
use App\Enums\Sampling;
use App\Enums\UserType;
use App\Jobs\CheckEnquirySanctions;
use App\Models\Agent;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use Illuminate\Support\Facades\Bus;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the enquiries page', function () {
    $this->get(route('enquiries.index'))->assertRedirect(route('login'));
});

test('enquiry export returns all records in the date range regardless of pagination', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Enquiry::factory()->count(30)->create(['created_at' => '2026-10-15 12:00:00']);
    Enquiry::factory()->create(['created_at' => '2026-11-01 00:00:00']);

    $this->getJson(route('enquiries.edit.export', ['date_from' => '2026-10-01', 'date_to' => '2026-10-31']))
        ->assertOk()
        ->assertJsonCount(30, 'rows');

    $this->get(route('enquiries.edit.export', ['date_from' => '2026-11-01', 'date_to' => '2026-10-01']))
        ->assertRedirect()
        ->assertSessionHasErrors('date_to');
});

test('enquiry export is restricted to administrators', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Sales]));

    $this->getJson(route('enquiries.edit.export', ['date_from' => '2026-10-01', 'date_to' => '2026-10-31']))
        ->assertRedirect();
});

test('index lists enquiries with their customers and product details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create([
        'status' => EnquiryStatus::Open,
        'vlsfo_quantity_low' => 100,
    ]);
    $enquiry->enquiryCustomers()->createMany([
        ['customer_id' => 'AAA'],
        ['customer_id' => 'BBB'],
    ]);

    $this->get(route('enquiries.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/index')
            ->has('enquiries', 1)
            ->has('enquiries.0.customers', 2)
            ->where('enquiries.0.vlsfo_quantity_low', '100.000')
            ->has('customers')
            ->has('ports')
            ->has('agents'));
});

test('index reports each customer credit limit less their open orders and invoices', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['credit_limit' => 500000]);

    $order = Order::factory()->create([
        'customer_id' => $customer->sap_id,
        'status' => OrderStatus::Pending,
        'vlsfo_rate' => 500,
        'vlsfo_final_qty' => 200,
        'mgo_rate' => null,
        'mgo_final_qty' => null,
        'mgo_quantity_high' => null,
        'hsfo_rate' => null,
        'hsfo_final_qty' => null,
        'hsfo_quantity_high' => null,
        'invoice_value' => null,
        'amount_received' => null,
    ]);

    $order->enquiry->update(['status' => EnquiryStatus::Open]);
    $order->enquiry->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);

    $this->get(route('enquiries.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('enquiries', 1)
            ->where("creditByCustomer.{$customer->sap_id}.credit_available", 400000));
});

test('index excludes won and lost enquiries', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    Enquiry::factory()->create(['status' => EnquiryStatus::Won]);
    Enquiry::factory()->create(['status' => EnquiryStatus::Lost]);

    $this->get(route('enquiries.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/index')
            ->has('enquiries', 1));
});

test('store creates an enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    Bus::fake();

    $port = Port::factory()->create();

    $this->post(route('enquiries.store'), [
        'vessel_name' => 'MT Test Vessel',
        'imo' => '1234567',
        'port_id' => $port->id,
        'laycan_from' => '2026-08-01',
        'laycan_to' => '2026-08-05',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Enquiry::sole())
        ->vessel_name->toBe('MT Test Vessel')
        ->imo->toBe('1234567')
        ->sanctions_screening_status->toBe('pending');

    Bus::assertDispatched(CheckEnquirySanctions::class, fn (CheckEnquirySanctions $job): bool => $job->enquiryId === Enquiry::sole()->id);
});

test('store requires a vessel name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('enquiries.store'), [])
        ->assertSessionHasErrors(['vessel_name']);
});

test('update saves core fields and product details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['vessel_name' => 'Old Name']);

    $this->put(route('enquiries.update', $enquiry), [
        'vessel_name' => 'New Name',
        'imo' => '7654321',
        'port_id' => null,
        'laycan_from' => null,
        'laycan_to' => null,
        'vlsfo_quantity_low' => 100,
        'vlsfo_quantity_high' => 200,
        'vlsfo_product_type' => 'bonded',
        'vlsfo_delivery_mode' => 'barge',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh())
        ->vessel_name->toBe('New Name')
        ->vlsfo_quantity_low->toEqual('100.000')
        ->vlsfo_quantity_high->toEqual('200.000')
        ->vlsfo_product_type->toBe(ProductType::Bonded)
        ->vlsfo_delivery_mode->toBe(DeliveryMode::Barge);
});

test('compliance status can be updated from the enquiry card', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Sales]));

    $enquiry = Enquiry::factory()->create(['compliance_checked' => false]);

    $this->patch(route('enquiries.compliance.update', $enquiry), [
        'compliance_checked' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh()->compliance_checked)->toBeTrue();
});

test('update clears product details when its fields are emptied', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['vlsfo_quantity_low' => 100]);

    $this->put(route('enquiries.update', $enquiry), [
        'vessel_name' => $enquiry->vessel_name,
        'vlsfo_quantity_low' => null,
        'vlsfo_quantity_high' => null,
        'vlsfo_product_type' => null,
        'vlsfo_delivery_mode' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh()->vlsfo_quantity_low)->toBeNull();
});

test('updateDetails saves the additional operational details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);
    $agent = Agent::factory()->create();
    $location = SupplyLocation::firstOrCreate(['port_id' => $enquiry->port_id, 'name' => 'ANCHORAGE']);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'agent_id' => $agent->id,
        'sampling' => 'vessel_manifold',
        'supply_location_id' => $location->id,
        'quality_claim' => '30_days',
        'instructions' => 'Deliver before noon.',
        'barging_cost' => 1500,
        'generate_order' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh())
        ->agent_id->toBe($agent->id)
        ->sampling->toBe(Sampling::VesselManifold)
        ->supply_location_id->toBe($location->id)
        ->quality_claim->toBe(QualityClaim::ThirtyDays)
        ->instructions->toBe('Deliver before noon.')
        ->status->toBe(EnquiryStatus::Completing);
    expect((float) $enquiry->barging_cost)->toBe(1500.0);
});

test('updateDetails rejects invalid supply location and quality claim', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'supply_location_id' => 999999,
        'quality_claim' => '7_days',
    ])->assertSessionHasErrors(['supply_location_id', 'quality_claim']);
});

test('updateDetails rejects supply location when enquiry has no port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create([
        'port_id' => null,
        'status' => EnquiryStatus::Completing,
    ]);
    $location = SupplyLocation::factory()->create();

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'supply_location_id' => $location->id,
    ])->assertSessionHasErrors(['supply_location_id']);
});

test('updateDetails with generate_order wins the enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'agent_id' => null,
        'sampling' => 'barge_manifold',
        'supply_location_id' => null,
        'barging_cost' => 0,
        'generate_order' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh()->status)->toBe(EnquiryStatus::Won);
});

test('updateDetails with generate_order marks non-fixed customers lost', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);
    $fixed = $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
        'status' => EnquiryCustomerStatus::Fixed,
    ]);
    $pending = $enquiry->enquiryCustomers()->create(['customer_id' => Customer::factory()->create()->sap_id]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($fixed->refresh()->status)->toBe(EnquiryCustomerStatus::Fixed);
    expect($pending->refresh()->status)->toBe(EnquiryCustomerStatus::Lost);
});

test('generate_order snapshots the enquiry and winning customer into an order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    $location = SupplyLocation::firstOrCreate(['port_id' => $port->id, 'name' => 'ANCHORAGE']);
    $agent = Agent::factory()->create();
    $customer = Customer::factory()->create();

    $enquiry = Enquiry::factory()->create([
        'status' => EnquiryStatus::Completing,
        'vessel_name' => 'MT Test Vessel',
        'imo' => '1234567',
        'port_id' => $port->id,
        'supply_location_id' => $location->id,
        'laycan_from' => '2026-08-01',
        'laycan_to' => '2026-08-05',
        'vlsfo_quantity_low' => 500,
        'vlsfo_quantity_high' => 1000,
        'vlsfo_product_type' => ProductType::Bonded,
        'vlsfo_delivery_mode' => DeliveryMode::Barge,
        'barging_cost' => 1250,
        'compliance_checked' => true,
    ]);

    $enquiry->enquiryCustomers()->create([
        'customer_id' => $customer->sap_id,
        'status' => EnquiryCustomerStatus::Fixed,
        'credit_terms' => CreditTerms::Days14,
        'vlsfo_fixing_counter' => 650.5,
    ]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'agent_id' => $agent->id,
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order = Order::sole();

    expect($order->enquiry_id)->toBe($enquiry->id)
        ->and($order->order_number)->toStartWith('ORD-')
        ->and($order->customer_id)->toBe($customer->sap_id)
        ->and($order->vessel_id)->toBe('1234567')
        ->and($order->vessel_name)->toBe('MT Test Vessel')
        ->and($order->port_id)->toBe($port->id)
        ->and($order->agent_id)->toBe($agent->id)
        ->and($order->delivery_location_id)->toBe($location->id)
        ->and((float) $order->barging_cost)->toBe(1250.0)
        ->and($order->product_type)->toBe(ProductType::Bonded)
        ->and($order->delivery_mode)->toBe(DeliveryMode::Barge)
        ->and($order->compliance_checked)->toBeTrue()
        ->and($order->vlsfo_qty_range)->toBe('500 - 1000')
        ->and((float) $order->vlsfo_rate)->toBe(650.5)
        ->and($order->credit_terms)->toBe(CreditTerms::Days14)
        ->and($order->status)->toBe(OrderStatus::Pending);

    expect($enquiry->refresh()->order)->not->toBeNull();
});

test('generate_order requires a fixed rate for every selected product', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create([
        'status' => EnquiryStatus::Completing,
        'vlsfo_quantity_low' => 500,
        'mgo_quantity_high' => 100,
    ]);
    $fixed = $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
        'status' => EnquiryCustomerStatus::Fixed,
        'vlsfo_fixing_counter' => 650.5,
        'mgo_fixing_counter' => null,
    ]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ])
        ->assertRedirect()
        ->assertSessionHasErrors([
            'generate_order' => 'Add a fixed rate for MGO before generating the order.',
        ]);

    expect(Order::count())->toBe(0)
        ->and($enquiry->refresh()->status)->toBe(EnquiryStatus::Completing)
        ->and($fixed->refresh()->status)->toBe(EnquiryCustomerStatus::Fixed);
});

test('saving details without generate_order creates no order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);
    $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
        'status' => EnquiryCustomerStatus::Fixed,
    ]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Order::count())->toBe(0);
});

test('generating an order twice does not create a second order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);
    $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
        'status' => EnquiryCustomerStatus::Fixed,
    ]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Order::count())->toBe(1);
});

test('order numbers stay unique after an order is deleted', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $generateOrderFor = function (): Order {
        $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);
        $enquiry->enquiryCustomers()->create([
            'customer_id' => Customer::factory()->create()->sap_id,
            'status' => EnquiryCustomerStatus::Fixed,
        ]);

        $this->patch(route('enquiries.details.update', $enquiry), [
            'sampling' => 'barge_manifold',
            'generate_order' => true,
        ])->assertRedirect()->assertSessionHasNoErrors();

        return $enquiry->order()->sole();
    };

    $first = $generateOrderFor();
    $second = $generateOrderFor();
    $second->delete();

    $third = $generateOrderFor();

    expect($third->order_number)
        ->toStartWith('ORD-')
        ->not->toBe($first->order_number);
});

test('generating an order removes the enquiry from the active index', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Completing]);

    $this->patch(route('enquiries.details.update', $enquiry), [
        'sampling' => 'barge_manifold',
        'generate_order' => true,
    ]);

    $this->get(route('enquiries.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/index')
            ->has('enquiries', 0));
});

test('markLost loses the whole enquiry, its customers, and drops it from the index', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $customer = $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
    ]);

    $this->patch(route('enquiries.lost', $enquiry), [
        'lost_to' => 'Rival Bunkers',
        'lost_port' => 'Singapore',
        'vlsfo_lost_price' => 545.5,
        'mgo_lost_price' => 720,
    ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($enquiry->refresh())
        ->status->toBe(EnquiryStatus::Lost)
        ->lost_to->toBe('Rival Bunkers')
        ->lost_port->toBe('Singapore')
        ->vlsfo_lost_price->toEqual('545.50')
        ->mgo_lost_price->toEqual('720.00')
        ->hsfo_lost_price->toBeNull();
    expect($customer->refresh()->status)->toBe(EnquiryCustomerStatus::Lost);

    $this->get(route('enquiries.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/index')
            ->has('enquiries', 0));
});

test('markLost accepts an empty payload and leaves the lost details null', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);

    $this->patch(route('enquiries.lost', $enquiry))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($enquiry->refresh())
        ->status->toBe(EnquiryStatus::Lost)
        ->lost_to->toBeNull()
        ->lost_port->toBeNull()
        ->vlsfo_lost_price->toBeNull();
});

test('edit renders the enquiries edit page with option lists', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Enquiry::factory()->create(['status' => EnquiryStatus::Won]);

    $this->get(route('enquiries.edit'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/edit')
            ->has('enquiries.data', 1)
            ->where('enquiries.per_page', 25)
            ->where('enquiries.total', 1)
            ->has('ports')
            ->has('agents')
            ->has('statusOptions')
            ->has('samplingOptions')
            ->has('productTypeOptions')
            ->has('deliveryModeOptions'));
});

test('edit paginates enquiries', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach (range(1, 26) as $number) {
        Enquiry::factory()->create([
            'vessel_name' => 'MT Page '.str_pad((string) $number, 2, '0', STR_PAD_LEFT),
            'created_at' => now()->subMinutes($number),
        ]);
    }

    $this->get(route('enquiries.edit'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/edit')
            ->has('enquiries.data', 25)
            ->where('enquiries.current_page', 1)
            ->where('enquiries.per_page', 25)
            ->where('enquiries.total', 26)
            ->where('enquiries.data.0.vessel_name', 'MT Page 01'));

    $this->get(route('enquiries.edit', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('enquiries/edit')
            ->has('enquiries.data', 1)
            ->where('enquiries.current_page', 2)
            ->where('enquiries.data.0.vessel_name', 'MT Page 26'));
});

test('editStore creates an enquiry with full details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    Bus::fake();

    $this->post(route('enquiries.edit.store'), [
        'vessel_name' => 'MT New',
        'imo' => '7654321',
        'status' => 'open',
        'sampling' => 'barge_manifold',
        'vlsfo_quantity_low' => 100,
        'vlsfo_product_type' => 'bonded',
        'vlsfo_delivery_mode' => 'barge',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Enquiry::sole())
        ->vessel_name->toBe('MT New')
        ->status->toBe(EnquiryStatus::Open)
        ->vlsfo_product_type->toBe(ProductType::Bonded)
        ->vlsfo_delivery_mode->toBe(DeliveryMode::Barge);

    Bus::assertDispatched(CheckEnquirySanctions::class, fn (CheckEnquirySanctions $job): bool => $job->enquiryId === Enquiry::sole()->id);
});

test('editStore requires vessel name, status and sampling', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('enquiries.edit.store'), [])
        ->assertSessionHasErrors(['vessel_name', 'status', 'sampling']);
});

test('editUpdate saves status, agent and product details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $agent = Agent::factory()->create();
    $location = SupplyLocation::firstOrCreate(['port_id' => $enquiry->port_id, 'name' => 'BERTH']);

    $this->patch(route('enquiries.edit.update', $enquiry), [
        'vessel_name' => 'Updated',
        'status' => 'won',
        'agent_id' => $agent->id,
        'sampling' => 'vessel_manifold',
        'supply_location_id' => $location->id,
        'quality_claim' => '14_days',
        'instructions' => 'Notify agent on arrival.',
        'barging_cost' => 1200,
        'mgo_quantity_low' => 50,
        'lost_to' => 'Rival Bunkers',
        'lost_port' => 'Colombo',
        'mgo_lost_price' => 610.25,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh())
        ->vessel_name->toBe('Updated')
        ->status->toBe(EnquiryStatus::Won)
        ->agent_id->toBe($agent->id)
        ->sampling->toBe(Sampling::VesselManifold)
        ->supply_location_id->toBe($location->id)
        ->quality_claim->toBe(QualityClaim::FourteenDays)
        ->instructions->toBe('Notify agent on arrival.')
        ->mgo_quantity_low->toEqual('50.000')
        ->lost_to->toBe('Rival Bunkers')
        ->lost_port->toBe('Colombo')
        ->mgo_lost_price->toEqual('610.25');
});

test('destroy deletes the enquiry and its customers', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $enquiry->enquiryCustomers()->create([
        'customer_id' => Customer::factory()->create()->sap_id,
    ]);

    $this->delete(route('enquiries.edit.destroy', $enquiry))
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Enquiry::count())->toBe(0);
    $this->assertDatabaseCount('enquiry_customers', 0);
});

test('destroy is blocked when an order references the enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    Order::factory()->create(['enquiry_id' => $enquiry->id]);

    $this->delete(route('enquiries.edit.destroy', $enquiry))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Enquiry::whereKey($enquiry->id)->exists())->toBeTrue();
});
