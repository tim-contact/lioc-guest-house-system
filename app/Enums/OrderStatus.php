<?php

namespace App\Enums;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Closed = 'closed';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /**
     * Statuses for orders still awaiting delivery.
     *
     * @return array<OrderStatus>
     */
    public static function pendingStatuses(): array
    {
        return [self::Pending];
    }

    /**
     * Statuses for orders shown in the completed history.
     *
     * @return array<OrderStatus>
     */
    public static function completedStatuses(): array
    {
        return [self::Delivered];
    }
}
