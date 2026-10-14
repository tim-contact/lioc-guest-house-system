<?php

use App\Enums\DisputeStatus;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(now()->startOfMonth()->addDays(14)->startOfDay());
    config(['stock.barge_stock_start_date' => null]);
});

test('super admins can view report analytics', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('reports/analytics')
            ->has('summary')
            ->has('stockPosition.rows', 7)
            ->has('funnel', 3)
            ->where('funnel.0.value', 0)
            ->where('funnel.1.value', 0)
            ->where('funnel.2.value', 0)
            ->has('portStatusMetrics')
            ->has('monthlyProductVolumes', 6)
            ->has('topCustomers')
            ->has('bargeUtilization', 3)
            ->has('pendingDisputesByPort')
            ->has('productDemandComparison', 3)
            ->has('productDemandByPort')
            ->has('cyLyProductSales', 3)
            ->has('cyLyProductSales.0.months', 12));
});

test('analytics summary includes the total customer credit limit', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Customer::factory()->create(['credit_limit' => 125000.25]);
    Customer::factory()->create(['credit_limit' => 74999.75]);

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.totalCreditLimit', 200000));
});

test('barge drilldown uses completed BDN deliveries and agrees with utilization counts', function (string $period, int $total) {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844']);
    $other = Barge::factory()->create();
    foreach ([
        [$barge->imo, $barge->imo, OrderStatus::Pending, now()],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, now()],
        [$barge->imo, $barge->imo, OrderStatus::Closed, now()->subDays(20)],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, now()->subDays(40)],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, null],
        [$barge->imo, $barge->imo, OrderStatus::Cancelled, now()],
        [$other->imo, $other->imo, OrderStatus::Delivered, now()],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, now()->addDay()],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, now()->subDays(29)],
        [$barge->imo, $barge->imo, OrderStatus::Delivered, now()->subDays(30)],
        [$barge->imo, $other->imo, OrderStatus::Delivered, now()],
        [$other->imo, $barge->imo, OrderStatus::Delivered, now()],
        [$barge->imo, null, OrderStatus::Delivered, now()],
    ] as [$orderBarge, $bdnBarge, $status, $deliveryDate]) {
        $order = Order::factory()->create([
            'barge_id' => $orderBarge,
            'status' => $status,
            'order_date' => now(),
            'invoice_date' => $deliveryDate?->isToday() ? now()->subDays(40) : now(),
        ]);
        if ($deliveryDate !== null) {
            Bdn::factory()->create([
                'order_id' => $order->id,
                'barge_id' => $bdnBarge,
                'delivery_date' => $deliveryDate,
            ]);
        }
    }

    $this->get(route('reports.barges.orders', ['barge' => $barge->imo, 'period' => $period]))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('reports/barge-orders')
            ->where('barge.imo', $barge->imo)
            ->where('filters.period', $period)
            ->where('summary.completed', $total)
            ->where('orders.total', $total)
            ->has('orders.data', $total)
            ->missing('summary.pending'));

    if ($period !== 'all') {
        $this->get(route('reports.analytics'))->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where("bargeUtilization.0.periods.{$period}.completed", $total)
                ->where("bargeUtilization.0.periods.{$period}.total", $total)
                ->missing("bargeUtilization.0.periods.{$period}.pending"));
    }
})->with([
    'current month' => ['currentMonth', 3],
    'last month' => ['lastMonth', 4],
    'all history' => ['all', 7],
]);

test('pending barge utilization and drilldown include all assigned pending orders', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844']);
    $other = Barge::factory()->create(['imo' => '9021291']);

    foreach ([now()->subDays(60), now(), now()->addDays(10)] as $date) {
        Order::factory()->create([
            'barge_id' => $barge->imo,
            'status' => OrderStatus::Pending,
            'order_date' => $date,
            'mgo_final_qty' => 12.345,
            'mgo_bdn_qty' => 999,
        ]);
    }

    foreach ([OrderStatus::Delivered, OrderStatus::Closed, OrderStatus::Cancelled] as $status) {
        Order::factory()->create(['barge_id' => $barge->imo, 'status' => $status]);
    }
    Order::factory()->create(['barge_id' => $other->imo, 'status' => OrderStatus::Pending]);
    Order::factory()->create(['barge_id' => null, 'status' => OrderStatus::Pending]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('bargeUtilization.0.periods.pending.pending', 3)
            ->where('bargeUtilization.0.periods.pending.total', 3)
            ->where('bargeUtilization.1.periods.pending.total', 1)
            ->where('bargeUtilization.2.periods.pending.total', 0)
            ->where('bargeUtilization.0.periods.currentMonth.total', 0)
            ->where('bargeUtilization.0.periods.lastMonth.total', 0));

    $this->get(route('reports.barges.orders', ['barge' => $barge->imo, 'period' => 'pending']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('reports/barge-orders')
            ->where('filters.period', 'pending')
            ->where('summary.pending', 3)
            ->missing('summary.completed')
            ->where('orders.total', 3)
            ->has('orders.data', 3)
            ->where('orders.data.0.status', 'pending')
            ->where('orders.data.0.delivery_date', null)
            ->where('orders.data.0.products.mgo', '12.345'));
});

