<?php

namespace App\Services;

use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use App\Models\Bdn;
use App\Models\StockMovement;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Support\Collection;

class StockMovementService
{
    /**
     * @return array{
     *     terminal: list<array<string, mixed>>,
     *     barges: list<array<string, mixed>>,
     *     totals: array<string, array<string, float>>
     * }
     */
    public function report(int $portId, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $movements = StockMovement::with('barge')
            ->where('port_id', $portId)
            ->whereDate('movement_date', '<=', $end->toDateString())
            ->orderBy('movement_date')
            ->get();

        $deliveries = Bdn::with(['order.barge'])
            ->whereHas('order', fn ($query) => $query
                ->where('port_id', $portId)
                ->whereIn('status', [OrderStatus::Delivered, OrderStatus::Closed]))
            ->whereDate('delivery_date', '<=', $end->toDateString())
            ->get();

        $products = FuelGrade::keys();
        $terminalBalance = $this->emptyProductTotals();
        $deadStockBalance = $this->emptyProductTotals();
        $bargeBalances = [];
        $bargeNames = [];
        $terminalRows = [];
        $bargeRows = [];

        $this->applyPreRangeBalances($movements, $deliveries, $start, $terminalBalance, $deadStockBalance, $bargeBalances, $bargeNames);

        foreach (CarbonPeriod::create($start, $end) as $date) {
            $day = CarbonImmutable::instance($date)->startOfDay();

            $terminalOpening = $terminalBalance;
            $deadStockOpening = $deadStockBalance;
            $dailyTerminalOpening = $this->sumManualMovements($movements, $day, StockMovementScope::Terminal, [StockMovementType::Opening]);
            $dailyTerminalIn = $this->sumManualMovements($movements, $day, StockMovementScope::Terminal, [
                StockMovementType::Loading,
                StockMovementType::RebondTransfer,
            ]);
            $dailyDeadStock = $this->sumManualMovements($movements, $day, StockMovementScope::Terminal, [StockMovementType::DeadStock]);
            $dailyBargeLoadings = $this->sumManualMovements($movements, $day, StockMovementScope::Barge, [StockMovementType::Loading]);

            foreach ($products as $product) {
                $terminalBalance[$product] += $dailyTerminalOpening[$product]
                    + $dailyTerminalIn[$product]
                    - $dailyBargeLoadings[$product];

                $deadStockBalance[$product] += $dailyDeadStock[$product];
            }

            $terminalRows[] = [
                'date' => $day->toDateString(),
                'opening' => $terminalOpening,
                'opening_entries' => $dailyTerminalOpening,
                'loadings' => $dailyTerminalIn,
                'dead_stock_opening' => $deadStockOpening,
                'dead_stock' => $dailyDeadStock,
                'dead_stock_closing' => $deadStockBalance,
                'barge_loadings' => $dailyBargeLoadings,
                'closing' => $terminalBalance,
            ];

            $dayBargeIds = collect()
                ->merge($this->dailyBargeMovementIds($movements, $day))
                ->merge($this->dailyDeliveryBargeIds($deliveries, $day))
                ->unique()
                ->filter()
                ->values();

            foreach ($dayBargeIds as $bargeId) {
                $bargeId = (string) $bargeId;
                $bargeBalances[$bargeId] ??= $this->emptyProductTotals();
                $bargeNames[$bargeId] ??= $this->bargeName($movements, $deliveries, $bargeId);

                $opening = $bargeBalances[$bargeId];
                $bargeOpening = $this->sumManualMovements($movements, $day, StockMovementScope::Barge, [StockMovementType::Opening], $bargeId);
                $bargeLoading = $this->sumManualMovements($movements, $day, StockMovementScope::Barge, [StockMovementType::Loading], $bargeId);
                $bargeDeliveries = $this->sumDeliveries($deliveries, $day, $bargeId);

                foreach ($products as $product) {
                    $bargeBalances[$bargeId][$product] += $bargeOpening[$product]
                        + $bargeLoading[$product]
                        - $bargeDeliveries[$product];
                }

                $bargeRows[] = [
                    'date' => $day->toDateString(),
                    'barge_id' => $bargeId,
                    'barge_name' => $bargeNames[$bargeId] ?? $bargeId,
                    'opening' => $opening,
                    'opening_entries' => $bargeOpening,
                    'loadings' => $bargeLoading,
                    'deliveries' => $bargeDeliveries,
                    'closing' => $bargeBalances[$bargeId],
                ];
            }
        }

        return [
            'terminal' => $terminalRows,
            'barges' => $bargeRows,
            'totals' => [
                'terminal_closing' => $terminalBalance,
                'barge_closing' => $this->sumBargeBalances($bargeBalances),
                'dead_stock' => $deadStockBalance,
                'removable_closing' => $this->subtractTotals(
                    $this->addTotals($terminalBalance, $this->sumBargeBalances($bargeBalances)),
                    $deadStockBalance,
                ),
            ],
        ];
    }

