<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\MealOrderRepository;
use Doctrine\ORM\Mapping as ORM;

/** A guest's meal on a particular date, with price and tax captured at ordering time. */
#[ORM\Entity(repositoryClass: MealOrderRepository::class)]
#[ORM\Table(name: 'meal_orders')]
#[ORM\Index(name: 'idx_meal_order_date', columns: ['meal_date'])]
class MealOrder
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\ManyToOne(targetEntity: Reservation::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Reservation $reservation;

    #[ORM\ManyToOne(targetEntity: Subsidiary::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Subsidiary $property;

    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private Customer $guest;

    #[ORM\ManyToOne(targetEntity: MealOption::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'RESTRICT')]
    private MealOption $option;

    #[ORM\Column(length: 120)]
    private string $itemName;

    #[ORM\Column(length: 40)]
    private string $serviceName;

    #[ORM\Column(type: 'date_immutable')]
    private \DateTimeImmutable $mealDate;

    #[ORM\Column]
    private int $quantity;

    #[ORM\Column(type: 'bigint')]
    private int $unitPriceMinor;

    #[ORM\Column(length: 3)]
    private string $currency;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    private ?string $taxRate;

    #[ORM\Column(nullable: true)]
    private ?bool $includesTax;

    #[ORM\Column(options: ['default' => false])]
    private bool $cancelled = false;

    #[ORM\OneToOne(targetEntity: InvoicePosition::class, inversedBy: 'mealOrder')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'RESTRICT')]
    private ?InvoicePosition $invoicePosition = null;

    /** Snapshot the option's pricing so later menu changes cannot alter an existing order. */
    public function __construct(Reservation $reservation, Customer $guest, MealOption $option, \DateTimeImmutable $mealDate, int $quantity)
    {
        if ($quantity < 1 || $quantity > 100) {
            throw new \InvalidArgumentException('meals.error.quantity_invalid');
        }
        $room = $reservation->getAppartment();
        if (null === $room) {
            throw new \InvalidArgumentException('meals.error.reservation_inactive');
        }
        $this->reservation = $reservation;
        $this->property = $room->getObject();
        $this->guest = $guest;
        $this->option = $option;
        $this->itemName = $option->getName();
        $this->serviceName = $option->getService();
        $this->mealDate = $mealDate;
        $this->quantity = $quantity;
        $this->unitPriceMinor = $option->getPriceMinor();
        $this->currency = $option->getCurrency();
        $this->taxRate = $option->getTaxRate();
        $this->includesTax = $option->getIncludesTax();
    }

    public function getId(): ?int { return $this->id ?? null; }
    public function setId(int $id): void { $this->id = $id; }
    public function getReservation(): Reservation { return $this->reservation; }
    public function getProperty(): Subsidiary { return $this->property; }
    public function getGuest(): Customer { return $this->guest; }
    public function getOption(): MealOption { return $this->option; }
    public function getItemName(): string { return $this->itemName; }
    public function getServiceName(): string { return $this->serviceName; }
    public function getMealDate(): \DateTimeImmutable { return $this->mealDate; }
    public function getQuantity(): int { return $this->quantity; }
    public function getUnitPriceMinor(): int { return $this->unitPriceMinor; }
    public function getCurrency(): string { return $this->currency; }
    public function getTaxRate(): ?string { return $this->taxRate; }
    public function getIncludesTax(): ?bool { return $this->includesTax; }
    public function isCancelled(): bool { return $this->cancelled; }
    public function getInvoicePosition(): ?InvoicePosition { return $this->invoicePosition; }

    /** Detect changes to the booking that make the original meal request invalid. */
    public function isValidForStay(): bool
    {
        $reservation = $this->reservation;
        $room = $reservation->getAppartment();
        $status = $reservation->getReservationStatus();
        return null !== $room && $room->getObject()->getId() === $this->property->getId()
            // Checked-out bookings no longer block rooms but their meals still need invoicing.
            && null !== $status && !$status->isCancelled()
            && !$reservation->isConflict() && !$reservation->isConflictIgnored()
            && ($reservation->getBooker() === $this->guest || $reservation->getCustomers()->contains($this->guest))
            && $this->mealDate->format('Y-m-d') >= $reservation->getStartDate()->format('Y-m-d')
            && $this->mealDate->format('Y-m-d') <= $reservation->getEndDate()->format('Y-m-d');
    }

    /** Preserve financial history while removing the association with a deleted guest. */
    public function anonymizeGuest(Customer $anonymous): void
    {
        $this->guest = $anonymous;
    }

    /** A billed order must be corrected through the invoice workflow. */
    public function cancel(): void
    {
        if (null !== $this->invoicePosition) {
            throw new \DomainException('meals.error.already_invoiced');
        }
        $this->cancelled = true;
    }

    /** Link the immutable meal snapshot to its invoice position. */
    public function markInvoiced(InvoicePosition $position): void
    {
        if ($this->cancelled || null !== $this->invoicePosition) {
            throw new \DomainException('meals.error.already_invoiced');
        }
        $this->invoicePosition = $position;
    }
}
