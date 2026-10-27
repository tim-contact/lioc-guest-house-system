<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\InventoryItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<InventoryItem>
 *  Queries the shared inventory item catalogue.
 */
class InventoryItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InventoryItem::class);
    }

    /** @return list<InventoryItem> */
    public function findActive(): array
    {
        return $this->createQueryBuilder('item')
            ->andWhere('item.active = true')
            ->orderBy('item.name', 'ASC')
            ->getQuery()->getResult();
    }
}