    /**
     * @param  Collection<int, StockMovement>  $movements
     * @param  Collection<int, Bdn>  $deliveries
     * @param  array<string, float>  $terminalBalance
     * @param  array<string, float>  $deadStockBalance
     * @param  array<string, array<string, float>>  $bargeBalances
     * @param  array<string, string>  $bargeNames
     */
    private function applyPreRangeBalances(
        Collection $movements,
        Collection $deliveries,
        CarbonImmutable $start,
        array &$terminalBalance,
        array &$deadStockBalance,
        array &$bargeBalances,
        array &$bargeNames,
    ): void {
        $movements
            ->filter(fn (StockMovement $movement): bool => $movement->movement_date->lt($start))
            ->each(function (StockMovement $movement) use (&$terminalBalance, &$deadStockBalance, &$bargeBalances, &$bargeNames, $movements, $deliveries): void {
                if ($movement->movement_type === StockMovementType::Adjustment) {
                    return;
                }

                if ($movement->movement_scope === StockMovementScope::Terminal) {
                    foreach (FuelGrade::keys() as $product) {
                        if ($movement->movement_type === StockMovementType::DeadStock) {
                            $deadStockBalance[$product] += (float) $movement->{"{$product}_qty"};

                            continue;
                        }

                        $terminalBalance[$product] += (float) $movement->{"{$product}_qty"};
                    }

                    return;
                }

                if ($movement->barge_id === null) {
                    return;
                }

                $bargeBalances[$movement->barge_id] ??= $this->emptyProductTotals();
                $bargeNames[$movement->barge_id] ??= $this->bargeName($movements, $deliveries, $movement->barge_id);

                foreach (FuelGrade::keys() as $product) {
                    $quantity = (float) $movement->{"{$product}_qty"};

                    if ($movement->movement_type === StockMovementType::Loading) {
                        $terminalBalance[$product] -= $quantity;
                    }

                    $bargeBalances[$movement->barge_id][$product] += $quantity;
                }
            });

        $deliveries
            ->filter(fn (Bdn $bdn): bool => $bdn->delivery_date?->lt($start) === true)
            ->each(function (Bdn $bdn) use (&$bargeBalances, &$bargeNames, $movements, $deliveries): void {
                $bargeId = $bdn->barge_id ?? $bdn->order?->barge_id;

                if ($bargeId === null) {
                    return;
                }

                $bargeBalances[$bargeId] ??= $this->emptyProductTotals();
                $bargeNames[$bargeId] ??= $this->bargeName($movements, $deliveries, $bargeId);

                foreach (FuelGrade::keys() as $product) {
                    $bargeBalances[$bargeId][$product] -= (float) ($bdn->order?->{"{$product}_bdn_qty"} ?? $bdn->{"{$product}_metric_ton"} ?? 0);
                }
            });
    }

    /**
     * @return array<string, float>
     */
    private function emptyProductTotals(): array
    {
        return array_fill_keys(FuelGrade::keys(), 0.0);
    }

