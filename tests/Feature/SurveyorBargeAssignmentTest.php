<?php

use App\Enums\OrderStatus;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\Surveyor;
use App\Models\User;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia;

// =============================================================
// Helpers
// =============================================================

/**
 * Create a surveyor-type user, optionally with a linked Surveyor profile and assigned barge.
 */
function makeSurveyorUser(?string $bargeImo = null): User
{
    $user = User::factory()->create(['type' => UserType::Surveyor]);

    if ($bargeImo !== null) {
        Surveyor::factory()->create([
            'user_id' => $user->id,
            'barge_id' => $bargeImo,
        ]);
    }

    return $user;
}

/**
 * Create a pending order on a specific barge with a VLSFO BDN quantity ready.
 */
function makeOrderOnBarge(string $bargeImo, array $attributes = []): Order
{
    return Order::factory()->create(array_merge([
        'barge_id' => $bargeImo,
        'status' => OrderStatus::Pending,
        'eta' => now(),
        'vlsfo_final_qty' => 100,
    ], $attributes));
}

// =============================================================
// 1. Migration / Model
// =============================================================

test('surveyor can be linked to a surveyor-type user', function () {
    $user = User::factory()->create(['type' => UserType::Surveyor]);

    $surveyor = Surveyor::factory()->create(['user_id' => $user->id]);

    expect($surveyor->user_id)->toBe($user->id);
    expect($surveyor->user)->not->toBeNull();
    expect($surveyor->user->id)->toBe($user->id);

    expect($user->surveyor)->not->toBeNull();
    expect($user->surveyor->id)->toBe($surveyor->id);
});

test('same user cannot be linked to two surveyor profiles', function () {
    $user = User::factory()->create(['type' => UserType::Surveyor]);

    Surveyor::factory()->create(['user_id' => $user->id]);

    Surveyor::factory()->create(['user_id' => $user->id]);
})->throws(QueryException::class);

test('surveyor can be assigned a barge', function () {
    $barge = Barge::factory()->create();

    $surveyor = Surveyor::factory()->create(['barge_id' => $barge->imo]);
    $surveyor->barges()->attach($barge->imo);

    expect($surveyor->barge_id)->toBe($barge->imo);
    expect($surveyor->barge)->not->toBeNull();
    expect($surveyor->barge->imo)->toBe($barge->imo);
    expect($surveyor->barges()->pluck('imo')->all())->toBe([$barge->imo]);
});

test('surveyor can be assigned multiple barges', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyor = Surveyor::factory()->create(['barge_id' => $bargeA->imo]);
    $surveyor->barges()->sync([$bargeA->imo, $bargeB->imo]);

    expect($surveyor->barges()->pluck('imo')->all())->toBe([
        $bargeA->imo,
        $bargeB->imo,
    ]);
});

// =============================================================
// 2. Dashboard
// =============================================================

test('surveyor with assigned barge sees pending orders for that barge only', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnA = makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    $orderOnB = makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);

    $this->get(route('surveyor'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV On Alpha')
            ->where('pendingOrders.0.barge_id', $bargeA->imo)
            ->where('assignedBarge.imo', $bargeA->imo)
            ->where('assignedBarge.name', 'Barge Alpha'));
});

test('surveyor with multiple assigned barges sees orders for all assigned barges', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);
    $bargeC = Barge::factory()->create(['name' => 'Barge Gamma']);

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $surveyorUser->surveyor->barges()->sync([$bargeA->imo, $bargeB->imo]);
    $this->actingAs($surveyorUser);

    makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);
    makeOrderOnBarge($bargeC->imo, ['vessel_name' => 'MV On Gamma']);

    $this->get(route('surveyor'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 2)
            ->where('pendingOrders.0.vessel_name', 'MV On Alpha')
            ->where('pendingOrders.1.vessel_name', 'MV On Beta')
            ->has('barges', 2));
});

test('surveyor with multiple assigned barges can filter to one assigned barge', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $surveyorUser->surveyor->barges()->sync([$bargeA->imo, $bargeB->imo]);
    $this->actingAs($surveyorUser);

    makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);

    $this->get(route('surveyor', ['barge' => $bargeB->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV On Beta')
            ->where('assignedBarge.imo', $bargeB->imo));
});

test('surveyor cannot see orders for another barge by passing ?barge= param', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnA = makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    $orderOnB = makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);

    // Even with ?barge=BETA, the surveyor still sees only barge A (param is ignored).
    $this->get(route('surveyor', ['barge' => $bargeB->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV On Alpha')
            ->where('pendingOrders.0.barge_id', $bargeA->imo));
});

test('surveyor with no linked profile sees no operational orders', function () {
    $barge = Barge::factory()->create();

    // Surveyor-type user with no Surveyor profile linked.
    $surveyorUser = User::factory()->create(['type' => UserType::Surveyor]);
    $this->actingAs($surveyorUser);

    makeOrderOnBarge($barge->imo, ['vessel_name' => 'MV Lonely']);

    $this->get(route('surveyor'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 0)
            ->has('completedOrders', 0)
            ->where('assignedBarge', null));
});

