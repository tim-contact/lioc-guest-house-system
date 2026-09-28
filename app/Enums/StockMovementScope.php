<?php

namespace App\Enums;

enum StockMovementScope: string
{
    case Terminal = 'terminal';
    case Barge = 'barge';

    public function label(): string
    {
        return match ($this) {
            self::Terminal => 'Terminal',
            self::Barge => 'Barge',
        };
    }
}
