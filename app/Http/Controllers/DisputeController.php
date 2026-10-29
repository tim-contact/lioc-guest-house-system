<?php

namespace App\Http\Controllers;

use App\Enums\ActionStatus;
use App\Enums\DisputeStatus;
use App\Enums\DisputeType;
use App\Enums\ProposedActionPlan;
use App\Models\Dispute;
use App\Models\Order;
use App\Services\DisputeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DisputeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('disputes/dashboard', [
            'disputes' => $this->rows(),
            ...$this->enumOptionProps(),
        ]);
    }

    public function table(): Response
    {
        return Inertia::render('disputes/table', [
            'disputes' => $this->rows(),
            ...$this->enumOptionProps(),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $dates = $request->validate([
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        return response()->json(['rows' => Dispute::with('order.customer', 'order.port', 'order.deliveryLocation')
            ->whereDate('created_at', '>=', $dates['date_from'])
            ->whereDate('created_at', '<=', $dates['date_to'])
            ->latest()->get()
            ->map(fn (Dispute $dispute): array => DisputeService::toRow($dispute, $dispute->order))->values()]);
    }

    public function store(Request $request, Order $order): RedirectResponse
    {
        $validated = $request->validate([
            'type_of_dispute' => ['required', Rule::enum(DisputeType::class)],
        ]);

        $order->disputes()->create($validated);

        return $this->toast('Dispute created.');
    }

    public function update(Request $request, Dispute $dispute): RedirectResponse
    {
        $dispute->update($request->validate($this->editableRules()));

        return $this->toast('Dispute updated.');
    }

    public function close(Request $request, Dispute $dispute): RedirectResponse
    {
        $rules = $this->editableRules();
        $rules['dispute_closure_remark'] = ['required', 'string'];

        $dispute->update([
            ...$request->validate($rules),
            'dispute_status' => DisputeStatus::Closed,
        ]);

        return $this->toast('Dispute closed.');
    }

    public function reopen(Dispute $dispute): RedirectResponse
    {
        $dispute->update(['dispute_status' => DisputeStatus::Open]);

        return $this->toast('Dispute reopened.');
    }

    public function destroy(Dispute $dispute): RedirectResponse
    {
        $dispute->delete();

        return $this->toast('Dispute deleted.');
    }

    /**
     * The rows shared by the disputes dashboard and the admin table.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function rows(): Collection
    {
        return Dispute::with('order.customer', 'order.port')
            ->latest()
            ->get()
            ->map(fn (Dispute $dispute): array => DisputeService::toRow($dispute, $dispute->order));
    }

    /**
     * @return array<string, array<int, array{value: string, label: string}>>
     */
    private function enumOptionProps(): array
    {
        return [
            'disputeTypeOptions' => $this->enumOptions(DisputeType::cases()),
            'proposedActionPlanOptions' => $this->enumOptions(ProposedActionPlan::cases()),
            'actionStatusOptions' => $this->enumOptions(ActionStatus::cases()),
        ];
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function editableRules(): array
    {
        $rules = [
            'type_of_dispute' => ['required', Rule::enum(DisputeType::class)],
            'dispute_value' => ['nullable', 'numeric', 'min:0'],
            'testing_date' => ['nullable', 'date'],
            'proposed_action_plan' => ['nullable', Rule::enum(ProposedActionPlan::class)],
            'action_status' => ['nullable', Rule::enum(ActionStatus::class)],
            'dispute_closure_remark' => ['nullable', 'string'],
        ];

        foreach (Dispute::PARAMETER_FIELDS as $field) {
            $rules[$field] = ['nullable', 'numeric', 'min:0'];
        }

        return $rules;
    }
}
