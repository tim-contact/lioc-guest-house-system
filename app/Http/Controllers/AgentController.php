<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Bdn;
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
            'agents' => Agent::orderBy('name')->get(['id', 'name', 'address', 'contact', 'mail_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Agent::create($request->validate($this->rules()));

        return $this->toast('Agent created.');
    }

    public function update(Request $request, Agent $agent): RedirectResponse
    {
        $agent->update($request->validate($this->rules()));

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
            'mail_id' => ['nullable', 'string', 'email', 'max:255'],
        ];
    }
}
