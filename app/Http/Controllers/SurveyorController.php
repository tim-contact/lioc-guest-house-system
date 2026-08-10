<?php

namespace App\Http\Controllers;

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
            'surveyors' => Surveyor::with('user')->latest()->get()
                ->map(fn (Surveyor $s) => [
                    'id' => $s->id,
                    'survey_company' => $s->survey_company,
                    'name' => $s->name,
                    'mail_id' => $s->mail_id,
                    'contact' => $s->contact,
                    'barge_id' => $s->barge_id,
                    'user_id' => $s->user_id,
                    'user_name' => $s->user?->name,
                    'user_email' => $s->user?->email,
                ]),
            'barges' => Barge::orderBy('name')->get(['imo', 'name']),
            'availableUsers' => $availableUsers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Surveyor::create($request->validate($this->rules()));

        return $this->toast('Surveyor created.');
    }

    public function update(Request $request, Surveyor $surveyor): RedirectResponse
    {
        $surveyor->update($request->validate($this->rules($surveyor)));

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
            'user_id' => $userIdRule,
        ];
    }
}
