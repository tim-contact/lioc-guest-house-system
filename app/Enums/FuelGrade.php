<?php

namespace App\Enums;

/**
 * Fuel grades, each backed by its own `{grade}_` prefixed columns on
 * enquiries, enquiry_customers, orders, barges and bdns.
 */
enum FuelGrade: string
{
    case Vlsfo = 'vlsfo';
    case Mgo = 'mgo';
    case Hsfo = 'hsfo';

    public function label(): string
    {
        return match ($this) {
            self::Vlsfo => 'VLSFO',
            self::Mgo => 'MGO',
            self::Hsfo => 'HSFO',
        };
    }

    /**
     * The column prefixes, for building `{grade}_{field}` rule and cast arrays.
     *
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_column(self::cases(), 'value');
    }
}
