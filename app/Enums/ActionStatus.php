<?php

namespace App\Enums;

enum ActionStatus: string
{
    case TestingPlanned = 'testing_planned';
    case TestingDone = 'testing_done';
    case BalancePaymentReceived = 'balance_payment_received';
    case WriteOffApprovalReceived = 'write_off_approval_received';
    case CreditNoteIssued = 'credit_note_issued';
}
