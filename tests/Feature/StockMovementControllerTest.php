<?php

use App\Enums\OrderStatus;
use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use App\Models\Port;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\StockMovementService;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->withoutVite();
    config(['stock.barge_stock_start_date' => null]);
});

test('operations users can view the stock movement report', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create(['name' => 'Colombo']);

    $this->get(route('stock-movements.index', [
        'port_id' => $port->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('stock-movements/index')
            ->where('filters.port_id', $port->id)
            ->has('report.terminal', 1)
            ->has('report.barges', 0));
});

test('stock movement form only exposes operational movement types', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create(['name' => 'Colombo']);

    $this->get(route('stock-movements.index', [
        'port_id' => $port->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('movementTypeOptions', 2)
            ->where('movementTypeOptions.0.value', StockMovementType::Loading->value)
            ->where('movementTypeOptions.1.value', StockMovementType::RebondTransfer->value));
});

test('manual stock movements can be recorded', function () {
    $user = User::factory()->create(['type' => UserType::Operations]);
    $this->actingAs($user);

    $port = Port::factory()->create();
    $barge = Barge::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Barge->value,
        'movement_type' => StockMovementType::Loading->value,
        'barge_id' => $barge->imo,
        'counterparty_name' => 'Southern Star',
        'mgo_qty' => 35,
        'vlsfo_qty' => 680,
        'hsfo_qty' => 0,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->assertDatabaseHas('stock_movements', [
        'port_id' => $port->id,
        'barge_id' => $barge->imo,
        'movement_scope' => StockMovementScope::Barge->value,
        'movement_type' => StockMovementType::Loading->value,
        'mgo_qty' => '35.000',
        'vlsfo_qty' => '680.000',
        'created_by' => $user->id,
    ]);
});

test('terminal imports can be recorded', function () {
    $user = User::factory()->create(['type' => UserType::Operations]);
    $this->actingAs($user);

    $port = Port::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => StockMovementType::Loading->value,
        'counterparty_name' => 'Import Supplier',
        'mgo_qty' => 120,
        'vlsfo_qty' => 450,
        'hsfo_qty' => 0,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->assertDatabaseHas('stock_movements', [
        'port_id' => $port->id,
        'barge_id' => null,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => StockMovementType::Loading->value,
        'counterparty_name' => 'Import Supplier',
        'mgo_qty' => '120.000',
        'vlsfo_qty' => '450.000',
        'created_by' => $user->id,
    ]);
});

test('terminal re-bond sales can be recorded', function () {
    $user = User::factory()->create(['type' => UserType::Operations]);
    $this->actingAs($user);

    $port = Port::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => StockMovementType::RebondTransfer->value,
        'counterparty_name' => 'Re-bond Customer',
        'mgo_qty' => 30,
        'vlsfo_qty' => 75,
        'hsfo_qty' => 0,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $this->assertDatabaseHas('stock_movements', [
        'port_id' => $port->id,
        'barge_id' => null,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => StockMovementType::RebondTransfer->value,
        'counterparty_name' => 'Re-bond Customer',
        'mgo_qty' => '30.000',
        'vlsfo_qty' => '75.000',
        'created_by' => $user->id,
    ]);
});

test('opening and dead stock movements cannot be recorded by users', function (StockMovementType $type) {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => $type->value,
        'mgo_qty' => 10,
        'vlsfo_qty' => 0,
        'hsfo_qty' => 0,
    ])->assertSessionHasErrors('movement_type');
})->with([
    'opening' => StockMovementType::Opening,
    'dead stock' => StockMovementType::DeadStock,
]);

test('re-bond stock movement cannot be recorded against a barge', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create();
    $barge = Barge::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Barge->value,
        'movement_type' => StockMovementType::RebondTransfer->value,
        'barge_id' => $barge->imo,
        'mgo_qty' => 10,
        'vlsfo_qty' => 0,
        'hsfo_qty' => 0,
    ])->assertSessionHasErrors('movement_type');
});

test('adjustment stock movements cannot be recorded', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create();

    $this->post(route('stock-movements.store'), [
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal->value,
        'movement_type' => StockMovementType::Adjustment->value,
        'mgo_qty' => 10,
        'vlsfo_qty' => 0,
        'hsfo_qty' => 0,
    ])->assertSessionHasErrors('movement_type');
});

