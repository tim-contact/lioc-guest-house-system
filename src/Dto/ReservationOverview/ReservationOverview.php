<?php

declare(strict_types=1);

namespace App\Dto\ReservationOverview;

use App\Entity\Subsidiary;

/**
 * Immutable view model for the operational reservation overview.
 */
final class ReservationOverview
{
    /**
     * @param list<ArrivalItem>      $arrivals
     * @param list<HousekeepingRoom> $housekeepingRooms
     * @param list<HandoverItem>     $handoverItems
     */
    public function __construct(
        public readonly \DateTimeImmutable $date,
        public readonly ?Subsidiary $subsidiary,
        public readonly int $roomCount,
        public readonly int $inHouseCount,
        public readonly int $availableCount,
        public readonly int $arrivingCount,
        public readonly array $arrivals,
        public readonly array $housekeepingRooms,
        public readonly array $handoverItems,
    ) {
    }
}
