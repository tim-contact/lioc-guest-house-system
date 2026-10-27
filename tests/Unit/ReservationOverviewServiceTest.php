<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Appartment;
use App\Entity\Reservation;
use App\Entity\ReservationStatus;
use App\Entity\RoomCategory;
use App\Service\FrontdeskViewService;
use App\Service\HousekeepingViewService;
use App\Service\ReservationNameResolver;
use App\Service\ReservationOverviewService;
use PHPUnit\Framework\TestCase;

/**
 * Verifies the operational metrics assembled for the reservation overview.
 */
final class ReservationOverviewServiceTest extends TestCase
{
    public function testBuildUsesLiveOccupancyAndArrivalRows(): void
    {
        $date = new \DateTimeImmutable('2026-10-22');
        $arrivalRoom = $this->room(1, 'COL-01', 'Double Occupancy');
        $freeRoom = $this->room(2, 'COL-02', 'Double Occupancy');
        $blockedRoom = $this->room(3, 'COL-04', 'Single Occupancy');

        $rows = [
            ['apartment' => $arrivalRoom, 'occupancyType' => 'ARRIVAL', 'status' => null, 'apartmentReservations' => []],
            ['apartment' => $freeRoom, 'occupancyType' => 'FREE', 'status' => null, 'apartmentReservations' => []],
            ['apartment' => $blockedRoom, 'occupancyType' => 'BLOCKED', 'status' => null, 'apartmentReservations' => []],
        ];

        $housekeeping = $this->createMock(HousekeepingViewService::class);
        $housekeeping->method('getAllowedOccupancyTypes')->willReturn(['FREE', 'ARRIVAL', 'BLOCKED']);
        $housekeeping->method('buildRangeView')->willReturn([
            'dayViews' => ['2026-10-22' => ['rows' => $rows]],
        ]);

        $reservation = $this->createMock(Reservation::class);
        $reservation->method('getId')->willReturn(42);
        $reservation->method('getPersons')->willReturn(2);
        $status = (new ReservationStatus())->setName('Approved');
        $reservation->method('getReservationStatus')->willReturn($status);

        $frontdesk = $this->createMock(FrontdeskViewService::class);
        $frontdesk->expects(self::once())
            ->method('buildItems')
            ->willReturnCallback(static function (array $actualRows, \DateTimeImmutable $actualDate, array $categories) use ($rows, $date, $reservation, $arrivalRoom): array {
                self::assertSame($rows, $actualRows);
                self::assertSame($date, $actualDate);
                self::assertSame(['arrival'], $categories);

                return [['reservation' => $reservation, 'apartment' => $arrivalRoom]];
            });

        $nameResolver = $this->createMock(ReservationNameResolver::class);
        $nameResolver->method('resolve')->willReturnCallback(static function (Reservation $actual) use ($reservation): string {
            self::assertSame($reservation, $actual);

            return 'Raut Prashant';
        });

        $overview = (new ReservationOverviewService($housekeeping, $frontdesk, $nameResolver))->build($date, null);

        self::assertSame(3, $overview->roomCount);
        self::assertSame(1, $overview->inHouseCount);
        self::assertSame(1, $overview->availableCount);
        self::assertSame(1, $overview->arrivingCount);
        self::assertSame('COL-01', $overview->arrivals[0]->roomNumber);
        self::assertSame('arrival', $overview->handoverItems[0]->type);
    }

    private function room(int $id, string $number, string $type): Appartment
    {
        $category = $this->createMock(RoomCategory::class);
        $category->method('getName')->willReturn($type);

        $room = $this->createMock(Appartment::class);
        $room->method('getId')->willReturn($id);
        $room->method('getNumber')->willReturn($number);
        $room->method('getRoomCategory')->willReturn($category);

        return $room;
    }
}
