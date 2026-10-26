<?php

namespace App\Enums;

enum CreditTerms: string
{
    case Days7 = '7_days';
    case Days14 = '14_days';
    case Days30 = '30_days';
    case Days45 = '45_days';
    case Days60 = '60_days';
    case Cia = 'cia';
    case Cod = 'cod';

    public function label(): string
    {
        return match ($this) {
            self::Days7 => '7 Days',
            self::Days14 => '14 Days',
            self::Days30 => '30 Days',
            self::Days45 => '45 Days',
            self::Days60 => '60 Days',
            self::Cia => 'CIA',
            self::Cod => 'COD',
        };
    }

    /**
     * Number of days after invoicing that payment falls due.
     */
    public function days(): int
    {
        return match ($this) {
            self::Days7 => 7,
            self::Days14 => 14,
            self::Days30 => 30,
            self::Days45 => 45,
            self::Days60 => 60,
            self::Cia, self::Cod => 0,
        };
    }

    public function isCashPayment(): bool
    {
        return in_array($this, [self::Cia, self::Cod], true);
    }
}
