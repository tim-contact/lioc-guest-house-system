<?php

namespace App\Enums;

enum EnquiryStatus: string
{
    case Open = 'open';
    case Completing = 'completing';
    case Won = 'won';
    case Lost = 'lost';

    /**
     * Statuses for enquiries that are still in progress.
     *
     * @return array<EnquiryStatus>
     */
    public static function activeStatuses(): array
    {
        return [self::Open, self::Completing];
    }
}
