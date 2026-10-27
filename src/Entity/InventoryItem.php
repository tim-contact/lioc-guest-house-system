<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\InventoryItemRepository;
use Doctrine\ORM\Mapping as ORM;

/** A reusable inventory catalogue entry; stock is held by purchase lots per subsidiary. */
#[ORM\Entity(repositoryClass: InventoryItemRepository::class)]
#[ORM\Table(name: 'inventory_items')]
#[ORM\UniqueConstraint(name: 'uniq_inventory_item_sku', columns: ['sku'])]
class InventoryItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\Column(length: 40)]
    private string $sku;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(length: 30)]
    private string $unit;

    #[ORM\Column(options: ['default' => 0])]
    private int $reorderLevel;

    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    public function __construct(string $sku, string $name, string $unit, int $reorderLevel = 0)
    {
        $sku = strtoupper(trim($sku));
        $name = trim($name);
        $unit = trim($unit);
        if ('' === $sku || mb_strlen($sku) > 40 || '' === $name || mb_strlen($name) > 120 || '' === $unit || mb_strlen($unit) > 30 || $reorderLevel < 0) {
            throw new \InvalidArgumentException('inventory.error.item_invalid');
        }

        $this->sku = $sku;
        $this->name = $name;
        $this->unit = $unit;
        $this->reorderLevel = $reorderLevel;
    }

    public function getId(): ?int { return $this->id ?? null; }
    public function setId(int $id): void { $this->id = $id; }
    public function getSku(): string { return $this->sku; }
    public function getName(): string { return $this->name; }
    public function getUnit(): string { return $this->unit; }
    public function getReorderLevel(): int { return $this->reorderLevel; }
    public function isActive(): bool { return $this->active; }
}
