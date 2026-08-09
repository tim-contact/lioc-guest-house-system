<?php

namespace App\Enums;

enum ProposedActionPlan: string
{
    case Testing = 'testing';
    case SettlementCreditNote = 'settlement_credit_note';
    case SettlementDebitNote = 'settlement_debit_note';
    case WriteOff = 'write_off';

    public function label(): string
    {
        return match ($this) {
            self::Testing => 'Testing',
            self::SettlementCreditNote => 'Settlement - Credit Note',
            self::SettlementDebitNote => 'Settlement - Debit Note',
            self::WriteOff => 'Write Off',
        };
    }
}