test('surveyor with linked profile but no barge assigned sees no operational orders', function () {
    $barge = Barge::factory()->create();

    $surveyorUser = User::factory()->create(['type' => UserType::Surveyor]);
    Surveyor::factory()->create(['user_id' => $surveyorUser->id, 'barge_id' => null]);

    $this->actingAs($surveyorUser);

    makeOrderOnBarge($barge->imo, ['vessel_name' => 'MV Unreachable']);

    $this->get(route('surveyor'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 0)
            ->has('completedOrders', 0)
            ->where('assignedBarge', null));
});

test('master can still filter by barge', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);

    $this->get(route('surveyor', ['barge' => $bargeA->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV On Alpha')
            ->where('pendingOrders.0.barge_id', $bargeA->imo));
});

test('super_admin can still filter by barge', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $admin = User::factory()->create(['type' => UserType::SuperAdmin]);
    $this->actingAs($admin);

    makeOrderOnBarge($bargeA->imo, ['vessel_name' => 'MV On Alpha']);
    makeOrderOnBarge($bargeB->imo, ['vessel_name' => 'MV On Beta']);

    $this->get(route('surveyor', ['barge' => $bargeA->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV On Alpha')
            ->where('pendingOrders.0.barge_id', $bargeA->imo));
});

// =============================================================
// 3. Write Actions
// =============================================================

test('surveyor can update BDN quantities for an order on their assigned barge', function () {
    $barge = Barge::factory()->create();
    $surveyorUser = makeSurveyorUser($barge->imo);
    $this->actingAs($surveyorUser);

    $order = makeOrderOnBarge($barge->imo, [
        'vlsfo_bdn_qty' => 50,
        'mgo_bdn_qty' => 0,
        'hsfo_bdn_qty' => 0,
    ]);

    $this->patch(route('surveyor.update', $order), [
        'vlsfo_bdn_qty' => 200,
        'mgo_bdn_qty' => 100,
        'hsfo_bdn_qty' => 30,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $order->refresh();
    expect((float) $order->vlsfo_bdn_qty)->toBe(200.0);
    expect((float) $order->mgo_bdn_qty)->toBe(100.0);
    expect((float) $order->hsfo_bdn_qty)->toBe(30.0);
});

test('surveyor can update BDN quantities for any assigned barge', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $surveyorUser->surveyor->barges()->sync([$bargeA->imo, $bargeB->imo]);
    $this->actingAs($surveyorUser);

    $orderOnB = makeOrderOnBarge($bargeB->imo, ['vlsfo_bdn_qty' => 50]);

    $this->patch(route('surveyor.update', $orderOnB), [
        'vlsfo_bdn_qty' => 200,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect((float) $orderOnB->refresh()->vlsfo_bdn_qty)->toBe(200.0);
});

test('surveyor cannot update BDN quantities for another barge', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnB = makeOrderOnBarge($bargeB->imo);

    $this->patch(route('surveyor.update', $orderOnB), [
        'vlsfo_bdn_qty' => 200,
    ])->assertForbidden();
});

test('surveyor cannot complete an order for another barge', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnB = makeOrderOnBarge($bargeB->imo);

    $this->patch(route('surveyor.complete', $orderOnB))
        ->assertForbidden();
});

test('surveyor cannot update BDN details for another barge', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnB = makeOrderOnBarge($bargeB->imo);

    $this->put(route('surveyor.bdn.update', $orderOnB), [
        'delivery_date' => now()->toDateString(),
        'vlsfo_metric_ton' => 150,
    ])->assertForbidden();
});

test('surveyor cannot submit BDN payload that changes barge_id away from assignment', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnA = makeOrderOnBarge($bargeA->imo);

    // Try to set barge_id to a different barge in the BDN payload.
    $this->put(route('surveyor.bdn.update', $orderOnA), [
        'barge_id' => $bargeB->imo,
        'delivery_date' => now()->toDateString(),
    ])->assertForbidden();
});

// =============================================================
// 4. Master Assignment
// =============================================================

test('master can assign surveyor user to surveyor profile', function () {
    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    $surveyorUser = User::factory()->create(['type' => UserType::Surveyor, 'name' => 'Bob Surveyor']);
    $surveyor = Surveyor::factory()->create(['name' => 'Old Name']);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => $surveyor->survey_company,
        'name' => $surveyor->name,
        'user_id' => $surveyorUser->id,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor->refresh();
    expect($surveyor->user_id)->toBe($surveyorUser->id);
    expect($surveyor->user->name)->toBe('Bob Surveyor');
});

test('master can assign barge to surveyor profile', function () {
    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    $barge = Barge::factory()->create();
    $surveyor = Surveyor::factory()->create(['barge_id' => null]);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => $surveyor->survey_company,
        'name' => $surveyor->name,
        'barge_id' => $barge->imo,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor->refresh();
    expect($surveyor->barge_id)->toBe($barge->imo);
    expect($surveyor->barges()->pluck('imo')->all())->toBe([$barge->imo]);
});

