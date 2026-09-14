<?php

namespace App\Http\Controllers;

use App\Enums\SupplyLocationType;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('ports/index', [
            'ports' => Port::with(['supplyLocations' => fn ($query) => $query->orderBy('name')])
                ->orderBy('name')
                ->get(['id', 'name']),
            'locationTypeOptions' => $this->enumOptions(SupplyLocationType::cases()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Port::create($request->validate(['name' => ['required', 'string', 'max:255']]));

        return $this->toast('Port created.');
    }

    public function update(Request $request, Port $port): RedirectResponse
    {
        $port->update($request->validate(['name' => ['required', 'string', 'max:255']]));

        return $this->toast('Port saved.');
    }

    public function destroy(Port $port): RedirectResponse
    {
        return $this->deleteGuarded($port, 'Port', [
            'orders' => Order::where('port_id', $port->id),
            'enquiries' => Enquiry::where('port_id', $port->id),
        ]);
    }
}
