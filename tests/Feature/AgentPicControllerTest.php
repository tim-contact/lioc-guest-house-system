<?php

use App\Enums\UserType;
use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the agent PICs page', function () {
    $this->get(route('agent-pics.index'))->assertForbidden();
});

test('index lists PICs grouped by agency with the agency options', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $zeta = Agent::factory()->create(['name' => 'Zeta Agency']);
    $alpha = Agent::factory()->create(['name' => 'Alpha Agency']);

    AgentPic::factory()->create(['agent_id' => $zeta->id, 'name' => 'Zoe']);
    AgentPic::factory()->create(['agent_id' => $alpha->id, 'name' => 'Bob']);
    AgentPic::factory()->create(['agent_id' => $alpha->id, 'name' => 'Ann']);

    $this->get(route('agent-pics.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('agent-pics/index')
            ->has('pics', 3)
            ->where('pics.0.agent_name', 'Alpha Agency')
            ->where('pics.0.name', 'Ann')
            ->where('pics.1.name', 'Bob')
            ->where('pics.2.agent_name', 'Zeta Agency')
            ->has('agents', 2));
});

test('store creates a PIC', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create();

    $this->post(route('agent-pics.store'), [
        'agent_id' => $agent->id,
        'name' => 'Neo Anderson',
        'mobile' => '0710000009',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(AgentPic::sole())
        ->agent_id->toBe($agent->id)
        ->name->toBe('Neo Anderson')
        ->mobile->toBe('0710000009');
});

test('store requires an existing agency, a name and a mobile', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('agent-pics.store'), ['agent_id' => 999])
        ->assertSessionHasErrors(['agent_id', 'name', 'mobile']);
});

test('update saves edits to a PIC', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $pic = AgentPic::factory()->create(['name' => 'Old Name']);
    $other = Agent::factory()->create();

    $this->put(route('agent-pics.update', $pic), [
        'agent_id' => $other->id,
        'name' => 'Trinity',
        'mobile' => '0710000010',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($pic->refresh())
        ->agent_id->toBe($other->id)
        ->name->toBe('Trinity')
        ->mobile->toBe('0710000010');
});

test('destroy deletes a PIC', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $pic = AgentPic::factory()->create();

    $this->delete(route('agent-pics.destroy', $pic))->assertRedirect();

    expect(AgentPic::find($pic->id))->toBeNull();
});

test('destroy is refused with an error toast when an order references the PIC', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $pic = AgentPic::factory()->create();
    Order::factory()->create(['agent_pic_id' => $pic->id]);

    $this->delete(route('agent-pics.destroy', $pic))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(AgentPic::find($pic->id))->not->toBeNull();
});