test('barge utilization product volumes follow delivery scopes and pending nominations', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844']);
    $other = Barge::factory()->create(['imo' => '9021291']);

    foreach ([
        [OrderStatus::Delivered, now(), $barge->imo, null, 2.345, 0],
        [OrderStatus::Closed, now()->subDays(20), $barge->imo, 4.567, 5.678, 6.789],
        [OrderStatus::Delivered, now()->subMonthsNoOverflow(2), $barge->imo, 100, 100, 100],
        [OrderStatus::Delivered, now()->addDay(), $barge->imo, 100, 100, 100],
        [OrderStatus::Cancelled, now(), $barge->imo, 100, 100, 100],
        [OrderStatus::Delivered, now(), $other->imo, 100, 100, 100],
    ] as [$status, $date, $bdnBarge, $mgo, $vlsfo, $hsfo]) {
        $order = Order::factory()->create([
            'barge_id' => $barge->imo,
            'status' => $status,
            'order_date' => now()->subDays(60),
            'invoice_date' => now()->subDays(60),
            'mgo_bdn_qty' => $mgo,
            'vlsfo_bdn_qty' => $vlsfo,
            'hsfo_bdn_qty' => $hsfo,
            'mgo_final_qty' => 999,
            'vlsfo_final_qty' => 999,
            'hsfo_final_qty' => 999,
        ]);
        Bdn::factory()->create([
            'order_id' => $order->id,
            'barge_id' => $bdnBarge,
            'delivery_date' => $date,
            'mgo_metric_ton' => 1.234,
            'vlsfo_metric_ton' => 99,
            'hsfo_metric_ton' => 88,
        ]);
    }

    foreach ([now()->subDays(60), now()->addDays(10)] as $date) {
        Order::factory()->create([
            'barge_id' => $barge->imo,
            'status' => OrderStatus::Pending,
            'order_date' => $date,
            'mgo_final_qty' => 1.111,
            'vlsfo_final_qty' => 2.222,
            'hsfo_final_qty' => null,
            'mgo_bdn_qty' => 999,
            'vlsfo_bdn_qty' => 999,
            'hsfo_bdn_qty' => 999,
        ]);
    }

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('bargeUtilization.0.periods.currentMonth.products.mgo', 1.234)
            ->where('bargeUtilization.0.periods.currentMonth.products.vlsfo', 2.345)
            ->where('bargeUtilization.0.periods.currentMonth.products.hsfo', 0)
            ->where('bargeUtilization.0.periods.lastMonth.products.mgo', 4.567)
            ->where('bargeUtilization.0.periods.lastMonth.products.vlsfo', 5.678)
            ->where('bargeUtilization.0.periods.lastMonth.products.hsfo', 6.789)
            ->where('bargeUtilization.0.periods.pending.products.mgo', 2.222)
            ->where('bargeUtilization.0.periods.pending.products.vlsfo', 4.444)
            ->where('bargeUtilization.0.periods.pending.products.hsfo', 0)
            ->where('bargeUtilization.2.periods.currentMonth.products.mgo', 0)
            ->where('bargeUtilization.2.periods.lastMonth.products.vlsfo', 0)
            ->where('bargeUtilization.2.periods.pending.products.hsfo', 0));
});

