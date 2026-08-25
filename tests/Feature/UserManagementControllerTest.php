<?php

use App\Enums\UserType;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

// ─── Store (POST /users) ────────────────────────────────────────────────────

test('super admin can create users', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('users.store'), [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'type' => UserType::Sales->value,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(User::count())->toBe(2)
        ->and(User::where('email', 'john@example.com')->exists())->toBeTrue();
});

test('master can create users', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->post(route('users.store'), [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'type' => UserType::Operations->value,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(User::count())->toBe(2)
        ->and(User::where('email', 'jane@example.com')->exists())->toBeTrue();
});

test('super admin can create another super admin', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('users.store'), [
        'name' => 'Another Admin',
        'email' => 'another-admin@example.com',
        'type' => UserType::SuperAdmin->value,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $newUser = User::where('email', 'another-admin@example.com')->first();
    expect($newUser)->not->toBeNull()
        ->and($newUser->type)->toBe(UserType::SuperAdmin);
});

test('master cannot create a super admin', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->post(route('users.store'), [
        'name' => 'Sneaky Admin',
        'email' => 'sneaky@example.com',
        'type' => UserType::SuperAdmin->value,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertForbidden();

    expect(User::where('email', 'sneaky@example.com')->exists())->toBeFalse();
});

test('unauthorized roles cannot create users', function (UserType $type) {
    $this->actingAs(User::factory()->create(['type' => $type]));

    $this->post(route('users.store'), [
        'name' => 'Unauthorized User',
        'email' => 'unauth@example.com',
        'type' => UserType::Sales->value,
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertForbidden();
})->with([
    UserType::Sales,
    UserType::Operations,
    UserType::Surveyor,
    UserType::Finance,
]);

// ─── user_id on create ───────────────────────────────────────────────────────

test('super admin can set user_id when creating a user', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('users.store'), [
        'name' => 'With User ID',
        'email' => 'with-id@example.com',
        'type' => UserType::Sales->value,
        'user_id' => 'EMP-001',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(User::where('email', 'with-id@example.com')->first()->user_id)->toBe('EMP-001');
});

test('master can set user_id for non-super-admin users', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->post(route('users.store'), [
        'name' => 'Master With ID',
        'email' => 'master-id@example.com',
        'type' => UserType::Finance->value,
        'user_id' => 'EMP-002',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(User::where('email', 'master-id@example.com')->first()->user_id)->toBe('EMP-002');
});

// ─── Index (GET /users) ─────────────────────────────────────────────────────

test('super admin sees all users in index', function () {
    $superAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);
    User::factory()->create(['type' => UserType::Sales]);
    User::factory()->create(['type' => UserType::Operations]);

    $this->actingAs($superAdmin);

    $this->get(route('users.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('users/index')
            ->has('users', 3));
});

test('master cannot see super admin users in index', function () {
    User::factory()->create(['type' => UserType::SuperAdmin]);
    User::factory()->create(['type' => UserType::Sales]);
    User::factory()->create(['type' => UserType::Operations]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $response = $this->get(route('users.index'))->assertOk();

    // The master sees themselves + sales + operations = 3 users.
    // The super_admin is excluded.
    $users = $response->inertiaProps('users');
    expect($users)->toHaveCount(3);

    // No user in the response should be a super_admin.
    $types = array_column($users, 'type');
    expect($types)->each->not->toBe(UserType::SuperAdmin->value);
});

// ─── Master cannot access direct actions for super_admin users ────────────────

test('master cannot update a super admin user', function () {
    $superAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.update', $superAdmin), [
        'name' => 'Hacked Name',
    ])->assertForbidden();
});

test('master cannot deactivate a super admin user', function () {
    $superAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.deactivate', $superAdmin))
        ->assertForbidden();

    expect($superAdmin->refresh()->is_active)->toBeTrue();
});

test('master cannot activate a super admin user', function () {
    $superAdmin = User::factory()->create([
        'type' => UserType::SuperAdmin,
        'is_active' => false,
    ]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.activate', $superAdmin))
        ->assertForbidden();

    expect($superAdmin->refresh()->is_active)->toBeFalse();
});

test('master cannot delete a super admin user', function () {
    $superAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->delete(route('users.destroy', $superAdmin))
        ->assertForbidden();

    expect(User::find($superAdmin->id))->not->toBeNull();
});

// ─── Promote to super_admin (cannot) ─────────────────────────────────────────

test('master cannot promote a user to super admin', function () {
    $salesUser = User::factory()->create(['type' => UserType::Sales]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.update', $salesUser), [
        'type' => UserType::SuperAdmin->value,
    ])->assertForbidden();

    expect($salesUser->refresh()->type)->toBe(UserType::Sales);
});

// ─── Master cannot manage other master users ──────────────────────────────────

test('master cannot create a master user', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->post(route('users.store'), [
        'name' => 'Another Master',
        'email' => 'another-master@example.com',
        'type' => UserType::Master->value,
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])->assertForbidden();

    expect(User::where('email', 'another-master@example.com')->exists())->toBeFalse();
});

test('master cannot update another master user', function () {
    $otherMaster = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.update', $otherMaster), [
        'name' => 'Hacked Master Name',
    ])->assertForbidden();

    expect($otherMaster->refresh()->name)->not->toBe('Hacked Master Name');
});

test('master cannot deactivate another master user', function () {
    $otherMaster = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.deactivate', $otherMaster))
        ->assertForbidden();

    expect($otherMaster->refresh()->is_active)->toBeTrue();
});

test('master cannot delete another master user', function () {
    $otherMaster = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->delete(route('users.destroy', $otherMaster))
        ->assertForbidden();

    expect(User::find($otherMaster->id))->not->toBeNull();
});

test('master cannot promote a user to master', function () {
    $salesUser = User::factory()->create(['type' => UserType::Sales]);

    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $this->patch(route('users.update', $salesUser), [
        'type' => UserType::Master->value,
    ])->assertForbidden();

    expect($salesUser->refresh()->type)->toBe(UserType::Sales);
});

test('master roleOptions excludes super_admin and master', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));

    $response = $this->get(route('users.index'))->assertOk();

    $roleOptions = $response->inertiaProps('roleOptions');
    expect($roleOptions)->toBeArray();

    $values = array_column($roleOptions, 'value');
    expect($values)->not->toContain(UserType::SuperAdmin->value);
    expect($values)->not->toContain(UserType::Master->value);
    expect($values)->toContain(UserType::Sales->value);
    expect($values)->toContain(UserType::Operations->value);
    expect($values)->toContain(UserType::Surveyor->value);
    expect($values)->toContain(UserType::Finance->value);
});

