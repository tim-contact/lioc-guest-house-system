<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\AgentPic;
use App\Models\ContactInformation;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AgentPicController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('agent-pics/index', [
            'pics' => AgentPic::with(['agent', 'contactNumbers'])
                ->get(['id', 'agent_id', 'name', 'mobile'])
                ->map(fn (AgentPic $pic): array => [
                    'id' => $pic->id,
                    'agent_id' => $pic->agent_id,
                    'agent_name' => $pic->agent->name,
                    'name' => $pic->name,
                    'mobile' => $pic->mobile,
                    'contact_numbers' => $pic->contactNumbers->pluck('value')->values(),
                ])
                ->sortBy(['agent_name', 'name'])
                ->values(),
            'agents' => Agent::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedData($request);
        $agentPic = AgentPic::create($validated);

        ContactInformation::syncFor($agentPic, [
            'phone' => $validated['mobile'],
        ]);

        return $this->toast('PIC created.');
    }

    public function update(Request $request, AgentPic $agentPic): RedirectResponse
    {
        $validated = $this->validatedData($request);

        $agentPic->update($validated);
        ContactInformation::syncFor($agentPic, [
            'phone' => $validated['mobile'],
        ]);

        return $this->toast('PIC saved.');
    }

    public function destroy(AgentPic $agentPic): RedirectResponse
    {
        return $this->deleteGuarded($agentPic, 'PIC', [
            'orders' => Order::where('agent_pic_id', $agentPic->id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'agent_id' => ['required', 'exists:agents,id'],
            'name' => ['required', 'string', 'max:255'],
            'mobile' => ['nullable', 'required_without:contact_numbers', 'string', 'max:255'],
            'contact_numbers' => ['nullable', 'array'],
            'contact_numbers.*' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array{agent_id: mixed, name: string, mobile: string}
     *
     * @throws ValidationException
     */
    private function validatedData(Request $request): array
    {
        $validated = $request->validate($this->rules());
        $phones = $this->contactValues($validated['contact_numbers'] ?? $validated['mobile'] ?? null);

        if ($phones === []) {
            throw ValidationException::withMessages([
                'mobile' => 'At least one mobile number is required.',
            ]);
        }

        return [
            'agent_id' => $validated['agent_id'],
            'name' => $validated['name'],
            'mobile' => implode(', ', $phones),
        ];
    }

    /**
     * @return list<string>
     */
    private function contactValues(mixed $value): array
    {
        if (! is_array($value)) {
            return ContactInformation::splitValues($value);
        }

        return collect($value)
            ->map(fn (mixed $item): string => trim((string) $item))
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
