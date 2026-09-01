<?php

use App\Enums\UserType;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('admin'));
    $response->assertForbidden();
});

test('authenticated users can visit the admin page', function () {
    $user = User::factory()->create(['type' => UserType::SuperAdmin]);
    $this->actingAs($user);

    $response = $this->get(route('admin'));
    $response->assertOk();
});

test('every admin dashboard card route resolves', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $routes = [
        'enquiries.edit',
        'reports.analytics',
        'customers.index',
        'agents.index',
        'agent-pics.index',
        'ports.index',
        'surveyors.edit',
        'barges.edit',
        'orders.table',
        'disputes.table',
        'bdns.index',
        'invoices.index',
        'payments.index',
    ];

    foreach ($routes as $name) {
        $this->get(route($name))->assertOk();
    }
});
