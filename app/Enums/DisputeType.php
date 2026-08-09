<?php

namespace App\Enums;

enum DisputeType: string
{
    case QualitySulphur = 'quality_sulphur';
    case QualityTsp = 'quality_tsp';
    case QualityDensity = 'quality_density';
    case QualityViscosity = 'quality_viscosity';
    case QualityAlSi = 'quality_al_si';
    case QualityWater = 'quality_water';
    case Quantity = 'quantity';
    case DelayClaim = 'delay_claim';

    public function label(): string
    {
        return match ($this) {
            self::QualitySulphur => 'Quality_Sulphur',
            self::QualityTsp => 'Quality_TSP',
            self::QualityDensity => 'Quality_Density',
            self::QualityViscosity => 'Quality_Viscosity',
            self::QualityAlSi => 'Quality_Al+Si',
            self::QualityWater => 'Quality_Water',
            self::Quantity => 'Quantity',
            self::DelayClaim => 'Delay Claim',
        };
    }
}
