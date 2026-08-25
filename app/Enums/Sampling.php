<?php

namespace App\Enums;

enum Sampling: string
{
    case BargeManifold = 'barge_manifold';
    case VesselManifold = 'vessel_manifold';

    public function label(): string
    {
        return match ($this) {
            self::BargeManifold => 'Barge Manifold',
            self::VesselManifold => 'Vessel Manifold',
        };
    }
}
