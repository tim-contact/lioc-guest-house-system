<?php

namespace App\Http\Controllers;

use App\Enums\DeliveryMode;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Surveyor;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SurveyorController extends Controller
{
    public function edit(): Response
    {
        // Available surveyor-type users (unlinked or linked to the record being edited).
        $linkedUserIds = Surveyor::whereNotNull('user_id')->pluck('user_id');

        $availableUsers = User::where('type', UserType::Surveyor)
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'already_linked' => $linkedUserIds->contains($user->id),
            ]);

        return Inertia::render('surveyors/edit', [
            'surveyors' => Surveyor::with(['user', 'barges', 'deliveryModeAssignments'])->latest()->get()
                ->map(fn (Surveyor $s) => [
                    'id' => $s->id,
                    'survey_company' => $s->survey_company,
                    'name' => $s->name,
                    'mail_id' => $s->mail_id,
                    'contact' => $s->contact,
                    'barge_id' => $s->barge_id,
                    'barge_ids' => $s->barges->pluck('imo')->values(),
                    'delivery_modes' => $s->deliveryModeAssignments
                        ->pluck('delivery_mode')
                        ->map(fn (DeliveryMode|string $mode): string => $mode instanceof DeliveryMode ? $mode->value : $mode)
                        ->values(),
                    'user_id' => $s->user_id,
                    'user_name' => $s->user?->name,
                    'user_email' => $s->user?->email,
                ]),
            'barges' => Barge::orderBy('name')->get(['imo', 'name']),
            'deliveryModeOptions' => $this->enumOptions([DeliveryMode::Truck, DeliveryMode::Pipeline]),
            'availableUsers' => $availableUsers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());
        $bargeIds = $this->bargeIdsFrom($validated);
        $deliveryModes = $this->deliveryModesFrom($validated);
        unset($validated['barge_ids'], $validated['delivery_modes']);

        $validated['barge_id'] = $bargeIds[0] ?? null;

        $surveyor = Surveyor::create($validated);
        $surveyor->barges()->sync($bargeIds);
        $this->syncDeliveryModes($surveyor, $deliveryModes);

        return $this->toast('Surveyor created.');
    }

    public function update(Request $request, Surveyor $surveyor): RedirectResponse
    {
        $validated = $request->validate($this->rules($surveyor));
        $bargeIds = $this->bargeIdsFrom($validated);
        $deliveryModes = $this->deliveryModesFrom($validated);
        unset($validated['barge_ids'], $validated['delivery_modes']);

        $validated['barge_id'] = $bargeIds[0] ?? null;

        $surveyor->update($validated);
        $surveyor->barges()->sync($bargeIds);
        $this->syncDeliveryModes($surveyor, $deliveryModes);

        return $this->toast('Surveyor saved.');
    }

    public function destroy(Surveyor $surveyor): RedirectResponse
    {
        $surveyor->delete();

        return $this->toast('Surveyor deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Surveyor $surveyor = null): array
    {
        $userIdRule = ['nullable', 'exists:users,id'];

        if ($surveyor) {
            $userIdRule[] = Rule::unique('surveyors', 'user_id')->ignore($surveyor->id);
        } else {
            $userIdRule[] = 'unique:surveyors,user_id';
        }

        return [
            'survey_company' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'mail_id' => ['nullable', 'email', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'barge_id' => ['nullable', 'exists:barges,imo'],
            'barge_ids' => ['nullable', 'array'],
            'barge_ids.*' => ['string', 'exists:barges,imo'],
            'delivery_modes' => ['nullable', 'array'],
            'delivery_modes.*' => [Rule::in([DeliveryMode::Truck->value, DeliveryMode::Pipeline->value])],
            'user_id' => $userIdRule,
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<string>
     */
    private function bargeIdsFrom(array $validated): array
    {
        if (array_key_exists('barge_ids', $validated)) {
            return collect($validated['barge_ids'])->filter()->unique()->values()->all();
        }

        return filled($validated['barge_id'] ?? null)
            ? [(string) $validated['barge_id']]
            : [];
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<string>
     */
    private function deliveryModesFrom(array $validated): array
    {
        return array_key_exists('delivery_modes', $validated)
            ? collect($validated['delivery_modes'])->filter()->unique()->values()->all()
            : [];
    }

    /**
     * @param  list<string>  $deliveryModes
     */
    private function syncDeliveryModes(Surveyor $surveyor, array $deliveryModes): void
    {
        $surveyor->deliveryModeAssignments()->delete();

        foreach ($deliveryModes as $deliveryMode) {
            $surveyor->deliveryModeAssignments()->create([
                'delivery_mode' => $deliveryMode,
            ]);
        }
    }
}
