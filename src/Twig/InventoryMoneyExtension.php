<?php

declare(strict_types=1);

namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

/** Formats integer minor-unit inventory costs with their recorded currency. */
final class InventoryMoneyExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [new TwigFilter('inventory_money', [$this, 'formatMoney'])];
    }

    public function formatMoney(int $minorUnits, string $currency, string $locale): string
    {
        $formatter = new \NumberFormatter($locale, \NumberFormatter::CURRENCY);
        return $formatter->formatCurrency($minorUnits / 100, $currency);
    }
}
