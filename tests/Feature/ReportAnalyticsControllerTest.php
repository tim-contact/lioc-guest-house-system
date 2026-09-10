<?php

use App\Enums\DisputeStatus;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('super admins can view report analytics', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('reports/analytics')
            ->has('summary')
            ->has('funnel', 3)
            ->has('portStatusMetrics')
            ->has('monthlyTrend', 6)
            ->has('topPorts')
            ->has('topCustomers')
            ->has('productMix', 3)
            ->has('rebondProductMix', 3)
            ->has('cyLyProductSales', 3)
            ->has('cyLyProductSales.0.months', 12));
});

test('report analytics includes enquiry to completed funnel counts', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $port = Port::factory()->create(['name' => 'Colombo']);
    $customer = Customer::factory()->create(['name' => 'Acme Marine']);
    $enquiries = Enquiry::factory()
        ->count(4)
        ->create(['port_id' => $port->id]);

    $pendingOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[0]->id,
        'customer_id' => $customer->sap_id,
        'port_id' => $port->id,
        'status' => OrderStatus::Pending,
        'invoice_value' => 1000,
        'amount_received' => 250,
    ]);
    $deliveredOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[1]->id,
        'customer_id' => $customer->sap_id,
        'port_id' => $port->id,
        'status' => OrderStatus::Delivered,
        'invoice_value' => 2000,
        'amount_received' => 2000,
    ]);
    $closedOrder = Order::factory()->create([
        'enquiry_id' => $enquiries[2]->id,
        'customer_id' => $customer->sap_id,
        'port_id' => $port->id,
        'status' => OrderStatus::Closed,
        'invoice_value' => 3000,
        'amount_received' => 3000,
    ]);
    Dispute::factory()->create([
        'order_id' => $pendingOrder->id,
        'dispute_status' => DisputeStatus::Open,
    ]);
    Dispute::factory()->create([
        'order_id' => $deliveredOrder->id,
        'dispute_status' => DisputeStatus::Open,
    ]);
    Dispute::factory()->create([
        'order_id' => $closedOrder->id,
        'dispute_status' => DisputeStatus::Closed,
    ]);

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('summary.enquiries', 7)
            ->where('summary.orders', 3)
            ->where('summary.completed', 2)
            ->where('summary.conversionRate', 42.9)
            ->where('summary.completionRate', 66.7)
            ->where('funnel.0.label', 'Enquiries')
            ->where('funnel.0.value', 7)
            ->where('funnel.1.label', 'Orders')
            ->where('funnel.1.value', 3)
            ->where('funnel.2.label', 'Completed')
            ->where('funnel.2.value', 2)
            ->where('portStatusMetrics.0.label', 'Colombo')
            ->where('portStatusMetrics.0.pendingDeliveries', 1)
            ->where('portStatusMetrics.0.completedDeliveries', 2)
            ->where('portStatusMetrics.0.pendingDisputes', 2)
            ->where('portStatusMetrics.0.total', 5));
});

test('product mix is scoped to current month sales', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->startOfMonth(),
        'product_type' => ProductType::Bonded,
        'invoice_value' => 1000,
        'vlsfo_bdn_qty' => 120,
        'mgo_bdn_qty' => 45,
        'hsfo_bdn_qty' => 0,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Closed,
        'invoice_date' => now()->endOfMonth(),
        'product_type' => ProductType::DutyPaid,
        'invoice_value' => 500,
        'vlsfo_bdn_qty' => 30,
        'mgo_bdn_qty' => 5,
        'hsfo_bdn_qty' => 70,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subMonth()->startOfMonth(),
        'invoice_value' => 9999,
        'vlsfo_bdn_qty' => 999,
        'mgo_bdn_qty' => 999,
        'hsfo_bdn_qty' => 999,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Pending,
        'invoice_date' => now()->startOfMonth(),
        'invoice_value' => 8888,
        'vlsfo_bdn_qty' => 999,
        'mgo_bdn_qty' => 999,
        'hsfo_bdn_qty' => 999,
    ]);

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now()->subYear()->startOfMonth(),
        'invoice_value' => 700,
        'vlsfo_bdn_qty' => 77,
    ]);

    $currentMonthIndex = now()->month - 1;
    $currentMonthPath = "cyLyProductSales.0.months.{$currentMonthIndex}";

    $this->get(route('reports.analytics'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('productMix.0.label', 'VLSFO')
            ->where('productMix.0.value', 150)
            ->where('productMix.1.label', 'MGO')
            ->where('productMix.1.value', 50)
            ->where('productMix.2.label', 'HSFO')
            ->where('productMix.2.value', 70)
            ->where('rebondProductMix.0.label', 'VLSFO')
            ->where('rebondProductMix.0.value', 120)
            ->where('rebondProductMix.1.label', 'MGO')
            ->where('rebondProductMix.1.value', 45)
            ->where('rebondProductMix.2.label', 'HSFO')
            ->where('rebondProductMix.2.value', 0)
            ->where('cyLyProductSales.0.label', 'VLSFO')
            ->where("{$currentMonthPath}.currentYear", 150)
            ->where("{$currentMonthPath}.lastYear", 77));
});
