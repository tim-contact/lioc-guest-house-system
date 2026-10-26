<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\SupplyLocation;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

abstract class Controller
{
    /**
     * Redirect back with a flash toast (see HandleInertiaRequests + useFlashToast).
     */
    protected function toast(string $message, string $type = 'success'): RedirectResponse
    {
        return back()->with('toast', [
            'id' => (string) Str::uuid(),
            'type' => $type,
            'message' => $message,
        ]);
    }

    /**
     * Map backed-enum cases to headline-cased select options.
     *
     * @param  array<int, \BackedEnum>  $cases
     * @return array<int, array{value: string, label: string}>
     */
    protected function enumOptions(array $cases): array
    {
        return array_map(fn (\BackedEnum $case) => [
            'value' => (string) $case->value,
            'label' => method_exists($case, 'label') ? $case->label() : Str::headline($case->name),
        ], $cases);
    }

    /**
     * Real supply locations, scoped by port for dependent dropdowns.
     *
     * @return array<int, array{value: string, label: string, port_id: int, location_type: string}>
     */
    protected function supplyLocationOptions(): array
    {
        return SupplyLocation::query()
            ->join('ports', 'ports.id', '=', 'supply_locations.port_id')
            ->orderBy('ports.name')
            ->orderBy('supply_locations.name')
            ->get(['supply_locations.id', 'supply_locations.name', 'supply_locations.port_id', 'supply_locations.location_type'])
            ->map(fn (SupplyLocation $location): array => [
                'value' => (string) $location->id,
                'label' => $location->name,
                'port_id' => $location->port_id,
                'location_type' => $location->location_type->value,
            ])
            ->all();
    }

    /**
     * Agency and PIC lists backing the shared <AgentContactFields> trio.
     * Column lists mirror AgentOption / AgentPicOption in resources/js/types/ui.ts.
     *
     * @return array<string, mixed>
     */
    protected function agentContactProps(): array
    {
        return [
            'agents' => Agent::orderBy('name')->get(['id', 'name', 'address']),
            'agentPics' => AgentPic::with('contactNumbers')
                ->orderBy('name')
                ->get(['id', 'agent_id', 'name', 'mobile'])
                ->map(fn (AgentPic $pic): array => [
                    'id' => $pic->id,
                    'agent_id' => $pic->agent_id,
                    'name' => $pic->name,
                    'mobile' => $pic->mobile,
                    'contact_numbers' => $pic->contactNumbers->pluck('value')->values(),
                ]),
        ];
    }

    /**
     * Accept a PIC only when it belongs to the agency submitted alongside it,
     * so an order can never snapshot a mismatched agency/PIC pair.
     */
    protected function agentPicRule(Request $request): Exists
    {
        return Rule::exists('agent_pics', 'id')->where('agent_id', $request->input('agent_id'));
    }

    /**
     * Accept a supply location only when it belongs to the selected port.
     */
    protected function supplyLocationRule(int|string|null $portId = null): Exists
    {
        $rule = Rule::exists('supply_locations', 'id');

        if (! filled($portId)) {
            $rule->where(fn ($query) => $query->whereRaw('1 = 0'));

            return $rule;
        }

        $rule->where('port_id', $portId);

        return $rule;
    }

    /**
     * The label of the first reference that still has rows, or null when none do.
     * Use before deleting a record other tables have a foreign key to, so the
     * constraint violation becomes a toast instead of a 500.
     *
     * @param  array<string, \Illuminate\Database\Eloquent\Builder<*>>  $references
     */
    protected function inUseBy(array $references): ?string
    {
        foreach ($references as $label => $query) {
            if ($query->exists()) {
                return $label;
            }
        }

        return null;
    }

    /**
     * Delete a record unless another table still references it, either way
     * reporting the outcome as a toast. `$noun` names the record in both
     * messages, e.g. 'Customer'.
     *
     * @param  array<string, \Illuminate\Database\Eloquent\Builder<*>>  $references
     */
    protected function deleteGuarded(Model $model, string $noun, array $references): RedirectResponse
    {
        $inUseBy = $this->inUseBy($references);

        if ($inUseBy !== null) {
            return $this->toast(
                'Cannot delete this '.Str::lower($noun).": it is still referenced by {$inUseBy}.",
                'error',
            );
        }

        $model->delete();

        return $this->toast("{$noun} deleted.");
    }
}
