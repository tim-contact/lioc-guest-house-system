<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\InventoryLotRepository;
use Doctrine\ORM\Mapping as ORM;

/** An immutable purchase receipt with its own cost, currency, property and expiry date. */
#[ORM\Entity(repositoryClass: InventoryLotRepository::class)]
#[ORM\Table(name: 'inventory_lots')]
#[ORM\Index(name: 'idx_inventory_lot_property_expiry', columns: ['subsidiary_id', 'expires_at'])]
class InventoryLot
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\ManyToOne(targetEntity: InventoryItem::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private InventoryItem $item;

    #[ORM\ManyToOne(targetEntity: Subsidiary::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Subsidiary $subsidiary;

    #[ORM\Column]
    private int $quantity;

    #[ORM\Column(type: 'bigint')]
    private int $unitCostMinor;

    #[ORM\Column(length: 3)]
    private string $currency;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $purchasedAt;

    #[ORM\Column(type: 'date_immutable', nullable: true)]
    private ?\DateTimeImmutable $expiresAt;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $supplier;

    #[ORM\Column(length: 120, nullable: true)]
    private ?string $reference;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $recordedBy;

    /** Purchase facts never change; stock usage is recorded separately. */
    public function __construct(
        InventoryItem $item,
        Subsidiary $subsidiary,
        int $quantity,
        int $unitCostMinor,
        string $currency,
        \DateTimeImmutable $purchasedAt,
        ?\DateTimeImmutable $expiresAt,
        ?string $supplier,
        ?string $reference,
        ?User $recordedBy,
    ) {
        $currency = strtoupper(trim($currency));
        if ($quantity < 1 || $unitCostMinor < 0 || !preg_match('/^[A-Z]{3}$/', $currency)) {
            throw new \InvalidArgumentException('inventory.error.purchase_invalid');
        }
        if (null !== $expiresAt && $expiresAt < $purchasedAt) {
            throw new \InvalidArgumentException('inventory.error.expiry_before_purchase');
        }
        $this->item = $item;
        $this->subsidiary = $subsidiary;
        $this->quantity = $quantity;
        $this->unitCostMinor = $unitCostMinor;
        $this->currency = $currency;
        $this->purchasedAt = $purchasedAt;
        $this->expiresAt = $expiresAt;
        $this->supplier = $this->optionalText($supplier);
        $this->reference = $this->optionalText($reference);
        $this->recordedBy = $recordedBy;
    }

    private function optionalText(?string $value): ?string
    {
        $value = null === $value ? '' : trim($value);
        if (mb_strlen($value) > 120) {
            throw new \InvalidArgumentException('inventory.error.purchase_invalid');
        }

        return '' === $value ? null : $value;
    }

    public function getId(): ?int { return $this->id ?? null; }
    public function setId(int $id): void { $this->id = $id; }
    public function getItem(): InventoryItem { return $this->item; }
    public function getSubsidiary(): Subsidiary { return $this->subsidiary; }
    public function getQuantity(): int { return $this->quantity; }
    public function getUnitCostMinor(): int { return $this->unitCostMinor; }
    public function getCurrency(): string { return $this->currency; }
    public function getPurchasedAt(): \DateTimeImmutable { return $this->purchasedAt; }
    public function getExpiresAt(): ?\DateTimeImmutable { return $this->expiresAt; }
    public function getSupplier(): ?string { return $this->supplier; }
    public function getReference(): ?string { return $this->reference; }
    public function getRecordedBy(): ?User { return $this->recordedBy; }
}
