<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SurveyorAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SurveyingController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $assignment = SurveyorAssignment::resolve($user);

        // Surveyor users: force barge from assignment, ignore query param.
        if ($user->type->value === 'surveyor') {
            if ($assignment['denied']) {
                return Inertia::render('surveyor/dashboard', [
                    'pendingOrders' => [],
                    'completedOrders' => [],
                    'barges' => [],
                    'agents' => fn () => Agent::orderBy('name')->get(['id', 'name', 'address']),
                    'supplyLocationOptions' => $this->supplyLocationOptions(),
                    'deliveryMethodOptions' => $this->enumOptions(DeliveryMode::cases()),
                    'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
                    'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
                    'assignedBarge' => null,
                    'assignedDeliveryModes' => [],
                    'selectedScope' => null,
                ]);
            }

            $assignedBargeIds = $assignment['barge_ids'];
            $assignedDeliveryModes = $assignment['delivery_modes'];
            $filterBargeIds = $assignedBargeIds;
            $filterDeliveryModes = $assignedDeliveryModes;
            $selectedScope = null;
            $requestedScope = $request->query('barge');
            $requestedDeliveryMode = is_string($requestedScope) && str_starts_with($requestedScope, 'delivery:')
                ? DeliveryMode::tryFrom(substr($requestedScope, 9))
                : null;
            $barge = is_string($requestedScope)
                && $requestedDeliveryMode === null
                && in_array($requestedScope, $assignedBargeIds, true)
                    ? $requestedScope
                    : null;

            if ($barge !== null) {
                $selectedScope = $barge;
            } elseif ($requestedDeliveryMode !== null && in_array($requestedDeliveryMode->value, $assignedDeliveryModes, true)) {
                $selectedScope = 'delivery:'.$requestedDeliveryMode->value;
                $filterBargeIds = [];
                $filterDeliveryModes = [$requestedDeliveryMode->value];
            }

            $assignedBarges = Barge::whereIn('imo', $assignedBargeIds)
                ->orderBy('name')
                ->get(['imo', 'name']);

            $scopeCount = count($assignedBargeIds) + count($assignedDeliveryModes);
            $barge = $selectedScope === null && $scopeCount === 1 && count($assignedBargeIds) === 1
                ? $assignedBargeIds[0]
                : $barge;

            if ($selectedScope === null && $scopeCount === 1 && count($assignedDeliveryModes) === 1) {
                $selectedScope = 'delivery:'.$assignedDeliveryModes[0];
                $filterBargeIds = [];
                $filterDeliveryModes = [$assignedDeliveryModes[0]];
            } elseif ($barge !== null) {
                $selectedScope = $barge;
            }

            $assignedBarge = $barge
                ? $assignedBarges->firstWhere('imo', $barge)
                : null;
        } else {
            // Privileged users: use query param for either a barge IMO or a delivery-mode scope.
            $selectedScope = $request->query('barge');
            $selectedDeliveryMode = is_string($selectedScope) && str_starts_with($selectedScope, 'delivery:')
                ? DeliveryMode::tryFrom(substr($selectedScope, 9))
                : null;
            $barge = $selectedDeliveryMode === null
                ? $selectedScope
                : null;
            $assignedBarge = null;
            $assignedBargeIds = [];
            $filterBargeIds = [];
            $assignedDeliveryModes = $selectedDeliveryMode !== null && $selectedDeliveryMode !== DeliveryMode::Barge
                ? [$selectedDeliveryMode->value]
                : [];
            $filterDeliveryModes = $assignedDeliveryModes;
            $assignedBarges = collect();
            $selectedScope = is_string($selectedScope) ? $selectedScope : null;
        }

        $pendingOrders = fn (): array => ($barge || $filterBargeIds !== [] || $filterDeliveryModes !== [])
            ? $this->filterByAssignment(OrderService::pending(dueWithinDays: 7), $barge, $filterBargeIds, $filterDeliveryModes)
                ->load(['bdn', 'enquiry'])
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'vessel_name' => $order->vessel_name,
                    'vessel_id' => $order->vessel_id,
                    'port_id' => $order->port_id,
                    'port' => $order->port?->name,
                    'location' => $order->deliveryLocation?->name,
                    'delivery_location_id' => $order->delivery_location_id,
                    'delivery_mode' => $order->delivery_mode?->value,
                    'barge_id' => $order->barge_id,
                    'agent_id' => $order->agent_id,
                    'pic' => $order->pic,
                    'mobile_no' => $order->mobile_no,
                    'sampling' => $order->enquiry?->sampling?->label(),
                    'instructions' => $order->enquiry?->instructions,
                    'vlsfo_qty' => $order->vlsfo_final_qty,
                    'mgo_qty' => $order->mgo_final_qty,
                    'hsfo_qty' => $order->hsfo_final_qty,
                    'vlsfo_bdn_qty' => $order->vlsfo_bdn_qty,
                    'mgo_bdn_qty' => $order->mgo_bdn_qty,
                    'hsfo_bdn_qty' => $order->hsfo_bdn_qty,
                    'grades' => $this->orderedGrades($order),
                    'bdn' => $order->bdn,
                    'eta' => $order->eta,
                ])
                ->values()
                ->all()
            : [];

        $completedOrders = fn (): array => ($barge || $filterBargeIds !== [] || $filterDeliveryModes !== [])
            ? $this->filterByAssignment(OrderService::completedWithin(7), $barge, $filterBargeIds, $filterDeliveryModes)
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'vessel_name' => $order->vessel_name,
                    'port' => $order->port?->name,
                    'location' => $order->deliveryLocation?->name,
                    'vlsfo_qty' => $order->vlsfo_bdn_qty ?? $order->vlsfo_final_qty,
                    'mgo_qty' => $order->mgo_bdn_qty ?? $order->mgo_final_qty,
                    'hsfo_qty' => $order->hsfo_bdn_qty ?? $order->hsfo_final_qty,
                    'eta' => $order->eta,
                ])
                ->values()
                ->all()
            : [];

        // Barges: surveyor sees only their assigned barges.
        $barges = $user->type->value === 'surveyor'
            ? fn () => $assignedBarges
            : fn () => Barge::orderBy('name')->get(['imo', 'name']);

        return Inertia::render('surveyor/dashboard', [
            'pendingOrders' => $pendingOrders,
            'completedOrders' => $completedOrders,
            'barges' => $barges,
            'agents' => fn () => Agent::orderBy('name')->get(['id', 'name', 'address']),
            'supplyLocationOptions' => $this->supplyLocationOptions(),
            'deliveryMethodOptions' => $this->enumOptions(DeliveryMode::cases()),
            'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
            'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
            'assignedBarge' => $assignedBarge,
            'assignedDeliveryModes' => $user->type->value === 'surveyor' ? $assignedDeliveryModes : [],
            'selectedScope' => $selectedScope,
        ]);
    }

    /**
     * @param  Collection<int, Order>  $orders
     * @param  list<string>  $bargeIds
     * @return Collection<int, Order>
     */
    private function filterByAssignment(Collection $orders, ?string $barge, array $bargeIds, array $deliveryModes): Collection
    {
        if ($barge) {
            return $orders->where('barge_id', $barge);
        }

        return $orders->filter(fn (Order $order): bool => (($order->delivery_mode === DeliveryMode::Barge
            || ($order->delivery_mode === null && $order->barge_id !== null))
            && $order->barge_id !== null
            && in_array($order->barge_id, $bargeIds, true))
            || ($order->delivery_mode !== null
                && $order->delivery_mode !== DeliveryMode::Barge
                && in_array($order->delivery_mode->value, $deliveryModes, true)));
    }

    /**
     * The fuel grades this order actually covers, so the BDN dialog only
     * renders the blocks the surveyor has to fill in.
     *
     * @return array<int, array{value: string, label: string}>
     */
    private function orderedGrades(Order $order): array
    {
        return collect(FuelGrade::cases())
            ->filter(fn (FuelGrade $grade): bool => filled($order->{"{$grade->value}_final_qty"})
                || filled($order->{"{$grade->value}_quantity_high"})
                || filled($order->{"{$grade->value}_quantity_low"}))
            ->map(fn (FuelGrade $grade): array => ['value' => $grade->value, 'label' => $grade->label()])
            ->values()
            ->all();
    }

    public function update(Request $request, Order $order): RedirectResponse
    {
        SurveyorAssignment::authorizeOrder($request->user(), $order);

        $validated = $request->validate([
            'vlsfo_bdn_qty' => ['nullable', 'numeric', 'min:0'],
            'mgo_bdn_qty' => ['nullable', 'numeric', 'min:0'],
            'hsfo_bdn_qty' => ['nullable', 'numeric', 'min:0'],
        ]);

        $order->update($validated);
        OrderService::reprice($order);

        return $this->toast('Order updated.');
    }

    public function complete(Order $order): RedirectResponse
    {
        SurveyorAssignment::authorizeOrder(request()->user(), $order);

        OrderService::complete($order);

        return $this->toast('Order completed.');
    }
}
