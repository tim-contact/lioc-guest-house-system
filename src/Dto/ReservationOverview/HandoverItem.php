<?php

declare(strict_types=1);

namespace App\Dto\ReservationOverview;

/**
 * Describes a derived operational prompt for the daily handover.
 */
final class HandoverItem
{
    public function __construct(
        public readonly string $type,
        public readonly string $roomNumber,
        public readonly ?string $guestName = null,
    ) {
    }
}
