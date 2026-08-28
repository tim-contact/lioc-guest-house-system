<?php

use App\Enums\DisputeStatus;
use App\Enums\OrderStatus;
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
            ->has('productMix', 3));
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
