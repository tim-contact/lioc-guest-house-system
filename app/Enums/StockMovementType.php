<?php

namespace App\Enums;

enum StockMovementType: string
{
    case Opening = 'opening';
    case Loading = 'loading';
    case BargeTransfer = 'barge_transfer';
    case RebondTransfer = 'rebond_transfer';
    case DeadStock = 'dead_stock';
    case Adjustment = 'adjustment';

    public function label(): string
    {
        return match ($this) {
            self::Opening => 'Opening Stock',
            self::Loading => 'Loading',
            self::BargeTransfer => 'Barge Transfer',
            self::RebondTransfer => 'Re-bond Sale',
            self::DeadStock => 'Dead Stock',
            self::Adjustment => 'Adjustment',
        };
    }
}
