<?php

namespace App\Enums;

enum EnquiryCustomerStatus: string
{
    case Pending = 'pending';
    case Fixed = 'fixed';
    case Lost = 'lost';
}
