<?php

declare(strict_types=1);

namespace App\Dto\ReservationOverview;

/**
 * Carries the current occupancy and housekeeping state for one room.
 */
final class HousekeepingRoom
{
    public function __construct(
        public readonly string $roomNumber,
        public readonly string $roomType,
        public readonly string $occupancyType,
        public readonly ?string $housekeepingStatus,
    ) {
    }
}