    /**
     * @param  Collection<int, StockMovement>  $movements
     * @param  list<StockMovementType>  $types
     * @return array<string, float>
     */
    private function sumManualMovements(
        Collection $movements,
        CarbonImmutable $date,
        StockMovementScope $scope,
        array $types,
        ?string $bargeId = null,
    ): array {
        $totals = $this->emptyProductTotals();

        $movements
            ->filter(fn (StockMovement $movement): bool => $movement->movement_date->isSameDay($date)
                && $movement->movement_scope === $scope
                && in_array($movement->movement_type, $types, true)
                && ($bargeId === null || $movement->barge_id === $bargeId))
            ->each(function (StockMovement $movement) use (&$totals): void {
                foreach (FuelGrade::keys() as $product) {
                    $totals[$product] += (float) $movement->{"{$product}_qty"};
                }
            });

        return $totals;
    }

    /**
     * @param  Collection<int, Bdn>  $deliveries
     * @return array<string, float>
     */
    private function sumDeliveries(Collection $deliveries, CarbonImmutable $date, string $bargeId): array
    {
        $totals = $this->emptyProductTotals();

        $deliveries
            ->filter(fn (Bdn $bdn): bool => $bdn->delivery_date?->isSameDay($date) === true
                && ($bdn->barge_id ?? $bdn->order?->barge_id) === $bargeId)
            ->each(function (Bdn $bdn) use (&$totals): void {
                foreach (FuelGrade::keys() as $product) {
                    $totals[$product] += (float) ($bdn->order?->{"{$product}_bdn_qty"} ?? $bdn->{"{$product}_metric_ton"} ?? 0);
                }
            });

        return $totals;
    }

    /**
     * @param  Collection<int, StockMovement>  $movements
     * @return list<string>
     */
    private function dailyBargeMovementIds(Collection $movements, CarbonImmutable $date): array
    {
        return $movements
            ->filter(fn (StockMovement $movement): bool => $movement->movement_scope === StockMovementScope::Barge
                && $movement->movement_date->isSameDay($date)
                && $movement->movement_type !== StockMovementType::Adjustment
                && $movement->barge_id !== null)
            ->pluck('barge_id')
            ->all();
    }

    /**
     * @param  Collection<int, Bdn>  $deliveries
     * @return list<string>
     */
    private function dailyDeliveryBargeIds(Collection $deliveries, CarbonImmutable $date): array
    {
        return $deliveries
            ->filter(fn (Bdn $bdn): bool => $bdn->delivery_date?->isSameDay($date) === true)
            ->map(fn (Bdn $bdn): ?string => $bdn->barge_id ?? $bdn->order?->barge_id)
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, StockMovement>  $movements
     * @param  Collection<int, Bdn>  $deliveries
     */
    private function bargeName(Collection $movements, Collection $deliveries, string $bargeId): string
    {
        $movementBarge = $movements->firstWhere('barge_id', $bargeId)?->barge?->name;

        if ($movementBarge !== null) {
            return $movementBarge;
        }

        return $deliveries->first(
            fn (Bdn $bdn): bool => ($bdn->barge_id ?? $bdn->order?->barge_id) === $bargeId,
        )?->barge?->name ?? $bargeId;
    }

    /**
     * @param  array<string, array<string, float>>  $bargeBalances
     * @return array<string, float>
     */
    private function sumBargeBalances(array $bargeBalances): array
    {
        $totals = $this->emptyProductTotals();

        foreach ($bargeBalances as $balance) {
            foreach (FuelGrade::keys() as $product) {
                $totals[$product] += $balance[$product] ?? 0;
            }
        }

        return $totals;
    }

    /**
     * @param  array<string, float>  $first
     * @param  array<string, float>  $second
     * @return array<string, float>
     */
    private function addTotals(array $first, array $second): array
    {
        $totals = $this->emptyProductTotals();

        foreach (FuelGrade::keys() as $product) {
            $totals[$product] = ($first[$product] ?? 0) + ($second[$product] ?? 0);
        }

        return $totals;
    }

    /**
     * @param  array<string, float>  $first
     * @param  array<string, float>  $second
     * @return array<string, float>
     */
    private function subtractTotals(array $first, array $second): array
    {
        $totals = $this->emptyProductTotals();

        foreach (FuelGrade::keys() as $product) {
            $totals[$product] = ($first[$product] ?? 0) - ($second[$product] ?? 0);
        }

        return $totals;
    }
}
