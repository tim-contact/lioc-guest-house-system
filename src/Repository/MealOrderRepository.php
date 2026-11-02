<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Customer;
use App\Entity\MealOption;
use App\Entity\MealOrder;
use App\Entity\Reservation;
use App\Entity\Subsidiary;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\Persistence\ManagerRegistry;

/** @extends ServiceEntityRepository<MealOrder> */
class MealOrderRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MealOrder::class);
    }

    public function findActiveDuplicate(Reservation $reservation, Customer $guest, MealOption $option, \DateTimeImmutable $date): ?MealOrder
    {
        return $this->findOneBy(['reservation' => $reservation, 'guest' => $guest, 'option' => $option, 'mealDate' => $date, 'cancelled' => false]);
    }

    /** @return list<MealOrder> */
    public function findForGuest(Customer $guest): array
    {
        return $this->createQueryBuilder('m')->addSelect('s')
            ->join('m.property', 's')
            ->where('m.guest = :guest')->setParameter('guest', $guest)
            ->orderBy('m.mealDate', 'DESC')->addOrderBy('m.id', 'DESC')->getQuery()->getResult();
    }

    /** @return list<MealOrder> */
    public function findForDay(\DateTimeImmutable $date, ?Subsidiary $property): array
    {
        $qb = $this->createQueryBuilder('m')->addSelect('r', 'g', 'o', 'a', 's')
            ->join('m.reservation', 'r')->join('m.guest', 'g')->join('m.option', 'o')
            ->leftJoin('r.appartment', 'a')->join('m.property', 's')
            ->where('m.mealDate = :date')->setParameter('date', $date, Types::DATE_IMMUTABLE)
            ->orderBy('m.serviceName')->addOrderBy('a.number')->addOrderBy('g.lastname');
        if (null !== $property) {
            $qb->andWhere('s = :property')->setParameter('property', $property);
        }

        return $qb->getQuery()->getResult();
    }

    /** @param list<int> $reservationIds
     *  @return list<MealOrder>
     */
    public function findUnbilledForReservations(array $reservationIds): array
    {
        if ([] === $reservationIds) {
            return [];
        }

        return $this->createQueryBuilder('m')->addSelect('o', 'g')->join('m.option', 'o')->join('m.guest', 'g')
            ->where('m.reservation IN (:ids)')->andWhere('m.cancelled = false')->andWhere('m.invoicePosition IS NULL')
            ->setParameter('ids', $reservationIds)->orderBy('m.mealDate')->addOrderBy('m.id')->getQuery()->getResult();
    }
}
