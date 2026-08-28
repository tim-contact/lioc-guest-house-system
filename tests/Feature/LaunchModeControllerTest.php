<?php

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    config(['launch.enabled' => false]);
});

test('guests cannot view the launch mode screen', function () {
    $this->get(route('launch.index'))->assertForbidden();
});

test('non admin users cannot view the launch mode screen', function () {
    $this->actingAs(User::factory()->create([
        'type' => UserType::Sales,
    ]));

    $this->get(route('launch.index'))->assertRedirect(route('sales-dashboard'));
});

test('privileged users can view the launch mode screen', function (UserType $type) {
    $this->actingAs(User::factory()->create([
        'type' => $type,
    ]));

    $this->get(route('launch.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('launch/index')
            ->where('launchModeEnabled', false));
})->with([
    UserType::SuperAdmin,
    UserType::Master,
]);

test('privileged users can view the launch screen', function (UserType $type) {
    $this->actingAs(User::factory()->create([
        'type' => $type,
    ]));

    $this->get(route('launch.screen'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('launch/screen'));
})->with([
    UserType::SuperAdmin,
    UserType::Master,
]);

test('privileged users can update launch mode', function (UserType $type) {
    $this->actingAs(User::factory()->create([
        'type' => $type,
    ]));

    $this->patch(route('launch.update'), [
        'enabled' => true,
    ])->assertRedirect();

    Storage::disk('local')->assertExists('launch-mode.json');

    expect(json_decode(
        Storage::disk('local')->get('launch-mode.json'),
        true,
    ))->toMatchArray([
        'enabled' => true,
    ]);
})->with([
    UserType::SuperAdmin,
    UserType::Master,
]);
