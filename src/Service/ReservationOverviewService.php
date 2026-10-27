<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\ReservationOverview\ArrivalItem;
use App\Dto\ReservationOverview\HandoverItem;
use App\Dto\ReservationOverview\HousekeepingRoom;
use App\Dto\ReservationOverview\ReservationOverview;
use App\Entity\Reservation;
use App\Entity\RoomDayStatus;
use App\Entity\Subsidiary;

/**
 * Builds the live metrics and operational briefing beside the reservation ledger.
 */
final class ReservationOverviewService
{
    public function __construct(
        private readonly HousekeepingViewService $housekeepingViewService,
        private readonly FrontdeskViewService $frontdeskViewService,
        private readonly ReservationNameResolver $reservationNameResolver,
    ) {
    }

    /**
     * Combine the established housekeeping and front-desk views for one date.
     */
    public function build(\DateTimeImmutable $date, ?Subsidiary $subsidiary): ReservationOverview
    {
        $rangeView = $this->housekeepingViewService->buildRangeView(
            $date,
            $date,
            $subsidiary,
            $this->housekeepingViewService->getAllowedOccupancyTypes(),
        );
        $rows = $rangeView['dayViews'][$date->format('Y-m-d')]['rows'] ?? [];
        $frontdeskArrivals = $this->frontdeskViewService->buildItems($rows, $date, ['arrival']);

        $arrivals = [];
        foreach ($frontdeskArrivals as $item) {
            $reservation = $item['reservation'] ?? null;
            $apartment = $item['apartment'] ?? null;
            if (!$reservation instanceof Reservation || null === $apartment) {
                continue;
            }

            $arrivals[] = new ArrivalItem(
                reservationId: (int) $reservation->getId(),
                guestName: $this->reservationNameResolver->resolve($reservation),
                roomNumber: (string) $apartment->getNumber(),
                guestCount: (int) $reservation->getPersons(),
                statusName: (string) ($reservation->getReservationStatus()?->getName() ?? ''),
            );
        }

        $inHouseCount = 0;
        $availableCount = 0;
        $housekeepingRooms = [];
        $handoverItems = [];
        $handoverKeys = [];

        foreach ($rows as $row) {
            $apartment = $row['apartment'];
            $occupancyType = (string) $row['occupancyType'];
            $status = $row['status'] ?? null;
            $statusValue = $status instanceof RoomDayStatus ? $status->getHkStatus()->value : null;

            if (in_array($occupancyType, ['ARRIVAL', 'STAYOVER', 'TURNOVER'], true)) {
                ++$inHouseCount;
            }
            if (in_array($occupancyType, ['FREE', 'DEPARTURE'], true)) {
                ++$availableCount;
            }

            $housekeepingRooms[] = new HousekeepingRoom(
                roomNumber: (string) $apartment->getNumber(),
                roomType: (string) ($apartment->getRoomCategory()?->getName() ?? $apartment->getDescription()),
                occupancyType: $occupancyType,
                housekeepingStatus: $statusValue,
            );

            if (in_array($occupancyType, ['DEPARTURE', 'TURNOVER'], true)
                && !in_array($statusValue, ['CLEANED', 'INSPECTED'], true)) {
                $key = 'prepare-'.$apartment->getId();
                $handoverKeys[$key] = true;
                $handoverItems[] = new HandoverItem('prepare', (string) $apartment->getNumber());
            } elseif (in_array($statusValue, ['OPEN', 'IN_PROGRESS'], true)) {
                $key = 'housekeeping-'.$apartment->getId();
                $handoverKeys[$key] = true;
                $handoverItems[] = new HandoverItem('housekeeping', (string) $apartment->getNumber());
            }
        }

        foreach ($arrivals as $arrival) {
            $key = 'arrival-'.$arrival->reservationId;
            if (!isset($handoverKeys[$key])) {
                $handoverItems[] = new HandoverItem('arrival', $arrival->roomNumber, $arrival->guestName);
            }
        }

        return new ReservationOverview(
            date: $date,
            subsidiary: $subsidiary,
            roomCount: count($rows),
            inHouseCount: $inHouseCount,
            availableCount: $availableCount,
            arrivingCount: count($arrivals),
            arrivals: $arrivals,
            housekeepingRooms: $housekeepingRooms,
            handoverItems: $handoverItems,
        );
    }
}
