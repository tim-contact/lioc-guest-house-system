<?php

declare(strict_types=1);

namespace App\Dto\ReservationOverview;

/**
 * Represents one arrival shown in the reservation overview briefing.
 */
final class ArrivalItem
{
    public function __construct(
        public readonly int $reservationId,
        public readonly string $guestName,
        public readonly string $roomNumber,
        public readonly int $guestCount,
        public readonly string $statusName,
    ) {
    }
}
