<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\InventoryIssue;
use App\Entity\InventoryItem;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use App\Entity\User;
use App\Repository\InventoryIssueRepository;
use App\Repository\InventoryItemRepository;
use App\Repository\InventoryLotRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;

/** Records inventory purchases and usage, and derives balances and alerts from those records. */
final class InventoryService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly InventoryItemRepository $itemRepository,
        private readonly InventoryLotRepository $lotRepository,
        private readonly InventoryIssueRepository $issueRepository,
    ) {
    }

    /** Create a catalogue entry shared across guest houses. */
    public function createItem(string $sku, string $name, string $unit, int $reorderLevel): InventoryItem
    {
        $item = new InventoryItem($sku, $name, $unit, $reorderLevel);
        if (null !== $this->itemRepository->findOneBy(['sku' => $item->getSku()])) {
            throw new \InvalidArgumentException('inventory.error.sku_exists');
        }
        $this->em->persist($item);
        $this->em->flush();

        return $item;
    }

    /** Record a purchase at one property; all cost values use currency minor units. */
    public function recordPurchase(
        InventoryItem $item,
        Subsidiary $subsidiary,
        int $quantity,
        int $unitCostMinor,
        string $currency,
        \DateTimeImmutable $purchasedAt,
        ?\DateTimeImmutable $expiresAt,
        ?string $supplier,
        ?string $reference,
        ?User $actor,
    ): InventoryLot {
        if (!$item->isActive()) {
            throw new \InvalidArgumentException('inventory.error.item_inactive');
        }
        if ($quantity < 1 || $quantity > 1_000_000 || $unitCostMinor < 0 || $unitCostMinor > 1_000_000_000 || $purchasedAt > new \DateTimeImmutable('today')) {
            throw new \InvalidArgumentException('inventory.error.purchase_invalid');
        }
        $lot = new InventoryLot($item, $subsidiary, $quantity, $unitCostMinor, $currency, $purchasedAt, $expiresAt, $supplier, $reference, $actor);
        $this->em->persist($lot);
        $this->em->flush();

        return $lot;
    }

    /** Consume unexpired stock in expiry-first order without allowing negative balances. */
    public function issueStock(InventoryItem $item, Subsidiary $subsidiary, int $quantity, \DateTimeImmutable $issuedAt, string $reason, ?User $actor): void
    {
        if ($quantity < 1 || $quantity > 1_000_000 || '' === trim($reason) || $issuedAt > new \DateTimeImmutable('today')) {
            throw new \InvalidArgumentException('inventory.error.issue_invalid');
        }

        // Locking the item serializes issues of this SKU while remaining lots are computed.
        $this->em->wrapInTransaction(function () use ($item, $subsidiary, $quantity, $issuedAt, $reason, $actor): void {
            $this->em->lock($item, LockMode::PESSIMISTIC_WRITE);
            $lots = $this->lotRepository->findForStock($subsidiary, $item);
            $consumed = $this->consumedForLots($lots);
            usort($lots, static function (InventoryLot $a, InventoryLot $b): int {
                // Lots without expiry follow dated lots; purchase order breaks ties.
                return ($a->getExpiresAt()?->format('Y-m-d') ?? '9999-12-31') <=> ($b->getExpiresAt()?->format('Y-m-d') ?? '9999-12-31')
                    ?: $a->getPurchasedAt() <=> $b->getPurchasedAt()
                    ?: $a->getId() <=> $b->getId();
            });

            $remaining = $quantity;
            foreach ($lots as $lot) {
                if ($lot->getPurchasedAt() > $issuedAt || (null !== $lot->getExpiresAt() && $lot->getExpiresAt() < $issuedAt)) {
                    continue;
                }
                $available = $lot->getQuantity() - ($consumed[$lot->getId()] ?? 0);
                $take = min($available, $remaining);
                if ($take > 0) {
                    $this->em->persist(new InventoryIssue($lot, $take, $issuedAt, $reason, $actor));
                    $remaining -= $take;
                }
                if (0 === $remaining) {
                    break;
                }
            }
            if ($remaining > 0) {
                throw new \InvalidArgumentException('inventory.error.insufficient_stock');
            }
        });
    }

    /**
     * Build stock, expiry and period cost summaries for one property or all properties.
     * Expired units count as on-hand but not as usable stock.
     *
     * @return array{rows: list<array{item: InventoryItem, onHand: int, usable: int, low: bool}>, lots: list<array{lot: InventoryLot, remaining: int}>, expiring: list<array{lot: InventoryLot, remaining: int, expired: bool}>, purchases: array<string, int>, usage: array<string, int>}
     */
    public function overview(?Subsidiary $subsidiary, \DateTimeImmutable $today, int $alertDays = 30): array
    {
        if ($alertDays < 0 || $alertDays > 365) {
            throw new \InvalidArgumentException('inventory.error.alert_period_invalid');
        }
        $items = $this->itemRepository->findActive();
        $lots = $this->lotRepository->findForStock($subsidiary);
        $consumed = $this->consumedForLots($lots);
        $rows = [];
        foreach ($items as $item) {
            $rows[$item->getId()] = ['item' => $item, 'onHand' => 0, 'usable' => 0, 'low' => false];
        }
        $expiring = [];
        $lotRows = [];
        $alertEnd = $today->modify(sprintf('+%d days', $alertDays));
        foreach ($lots as $lot) {
            $remaining = max(0, $lot->getQuantity() - ($consumed[$lot->getId()] ?? 0));
            $lotRows[] = ['lot' => $lot, 'remaining' => $remaining];
            $itemId = $lot->getItem()->getId();
            if (0 === $remaining || null === $itemId || !isset($rows[$itemId])) {
                continue;
            }
            $rows[$itemId]['onHand'] += $remaining;
            if (null === $lot->getExpiresAt() || $lot->getExpiresAt() >= $today) {
                $rows[$itemId]['usable'] += $remaining;
            }
            if (null !== $lot->getExpiresAt() && $lot->getExpiresAt() <= $alertEnd) {
                $expiring[] = ['lot' => $lot, 'remaining' => $remaining, 'expired' => $lot->getExpiresAt() < $today];
            }
        }
        foreach ($rows as &$row) {
            $row['low'] = $row['usable'] <= $row['item']->getReorderLevel();
        }
        unset($row);
        usort($expiring, static fn (array $a, array $b): int => $a['lot']->getExpiresAt() <=> $b['lot']->getExpiresAt());
        usort($lotRows, static fn (array $a, array $b): int => $b['lot']->getPurchasedAt() <=> $a['lot']->getPurchasedAt() ?: $b['lot']->getId() <=> $a['lot']->getId());

        $periodStart = $today->modify('first day of this month')->setTime(0, 0);
        $periodEnd = $periodStart->modify('first day of next month');
        $purchases = [];
        foreach ($this->lotRepository->findPurchasedInPeriod($subsidiary, $periodStart, $periodEnd) as $lot) {
            $purchases[$lot->getCurrency()] = ($purchases[$lot->getCurrency()] ?? 0) + $lot->getQuantity() * $lot->getUnitCostMinor();
        }
        $usage = [];
        foreach ($this->issueRepository->findIssuedInPeriod($subsidiary, $periodStart, $periodEnd) as $issue) {
            $lot = $issue->getLot();
            $usage[$lot->getCurrency()] = ($usage[$lot->getCurrency()] ?? 0) + $issue->getQuantity() * $lot->getUnitCostMinor();
        }

        return ['rows' => array_values($rows), 'lots' => $lotRows, 'expiring' => $expiring, 'purchases' => $purchases, 'usage' => $usage];
    }

    /** @param list<InventoryLot> $lots
     *  @return array<int, int>
     */
    private function consumedForLots(array $lots): array
    {
        $ids = array_values(array_filter(array_map(static fn (InventoryLot $lot): ?int => $lot->getId(), $lots)));

        return $this->issueRepository->consumedByLotIds($ids);
    }
}