test('last month utilization and drilldown include exactly the previous calendar month', function (string $today) {
    $this->travelTo(CarbonImmutable::parse($today));
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844']);
    $monthStart = now()->startOfMonth();
    $previousStart = $monthStart->copy()->subMonth();

    foreach ([
        $previousStart->copy()->subDay(),
        $previousStart,
        $monthStart->copy()->subDay(),
        $monthStart,
    ] as $date) {
        $order = Order::factory()->create([
            'barge_id' => $barge->imo,
            'status' => OrderStatus::Delivered,
            'invoice_date' => now(),
            'mgo_bdn_qty' => 10,
            'vlsfo_bdn_qty' => 0,
            'hsfo_bdn_qty' => 0,
        ]);
        Bdn::factory()->create([
            'order_id' => $order->id,
            'barge_id' => $barge->imo,
            'delivery_date' => $date,
        ]);
    }

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('bargeUtilization.0.periods.lastMonth.completed', 2)
            ->where('bargeUtilization.0.periods.lastMonth.products.mgo', 20)
            ->missing('bargeUtilization.0.periods.last30Days'));

    $this->get(route('reports.barges.orders', ['barge' => $barge->imo, 'period' => 'lastMonth']))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('filters.period', 'lastMonth')
            ->where('summary.completed', 2)
            ->where('orders.total', 2));
})->with(['2026-01-31', '2026-03-31', '2024-03-31']);

test('pending barge orders paginate and preserve their filter', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844']);
    Order::factory()->count(11)->create(['barge_id' => $barge->imo, 'status' => OrderStatus::Pending]);

    $this->get(route('reports.barges.orders', [
        'barge' => $barge->imo, 'period' => 'pending', 'per_page' => 10, 'page' => 2,
    ]))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.pending', 11)
            ->where('orders.total', 11)
            ->where('orders.current_page', 2)
            ->has('orders.data', 1)
            ->where('orders.prev_page_url', fn ($url): bool => str_contains($url, 'period=pending')));
});

test('barge deliveries paginate and preserve filters', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    $barge = Barge::factory()->create();
    $orders = Order::factory()->count(12)->create(['barge_id' => $barge->imo, 'status' => OrderStatus::Delivered]);
    foreach ($orders as $order) {
        Bdn::factory()->create(['order_id' => $order->id, 'barge_id' => $barge->imo, 'delivery_date' => now()]);
    }

    $this->get(route('reports.barges.orders', [
        'barge' => $barge->imo, 'period' => 'all', 'per_page' => 10, 'page' => 2,
    ]))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('orders.total', 12)
            ->where('orders.current_page', 2)
            ->has('orders.data', 2)
            ->where('orders.prev_page_url', fn (string $url): bool => str_contains($url, 'period=all')));
});

test('barge drilldown follows analytics access permissions', function () {
    $barge = Barge::factory()->create();
    $url = route('reports.barges.orders', $barge->imo);
    $this->get($url)->assertRedirect(route('login'));
    $this->actingAs(User::factory()->create(['type' => UserType::Operations]));
    $this->get($url)->assertRedirect();
});

test('barge drilldown validates filters and handles unknown barges', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create();
    $this->get(route('reports.barges.orders', ['barge' => $barge->imo, 'period' => 'invalid', 'status' => 'invalid']))
        ->assertSessionHasErrors(['period']);
    $this->get(route('reports.barges.orders', 'not-a-barge'))->assertNotFound();
});

