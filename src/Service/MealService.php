<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Customer;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Repository\MealOrderRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

/** Validates and records guest meal orders and menu changes. */
final class MealService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MealOrderRepository $orders,
    ) {
    }

    /** Record one guest's meal; reservation locking prevents concurrent duplicate submissions. */
    public function record(Reservation $reservation, Customer $guest, MealOption $option, \DateTimeImmutable $date, int $quantity): MealOrder
    {
        return $this->em->wrapInTransaction(function () use ($reservation, $guest, $option, $date, $quantity): MealOrder {
            $this->em->refresh($reservation, LockMode::PESSIMISTIC_WRITE);
            $this->em->refresh($option, LockMode::PESSIMISTIC_WRITE);
            $status = $reservation->getReservationStatus();
            if (null === $reservation->getAppartment() || null === $status || $status->isCancelled() || $reservation->isConflict() || $reservation->isConflictIgnored()) {
                throw new \InvalidArgumentException('meals.error.reservation_inactive');
            }
            if ($reservation->getBooker() !== $guest && !$reservation->getCustomers()->contains($guest)) {
                throw new \InvalidArgumentException('meals.error.guest_invalid');
            }
            // A guest may have breakfast on departure day, so both date boundaries are included.
            if ($date->format('Y-m-d') < $reservation->getStartDate()->format('Y-m-d') || $date->format('Y-m-d') > $reservation->getEndDate()->format('Y-m-d')) {
                throw new \InvalidArgumentException('meals.error.date_outside_stay');
            }
            if (!$option->isActive()) {
                throw new \InvalidArgumentException('meals.error.option_inactive');
            }
            if (null !== $this->orders->findActiveDuplicate($reservation, $guest, $option, $date)) {
                throw new \InvalidArgumentException('meals.error.duplicate');
            }
            $order = new MealOrder($reservation, $guest, $option, $date, $quantity);
            $this->em->persist($order);

            return $order;
        });
    }

    /** Cancel an unbilled order without erasing the record. */
    public function cancel(MealOrder $order): void
    {
        $this->em->wrapInTransaction(function () use ($order): void {
            $this->em->refresh($order, LockMode::PESSIMISTIC_WRITE);
            $order->cancel();
        });
    }

    /** Persist a menu option. */
    public function saveOption(MealOption $option): void
    {
        $this->em->persist($option);
        $this->em->flush();
    }

    /** @param list<Reservation> $reservations
     *  @return list<Reservation>
     */
    public function eligibleReservations(array $reservations): array
    {
        return array_values(array_filter($reservations, static fn (Reservation $reservation): bool => null !== $reservation->getReservationStatus() && !$reservation->getReservationStatus()->isCancelled()));
    }

    /** Summarize non-cancelled quantities and base prices by item and currency.
     *
     * @param list<MealOrder> $orders
     * @return list<array{service: string, item: string, currency: string, quantity: int, totalMinor: int}>
     */
    public function summarize(array $orders): array
    {
        $summary = [];
        foreach ($orders as $order) {
            if ($order->isCancelled() || (null === $order->getInvoicePosition() && !$order->isValidForStay())) {
                continue;
            }
            $key = json_encode([$order->getServiceName(), $order->getItemName(), $order->getCurrency()], JSON_THROW_ON_ERROR);
            $summary[$key] ??= ['service' => $order->getServiceName(), 'item' => $order->getItemName(), 'currency' => $order->getCurrency(), 'quantity' => 0, 'totalMinor' => 0];
            $summary[$key]['quantity'] += $order->getQuantity();
            $summary[$key]['totalMinor'] += $order->getQuantity() * $order->getUnitPriceMinor();
        }

        return array_values($summary);
    }
}
