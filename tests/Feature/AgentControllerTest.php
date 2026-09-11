<?php

use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Bdn;
use App\Models\ContactInformation;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the agents page', function () {
    $this->get(route('agents.index'))->assertRedirect(route('login'));
});

test('index lists agents ordered by name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Agent::factory()->create(['name' => 'Zeta Agency']);
    Agent::factory()->create(['name' => 'Alpha Agency']);

    $this->get(route('agents.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('agents/index')
            ->has('agents', 2)
            ->where('agents.0.name', 'Alpha Agency')
            ->where('agents.1.name', 'Zeta Agency'));
});

test('store creates an agent', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('agents.store'), [
        'name' => 'Agent Smith',
        'address' => '1 Matrix Lane',
        'contact' => '0700000009',
        'mail_id' => 'agent.smith@matrix.test',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Agent::sole())
        ->name->toBe('Agent Smith')
        ->address->toBe('1 Matrix Lane')
        ->contact->toBe('0700000009')
        ->mail_id->toBe('agent.smith@matrix.test');
});

test('store records multiple agent contact values separately', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('agents.store'), [
        'name' => 'Multi Contact Agency',
        'address' => '1 Port Road',
        'contact' => '0700000001; 0700000002 / 0700000003',
        'mail_id' => 'ops@example.test; finance@example.test',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $agent = Agent::sole();

    expect($agent->contactNumbers()->pluck('value')->all())->toBe([
        '0700000001',
        '0700000002',
        '0700000003',
    ])->and($agent->emailAddresses()->pluck('value')->all())->toBe([
        'ops@example.test',
        'finance@example.test',
    ]);
});

test('store accepts separate agent contact fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('agents.store'), [
        'name' => 'Separate Contact Agency',
        'address' => '3 Jetty Road',
        'contact_numbers' => ['0700000001', '0700000002', ''],
        'email_addresses' => ['ops@example.test', 'finance@example.test', ''],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $agent = Agent::sole();

    expect($agent)
        ->contact->toBe('0700000001, 0700000002')
        ->mail_id->toBe('ops@example.test, finance@example.test')
        ->and($agent->contactNumbers()->pluck('value')->all())->toBe([
            '0700000001',
            '0700000002',
        ])->and($agent->emailAddresses()->pluck('value')->all())->toBe([
            'ops@example.test',
            'finance@example.test',
        ]);
});

test('update accepts separate agent contact fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create(['contact' => '0700000001', 'mail_id' => 'old@example.test']);
    $agent->contactInformation()->createMany([
        ['kind' => 'phone', 'value' => '0700000001', 'is_primary' => true],
        ['kind' => 'email', 'value' => 'old@example.test', 'is_primary' => true],
    ]);

    $this->put(route('agents.update', $agent), [
        'name' => 'Updated Separate Agency',
        'address' => '4 Harbour Road',
        'contact_numbers' => ['0710000001', '0710000002'],
        'email_addresses' => ['new@example.test'],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($agent->refresh())
        ->contact->toBe('0710000001, 0710000002')
        ->mail_id->toBe('new@example.test')
        ->and($agent->contactNumbers()->pluck('value')->all())->toBe([
            '0710000001',
            '0710000002',
        ])->and($agent->emailAddresses()->pluck('value')->all())->toBe([
            'new@example.test',
        ]);
});

test('store requires the core fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('agents.store'), [])
        ->assertSessionHasErrors(['name', 'address', 'contact']);
});

test('update saves edits to an agent', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create(['name' => 'Old Name']);

    $this->put(route('agents.update', $agent), [
        'name' => 'New Name',
        'address' => '2 Zion Way',
        'contact' => '0700000010',
        'mail_id' => 'new.name@zion.test',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($agent->refresh())
        ->name->toBe('New Name')
        ->address->toBe('2 Zion Way')
        ->contact->toBe('0700000010')
        ->mail_id->toBe('new.name@zion.test');
});

test('update replaces the agent contact rows', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    $agent->contactInformation()->createMany([
        ['kind' => 'phone', 'value' => '0700000001', 'is_primary' => true],
        ['kind' => 'email', 'value' => 'old@example.test', 'is_primary' => true],
    ]);

    $this->put(route('agents.update', $agent), [
        'name' => 'Updated Agency',
        'address' => '2 Harbour Road',
        'contact' => '0710000001 / 0710000002',
        'mail_id' => 'new@example.test',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($agent->refresh()->contactNumbers()->pluck('value')->all())->toBe([
        '0710000001',
        '0710000002',
    ])->and($agent->emailAddresses()->pluck('value')->all())->toBe([
        'new@example.test',
    ]);
});

test('destroy deletes an agent and cascades its PICs', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    $pic = AgentPic::factory()->create(['agent_id' => $agent->id]);
    $pic->contactInformation()->create([
        'kind' => 'phone',
        'value' => '0710000001',
        'is_primary' => true,
    ]);

    $this->delete(route('agents.destroy', $agent))->assertRedirect();

    expect(Agent::find($agent->id))->toBeNull()
        ->and(AgentPic::find($pic->id))->toBeNull()
        ->and(ContactInformation::count())->toBe(0);
});

test('destroy removes an agents contact information', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    $agent->contactInformation()->create([
        'kind' => 'phone',
        'value' => '0700000001',
        'is_primary' => true,
    ]);

    $this->delete(route('agents.destroy', $agent))->assertRedirect();

    expect(ContactInformation::count())->toBe(0);
});

test('destroy is refused with an error toast when an order references the agent', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    Order::factory()->create(['agent_id' => $agent->id]);

    $this->delete(route('agents.destroy', $agent))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Agent::find($agent->id))->not->toBeNull();
});

test('destroy is refused with an error toast when an order references one of the agent PICs', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    $pic = AgentPic::factory()->create(['agent_id' => $agent->id]);
    Order::factory()->create(['agent_id' => null, 'agent_pic_id' => $pic->id]);

    $this->delete(route('agents.destroy', $agent))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Agent::find($agent->id))->not->toBeNull();
});

test('destroy is refused with an error toast when a bdn references the agent', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    Bdn::factory()->create(['agent_id' => $agent->id]);

    $this->delete(route('agents.destroy', $agent))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Agent::find($agent->id))->not->toBeNull();
});
