<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\InvoicePosition;
use App\Entity\MealOrder;
use App\Repository\MealOrderRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

/** Builds meal invoice lines and claims their source orders atomically. */
final class MealBillingService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly MealOrderRepository $orders,
        private readonly AppSettingsService $settings,
    ) {
    }

    /** @param list<int> $reservationIds
     *  @return list<InvoicePosition>
     */
    public function buildPositions(array $reservationIds): array
    {
        $result = [];
        $currency = $this->settings->getSettings()->getCurrency();
        foreach ($this->orders->findUnbilledForReservations($reservationIds) as $order) {
            $this->validateOrder($order, $currency);
            $position = new InvoicePosition();
            $position->setDescription($this->description($order));
            $position->setAmount($order->getQuantity());
            $position->setPrice(number_format($order->getUnitPriceMinor() / 100, 2, '.', ''));
            $position->setVat((float) $order->getTaxRate());
            $position->setIncludesVat((bool) $order->getIncludesTax());
            $position->setIsFlatPrice(false);
            $position->setIsPerRoom(false);
            $position->setPositionGroup('misc');
            $position->setSourceMealOrderId($order->getId());
            $result[] = $position;
        }

        return $result;
    }

    /** Lock and claim the meal orders behind the selected invoice lines within the caller's transaction.
     *
     * @param iterable<InvoicePosition> $positions
     * @param list<int> $reservationIds
     */
    public function claimPositions(iterable $positions, array $reservationIds): void
    {
        if (!$this->em->getConnection()->isTransactionActive()) {
            throw new \LogicException('Meal billing requires an active transaction.');
        }
        $mealPositions = [];
        foreach ($positions as $position) {
            $id = $position->getSourceMealOrderId();
            if (null === $id) {
                continue;
            }
            if (isset($mealPositions[$id])) {
                throw new \DomainException('meals.error.invoice_changed');
            }
            $mealPositions[$id] = $position;
        }
        ksort($mealPositions);
        $currency = $this->settings->getSettings()->getCurrency();
        foreach ($mealPositions as $id => $position) {
            $order = $this->orders->find($id);
            if (!$order instanceof MealOrder) {
                throw new \DomainException('meals.error.invoice_changed');
            }
            $this->em->refresh($order, LockMode::PESSIMISTIC_WRITE);
            $this->em->refresh($order->getReservation(), LockMode::PESSIMISTIC_READ);
            $this->validateOrder($order, $currency);
            if (!in_array((int) $order->getReservation()->getId(), $reservationIds, true)
                || $position->getAmount() !== $order->getQuantity()
                || (int) round((float) $position->getPrice() * 100) !== $order->getUnitPriceMinor()
                || $position->getDescription() !== $this->description($order)
                || (float) $position->getVat() !== (float) $order->getTaxRate()
                || $position->getIncludesVat() !== $order->getIncludesTax()
                || $position->getIsFlatPrice()) {
                throw new \DomainException('meals.error.invoice_changed');
            }
            $order->markInvoiced($position);
        }
    }

    /** Reject stale orders and billing values that the invoice cannot represent. */
    private function validateOrder(MealOrder $order, ?string $currency): void
    {
        if ($order->isCancelled() || null !== $order->getInvoicePosition()) {
            throw new \DomainException('meals.error.invoice_changed');
        }
        if (!$order->isValidForStay()) {
            throw new \DomainException('meals.error.reservation_changed');
        }
        if ($order->getCurrency() !== $currency || null === $order->getTaxRate() || null === $order->getIncludesTax()) {
            throw new \DomainException('meals.error.invoice_configuration');
        }
    }

    private function description(MealOrder $order): string
    {
        return $order->getItemName().' · '.$order->getMealDate()->format('Y-m-d');
    }
}
