<?php

use App\Models\Order;
use App\Enums\UserType;
use App\Models\Port;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the ports page', function () {
    $this->get(route('ports.index'))->assertRedirect(route('login'));
});

test('index lists ports ordered by name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Port::factory()->create(['name' => 'Zeta Port']);
    Port::factory()->create(['name' => 'Alpha Port']);

    $this->get(route('ports.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('ports/index')
            ->has('ports', 2)
            ->where('ports.0.name', 'Alpha Port')
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
