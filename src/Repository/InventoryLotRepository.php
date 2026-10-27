<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\InventoryItem;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<InventoryLot>
 *  Queries purchase lots by property, item and accounting period.
 */
class InventoryLotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InventoryLot::class);
    }

    /** @return list<InventoryLot> */
    public function findForStock(?Subsidiary $subsidiary, ?InventoryItem $item = null): array
    {
        $qb = $this->createQueryBuilder('lot')->addSelect('item', 'property')
            ->join('lot.item', 'item')->join('lot.subsidiary', 'property')
            ->orderBy('lot.purchasedAt', 'ASC')->addOrderBy('lot.id', 'ASC');
        if (null !== $subsidiary) {
            $qb->andWhere('lot.subsidiary = :subsidiary')->setParameter('subsidiary', $subsidiary);
        }
        if (null !== $item) {
            $qb->andWhere('lot.item = :item')->setParameter('item', $item);
        }

        return $qb->getQuery()->getResult();
    }

    /** @return list<InventoryLot> */
    public function findPurchasedInPeriod(?Subsidiary $subsidiary, \DateTimeImmutable $start, \DateTimeImmutable $end): array
    {
        $qb = $this->createQueryBuilder('lot')
            ->andWhere('lot.purchasedAt >= :start')->andWhere('lot.purchasedAt < :end')
            ->setParameter('start', $start)->setParameter('end', $end);
        if (null !== $subsidiary) {
            $qb->andWhere('lot.subsidiary = :subsidiary')->setParameter('subsidiary', $subsidiary);
        }

        return $qb->getQuery()->getResult();
    }
}
