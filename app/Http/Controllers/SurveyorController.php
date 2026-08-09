<?php

namespace App\Http\Controllers;

use App\Models\Barge;
use App\Models\Surveyor;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SurveyorController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('surveyors/edit', [
            'surveyors' => Surveyor::latest()->get(),
            'barges' => Barge::orderBy('name')->get(['imo', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Surveyor::create($request->validate($this->rules()));

        return $this->toast('Surveyor created.');
    }

    public function update(Request $request, Surveyor $surveyor): RedirectResponse
    {
        $surveyor->update($request->validate($this->rules()));

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
    private function rules(): array
    {
        return [
            'survey_company' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'mail_id' => ['nullable', 'email', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'barge_id' => ['nullable', 'exists:barges,imo'],
        ];
    }
}
