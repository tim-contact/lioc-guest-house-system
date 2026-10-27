<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\InventoryIssue;
use App\Entity\InventoryItem;
use App\Entity\InventoryLot;
use App\Entity\Subsidiary;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Bundle\FixturesBundle\FixtureGroupInterface;
use Doctrine\Persistence\ObjectManager;

/** Adds clearly marked, repeatable inventory examples to configured properties. */
final class InventoryFixtures extends Fixture implements FixtureGroupInterface
{
    /** @return list<string> */
    public static function getGroups(): array
    {
        return ['inventory'];
    }

    public function load(ObjectManager $manager): void
    {
        $properties = $manager->getRepository(Subsidiary::class)->findAll();
        if ([] === $properties) {
            throw new \RuntimeException('Create at least one guest house before loading inventory sample data.');
        }

        // Stable sample codes and lot references make reruns safe without changing existing data.
        $examples = [
            ['code' => 'TEA', 'name' => '[SAMPLE] Tea packets', 'unit' => 'pack', 'reorder' => 6, 'quantity' => 20, 'cost' => 45000, 'purchased' => 0, 'expiry' => 10, 'used' => 4],
            ['code' => 'MILK', 'name' => '[SAMPLE] Milk cartons', 'unit' => 'carton', 'reorder' => 6, 'quantity' => 4, 'cost' => 38000, 'purchased' => 0, 'expiry' => 20, 'used' => 0],
            ['code' => 'SOAP', 'name' => '[SAMPLE] Bath soap', 'unit' => 'bar', 'reorder' => 6, 'quantity' => 24, 'cost' => 15000, 'purchased' => 0, 'expiry' => null, 'used' => 5],
            ['code' => 'RICE', 'name' => '[SAMPLE] Rice packets', 'unit' => 'pack', 'reorder' => 4, 'quantity' => 8, 'cost' => 65000, 'purchased' => -10, 'expiry' => -1, 'used' => 0],
        ];
        $today = new \DateTimeImmutable('today');
        $itemRepository = $manager->getRepository(InventoryItem::class);
        $lotRepository = $manager->getRepository(InventoryLot::class);

        foreach ($examples as $example) {
            $sku = 'SAMPLE-INV-'.$example['code'];
            $item = $itemRepository->findOneBy(['sku' => $sku]);
            if (null !== $item && ($item->getName() !== $example['name'] || $item->getUnit() !== $example['unit'])) {
                throw new \RuntimeException(sprintf('Sample item code %s is already used by a different item.', $sku));
            }
            if (null !== $item && !$item->isActive()) {
                throw new \RuntimeException(sprintf('Sample item %s is inactive.', $sku));
            }
            if (null === $item) {
                $item = new InventoryItem($sku, $example['name'], $example['unit'], $example['reorder']);
                $manager->persist($item);
                $manager->flush();
            }

            foreach ($properties as $property) {
                $reference = 'SAMPLE-INVENTORY-V1-'.$example['code'];
                if (null !== $lotRepository->findOneBy(['item' => $item, 'subsidiary' => $property, 'reference' => $reference])) {
                    continue;
                }

                $expiry = null === $example['expiry'] ? null : $today->modify(sprintf('%+d days', $example['expiry']));
                $lot = new InventoryLot($item, $property, $example['quantity'], $example['cost'], 'LKR', $today->modify(sprintf('%+d days', $example['purchased'])), $expiry, '[SAMPLE] Supplier', $reference, null);
                $manager->persist($lot);
                if ($example['used'] > 0) {
                    $manager->persist(new InventoryIssue($lot, $example['used'], $today, '[SAMPLE] Usage', null));
                }
            }
            $manager->flush();
        }
    }
}
