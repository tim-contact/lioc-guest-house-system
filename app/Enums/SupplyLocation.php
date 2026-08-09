<?php

namespace App\Enums;

enum SupplyLocation: string
{
    case Berth = 'berth';
    case Anchorage = 'anchorage';
    case Opl = 'opl';

    public function label(): string
    {
        return match ($this) {
            self::Berth => 'Berth',
            self::Anchorage => 'Anchorage',
            self::Opl => 'OPL',
        };
    }
}
