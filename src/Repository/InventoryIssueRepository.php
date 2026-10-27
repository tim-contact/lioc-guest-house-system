<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\InventoryIssue;
use App\Entity\Subsidiary;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<InventoryIssue>
 *  Queries immutable stock usage and its totals by purchase lot.
 */
class InventoryIssueRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InventoryIssue::class);
    }

    /** @param list<int> $lotIds
     *  @return array<int, int>
     */
    public function consumedByLotIds(array $lotIds): array
    {
        if ([] === $lotIds) {
            return [];
        }

        $rows = $this->createQueryBuilder('issue')
            ->select('IDENTITY(issue.lot) AS lotId', 'SUM(issue.quantity) AS consumed')
            ->andWhere('IDENTITY(issue.lot) IN (:lotIds)')
            ->setParameter('lotIds', $lotIds)
            ->groupBy('issue.lot')
            ->getQuery()->getArrayResult();
        $totals = [];
        foreach ($rows as $row) {
            $totals[(int) $row['lotId']] = (int) $row['consumed'];
        }

        return $totals;
    }

    /** @return list<InventoryIssue> */
    public function findIssuedInPeriod(?Subsidiary $subsidiary, \DateTimeImmutable $start, \DateTimeImmutable $end): array
    {
        $qb = $this->createQueryBuilder('issue')->addSelect('lot')
            ->join('issue.lot', 'lot')
            ->andWhere('issue.issuedAt >= :start')->andWhere('issue.issuedAt < :end')
            ->setParameter('start', $start)->setParameter('end', $end);
        if (null !== $subsidiary) {
            $qb->andWhere('lot.subsidiary = :subsidiary')->setParameter('subsidiary', $subsidiary);
        }

        return $qb->getQuery()->getResult();
    }
}