test('analytics stock position uses current stock balances and pending commitments', function (?string $cutoff, int $bargeBalance) {
    $this->travelTo(now()->setDate(2026, 10, 5)->startOfDay());
    config(['stock.barge_stock_start_date' => $cutoff]);
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $colombo = Port::factory()->create(['name' => 'Colombo']);
    $trinco = Port::factory()->create(['name' => 'Trincomalee']);
    $barge = Barge::factory()->create();

    foreach ([
        [$colombo->id, '2026-10-03', StockMovementScope::Terminal, StockMovementType::Opening, 1000],
        [$colombo->id, '2026-10-04', StockMovementScope::Terminal, StockMovementType::DeadStock, 100],
        [$trinco->id, '2026-10-04', StockMovementScope::Terminal, StockMovementType::Opening, 200],
        [$trinco->id, '2026-10-04', StockMovementScope::Terminal, StockMovementType::DeadStock, 20],
        [$colombo->id, '2026-10-04', StockMovementScope::Barge, StockMovementType::Opening, 50],
        [$colombo->id, '2026-10-05', StockMovementScope::Barge, StockMovementType::Loading, 20],
        [$colombo->id, '2026-10-06', StockMovementScope::Terminal, StockMovementType::Loading, 500],
    ] as [$portId, $date, $scope, $type, $quantity]) {
        StockMovement::factory()->create([
            'port_id' => $portId,
            'movement_date' => $date,
            'movement_scope' => $scope,
            'movement_type' => $type,
            'barge_id' => $scope === StockMovementScope::Barge ? $barge->imo : null,
            'mgo_qty' => $quantity,
            'vlsfo_qty' => 0,
            'hsfo_qty' => 0,
        ]);
    }

    foreach ([['2026-10-03', 30], ['2026-10-05', 10]] as [$date, $quantity]) {
        $order = Order::factory()->create([
            'port_id' => $colombo->id,
            'barge_id' => $barge->imo,
            'status' => OrderStatus::Delivered,
            'mgo_bdn_qty' => $quantity,
            'vlsfo_bdn_qty' => 0,
            'hsfo_bdn_qty' => 0,
        ]);
        $knownOrderIds = Order::query()->pluck('id');
        Bdn::factory()->create([
            'order_id' => $order->id,
            'barge_id' => $barge->imo,
            'delivery_date' => $date,
        ]);
        // BdnFactory creates an additional default order even when order_id is supplied.
        Order::query()->whereNotIn('id', $knownOrderIds)->update(['status' => OrderStatus::Cancelled]);
    }

    foreach ([
        [OrderStatus::Pending, '2026-10-05', 200],
        [OrderStatus::Cancelled, '2026-10-05', 100],
        [OrderStatus::Pending, '2026-10-06', 500],
    ] as [$status, $date, $quantity]) {
        Order::factory()->create([
            'port_id' => $colombo->id,
            'status' => $status,
            'order_date' => $date,
            'mgo_final_qty' => $quantity,
            'vlsfo_final_qty' => 0,
            'hsfo_final_qty' => 0,
            'mgo_bdn_qty' => 999,
        ]);
    }

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('stockPosition.asOf', '2026-10-05')
            ->where('stockPosition.rows.0.values.mgo', 1060)
            ->where('stockPosition.rows.1.values.mgo', $bargeBalance)
            ->where('stockPosition.rows.2.values.mgo', 1060 + $bargeBalance)
            ->where('stockPosition.rows.3.values.mgo', 200)
            ->where('stockPosition.rows.4.values.mgo', 860 + $bargeBalance)
            ->where('stockPosition.rows.4.values.hsfo', 0)
            ->where('stockPosition.rows.5.values.mgo', null)
            ->where('stockPosition.rows.6.values.mgo', null));
})->with([
    'all history' => [null, 30],
    'configured barge cutoff' => ['2026-10-04', 60],
]);

test('analytics stock position preserves zero and negative balances', function () {
    $this->travelTo(now()->setDate(2026, 10, 5)->startOfDay());
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $port = Port::factory()->create();
    Order::factory()->create([
        'port_id' => $port->id,
        'status' => OrderStatus::Pending,
        'order_date' => '2026-10-05',
        'mgo_final_qty' => 10,
        'vlsfo_final_qty' => 0,
        'hsfo_final_qty' => 0,
    ]);

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('stockPosition.rows.0.values.mgo', 0)
            ->where('stockPosition.rows.1.values.mgo', 0)
            ->where('stockPosition.rows.2.values.mgo', 0)
            ->where('stockPosition.rows.4.values.mgo', -10));
});

test('barge utilization excludes pending orders and uses BDN dates instead of invoice dates', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $barge = Barge::factory()->create(['imo' => '8923844', 'name' => 'Barge Alpha']);
    Order::factory()->create(['barge_id' => $barge->imo, 'status' => OrderStatus::Pending, 'order_date' => now()]);
    $delivered = Order::factory()->create([
        'barge_id' => $barge->imo, 'status' => OrderStatus::Delivered, 'invoice_date' => now()->subDays(40),
    ]);
    Bdn::factory()->create(['order_id' => $delivered->id, 'barge_id' => $barge->imo, 'delivery_date' => now()]);
    $old = Order::factory()->create([
        'barge_id' => $barge->imo, 'status' => OrderStatus::Delivered, 'invoice_date' => now(),
    ]);
    Bdn::factory()->create(['order_id' => $old->id, 'barge_id' => $barge->imo, 'delivery_date' => now()->subDays(40)]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('bargeUtilization.0.imo', $barge->imo)
            ->where('bargeUtilization.0.label', 'Barge Alpha')
            ->where('bargeUtilization.0.ordersUrl', route('reports.barges.orders', $barge->imo))
            ->where('bargeUtilization.0.periods.currentMonth.completed', 1)
            ->where('bargeUtilization.0.periods.currentMonth.total', 1)
            ->where('bargeUtilization.0.periods.lastMonth.completed', 1)
            ->where('bargeUtilization.0.periods.lastMonth.total', 1)
            ->missing('bargeUtilization.0.periods.currentMonth.pending')
            ->where('bargeUtilization.1.periods.currentMonth.total', 0)
            ->where('bargeUtilization.2.periods.currentMonth.total', 0));
});

