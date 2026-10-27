<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Entity\InventoryIssue;
use App\Entity\InventoryItem;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use App\Repository\InventoryIssueRepository;
use App\Repository\InventoryItemRepository;
use App\Repository\InventoryLotRepository;
use App\Service\InventoryService;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\TestCase;

/** Covers stock balance, expiry and lot allocation without a database. */
final class InventoryServiceTest extends TestCase
{
    public function testOverviewSeparatesExpiredStockAndTracksPurchaseAndUsageCost(): void
    {
        $today = new \DateTimeImmutable('2026-10-27');
        $item = new InventoryItem('TEA', 'Tea', 'pack', 5);
        $item->setId(10);
        $property = new Subsidiary();
        $property->setId(2);
        $lot = new InventoryLot($item, $property, 10, 250, 'LKR', $today->modify('-5 days'), $today->modify('+3 days'), null, null, null);
        $lot->setId(20);
        $expired = new InventoryLot($item, $property, 2, 300, 'LKR', $today->modify('-20 days'), $today->modify('-1 day'), null, null, null);
        $expired->setId(21);
        $issue = new InventoryIssue($lot, 6, $today, 'Kitchen use', null);

        $items = $this->createStub(InventoryItemRepository::class);
        $items->method('findActive')->willReturn([$item]);
        $lots = $this->createStub(InventoryLotRepository::class);
        $lots->method('findForStock')->willReturn([$lot, $expired]);
        $lots->method('findPurchasedInPeriod')->willReturn([$lot, $expired]);
        $issues = $this->createStub(InventoryIssueRepository::class);
        $issues->method('consumedByLotIds')->willReturn([20 => 6]);
        $issues->method('findIssuedInPeriod')->willReturn([$issue]);
        $service = new InventoryService($this->createStub(EntityManagerInterface::class), $items, $lots, $issues);

        $overview = $service->overview($property, $today);

        self::assertSame(6, $overview['rows'][0]['onHand']);
        self::assertSame(4, $overview['rows'][0]['usable']);
        self::assertTrue($overview['rows'][0]['low']);
        self::assertCount(2, $overview['expiring']);
        self::assertTrue($overview['expiring'][0]['expired']);
        self::assertSame(3100, $overview['purchases']['LKR']);
        self::assertSame(1500, $overview['usage']['LKR']);
    }

    public function testIssueConsumesEarliestExpiringLotsFirst(): void
    {
        $today = new \DateTimeImmutable('today');
        $item = new InventoryItem('SOAP', 'Soap', 'bar');
        $item->setId(10);
        $property = new Subsidiary();
        $property->setId(2);
        $later = new InventoryLot($item, $property, 5, 100, 'LKR', $today->modify('-3 days'), $today->modify('+20 days'), null, null, null);
        $later->setId(30);
        $sooner = new InventoryLot($item, $property, 5, 100, 'LKR', $today->modify('-2 days'), $today->modify('+2 days'), null, null, null);
        $sooner->setId(31);
        $persisted = [];
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('wrapInTransaction')->willReturnCallback(static function (callable $callback) use ($em): void { $callback($em); });
        $em->method('persist')->willReturnCallback(static function (object $entity) use (&$persisted): void { $persisted[] = $entity; });
        $lots = $this->createStub(InventoryLotRepository::class);
        $lots->method('findForStock')->willReturn([$later, $sooner]);
        $issues = $this->createStub(InventoryIssueRepository::class);
        $issues->method('consumedByLotIds')->willReturn([]);
        $service = new InventoryService($em, $this->createStub(InventoryItemRepository::class), $lots, $issues);

        $service->issueStock($item, $property, 7, $today, 'Housekeeping', null);

        self::assertCount(2, $persisted);
        self::assertSame($sooner, $persisted[0]->getLot());
        self::assertSame(5, $persisted[0]->getQuantity());
        self::assertSame($later, $persisted[1]->getLot());
        self::assertSame(2, $persisted[1]->getQuantity());
    }

    public function testIssueRejectsQuantityBeyondUnexpiredStock(): void
    {
        $today = new \DateTimeImmutable('today');
        $item = new InventoryItem('MILK', 'Milk', 'carton');
        $item->setId(10);
        $property = new Subsidiary();
        $property->setId(2);
        $lot = new InventoryLot($item, $property, 4, 200, 'LKR', $today->modify('-3 days'), $today->modify('-1 day'), null, null, null);
        $lot->setId(40);
        $em = $this->createStub(EntityManagerInterface::class);
        $em->method('wrapInTransaction')->willReturnCallback(static function (callable $callback) use ($em): void { $callback($em); });
        $lots = $this->createStub(InventoryLotRepository::class);
        $lots->method('findForStock')->willReturn([$lot]);
        $issues = $this->createStub(InventoryIssueRepository::class);
        $issues->method('consumedByLotIds')->willReturn([]);
        $service = new InventoryService($em, $this->createStub(InventoryItemRepository::class), $lots, $issues);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('inventory.error.insufficient_stock');
        $service->issueStock($item, $property, 1, $today, 'Kitchen', null);
    }
}
