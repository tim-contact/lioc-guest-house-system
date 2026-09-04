<?php

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\OrderStatus;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Enums\UserType;
use App\Http\Middleware\HandleInertiaRequests;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\SupplyLocation;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Spatie\LaravelPdf\Facades\Pdf;
use Spatie\LaravelPdf\PdfBuilder;

test('guests are redirected from the bdns page', function () {
    $this->get(route('bdns.index'))->assertRedirect(route('login'));
});

test('index lists bdns with their order, agent and barge details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $agent = Agent::factory()->create(['name' => 'Blue Agents']);
    $barge = Barge::factory()->create(['name' => 'MT Bunker One']);
    $order = Order::factory()->create(['order_number' => 'ORD-BDN-INDEX']);
    Bdn::factory()->create([
        'order_id' => $order->id,
        'bdn_number' => 'BDN-INDEX-1',
        'agent_id' => $agent->id,
        'barge_id' => $barge->imo,
    ]);

    $this->get(route('bdns.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bdns/index')
            ->has('bdns', 1)
            ->where('bdns.0.bdn_number', 'BDN-INDEX-1')
            ->where('bdns.0.order_number', 'ORD-BDN-INDEX')
            ->where('bdns.0.agent_name', 'Blue Agents')
            ->where('bdns.0.barge_name', 'MT Bunker One')
            ->has('supplyLocationOptions')
            ->has('deliveryModeOptions')
            ->has('samplingLocationOptions')
            ->has('samplingMethodOptions'));
});

test('guests cannot save a bdn', function () {
    $order = Order::factory()->create();

    $this->put(route('surveyor.bdn.update', $order))->assertRedirect(route('login'));
});

test('update creates the bdn on first save and numbers it after the order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['order_number' => 'ORD-BDN-1']);
    $location = SupplyLocation::firstOrCreate(['port_id' => $order->port_id, 'name' => 'ANCHORAGE']);

    $this->put(route('surveyor.bdn.update', $order), [
        'delivery_date' => '2026-07-30',
        'delivery_location_id' => $location->id,
        'vessel_flag' => 'Panama',
        'grt' => 45000,
        'pi_club' => 'Britannia',
        'owner_operator' => 'Blue Ocean Ltd',
        'last_port_of_call' => 'Singapore',
        'destination_port' => 'Colombo',
        'delivery_method' => DeliveryMode::Barge->value,
        'barge_alongside_at' => '2026-07-30T08:15',
        'vlsfo_hose_connected_at' => '2026-07-30T08:45',
        'vlsfo_density_15' => 0.9814,
        'vlsfo_sulphur_pct' => 0.482,
        'chief_engineer_invited' => true,
        'chief_engineer_witnessed' => false,
        'sampling_location' => Sampling::BargeManifold->value,
        'sampling_method' => SamplingMethod::ContinuousDrip->value,
        'marpol_seal_number' => '778812',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->bdn()->sole())
        ->bdn_number->toBe('BDN-ORD-BDN-1')
        ->delivery_location_id->toBe($location->id)
        ->vessel_flag->toBe('Panama')
        ->grt->toBe('45000.00')
        ->delivery_method->toBe(DeliveryMode::Barge)
        ->vlsfo_density_15->toBe('0.9814')
        ->vlsfo_sulphur_pct->toBe('0.482')
        ->chief_engineer_invited->toBeTrue()
        ->chief_engineer_witnessed->toBeFalse()
        ->sampling_location->toBe(Sampling::BargeManifold)
        ->sampling_method->toBe(SamplingMethod::ContinuousDrip)
        ->marpol_seal_number->toBe('778812');
});

test('update saves the timesheet as entered without shifting the clock', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->put(route('surveyor.bdn.update', $order), [
        'vlsfo_hose_connected_at' => '2026-07-30T08:45',
        'vlsfo_pumping_started_at' => '2026-07-30T09:00',
        'vlsfo_cast_off_at' => '2026-07-30T14:30',
    ])->assertSessionHasNoErrors();

    expect($order->bdn()->sole()->toArray())
        ->{'vlsfo_hose_connected_at'}->toBe('2026-07-30T08:45')
        ->{'vlsfo_pumping_started_at'}->toBe('2026-07-30T09:00')
        ->{'vlsfo_cast_off_at'}->toBe('2026-07-30T14:30');
});

