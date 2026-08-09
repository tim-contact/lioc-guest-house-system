<?php

namespace App\Enums;

enum QualityClaim: string
{
    case FourteenDays = '14_days';
    case ThirtyDays = '30_days';

    public function label(): string
    {
        return match ($this) {
            self::FourteenDays => '14 days',
            self::ThirtyDays => '30 days',
        };
    }
}