test('analytics completed card uses BDN delivery month for delivered and closed orders', function () {
    $this->travelTo(now()->setDate(2026, 10, 12)->startOfDay());
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    foreach ([
        [OrderStatus::Delivered, '2026-10-01', '2026-09-30'],
        [OrderStatus::Closed, '2026-10-31', null],
        [OrderStatus::Delivered, '2026-10-12', null],
        [OrderStatus::Delivered, '2026-09-30', '2026-10-12'],
        [OrderStatus::Closed, '2026-11-01', '2026-10-12'],
        [OrderStatus::Delivered, '2025-10-12', '2026-10-12'],
        [OrderStatus::Delivered, null, '2026-10-12'],
        [OrderStatus::Pending, '2026-10-12', '2026-10-12'],
        [OrderStatus::Cancelled, '2026-10-12', '2026-10-12'],
    ] as [$status, $deliveryDate, $invoiceDate]) {
        $order = Order::factory()->create([
            'status' => $status,
            'invoice_date' => $invoiceDate,
            'order_date' => now(),
        ]);
        $order->bdn()->create(['delivery_date' => $deliveryDate]);
    }
    Order::factory()->create(['status' => OrderStatus::Delivered, 'invoice_date' => now(), 'order_date' => now()]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.orders', 10)
            ->where('summary.completed', 3)
            ->missing('summary.conversionRate')
            ->missing('summary.completionRate'));
});

test('analytics total volume uses completed BDN deliveries only', function () {
    $this->travelTo(now()->setDate(2026, 10, 12)->startOfDay());
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $quantities = [
        'vlsfo_final_qty' => 0,
        'mgo_final_qty' => 0,
        'hsfo_final_qty' => 0,
        'vlsfo_bdn_qty' => null,
        'mgo_bdn_qty' => null,
        'hsfo_bdn_qty' => null,
    ];

    Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Pending,
        'order_date' => now()->subMonth(),
        'eta' => now(),
        'vlsfo_final_qty' => 10,
    ]);
    Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Pending,
        'order_date' => now(),
        'eta' => now()->subMonth(),
        'vlsfo_final_qty' => 100,
    ]);

    $delivered = Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subMonth(),
        'vlsfo_bdn_qty' => 20,
    ]);
    $delivered->bdn()->create(['delivery_date' => now()->toDateString()]);

    $closedThisMonth = Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Closed,
        'invoice_date' => now()->subMonth(),
        'vlsfo_bdn_qty' => 30,
    ]);
    $closedThisMonth->bdn()->create(['delivery_date' => now()->toDateString()]);

    $closed = Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Closed,
        'invoice_date' => now(),
        'vlsfo_bdn_qty' => 200,
    ]);
    $closed->bdn()->create(['delivery_date' => now()->subMonth()->toDateString()]);

    Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
        'vlsfo_bdn_qty' => 300,
    ]);
    Order::factory()->create([
        ...$quantities,
        'status' => OrderStatus::Cancelled,
        'eta' => now(),
        'vlsfo_final_qty' => 400,
    ]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.currentMonthVolume', 50));
});

test('enquiry funnel follows this months enquiries rather than independent order and invoice dates', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiries = Enquiry::factory()->count(4)->create(['created_at' => now()->startOfMonth()]);
    $previousEnquiry = Enquiry::factory()->create(['created_at' => now()->subMonth()]);

    foreach ([OrderStatus::Pending, OrderStatus::Delivered, OrderStatus::Closed] as $index => $status) {
        Order::factory()->create([
            'enquiry_id' => $enquiries[$index]->id,
            'status' => $status,
            'order_date' => now()->subMonth(),
            'invoice_date' => null,
        ]);
    }
    $completedOrder = Order::factory()->create([
        'enquiry_id' => $previousEnquiry->id,
        'status' => OrderStatus::Delivered,
        'order_date' => now(),
        'invoice_date' => now(),
    ]);
    $completedOrder->bdn()->create(['delivery_date' => now()->toDateString()]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('funnel.0.value', 8)
            ->where('funnel.0.displayValue', '8')
            ->where('funnel.1.value', 3)
            ->where('funnel.1.displayValue', '3')
            ->where('funnel.2.value', 2)
            ->where('funnel.2.displayValue', '2')
            ->where('summary.orders', 1)
            ->where('summary.completed', 1));
});