test('update edits the existing bdn in place rather than creating a second one', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();
    $bdn = Bdn::factory()->create([
        'order_id' => $order->id,
        'bdn_number' => 'BDN-ORIGINAL',
        'pi_club' => 'Britannia',
    ]);

    $this->put(route('surveyor.bdn.update', $order), ['pi_club' => 'Gard'])
        ->assertSessionHasNoErrors();

    expect(Bdn::where('order_id', $order->id)->count())->toBe(1);
    expect($bdn->fresh())
        ->pi_club->toBe('Gard')
        ->bdn_number->toBe('BDN-ORIGINAL');
});

test('update mirrors the metric tons onto the order bdn quantities', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->put(route('surveyor.bdn.update', $order), [
        'vlsfo_metric_ton' => 480.125,
        'mgo_metric_ton' => 60.5,
    ])->assertSessionHasNoErrors();

    expect($order->fresh())
        ->vlsfo_bdn_qty->toBe('480.125')
        ->mgo_bdn_qty->toBe('60.500')
        ->hsfo_bdn_qty->toBeNull();
});

test('update reprices a delivered order\'s invoice value from the new metric tons', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'vlsfo_rate' => 500,
        'mgo_rate' => 600,
        'hsfo_rate' => 0,
        'barging_cost' => 1200,
        'agent_fees' => 750,
        'invoice_value' => 0,
    ]);

    $this->put(route('surveyor.bdn.update', $order), [
        'vlsfo_metric_ton' => 100,
        'mgo_metric_ton' => 50,
    ])->assertSessionHasNoErrors();

    expect((float) $order->fresh()->invoice_value)->toBe(81950.0);
});

test('update keeps a delivered order invoice date aligned to the bdn delivery date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'credit_terms' => CreditTerms::Days30,
        'invoice_date' => '2026-07-01',
        'payment_due_date' => '2026-07-31',
    ]);

    $this->put(route('surveyor.bdn.update', $order), [
        'delivery_date' => '2026-07-20',
    ])->assertSessionHasNoErrors();

    expect($order->fresh())
        ->invoice_date->toDateString()->toBe('2026-07-20')
        ->payment_due_date->toDateString()->toBe('2026-08-19');
});

test('update accepts a form where every field is still blank', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();
    $blank = array_fill_keys((new Bdn)->getFillable(), '');
    unset($blank['order_id'], $blank['bdn_number']);

    $this->put(route('surveyor.bdn.update', $order), $blank)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($order->bdn()->sole())
        ->grt->toBeNull()
        ->delivery_location_id->toBeNull()
        ->barge_alongside_at->toBeNull()
        ->vlsfo_hose_connected_at->toBeNull()
        ->vlsfo_metric_ton->toBeNull()
        ->chief_engineer_invited->toBeNull()
        ->marpol_seal_number->toBeNull();

    expect($order->fresh()->vlsfo_bdn_qty)->toBeNull();
});

test('update rejects an invalid sampling method', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->put(route('surveyor.bdn.update', $order), ['sampling_method' => 'spot'])
        ->assertSessionHasErrors('sampling_method');
});

test('update rejects a barge that is not on the master list', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->put(route('surveyor.bdn.update', $order), ['barge_id' => '0000000'])
        ->assertSessionHasErrors('barge_id');
});

test('the surveyor dashboard ships each pending order with its bdn and grades', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();
    $order = Order::factory()->create([
        'barge_id' => $barge->imo,
        'status' => OrderStatus::Pending,
        'eta' => now(),
        'vlsfo_final_qty' => 500,
        'mgo_final_qty' => 100,
        'hsfo_final_qty' => 0,
    ]);
    Bdn::factory()->create([
        'order_id' => $order->id,
        'bdn_number' => 'BDN-SURVEYOR',
        'vlsfo_metric_ton' => 480,
    ]);

    $this->get(route('surveyor', ['barge' => $barge->imo]))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.bdn.vlsfo_metric_ton', '480.000')
            ->where('pendingOrders.0.vlsfo_qty', '500.000')
            ->where('pendingOrders.0.mgo_qty', '100.000')
            ->where('pendingOrders.0.hsfo_qty', '0.000'));
});

