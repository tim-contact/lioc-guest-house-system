<?php

namespace App\Enums;

enum CreditTerms: string
{
    case Days30 = '30_days';
    case Days14 = '14_days';
    case Cia = 'cia';
    case Cod = 'cod';

    /**
     * Number of days after invoicing that payment falls due.
     */
    public function days(): int
    {
        return match ($this) {
            self::Days30 => 30,
            self::Days14 => 14,
            self::Cia, self::Cod => 0,
        };
    }
}
