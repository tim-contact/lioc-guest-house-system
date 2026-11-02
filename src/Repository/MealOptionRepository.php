<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MealOption;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<MealOption> */
class MealOptionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MealOption::class);
    }

    /** @return list<MealOption> */
    public function findActive(): array
    {
        return $this->createQueryBuilder('m')->where('m.active = true')->orderBy('m.service')->addOrderBy('m.name')->getQuery()->getResult();
    }
}
