<?php

namespace App\Enums;

enum PaymentType: string
{
    case Regular = 'regular';
    case CreditNote = 'credit_note';
    case WriteOffApproved = 'write_off_approved';
}
