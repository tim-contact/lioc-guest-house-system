<?php

namespace App\Enums;

enum DeliveryMode: string
{
    case Barge = 'barge';
    case Truck = 'truck';
    case Pipeline = 'pipeline';
}
