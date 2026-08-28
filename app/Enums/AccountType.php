<?php

namespace App\Enums;

enum AccountType: string
{
    case FCBU = 'fcbu';
    case DBU = 'dbu';

    /**
     * Return a human-readable label for the enum case.
     */
    public function label(): string
    {
        return match ($this) {
            self::FCBU => 'FCBU',
            self::DBU => 'DBU',
        };
    }
}
