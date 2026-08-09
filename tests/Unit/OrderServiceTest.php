<?php

use App\Services\OrderService;

test('formatQtyRange joins both bounds', function () {
    expect(OrderService::formatQtyRange(1000, 2000))->toBe('1000 - 2000');
});

test('formatQtyRange returns the single bound when one side is missing', function () {
    expect(OrderService::formatQtyRange(1000, null))->toBe('1000');
    expect(OrderService::formatQtyRange(null, 2000))->toBe('2000');
});

test('formatQtyRange returns null when both bounds are missing', function () {
    expect(OrderService::formatQtyRange(null, null))->toBeNull();
});