test('report subtracts barge loading from terminal and delivery from barge stock', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create(['name' => 'Colombo']);
    $barge = Barge::factory()->create(['name' => 'Southern Star']);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::Opening,
        'mgo_qty' => 1000,
        'vlsfo_qty' => 2000,
        'hsfo_qty' => 0,
    ]);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'barge_id' => $barge->imo,
        'movement_scope' => StockMovementScope::Barge,
        'movement_type' => StockMovementType::Loading,
        'mgo_qty' => 35,
        'vlsfo_qty' => 680,
        'hsfo_qty' => 0,
    ]);

    $order = Order::factory()->create([
        'port_id' => $port->id,
        'barge_id' => $barge->imo,
        'status' => OrderStatus::Delivered,
        'mgo_bdn_qty' => 10,
        'vlsfo_bdn_qty' => 80,
        'hsfo_bdn_qty' => 0,
    ]);

    Bdn::factory()->create([
        'order_id' => $order->id,
        'delivery_date' => '2026-08-01',
        'barge_id' => $barge->imo,
    ]);

    $this->get(route('stock-movements.index', [
        'port_id' => $port->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('report.terminal.0.closing.mgo', 965)
            ->where('report.terminal.0.closing.vlsfo', 1320)
            ->where('report.barges.0.barge_name', 'Southern Star')
            ->where('report.barges.0.deliveries.mgo', 10)
            ->where('report.barges.0.deliveries.vlsfo', 80)
            ->where('report.barges.0.closing.mgo', 25)
            ->where('report.barges.0.closing.vlsfo', 600));
});

test('report subtracts re-bond sales from terminal stock', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create(['name' => 'Colombo']);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::Opening,
        'mgo_qty' => 1000,
        'vlsfo_qty' => 2000,
        'hsfo_qty' => 0,
    ]);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::RebondTransfer,
        'mgo_qty' => 100,
        'vlsfo_qty' => 250,
        'hsfo_qty' => 0,
    ]);

    $this->get(route('stock-movements.index', [
        'port_id' => $port->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('report.terminal.0.rebond_sales.mgo', 100)
            ->where('report.terminal.0.rebond_sales.vlsfo', 250)
            ->where('report.terminal.0.closing.mgo', 900)
            ->where('report.terminal.0.closing.vlsfo', 1750));
});

test('barge report lists unique vessels only for completed deliveries on that barge and date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));
    $port = Port::factory()->create(['name' => 'Colombo']);
    $barge = Barge::factory()->create();
    $otherBarge = Barge::factory()->create();

    foreach ([
        ['MV Alpha', $barge->imo, '2026-08-01', OrderStatus::Delivered],
        ['MV Beta', $barge->imo, '2026-08-01', OrderStatus::Closed],
        ['MV Alpha', $barge->imo, '2026-08-01', OrderStatus::Delivered],
        ['MV Other Barge', $otherBarge->imo, '2026-08-01', OrderStatus::Delivered],
        ['MV Other Date', $barge->imo, '2026-08-02', OrderStatus::Delivered],
        ['MV Pending', $barge->imo, '2026-08-01', OrderStatus::Pending],
    ] as [$vesselName, $bargeId, $date, $status]) {
        $order = Order::factory()->create([
            'port_id' => $port->id,
            'barge_id' => $bargeId,
            'vessel_name' => $vesselName,
            'status' => $status,
            'mgo_bdn_qty' => 1,
            'vlsfo_bdn_qty' => 0,
            'hsfo_bdn_qty' => 0,
        ]);

        Bdn::factory()->create([
            'order_id' => $order->id,
            'delivery_date' => $date,
            'barge_id' => $bargeId,
        ]);
    }

    $report = app(StockMovementService::class)->report(
        $port->id,
        CarbonImmutable::parse('2026-08-01'),
        CarbonImmutable::parse('2026-08-01'),
    );
    $row = collect($report['barges'])->firstWhere('barge_id', $barge->imo);

    expect($row['vessel_names'])->toEqualCanonicalizing(['MV Alpha', 'MV Beta'])
        ->and($row['deliveries']['mgo'])->toBe(3.0)
        ->and($row['closing']['mgo'])->toBe(-3.0);
});

