<?php

use App\Enums\BargeStatus;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the barges page', function () {
    $this->get(route('barges.edit'))->assertRedirect(route('login'));
});

test('edit renders the barges page with status options', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Barge::factory()->create(['name' => 'MT Bunker One']);

    $this->get(route('barges.edit'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('barges/edit')
            ->has('barges', 1)
            ->has('statusOptions'));
});

test('store creates a barge with a capacity per product', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('barges.store'), [
        'imo' => '9111222',
        'name' => 'MT New Barge',
        'vlsfo_capacity' => 3200.5,
        'mgo_capacity' => 800,
        'status' => BargeStatus::Available->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Barge::sole())
        ->imo->toBe('9111222')
        ->name->toBe('MT New Barge')
        ->vlsfo_capacity->toBe('3200.500')
        ->mgo_capacity->toBe('800.000')
        ->hsfo_capacity->toBeNull()
        ->status->toBe(BargeStatus::Available);
});

test('store validates required fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('barges.store'), [])
        ->assertSessionHasErrors(['imo', 'name', 'status'])
        ->assertSessionDoesntHaveErrors(['vlsfo_capacity', 'mgo_capacity', 'hsfo_capacity']);
});

test('update saves the barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create(['name' => 'Old Name']);

    $this->put(route('barges.update', $barge), [
        'imo' => $barge->imo,
        'name' => 'New Name',
        'hsfo_capacity' => 4000,
        'status' => BargeStatus::Maintenance->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($barge->refresh())
        ->name->toBe('New Name')
        ->hsfo_capacity->toBe('4000.000')
        ->status->toBe(BargeStatus::Maintenance);
});

test('destroy deletes the barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();

    $this->delete(route('barges.destroy', $barge))
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(Barge::count())->toBe(0);
});

test('destroy is refused with an error toast when an order references the barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();
    Order::factory()->create(['barge_id' => $barge->imo]);

    $this->delete(route('barges.destroy', $barge))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Barge::find($barge->imo))->not->toBeNull();
});

test('destroy is refused with an error toast when a bdn references the barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();
    Bdn::factory()->create(['barge_id' => $barge->imo]);

    $this->delete(route('barges.destroy', $barge))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Barge::find($barge->imo))->not->toBeNull();
});
