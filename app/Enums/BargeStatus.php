<?php

namespace App\Enums;

enum BargeStatus: string
{
    case Available = 'available';
    case Operating = 'operating';
    case Maintenance = 'maintenance';
    case OutOfService = 'out_of_service';
}
