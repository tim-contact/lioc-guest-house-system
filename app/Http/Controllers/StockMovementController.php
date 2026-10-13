<?php

namespace App\Http\Controllers;

use App\Enums\FuelGrade;
use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use App\Models\Barge;
use App\Models\Port;
use App\Models\StockMovement;
use App\Services\StockMovementService;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class StockMovementController extends Controller
{
    public function index(Request $request, StockMovementService $stockMovementService): Response
    {
        $ports = Port::query()->orderBy('name')->get(['id', 'name']);
        $selectedPortId = (int) $request->input('port_id', $ports->first()?->id ?? 0);
        $start = CarbonImmutable::parse($request->input('date_from', now()->startOfMonth()->toDateString()))->startOfDay();
        $end = CarbonImmutable::parse($request->input('date_to', now()->endOfMonth()->toDateString()))->startOfDay();

        if ($end->lt($start)) {
            $end = $start;
        }

        return Inertia::render('stock-movements/index', [
            'ports' => $ports,
            'barges' => Barge::query()->orderBy('name')->get(['imo', 'name']),
            'movementScopeOptions' => $this->enumOptions(StockMovementScope::cases()),
            'movementTypeOptions' => $this->enumOptions($this->availableMovementTypes()),
            'filters' => [
                'port_id' => $selectedPortId,
                'date_from' => $start->toDateString(),
                'date_to' => $end->toDateString(),
            ],
            'report' => $selectedPortId > 0
                ? $stockMovementService->report($selectedPortId, $start, $end)
                : ['terminal' => [], 'barges' => [], 'totals' => []],
            'stockOverview' => $this->stockOverview($ports, $stockMovementService, $start, $end),
            'recentMovements' => $this->recentMovements($selectedPortId),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'movement_date' => ['required', 'date'],
            'port_id' => ['required', 'exists:ports,id'],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'movement_scope' => ['required', Rule::enum(StockMovementScope::class)],
            'movement_type' => ['required', Rule::in(array_map(
                fn (StockMovementType $type): string => $type->value,
                $this->availableMovementTypes(),
            ))],
            'counterparty_name' => ['nullable', 'string', 'max:255'],
            'mgo_qty' => ['nullable', 'numeric'],
            'vlsfo_qty' => ['nullable', 'numeric'],
            'hsfo_qty' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['movement_scope'] === StockMovementScope::Barge->value && blank($validated['barge_id'] ?? null)) {
            return back()->withErrors(['barge_id' => 'Select a barge for barge stock movements.'])->withInput();
        }

        if (
            $validated['movement_scope'] === StockMovementScope::Barge->value
            && $validated['movement_type'] !== StockMovementType::Loading->value
        ) {
            return back()->withErrors(['movement_type' => 'Barge movements can only be terminal-to-barge loadings.'])->withInput();
        }

        if ($validated['movement_scope'] === StockMovementScope::Terminal->value) {
            $validated['barge_id'] = null;
        }

        foreach (FuelGrade::keys() as $product) {
            $validated["{$product}_qty"] = $validated["{$product}_qty"] ?? 0;
        }

        $validated['created_by'] = $request->user()->id;

        StockMovement::create($validated);

        return $this->toast('Stock movement recorded.');
    }

    /**
     * @return list<StockMovementType>
     */
    private function availableMovementTypes(): array
    {
        return array_values(array_filter(
            StockMovementType::cases(),
            fn (StockMovementType $type): bool => in_array($type, [
                StockMovementType::Loading,
                StockMovementType::RebondTransfer,
            ], true),
        ));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentMovements(int $portId): array
    {
        return StockMovement::with(['port', 'barge'])
            ->when($portId > 0, fn ($query) => $query->where('port_id', $portId))
            ->whereIn('movement_type', array_map(
                fn (StockMovementType $type): string => $type->value,
                $this->availableMovementTypes(),
            ))
            ->latest('movement_date')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (StockMovement $movement): array => [
                'id' => $movement->id,
                'movement_date' => $movement->movement_date->toDateString(),
                'port_name' => $movement->port?->name,
                'barge_name' => $movement->barge?->name,
                'movement_scope' => $movement->movement_scope->value,
                'movement_type' => $movement->movement_type->value,
                'movement_type_label' => $this->movementTypeLabel($movement),
                'counterparty_name' => $movement->counterparty_name,
                'mgo_qty' => $movement->mgo_qty,
                'vlsfo_qty' => $movement->vlsfo_qty,
                'hsfo_qty' => $movement->hsfo_qty,
                'notes' => $movement->notes,
            ])
            ->all();
    }

    private function movementTypeLabel(StockMovement $movement): string
    {
        if ($movement->movement_type === StockMovementType::Loading) {
            return $movement->movement_scope === StockMovementScope::Terminal
                ? 'Import'
                : 'Loading';
        }

        return $movement->movement_type->label();
    }

    /**
     * @param  Collection<int, Port>  $ports
     * @return array<string, mixed>
     */
    private function stockOverview(Collection $ports, StockMovementService $stockMovementService, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $trackedBarges = [
            '9021291' => 'MT CEYLON STAR',
            '8923844' => 'MT SOUTHERN STAR',
            '8530570' => 'MT SANVI69',
        ];

        $reportsByPort = $ports
            ->filter(fn (Port $port): bool => in_array(strtolower($port->name), ['colombo', 'trincomalee', 'trinco'], true))
            ->mapWithKeys(fn (Port $port): array => [
                strtolower($port->name) => $stockMovementService->report($port->id, $start, $end),
            ]);

        $colomboReport = $reportsByPort->get('colombo', ['totals' => []]);
        $trincoReport = $reportsByPort->get('trincomalee', $reportsByPort->get('trinco', ['totals' => []]));

        $bargeTotals = collect($trackedBarges)
            ->map(function (string $name, string $imo) use ($reportsByPort): array {
                $closingBalance = $reportsByPort->reduce(
                    fn (array $totals, array $report): array => $this->addProductTotals(
                        $totals,
                        $report['barge_balances'][$imo] ?? $this->emptyProductTotals(),
                    ),
                    $this->emptyProductTotals(),
                );

                return [
                    'imo' => $imo,
                    'name' => $name,
                    'totals' => $closingBalance,
                ];
            })
            ->values()
            ->all();

        $colomboTerminal = $colomboReport['totals']['terminal_closing'] ?? $this->emptyProductTotals();
        $trincoTerminal = $trincoReport['totals']['terminal_closing'] ?? $this->emptyProductTotals();
        $bargeAggregate = collect($bargeTotals)
            ->reduce(
                fn (array $totals, array $barge): array => $this->addProductTotals($totals, $barge['totals']),
                $this->emptyProductTotals(),
            );

        return [
            'colombo_terminal' => $colomboTerminal,
            'trinco_terminal' => $trincoTerminal,
            'tracked_barges' => $bargeTotals,
            'balance_on_hand' => $this->addProductTotals(
                $this->addProductTotals($colomboTerminal, $trincoTerminal),
                $bargeAggregate,
            ),
        ];
    }

    /**
     * @return array<string, float>
     */
    private function emptyProductTotals(): array
    {
        return array_fill_keys(FuelGrade::keys(), 0.0);
    }

    /**
     * @param  array<string, float>  $first
     * @param  array<string, float>  $second
     * @return array<string, float>
     */
    private function addProductTotals(array $first, array $second): array
    {
        $totals = $this->emptyProductTotals();

        foreach (FuelGrade::keys() as $product) {
            $totals[$product] = ($first[$product] ?? 0) + ($second[$product] ?? 0);
        }

        return $totals;
    }
}
