<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\MealOptionRepository;
use Doctrine\ORM\Mapping as ORM;

/** A configurable meal or drink offered for a price in one currency. */
#[ORM\Entity(repositoryClass: MealOptionRepository::class)]
#[ORM\Table(name: 'meal_options')]
class MealOption
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private int $id;

    #[ORM\Column(length: 120)]
    private string $name;

    #[ORM\Column(length: 40)]
    private string $service;

    #[ORM\Column(type: 'bigint')]
    private int $priceMinor;

    #[ORM\Column(length: 3)]
    private string $currency;

    // Null means finance has not yet specified how to invoice this meal.
    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    private ?string $taxRate;

    #[ORM\Column(nullable: true)]
    private ?bool $includesTax;

    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    public function __construct(string $name, string $service, int $priceMinor, string $currency, ?string $taxRate, ?bool $includesTax)
    {
        $this->update($name, $service, $priceMinor, $currency, $taxRate, $includesTax);
    }

    /** Update the menu; existing orders retain their own price and label snapshots. */
    public function update(string $name, string $service, int $priceMinor, string $currency, ?string $taxRate, ?bool $includesTax): void
    {
        $name = trim($name);
        $service = trim($service);
        $currency = strtoupper(trim($currency));
        if ('' === $name || mb_strlen($name) > 120 || '' === $service || mb_strlen($service) > 40 || $priceMinor < 0 || $priceMinor > 1_000_000_000 || !preg_match('/^[A-Z]{3}$/', $currency)) {
            throw new \InvalidArgumentException('meals.error.option_invalid');
        }
        if ((null === $taxRate) !== (null === $includesTax) || (null !== $taxRate && (!preg_match('/^\d{1,3}(?:\.\d{1,2})?$/', $taxRate) || (float) $taxRate > 100))) {
            throw new \InvalidArgumentException('meals.error.tax_invalid');
        }
        $this->name = $name;
        $this->service = $service;
        $this->priceMinor = $priceMinor;
        $this->currency = $currency;
        $this->taxRate = $taxRate;
        $this->includesTax = $includesTax;
    }

    public function getId(): ?int { return $this->id ?? null; }
    public function setId(int $id): void { $this->id = $id; }
    public function getName(): string { return $this->name; }
    public function getService(): string { return $this->service; }
    public function getPriceMinor(): int { return $this->priceMinor; }
    public function getCurrency(): string { return $this->currency; }
    public function getTaxRate(): ?string { return $this->taxRate; }
    public function getIncludesTax(): ?bool { return $this->includesTax; }
    public function isActive(): bool { return $this->active; }
    public function setActive(bool $active): void { $this->active = $active; }
}
