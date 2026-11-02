<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\AppSettings;
use App\Entity\Appartment;
use App\Entity\Customer;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\ReservationStatus;
use App\Entity\Subsidiary;
use App\Repository\MealOrderRepository;
use App\Service\AppSettingsService;
use App\Service\MealBillingService;
use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

/** Covers invoice lines and prevents stale or repeated meal billing. */
final class MealBillingServiceTest extends TestCase
{
    public function testBuildsAndClaimsMealLineOnlyOnce(): void
    {
        [$order, $service] = $this->sample();
        $position = $service->buildPositions([42])[0];
        self::assertSame(2, $position->getAmount());
        self::assertSame('1500.00', $position->getPrice());
        self::assertSame('Veg lunch · 2026-11-02', $position->getDescription());

        $service->claimPositions([$position], [42]);
        self::assertSame($position, $order->getInvoicePosition());
        $this->expectExceptionMessage('meals.error.invoice_changed');
        $service->claimPositions([$position], [42]);
    }

    public function testRejectsChangedInvoiceLine(): void
    {
        [, $service] = $this->sample();
        $position = $service->buildPositions([42])[0];
        $position->setAmount(3);
        $this->expectExceptionMessage('meals.error.invoice_changed');
        $service->claimPositions([$position], [42]);
    }

    public function testRejectsMismatchedCurrency(): void
    {
        [, $service] = $this->sample('EUR');
        $this->expectExceptionMessage('meals.error.invoice_configuration');
        $service->buildPositions([42]);
    }

    public function testRejectsMealWhenReservationDatesChange(): void
    {
        [$order, $service] = $this->sample();
        $order->getReservation()->setStartDate(new \DateTime('2026-11-03'));
        $this->expectExceptionMessage('meals.error.reservation_changed');
        $service->buildPositions([42]);
    }

    public function testRejectsMealWhenReservationMovesToAnotherProperty(): void
    {
        [$order, $service] = $this->sample();
        $otherProperty = new Subsidiary();
        $otherProperty->setId(2);
        $room = $order->getReservation()->getAppartment();
        self::assertInstanceOf(Appartment::class, $room);
        $room->setObject($otherProperty);
        $this->expectExceptionMessage('meals.error.reservation_changed');
        $service->buildPositions([42]);
    }

    public function testRejectsDuplicateLinesInTheSameInvoice(): void
    {
        [, $service] = $this->sample();
        $position = $service->buildPositions([42])[0];
        $this->expectExceptionMessage('meals.error.invoice_changed');
        $service->claimPositions([$position, $position], [42]);
    }

    public function testCheckedOutReservationCanStillBeBilled(): void
    {
        [$order, $service] = $this->sample();
        $order->getReservation()->getReservationStatus()->setIsBlocking(false);

        self::assertCount(1, $service->buildPositions([42]));
    }

    public function testCancelledReservationCannotBeBilled(): void
    {
        [$order, $service] = $this->sample();
        $order->getReservation()->getReservationStatus()->setCode(ReservationStatus::CODE_CANCELED_NOSHOW);
        $this->expectExceptionMessage('meals.error.reservation_changed');
        $service->buildPositions([42]);
    }

    /** @return array{MealOrder, MealBillingService} */
    private function sample(string $invoiceCurrency = 'LKR'): array
    {
        $reservation = new Reservation();
        $reservation->setId(42);
        $reservation->setStartDate(new \DateTime('2026-11-01'));
        $reservation->setEndDate(new \DateTime('2026-11-04'));
        $reservation->setReservationStatus(new ReservationStatus());
        $property = new Subsidiary();
        $property->setId(1);
        $room = new Appartment();
        $room->setObject($property);
        $reservation->setAppartment($room);
        $guest = new Customer();
        $reservation->addCustomer($guest);
        $order = new MealOrder($reservation, $guest, new MealOption('Veg lunch', 'Lunch', 150000, 'LKR', '0', true), new \DateTimeImmutable('2026-11-02'), 2);
        $order->setId(7);
        $repository = $this->createStub(MealOrderRepository::class);
        $repository->method('findUnbilledForReservations')->willReturn([$order]);
        $repository->method('find')->willReturn($order);
        $connection = $this->createStub(Connection::class);
        $connection->method('isTransactionActive')->willReturn(true);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('getConnection')->willReturn($connection);
        $settings = $this->createStub(AppSettingsService::class);
        $settings->method('getSettings')->willReturn((new AppSettings())->setCurrency($invoiceCurrency));

        return [$order, new MealBillingService($em, $repository, $settings)];
    }
}
