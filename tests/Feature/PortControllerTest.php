<?php

use App\Enums\UserType;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the ports page', function () {
    $this->get(route('ports.index'))->assertForbidden();
});

test('index lists ports ordered by name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Port::factory()->create(['name' => 'Zeta Port']);
    $alpha = Port::factory()->create(['name' => 'Alpha Port']);
    SupplyLocation::factory(['port_id' => $alpha->id])->create(['name' => 'ANCHORAGE']);

    $this->get(route('ports.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('ports/index')
            ->has('ports', 2)
            ->where('ports.0.name', 'Alpha Port')
            ->where('ports.0.supply_locations.0.name', 'ANCHORAGE')
            ->where('ports.1.name', 'Zeta Port'));
});

test('store creates a port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('ports.store'), ['name' => 'New Port'])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Port::sole())->name->toBe('New Port');
});

test('store requires a name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('ports.store'), [])->assertSessionHasErrors('name');
});

test('update saves the port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create(['name' => 'Old Name']);

    $this->put(route('ports.update', $port), ['name' => 'New Name'])
        ->assertRedirect()->assertSessionHasNoErrors();

    expect($port->refresh()->name)->toBe('New Name');
});

test('destroy deletes an unreferenced port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();

    $this->delete(route('ports.destroy', $port))->assertRedirect();

    expect(Port::find($port->id))->toBeNull();
});

test('destroy is refused with an error toast when an order references the port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    Order::factory()->create(['port_id' => $port->id]);

    $this->delete(route('ports.destroy', $port))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Port::find($port->id))->not->toBeNull();
});

test('store creates a supply location for a port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();

    $this->post(route('ports.supply-locations.store', $port), ['name' => 'BQ BERTH'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($port->supplyLocations()->sole())
        ->name->toBe('BQ BERTH');
});

test('supply location names are unique per port', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    SupplyLocation::factory(['port_id' => $port->id])->create(['name' => 'OPL']);

    $this->post(route('ports.supply-locations.store', $port), ['name' => 'OPL'])
        ->assertSessionHasErrors('name');
});

test('update saves a supply location', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    $location = SupplyLocation::factory(['port_id' => $port->id])->create(['name' => 'Old Berth']);

    $this->patch(route('ports.supply-locations.update', [$port, $location]), ['name' => 'New Berth'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($location->refresh()->name)->toBe('New Berth');
});

test('destroy deletes an unused supply location', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    $location = SupplyLocation::factory(['port_id' => $port->id])->create();

    $this->delete(route('ports.supply-locations.destroy', [$port, $location]))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(SupplyLocation::find($location->id))->toBeNull();
});

test('destroy refuses a supply location used by an enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create();
    $location = SupplyLocation::factory(['port_id' => $port->id])->create();
    Enquiry::factory()->create([
        'port_id' => $port->id,
        'supply_location_id' => $location->id,
    ]);

    $this->delete(route('ports.supply-locations.destroy', [$port, $location]))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(SupplyLocation::find($location->id))->not->toBeNull();
});
