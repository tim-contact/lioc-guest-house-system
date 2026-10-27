<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\DataFixtures\InventoryFixtures;
use App\Entity\InventoryIssue;
use App\Entity\InventoryItem;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use Doctrine\Persistence\ObjectManager;
use Doctrine\Persistence\ObjectRepository;
use PHPUnit\Framework\TestCase;

/** Exercises repeatable sample inventory generation without a database. */
final class InventoryFixturesTest extends TestCase
{
    public function testCreatesExamplesForEachPropertyOnlyOnce(): void
    {
        $properties = [new Subsidiary(), new Subsidiary()];
        /** @var \ArrayObject<int, object> $persisted */
        $persisted = new \ArrayObject();
        $propertyRepo = $this->createStub(ObjectRepository::class);
        $propertyRepo->method('findAll')->willReturn($properties);
        $itemRepo = $this->createStub(ObjectRepository::class);
        $itemRepo->method('findOneBy')->willReturnCallback(static function (array $criteria) use ($persisted): ?InventoryItem {
            foreach ($persisted as $entity) {
                if ($entity instanceof InventoryItem && $entity->getSku() === $criteria['sku']) {
                    return $entity;
                }
            }

            return null;
        });
        $lotRepo = $this->createStub(ObjectRepository::class);
        $lotRepo->method('findOneBy')->willReturnCallback(static function (array $criteria) use ($persisted): ?InventoryLot {
            foreach ($persisted as $entity) {
                if ($entity instanceof InventoryLot && $entity->getItem() === $criteria['item'] && $entity->getSubsidiary() === $criteria['subsidiary'] && $entity->getReference() === $criteria['reference']) {
                    return $entity;
                }
            }

            return null;
        });
        $manager = $this->createStub(ObjectManager::class);
        $manager->method('getRepository')->willReturnCallback(static fn (string $class): ObjectRepository => match ($class) {
            Subsidiary::class => $propertyRepo,
            InventoryItem::class => $itemRepo,
            InventoryLot::class => $lotRepo,
            default => throw new \LogicException('Unexpected repository.'),
        });
        $manager->method('persist')->willReturnCallback(static function (object $entity) use ($persisted): void { $persisted[] = $entity; });
        $fixture = new InventoryFixtures();

        $fixture->load($manager);
        $fixture->load($manager);

        $entities = $persisted->getArrayCopy();
        $items = array_values(array_filter($entities, static fn (object $entity): bool => $entity instanceof InventoryItem));
        $lots = array_values(array_filter($entities, static fn (object $entity): bool => $entity instanceof InventoryLot));
        $issues = array_values(array_filter($entities, static fn (object $entity): bool => $entity instanceof InventoryIssue));
        self::assertCount(4, $items);
        self::assertCount(8, $lots);
        self::assertCount(4, $issues);
        self::assertCount(2, array_filter($lots, static fn (InventoryLot $lot): bool => null !== $lot->getExpiresAt() && $lot->getExpiresAt() < new \DateTimeImmutable('today')));
        self::assertSame('LKR', $lots[0]->getCurrency());
    }

    public function testRequiresAConfiguredProperty(): void
    {
        $propertyRepo = $this->createStub(ObjectRepository::class);
        $propertyRepo->method('findAll')->willReturn([]);
        $manager = $this->createStub(ObjectManager::class);
        $manager->method('getRepository')->willReturn($propertyRepo);

        $this->expectException(\RuntimeException::class);
        (new InventoryFixtures())->load($manager);
    }
}
