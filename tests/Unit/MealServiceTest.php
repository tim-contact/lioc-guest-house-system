<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\Customer;
use App\Entity\Appartment;
use App\Entity\InvoicePosition;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\ReservationStatus;
use App\Entity\Subsidiary;
use App\Repository\MealOrderRepository;
use App\Service\MealService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

/** Covers guest membership, dates, duplicate prevention and billing safeguards. */
final class MealServiceTest extends TestCase
{
    public function testRecordsGuestMealAndRetainsOriginalMenuPrice(): void
    {
        [$reservation, $guest, $option, $service] = $this->sample();
        $order = $service->record($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 2);
        $option->update('Changed', 'Lunch', 200000, 'LKR', '0', true);

        self::assertSame('Veg lunch', $order->getItemName());
        self::assertSame(150000, $order->getUnitPriceMinor());
        self::assertSame(2, $order->getQuantity());
    }

    public function testRejectsGuestOutsideReservation(): void
    {
        [$reservation, , $option, $service] = $this->sample();
        $this->expectExceptionMessage('meals.error.guest_invalid');
        $service->record($reservation, new Customer(), $option, new \DateTimeImmutable('2026-11-02'), 1);
    }

    public function testRejectsMealOutsideStay(): void
    {
        [$reservation, $guest, $option, $service] = $this->sample();
        $this->expectExceptionMessage('meals.error.date_outside_stay');
        $service->record($reservation, $guest, $option, new \DateTimeImmutable('2026-11-05'), 1);
    }

    public function testRejectsDuplicateOrder(): void
    {
        [$reservation, $guest, $option] = $this->sample();
        $orders = $this->createStub(MealOrderRepository::class);
        $orders->method('findActiveDuplicate')->willReturn(new MealOrder($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 1));
        $service = new MealService($this->entityManager(), $orders);
        $this->expectExceptionMessage('meals.error.duplicate');
        $service->record($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 1);
    }

    public function testCannotCancelAnInvoicedMeal(): void
    {
        [$reservation, $guest, $option] = $this->sample();
        $order = new MealOrder($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 1);
        $order->markInvoiced(new InvoicePosition());
        $this->expectExceptionMessage('meals.error.already_invoiced');
        $order->cancel();
    }

    public function testSummaryExcludesCancelledAndInvalidMeals(): void
    {
        [$reservation, $guest, $option, $service] = $this->sample();
        $valid = new MealOrder($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 2);
        $cancelled = new MealOrder($reservation, $guest, $option, new \DateTimeImmutable('2026-11-02'), 1);
        $cancelled->cancel();
        $invalid = new MealOrder($reservation, $guest, $option, new \DateTimeImmutable('2026-11-05'), 1);

        $summary = $service->summarize([$valid, $cancelled, $invalid]);

        self::assertCount(1, $summary);
        self::assertSame(2, $summary[0]['quantity']);
        self::assertSame(300000, $summary[0]['totalMinor']);
    }

    /** @return array{Reservation, Customer, MealOption, MealService} */
    private function sample(): array
    {
        $guest = new Customer();
        $reservation = new Reservation();
        $property = new Subsidiary();
        $property->setId(1);
        $room = new Appartment();
        $room->setObject($property);
        $reservation->setAppartment($room);
        $reservation->setStartDate(new \DateTime('2026-11-01'));
        $reservation->setEndDate(new \DateTime('2026-11-04'));
        $reservation->setReservationStatus(new ReservationStatus());
        $reservation->addCustomer($guest);
        $option = new MealOption('Veg lunch', 'Lunch', 150000, 'LKR', '0', true);

        return [$reservation, $guest, $option, new MealService($this->entityManager(), $this->createStub(MealOrderRepository::class))];
    }

    private function entityManager(): EntityManagerInterface
    {
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('wrapInTransaction')->willReturnCallback(static fn (callable $callback): mixed => $callback($em));

        return $em;
    }
}