test('enquiry funnel counts cancelled conversions without treating them as completed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    $enquiry = Enquiry::factory()->create();
    Order::factory()->create(['enquiry_id' => $enquiry->id, 'status' => OrderStatus::Cancelled]);

    $this->get(route('reports.analytics'))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('funnel.0.value', 2)
            ->where('funnel.1.value', 1)
            ->where('funnel.2.value', 0));
});

test('report analytics includes enquiry to completed funnel counts', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create(['name' => 'Colombo']);
    $customer = Customer::factory()->create(['name' => 'Acme Marine']);
    $enquiries = Enquiry::factory()
        ->count(4)
        ->create(['port_id' => $port->id]);
    Enquiry::factory()->create([
        'port_id' => $port->id,
        'created_at' => now()->subMonth(),
    ]);

    $pendingOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[0]->id,
        'customer_id' => $customer->sap_id,
        'vessel_name' => 'MT Pending Star',
        'port_id' => $port->id,
        'status' => OrderStatus::Pending,
        'order_date' => now()->startOfMonth(),
        'eta' => now()->startOfMonth(),
        'vlsfo_final_qty' => 100,
        'mgo_final_qty' => 50,
        'hsfo_final_qty' => 0,
        'vlsfo_bdn_qty' => null,
        'mgo_bdn_qty' => null,
        'hsfo_bdn_qty' => null,
        'invoice_value' => 1000,
        'amount_received' => 250,
    ]);
    $deliveredOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[1]->id,
        'customer_id' => $customer->sap_id,
        'vessel_name' => 'MT Delivered Star',
        'port_id' => $port->id,
        'status' => OrderStatus::Delivered,
        'order_date' => now()->startOfMonth(),
        'invoice_date' => now()->startOfMonth(),
        'vlsfo_final_qty' => 0,
        'mgo_final_qty' => 0,
        'hsfo_final_qty' => 0,
        'vlsfo_bdn_qty' => 200,
        'mgo_bdn_qty' => 0,
        'hsfo_bdn_qty' => 25,
        'invoice_value' => 2000,
        'amount_received' => 2000,
    ]);
    $deliveredOrder->bdn()->create(['delivery_date' => now()->startOfMonth()->toDateString()]);
    $closedOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[2]->id,
        'customer_id' => $customer->sap_id,
        'port_id' => $port->id,
        'status' => OrderStatus::Closed,
        'order_date' => now()->startOfMonth(),
        'invoice_date' => now()->subMonth(),
        'vlsfo_final_qty' => 0,
        'mgo_final_qty' => 0,
        'hsfo_final_qty' => 0,
        'vlsfo_bdn_qty' => 999,
        'mgo_bdn_qty' => 0,
        'hsfo_bdn_qty' => 0,
        'invoice_value' => 3000,
        'amount_received' => 3000,
    ]);
    Order::factory()->create([
        'enquiry_id' => $enquiries[3]->id,
        'customer_id' => $customer->sap_id,
        'port_id' => $port->id,
        'status' => OrderStatus::Delivered,
        'order_date' => now()->subMonth(),
        'invoice_date' => now()->subMonth(),
        'invoice_value' => 5000,
    ]);
    Dispute::factory()->create([
        'order_id' => $pendingOrder->id,
        'dispute_status' => DisputeStatus::Open,
        'created_at' => now()->subMinute(),
    ]);
    Dispute::factory()->create([
        'order_id' => $deliveredOrder->id,
        'dispute_status' => DisputeStatus::Open,
        'created_at' => now(),
    ]);
    Dispute::factory()->create([
        'order_id' => $closedOrder->id,
        'dispute_status' => DisputeStatus::Closed,
    ]);

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.enquiries', 8)
            ->where('summary.orders', 3)
            ->where('summary.completed', 1)
            ->where('summary.currentMonthVolume', 225)
            ->where('monthlyProductVolumes.5.vlsfo', 300)
            ->where('monthlyProductVolumes.5.hsfo', 25)
            ->where('monthlyProductVolumes.5.mgo', 50)
            ->where('monthlyProductVolumes.5.total', 375)
            ->where('funnel.0.label', 'Enquiries')
            ->where('funnel.0.value', 8)
            ->where('funnel.1.label', 'Orders')
            ->where('funnel.1.value', 4)
            ->where('funnel.2.label', 'Completed')
            ->where('funnel.2.value', 3)
            ->where('portStatusMetrics.0.label', 'Colombo')
            ->where('portStatusMetrics.0.pendingDeliveries', 1)
            ->where('portStatusMetrics.0.completedDeliveries', 1)
            ->where('portStatusMetrics.0.pendingDisputes', 2)
            ->where('portStatusMetrics.0.total', 4)
            ->where('pendingDisputesByPort.0.label', 'Colombo')
            ->where('pendingDisputesByPort.0.count', 2)
            ->where('pendingDisputesByPort.0.disputes.0.customerName', 'Acme Marine')
            ->where('pendingDisputesByPort.0.disputes.0.vesselName', 'MT Delivered Star')
            ->where('pendingDisputesByPort.0.disputes.1.vesselName', 'MT Pending Star'));
});

