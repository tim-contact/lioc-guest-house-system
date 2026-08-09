<?php

namespace App\Enums;

enum SamplingMethod: string
{
    case Manifold = 'manifold';
    case ContinuousDrip = 'continuous_drip';
    case Running = 'running';
    case Others = 'others';
}