test('super admin roleOptions includes all roles', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $response = $this->get(route('users.index'))->assertOk();

    $roleOptions = $response->inertiaProps('roleOptions');
    $values = array_column($roleOptions, 'value');
    expect($values)->toContain(UserType::SuperAdmin->value);
    expect($values)->toContain(UserType::Master->value);
    expect($values)->toContain(UserType::Sales->value);
});

// ─── First super admin protections ───────────────────────────────────────────

test('first super admin cannot be deleted', function () {
    // Seed the first super admin.
    $firstSuperAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    // Create a second super admin to act as.
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->delete(route('users.destroy', $firstSuperAdmin))
        ->assertForbidden();

    expect(User::find($firstSuperAdmin->id))->not->toBeNull();
});

test('first super admin cannot be deactivated', function () {
    $firstSuperAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->patch(route('users.deactivate', $firstSuperAdmin))
        ->assertForbidden();

    expect($firstSuperAdmin->refresh()->is_active)->toBeTrue();
});

test('first super admin cannot be role-changed away from super admin', function () {
    $firstSuperAdmin = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->patch(route('users.update', $firstSuperAdmin), [
        'type' => UserType::Master->value,
    ])->assertForbidden();

    expect($firstSuperAdmin->refresh()->type)->toBe(UserType::SuperAdmin);
});

// ─── Self-action protections ─────────────────────────────────────────────────

test('user cannot delete self', function () {
    // Seed a super admin first so the actor is not the first super admin.
    User::factory()->create(['type' => UserType::SuperAdmin]);

    $user = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs($user);

    $this->delete(route('users.destroy', $user))
        ->assertForbidden();

    expect(User::find($user->id))->not->toBeNull();
});

test('user cannot deactivate self', function () {
    // Seed a super admin first so the actor is not the first super admin.
    User::factory()->create(['type' => UserType::SuperAdmin]);

    $user = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs($user);

    $this->patch(route('users.deactivate', $user))
        ->assertForbidden();

    expect($user->refresh()->is_active)->toBeTrue();
});
