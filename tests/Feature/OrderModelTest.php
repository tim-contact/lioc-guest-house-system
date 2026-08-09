<?php

use App\Enums\DeliveryMode;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Models\Order;

it('persists an order with the flattened per-product columns', function () {
    $order = Order::factory()->create();

    expect($order->exists)->toBeTrue();

    $this->assertDatabaseHas('orders', [
        'id' => $order->id,
        'order_number' => $order->order_number,
    ]);

    expect($order->vlsfo_qty_range)->toBeString()->toContain(' - ');
});

it('casts status, product type and delivery mode to enums', function () {
    $order = Order::factory()->create([
        'status' => OrderStatus::Pending,
        'product_type' => ProductType::Bonded,
        'delivery_mode' => DeliveryMode::Barge,
    ]);

    expect($order->status)->toBe(OrderStatus::Pending)
        ->and($order->product_type)->toBe(ProductType::Bonded)
        ->and($order->delivery_mode)->toBe(DeliveryMode::Barge);
});

it('computes balance amount as invoice value less amount received', function () {
    $order = Order::factory()->create([
        'invoice_value' => 1000,
        'amount_received' => 300,
    ]);

    expect($order->balance_amount)->toBe(700.0)
        ->and($order->toArray())->toHaveKey('balance_amount', 700.0);
});
