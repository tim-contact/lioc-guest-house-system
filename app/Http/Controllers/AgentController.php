<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Bdn;
use App\Models\ContactInformation;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('agents/index', [
            'agents' => Agent::with(['contactNumbers', 'emailAddresses'])
                ->orderBy('name')
                ->get(['id', 'name', 'address', 'contact', 'mail_id'])
                ->map(fn (Agent $agent): array => [
                    ...$agent->toArray(),
                    'contact_numbers' => $agent->contactNumbers->pluck('value')->values(),
                    'email_addresses' => $agent->emailAddresses->pluck('value')->values(),
                ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatedData($request);
        $agent = Agent::create($validated);

        ContactInformation::syncFor($agent, [
            'phone' => $validated['contact'],
            'email' => $validated['mail_id'] ?? null,
        ]);

        return $this->toast('Agent created.');
    }

    public function update(Request $request, Agent $agent): RedirectResponse
    {
        $validated = $this->validatedData($request);

        $agent->update($validated);
        ContactInformation::syncFor($agent, [
            'phone' => $validated['contact'],
            'email' => $validated['mail_id'] ?? null,
        ]);

        return $this->toast('Agent saved.');
    }

    public function destroy(Agent $agent): RedirectResponse
    {
        return $this->deleteGuarded($agent, 'Agency', [
            'orders' => Order::where('agent_id', $agent->id)
                ->orWhereIn('agent_pic_id', $agent->pics()->select('id')),
            'BDNs' => Bdn::where('agent_id', $agent->id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'required_without:contact_numbers', 'string', 'max:255'],
            'contact_numbers' => ['nullable', 'array'],
            'contact_numbers.*' => ['nullable', 'string', 'max:255'],
            'mail_id' => ['nullable', 'string', 'max:1000', function (string $attribute, mixed $value, \Closure $fail): void {
                foreach (ContactInformation::splitValues($value) as $email) {
                    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                        $fail('Each mail ID must be a valid email address.');
                    }
                }
            }],
            'email_addresses' => ['nullable', 'array'],
            'email_addresses.*' => ['nullable', 'email', 'max:255'],
        ];
    }

    /**
     * @return array{name: string, address: string, contact: string, mail_id: string|null}
     *
     * @throws ValidationException
     */
    private function validatedData(Request $request): array
    {
        $validated = $request->validate($this->rules());
        $phones = $this->contactValues($validated['contact_numbers'] ?? $validated['contact'] ?? null);

        if ($phones === []) {
            throw ValidationException::withMessages([
                'contact_numbers' => 'At least one contact number is required.',
            ]);
        }

        $emails = $this->contactValues($validated['email_addresses'] ?? $validated['mail_id'] ?? null);

        return [
            'name' => $validated['name'],
            'address' => $validated['address'],
            'contact' => implode(', ', $phones),
            'mail_id' => $emails === [] ? null : implode(', ', $emails),
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
