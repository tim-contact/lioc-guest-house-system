<?php

use App\Enums\UserType;
use App\Models\User;

// ============================================================
// Route sets
// ============================================================

$adminGetRoutes = [
    'admin',
    'users.index',
    'orders.table',
    'enquiries.edit',
    'disputes.table',
    'customers.index',
    'ports.index',
    'barges.edit',
    'agents.index',
    'agent-pics.index',
    'surveyors.edit',
];

$salesGetRoutes = [
    'sales-dashboard',
    'credit-management',
    'orders',
    'disputes',
    'enquiries.index',
];

$operationsGetRoutes = [
    'operations',
];

$surveyorGetRoutes = [
    'surveyor',
    'bdns.index',
];

$financeGetRoutes = [
    'finance',
    'invoices.index',
    'payments.index',
];

$allProtectedGetRoutes = array_merge(
    $adminGetRoutes,
    $salesGetRoutes,
    $operationsGetRoutes,
    $surveyorGetRoutes,
    $financeGetRoutes,
);

// ============================================================
// 1. Guests are redirected to login
// ============================================================

test('guests are redirected to login when accessing protected routes', function (string $route) {
    $this->get(route($route))->assertRedirect(route('login'));
})->with([
    'admin'          => 'admin',
    'sales-dashboard' => 'sales-dashboard',
    'operations'     => 'operations',
    'surveyor'       => 'surveyor',
    'finance'        => 'finance',
]);

// ============================================================
// 2. Inactive users are logged out and redirected to home
// ============================================================

test('inactive users are logged out and redirected to home when accessing a protected route', function () {
    $user = User::factory()->create(['is_active' => false]);

    $response = $this->actingAs($user)->get(route('sales-dashboard'));

    $response->assertRedirect(route('home'));
    $response->assertSessionHas('toast', [
        'type'    => 'error',
        'message' => 'Your account has been deactivated. Please contact an administrator.',
    ]);

    $this->assertGuest();
});

// ============================================================
// 3. super_admin can access ALL routes
// ============================================================

test('super_admin can access all protected routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::SuperAdmin]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($allProtectedGetRoutes, $allProtectedGetRoutes));

// ============================================================
// 4. master can access all role-group routes
// ============================================================

test('master can access all role-group routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Master]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($allProtectedGetRoutes, $allProtectedGetRoutes));

// ============================================================
// 5. Sales: allowed routes
// ============================================================

test('sales can access sales-section routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Sales]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($salesGetRoutes, $salesGetRoutes));

test('sales cannot access non-sales protected routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Sales]);

    $this->actingAs($user)->get(route($route))->assertForbidden();
})->with([
    'admin'  => 'admin',
    'operations' => 'operations',
    'surveyor'   => 'surveyor',
    'finance'    => 'finance',
]);

// ============================================================
// 6. Operations: allowed routes
// ============================================================

test('operations can access operations-section routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Operations]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($operationsGetRoutes, $operationsGetRoutes));

test('operations cannot access non-operations protected routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Operations]);

    $this->actingAs($user)->get(route($route))->assertForbidden();
})->with([
    'admin'          => 'admin',
    'sales-dashboard' => 'sales-dashboard',
    'surveyor'       => 'surveyor',
    'finance'        => 'finance',
]);

// ============================================================
// 7. Surveyor: allowed routes
// ============================================================

test('surveyor can access surveyor-section routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Surveyor]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($surveyorGetRoutes, $surveyorGetRoutes));

test('surveyor cannot access non-surveyor protected routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Surveyor]);

    $this->actingAs($user)->get(route($route))->assertForbidden();
})->with([
    'admin'          => 'admin',
    'sales-dashboard' => 'sales-dashboard',
    'operations'     => 'operations',
    'finance'        => 'finance',
]);

// ============================================================
// 8. Finance: allowed routes
// ============================================================

test('finance can access finance-section routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Finance]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with(array_combine($financeGetRoutes, $financeGetRoutes));

test('finance cannot access non-finance protected routes', function (string $route) {
    $user = User::factory()->create(['type' => UserType::Finance]);

    $this->actingAs($user)->get(route($route))->assertForbidden();
})->with([
    'admin'          => 'admin',
    'sales-dashboard' => 'sales-dashboard',
    'operations'     => 'operations',
    'surveyor'       => 'surveyor',
]);

// ============================================================
// 9. Settings routes accessible to all authenticated active users
// ============================================================

test('settings routes are accessible to every authenticated active user regardless of role', function (UserType $type, string $route) {
    $user = User::factory()->create(['type' => $type]);

    $this->actingAs($user)->get(route($route))->assertOk();
})->with([
    [UserType::SuperAdmin, 'profile.edit'],
    [UserType::SuperAdmin, 'appearance.edit'],
    [UserType::Master,     'profile.edit'],
    [UserType::Master,     'appearance.edit'],
    [UserType::Sales,      'profile.edit'],
    [UserType::Sales,      'appearance.edit'],
    [UserType::Operations, 'profile.edit'],
    [UserType::Operations, 'appearance.edit'],
    [UserType::Surveyor,   'profile.edit'],
    [UserType::Surveyor,   'appearance.edit'],
    [UserType::Finance,    'profile.edit'],
    [UserType::Finance,    'appearance.edit'],
]);