test('an autosave partial reload returns pending orders without rebuilding the rest of the page', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $barge = Barge::factory()->create();
    Order::factory()->create(['barge_id' => $barge->imo, 'status' => OrderStatus::Pending, 'eta' => now()]);

    DB::enableQueryLog();

    $this->withHeaders([
        'X-Inertia' => 'true',
        'X-Inertia-Version' => app(HandleInertiaRequests::class)->version(request()),
        'X-Inertia-Partial-Component' => 'surveyor/dashboard',
        'X-Inertia-Partial-Data' => 'pendingOrders',
    ])->getJson(route('surveyor', ['barge' => $barge->imo]))
        ->assertOk()
        ->assertJsonPath('props.pendingOrders.0.order_number', Order::sole()->order_number)
        ->assertJsonMissingPath('props.completedOrders')
        ->assertJsonMissingPath('props.agents');

    $queries = collect(DB::getQueryLog())->pluck('query');

    expect($queries->filter(fn (string $query): bool => str_contains($query, '"agents"')))->toBeEmpty();
});

test('every sample type on the model has validated seal columns', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $seals = collect(Bdn::SAMPLE_TYPES)
        ->flatMap(fn (string $sample): array => [
            "{$sample}_seal_number" => "SEAL-{$sample}",
            "{$sample}_counter_seal_number" => "COUNTER-{$sample}",
        ])
        ->all();

    $this->put(route('surveyor.bdn.update', $order), $seals)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($order->bdn()->sole()->only(array_keys($seals)))->toBe($seals);
});

test('guests are redirected from the ebdn download', function () {
    $order = Order::factory()->create();

    $this->get(route('bdns.ebdn', $order))->assertRedirect(route('login'));
});

test('ebdn responds with a pdf for the order even with no bdn yet', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    Pdf::fake();

    $order = Order::factory()->create();

    $this->get(route('bdns.ebdn', $order))->assertOk();

    Pdf::assertRespondedWithPdf(fn (PdfBuilder $pdf): bool => $pdf->viewName === 'pdf.bdn');
});

test('ebdn renders the order and bdn data onto the pdf', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    Pdf::fake();

    $agent = Agent::factory()->create(['name' => 'Blue Agents']);
    $barge = Barge::factory()->create(['name' => 'MT Bunker One']);
    $order = Order::factory()->create([
        'vessel_name' => 'MV Test Vessel',
        'vessel_id' => 'IMO1234567',
    ]);
    $bdn = Bdn::factory()->create([
        'order_id' => $order->id,
        'bdn_number' => 'BDN-EBDN-TEST',
        'agent_id' => $agent->id,
        'barge_id' => $barge->imo,
        'owner_operator' => 'Test Owner Co',
        'pi_club' => 'Test PI Club',
        'vlsfo_density_15' => 0.9410,
        'vlsfo_hose_connected_at' => '2026-08-04 19:30:00',
        'mgo_metric_ton' => null,
    ]);

    $this->get(route('bdns.ebdn', $order))->assertOk();

    Pdf::assertRespondedWithPdf(function (PdfBuilder $pdf) use ($bdn): bool {
        expect($pdf->viewName)->toBe('pdf.bdn');

        $html = $pdf->getHtml();

        foreach ([
            $bdn->bdn_number,
            'MV Test Vessel',
            'IMO1234567',
            'Blue Agents',
            'MT Bunker One',
            'Test Owner Co',
            'Test PI Club',
            '0.9410',
            '04.08.2026 at 19:30 hrs',
        ] as $needle) {
            expect($html)->toContain($needle);
        }

        // Only a null that fills a cell on its own; the terms and conditions
        // legitimately read "null and void".
        expect($html)->not->toMatch('/>\s*null\s*</i');

        return true;
    });
});
