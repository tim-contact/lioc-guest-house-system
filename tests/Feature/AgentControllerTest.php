<?php

use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the agents page', function () {
    $this->get(route('agents.index'))->assertForbidden();
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

test('destroy deletes an agent and cascades its PICs', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();
    $pic = AgentPic::factory()->create(['agent_id' => $agent->id]);

    $this->delete(route('agents.destroy', $agent))->assertRedirect();

    expect(Agent::find($agent->id))->toBeNull()
        ->and(AgentPic::find($pic->id))->toBeNull();
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
