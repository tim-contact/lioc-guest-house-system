<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Bdn;
use App\Models\ContactInformation;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        $validated = $request->validate($this->rules());
        $agent = Agent::create($validated);

        ContactInformation::syncFor($agent, [
            'phone' => $validated['contact'],
            'email' => $validated['mail_id'] ?? null,
        ]);

        return $this->toast('Agent created.');
    }

    public function update(Request $request, Agent $agent): RedirectResponse
    {
        $validated = $request->validate($this->rules());

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
            'contact' => ['required', 'string', 'max:255'],
            'mail_id' => ['nullable', 'string', 'max:1000', function (string $attribute, mixed $value, \Closure $fail): void {
                foreach (ContactInformation::splitValues($value) as $email) {
                    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
                        $fail('Each mail ID must be a valid email address.');
                    }
                }
            }],
        ];
    }
}
