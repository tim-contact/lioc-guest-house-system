<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\InventoryIssueRepository;
use Doctrine\ORM\Mapping as ORM;

/** An immutable stock usage entry against one purchase lot. */
#[ORM\Entity(repositoryClass: InventoryIssueRepository::class)]
#[ORM\Table(name: 'inventory_issues')]
#[ORM\Index(name: 'idx_inventory_issue_date', columns: ['issued_at'])]
class InventoryIssue
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\ManyToOne(targetEntity: InventoryLot::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private InventoryLot $lot;

    #[ORM\Column]
    private int $quantity;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $issuedAt;

    #[ORM\Column(length: 255)]
    private string $reason;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $recordedBy;

    public function __construct(InventoryLot $lot, int $quantity, \DateTimeImmutable $issuedAt, string $reason, ?User $recordedBy)
    {
        $reason = trim($reason);
        if ($quantity < 1 || '' === $reason || mb_strlen($reason) > 255) {
            throw new \InvalidArgumentException('inventory.error.issue_invalid');
        }
        $this->lot = $lot;
        $this->quantity = $quantity;
        $this->issuedAt = $issuedAt;
        $this->reason = $reason;
        $this->recordedBy = $recordedBy;
    }

    public function getId(): ?int { return $this->id ?? null; }
    public function setId(int $id): void { $this->id = $id; }
    public function getLot(): InventoryLot { return $this->lot; }
    public function getQuantity(): int { return $this->quantity; }
    public function getIssuedAt(): \DateTimeImmutable { return $this->issuedAt; }
    public function getReason(): string { return $this->reason; }
    public function getRecordedBy(): ?User { return $this->recordedBy; }
}
