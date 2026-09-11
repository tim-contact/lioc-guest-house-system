<?php

namespace App\Enums;

enum SupplyLocationType: string
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

    public function isNonBerthOperation(): bool
    {
        return in_array($this, [self::Anchorage, self::Opl], true);
    }
}