test('product demand comparison is scoped to current month and same month last year sales', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $colombo = Port::factory()->create(['name' => 'Colombo']);
    $galle = Port::factory()->create(['name' => 'Galle']);
    $recentCustomer = Customer::factory()->create(['name' => 'Recent Customer']);
    $olderCustomer = Customer::factory()->create(['name' => 'Older Customer']);

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->startOfMonth(),
        'product_type' => ProductType::Bonded,
        'customer_id' => $recentCustomer->sap_id,
        'port_id' => $colombo->id,
        'invoice_value' => 1000,
        'vlsfo_bdn_qty' => 120,
        'mgo_bdn_qty' => 45,
        'hsfo_bdn_qty' => 0,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Closed,
        'invoice_date' => now()->endOfMonth(),
        'product_type' => ProductType::DutyPaid,
        'port_id' => $galle->id,
        'invoice_value' => 500,
        'vlsfo_bdn_qty' => 30,
        'mgo_bdn_qty' => 5,
        'hsfo_bdn_qty' => 70,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subMonth()->startOfMonth(),
        'customer_id' => $olderCustomer->sap_id,
        'port_id' => $galle->id,
        'invoice_value' => 9999,
        'vlsfo_bdn_qty' => 999,
        'mgo_bdn_qty' => 999,
        'hsfo_bdn_qty' => 999,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Pending,
        'invoice_date' => null,
        'port_id' => $galle->id,
        'invoice_value' => 8888,
        'vlsfo_bdn_qty' => 999,
        'mgo_bdn_qty' => 999,
        'hsfo_bdn_qty' => 999,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subYear()->startOfMonth(),
        'product_type' => ProductType::Bonded,
        'port_id' => $colombo->id,
        'invoice_value' => 700,
        'vlsfo_bdn_qty' => 77,
    ]);

    $currentMonthIndex = now()->month - 1;
    $currentMonthPath = "cyLyProductSales.0.months.{$currentMonthIndex}";

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('productDemandComparison.0.label', 'VLSFO')
            ->where('productDemandComparison.0.current.total', 150)
            ->where('productDemandComparison.0.current.rebond', 120)
            ->where('productDemandComparison.0.lastYear.total', 77)
            ->where('productDemandComparison.0.lastYear.rebond', 77)
            ->where('productDemandComparison.1.label', 'MGO')
            ->where('productDemandComparison.1.current.total', 50)
            ->where('productDemandComparison.1.current.rebond', 45)
            ->where('productDemandComparison.2.label', 'HSFO')
            ->where('productDemandComparison.2.current.total', 70)
            ->where('productDemandComparison.2.current.rebond', 0)
            ->where('productDemandByPort.0.label', 'Colombo')
            ->where('productDemandByPort.0.data.0.current.total', 120)
            ->where('productDemandByPort.0.data.0.lastYear.total', 77)
            ->where('productDemandByPort.1.label', 'Galle')
            ->where('productDemandByPort.1.data.0.current.total', 30)
            ->where('topCustomers.0.label', 'Recent Customer')
            ->where('topCustomers.0.value', 1000)
            ->where('cyLyProductSales.0.label', 'VLSFO')
            ->where("{$currentMonthPath}.currentYear", 150)
            ->where("{$currentMonthPath}.lastYear", 77));
});
