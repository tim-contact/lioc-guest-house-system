<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use App\DataFixtures\InventoryFixtures;
use App\Entity\InventoryIssue;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/** Checks that inventory samples persist and are not duplicated on a second load. */
final class InventoryFixturesTest extends KernelTestCase
{
    public function testFixturePersistsOneLotPerSampleItemForEachProperty(): void
    {
        self::bootKernel();
        $container = static::getContainer();
        $manager = $container->get(ManagerRegistry::class)->getManager();
        $property = new Subsidiary();
        $property->setName('Inventory fixture test');
        $property->setDescription('Inventory fixture test');
        $manager->persist($property);
        $manager->flush();

        $fixture = new InventoryFixtures();
        $fixture->load($manager);
        $fixture->load($manager);
        $manager->clear();

        $lots = $manager->getRepository(InventoryLot::class)->findBy(['subsidiary' => $property->getId()]);
        self::assertCount(4, $lots);
        $issues = 0;
        foreach ($lots as $lot) {
            self::assertStringStartsWith('SAMPLE-INVENTORY-V1-', (string) $lot->getReference());
            $issues += count($manager->getRepository(InventoryIssue::class)->findBy(['lot' => $lot]));
        }
        self::assertSame(2, $issues);
    }
}
