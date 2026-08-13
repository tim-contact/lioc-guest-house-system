<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use App\Enums\SupplyLocation;
use App\Models\Agent;
use App\Models\Barge;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderService;
use App\Services\SurveyorAssignment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
                    'supplyLocationOptions' => $this->enumOptions(SupplyLocation::cases()),
                    'deliveryMethodOptions' => $this->enumOptions(DeliveryMode::cases()),
                    'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
                    'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
                    'assignedBarge' => null,
                ]);
            }

            $barge = $assignment['barge_id'];
            $assignedBarge = Barge::where('imo', $barge)->first(['imo', 'name']);
        } else {
            // Privileged users: use query param as before.
            $barge = $request->query('barge');
            $assignedBarge = null;
        }

        $pendingOrders = fn (): array => $barge
            ? OrderService::pending(dueWithinDays: 7)
                ->where('barge_id', $barge)
                ->load(['bdn', 'enquiry'])
                ->map(fn (Order $order): array => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'vessel_name' => $order->vessel_name,
                    'vessel_id' => $order->vessel_id,
                    'port' => $order->port?->name,
                    'location' => $order->delivery_location?->label(),
                    'delivery_location' => $order->delivery_location?->value,
                    'delivery_mode' => $order->delivery_mode?->value,
                    'barge_id' => $order->barge_id,
                    'agent_id' => $order->agent_id,
                    'pic' => $order->pic,
                    'mobile_no' => $order->mobile_no,
                    'sampling' => $order->enquiry?->sampling?->label(),
                    'quality_claim' => $order->enquiry?->quality_claim?->label(),
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

        $completedOrders = fn (): array => $barge
            ? OrderService::completedWithin()
                ->where('barge_id', $barge)
                ->flatMap(fn (Order $order): array => collect(FuelGrade::cases())
                    ->map(fn (FuelGrade $grade): array => [
                        'id' => "{$order->id}-{$grade->value}",
                        'order_id' => $order->id,
                        'vessel_name' => $order->vessel_name,
                        'port' => $order->port?->name,
                        'location' => $order->delivery_location?->label(),
                        'product' => $grade->label(),
                        'qty' => $order->{"{$grade->value}_bdn_qty"} ?? $order->{"{$grade->value}_final_qty"},
                        'eta' => $order->eta,
                    ])
                    ->filter(fn (array $row): bool => filled($row['qty']))
                    ->values()
                    ->all())
                ->values()
                ->all()
            : [];

        // Barges: surveyor sees only their assigned barge.
        $barges = $user->type->value === 'surveyor' && $assignedBarge
            ? fn () => collect([$assignedBarge])
            : fn () => Barge::orderBy('name')->get(['imo', 'name']);

        return Inertia::render('surveyor/dashboard', [
            'pendingOrders' => $pendingOrders,
            'completedOrders' => $completedOrders,
            'barges' => $barges,
            'agents' => fn () => Agent::orderBy('name')->get(['id', 'name', 'address']),
            'supplyLocationOptions' => $this->enumOptions(SupplyLocation::cases()),
            'deliveryMethodOptions' => $this->enumOptions(DeliveryMode::cases()),
            'samplingLocationOptions' => $this->enumOptions(Sampling::cases()),
            'samplingMethodOptions' => $this->enumOptions(SamplingMethod::cases()),
            'assignedBarge' => $assignedBarge,
        ]);
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
        SurveyorAssignment::authorizeOrder($request->user(), $order->barge_id);

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
        SurveyorAssignment::authorizeOrder(request()->user(), $order->barge_id);

        OrderService::complete($order);

        return $this->toast('Order completed.');
    }
}