test('master can assign multiple barges to surveyor profile', function () {
    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();
    $surveyor = Surveyor::factory()->create(['barge_id' => null]);

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => $surveyor->survey_company,
        'name' => $surveyor->name,
        'barge_ids' => [$bargeA->imo, $bargeB->imo],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor->refresh();
    expect($surveyor->barge_id)->toBe($bargeA->imo);
    expect($surveyor->barges()->pluck('imo')->all())->toBe([
        $bargeA->imo,
        $bargeB->imo,
    ]);
});

test('super_admin can assign user and barge to surveyor profile', function () {
    $admin = User::factory()->create(['type' => UserType::SuperAdmin]);
    $this->actingAs($admin);

    $surveyorUser = User::factory()->create(['type' => UserType::Surveyor]);
    $barge = Barge::factory()->create();
    $surveyor = Surveyor::factory()->create();

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => $surveyor->survey_company,
        'name' => $surveyor->name,
        'user_id' => $surveyorUser->id,
        'barge_id' => $barge->imo,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $surveyor->refresh();
    expect($surveyor->user_id)->toBe($surveyorUser->id);
    expect($surveyor->barge_id)->toBe($barge->imo);
});

test('non-privileged roles are redirected from surveyors edit page', function () {
    $salesUser = User::factory()->create(['type' => UserType::Sales]);
    $this->actingAs($salesUser);

    $this->get(route('surveyors.edit'))->assertRedirect(route('sales-dashboard', absolute: false));
});

test('non-privileged roles cannot create surveyor profiles', function () {
    $salesUser = User::factory()->create(['type' => UserType::Sales]);
    $this->actingAs($salesUser);

    $barge = Barge::factory()->create();

    $this->post(route('surveyors.store'), [
        'survey_company' => 'Test Co',
        'name' => 'Test Name',
        'barge_id' => $barge->imo,
    ])->assertForbidden();
});

test('non-privileged roles cannot update surveyor profiles', function () {
    $salesUser = User::factory()->create(['type' => UserType::Sales]);
    $this->actingAs($salesUser);

    $surveyor = Surveyor::factory()->create();

    $this->patch(route('surveyors.update', $surveyor), [
        'survey_company' => $surveyor->survey_company,
        'name' => $surveyor->name,
        'barge_id' => null,
    ])->assertForbidden();
});

// =============================================================
// 5. Regression
// =============================================================

test('super_admin dashboard access still works', function () {
    $admin = User::factory()->create(['type' => UserType::SuperAdmin]);
    $this->actingAs($admin);

    $barge = Barge::factory()->create();
    makeOrderOnBarge($barge->imo, ['vessel_name' => 'MV Regression']);

    $this->get(route('surveyor', ['barge' => $barge->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV Regression')
            ->where('pendingOrders.0.barge_id', $barge->imo));
});

test('master dashboard access still works', function () {
    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    $barge = Barge::factory()->create();
    makeOrderOnBarge($barge->imo, ['vessel_name' => 'MV Master Regression']);

    $this->get(route('surveyor', ['barge' => $barge->imo]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('surveyor/dashboard')
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.vessel_name', 'MV Master Regression')
            ->where('pendingOrders.0.barge_id', $barge->imo));
});

test('bdns are filtered for surveyors in index', function () {
    $bargeA = Barge::factory()->create(['name' => 'Barge Alpha']);
    $bargeB = Barge::factory()->create(['name' => 'Barge Beta']);

    $surveyorUser = makeSurveyorUser($bargeA->imo);
    $this->actingAs($surveyorUser);

    $orderOnA = makeOrderOnBarge($bargeA->imo);
    $orderOnB = makeOrderOnBarge($bargeB->imo);

    Bdn::factory()->create([
        'order_id' => $orderOnA->id,
        'bdn_number' => 'BDN-ALPHA',
        'barge_id' => $bargeA->imo,
    ]);
    Bdn::factory()->create([
        'order_id' => $orderOnB->id,
        'bdn_number' => 'BDN-BETA',
        'barge_id' => $bargeB->imo,
    ]);

    $this->get(route('bdns.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bdns/index')
            ->has('bdns', 1)
            ->where('bdns.0.bdn_number', 'BDN-ALPHA'));
});

test('privileged users see all bdns in index', function () {
    $bargeA = Barge::factory()->create();
    $bargeB = Barge::factory()->create();

    $master = User::factory()->create(['type' => UserType::Master]);
    $this->actingAs($master);

    $orderOnA = makeOrderOnBarge($bargeA->imo);
    $orderOnB = makeOrderOnBarge($bargeB->imo);

    Bdn::factory()->create(['order_id' => $orderOnA->id, 'barge_id' => $bargeA->imo]);
    Bdn::factory()->create(['order_id' => $orderOnB->id, 'barge_id' => $bargeB->imo]);

    $this->get(route('bdns.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bdns/index')
            ->has('bdns', 2));
});