test('barge stock cutoff excludes older stock and deliveries while preserving terminal history', function (
    string $from,
    string $to,
    int $rowCount,
    float $opening,
    float $closing,
    float $terminalClosing,
) {
    config(['stock.barge_stock_start_date' => '2026-08-01']);
    $port = Port::factory()->create();
    $barge = Barge::factory()->create();

    foreach ([
        ['2026-07-31', StockMovementScope::Terminal, StockMovementType::Opening, 1000],
        ['2026-07-31', StockMovementScope::Barge, StockMovementType::Opening, 100],
        ['2026-07-31', StockMovementScope::Barge, StockMovementType::Loading, 20],
        ['2026-08-01', StockMovementScope::Barge, StockMovementType::Opening, 5],
        ['2026-08-01', StockMovementScope::Barge, StockMovementType::Loading, 50],
    ] as [$date, $scope, $type, $quantity]) {
        StockMovement::factory()->create([
            'movement_date' => $date,
            'port_id' => $port->id,
            'barge_id' => $scope === StockMovementScope::Barge ? $barge->imo : null,
            'movement_scope' => $scope,
            'movement_type' => $type,
            'mgo_qty' => $quantity,
            'vlsfo_qty' => 0,
            'hsfo_qty' => 0,
        ]);
    }

    foreach ([
        ['2026-07-31', 300, 'MV Historical'],
        ['2026-08-01', 10, 'MV Boundary'],
        ['2026-08-02', 5, 'MV Current'],
    ] as [$date, $quantity, $vesselName]) {
        $order = Order::factory()->create([
            'port_id' => $port->id,
            'barge_id' => $barge->imo,
            'status' => OrderStatus::Delivered,
            'vessel_name' => $vesselName,
            'mgo_bdn_qty' => $quantity,
            'vlsfo_bdn_qty' => 0,
            'hsfo_bdn_qty' => 0,
        ]);
        Bdn::factory()->create([
            'order_id' => $order->id,
            'delivery_date' => $date,
            'barge_id' => $barge->imo,
        ]);
    }

    $report = app(StockMovementService::class)->report(
        $port->id, CarbonImmutable::parse($from), CarbonImmutable::parse($to),
    );

    expect($report['barges'])->toHaveCount($rowCount)
        ->and($report['totals']['barge_closing']['mgo'])->toBe($closing)
        ->and($report['totals']['terminal_closing']['mgo'])->toBe($terminalClosing);

    if ($rowCount > 0) {
        expect($report['barges'][0]['opening']['mgo'])->toBe($opening)
            ->and(collect($report['barges'])->pluck('vessel_names')->flatten()->all())
            ->not->toContain('MV Historical');
    }
})->with([
    'range crosses cutoff' => ['2026-07-31', '2026-08-02', 2, 0.0, 40.0, 930.0],
    'range begins after cutoff' => ['2026-08-02', '2026-08-02', 1, 45.0, 40.0, 930.0],
    'range ends before cutoff' => ['2026-07-31', '2026-07-31', 0, 0.0, 0.0, 980.0],
]);

test('dead stock is reported separately and reduces removable stock', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $port = Port::factory()->create(['name' => 'Colombo']);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::Opening,
        'mgo_qty' => 1000,
        'vlsfo_qty' => 2000,
        'hsfo_qty' => 0,
    ]);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $port->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::DeadStock,
        'mgo_qty' => 100,
        'vlsfo_qty' => 250,
        'hsfo_qty' => 0,
    ]);

    $this->get(route('stock-movements.index', [
        'port_id' => $port->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('report.terminal.0.closing.mgo', 1000)
            ->where('report.terminal.0.dead_stock_closing.mgo', 100)
            ->where('report.terminal.0.dead_stock_closing.vlsfo', 250)
            ->where('report.totals.dead_stock.mgo', 100)
            ->where('report.totals.removable_closing.mgo', 900)
            ->where('report.totals.removable_closing.vlsfo', 1750));
});

test('overview includes colombo trinco tracked barges and balance on hand', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));

    $colombo = Port::factory()->create(['name' => 'Colombo']);
    $trinco = Port::factory()->create(['name' => 'Trincomalee']);
    $ceylonStar = Barge::factory()->create(['imo' => '9021291', 'name' => 'MT CEYLON STAR']);
    $southernStar = Barge::factory()->create(['imo' => '8923844', 'name' => 'MT SOUTHERN STAR']);
    $sanvi = Barge::factory()->create(['imo' => '8530570', 'name' => 'MT SANVI69']);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $colombo->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::Opening,
        'mgo_qty' => 800,
        'vlsfo_qty' => 5000,
        'hsfo_qty' => 0,
    ]);

    StockMovement::factory()->create([
        'movement_date' => '2026-08-01',
        'port_id' => $trinco->id,
        'movement_scope' => StockMovementScope::Terminal,
        'movement_type' => StockMovementType::Opening,
        'mgo_qty' => 1800,
        'vlsfo_qty' => 14000,
        'hsfo_qty' => 0,
    ]);

    foreach ([
        [$ceylonStar, 74, 752],
        [$southernStar, 124, 1467],
        [$sanvi, 34, 1419],
    ] as [$barge, $mgo, $vlsfo]) {
        StockMovement::factory()->create([
            'movement_date' => '2026-08-01',
            'port_id' => $colombo->id,
            'barge_id' => $barge->imo,
            'movement_scope' => StockMovementScope::Barge,
            'movement_type' => StockMovementType::Opening,
            'mgo_qty' => $mgo,
            'vlsfo_qty' => $vlsfo,
            'hsfo_qty' => 0,
        ]);
    }

    $this->get(route('stock-movements.index', [
        'port_id' => $colombo->id,
        'date_from' => '2026-08-01',
        'date_to' => '2026-08-01',
    ]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('stockOverview.colombo_terminal.mgo', 800)
            ->where('stockOverview.trinco_terminal.vlsfo', 14000)
            ->has('stockOverview.tracked_barges', 3)
            ->where('stockOverview.tracked_barges.0.imo', '9021291')
            ->where('stockOverview.tracked_barges.1.imo', '8923844')
            ->where('stockOverview.tracked_barges.2.imo', '8530570')
            ->where('stockOverview.balance_on_hand.mgo', 2832)
            ->where('stockOverview.balance_on_hand.vlsfo', 22638));
});
