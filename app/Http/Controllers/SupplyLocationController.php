<?php

namespace App\Http\Controllers;

use App\Models\Bdn;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Port;
use App\Models\SupplyLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplyLocationController extends Controller
{
    public function store(Request $request, Port $port): RedirectResponse
    {
        $port->supplyLocations()->create($request->validate($this->rules($port)));

        return $this->toast('Supply location created.');
    }

    public function update(Request $request, Port $port, SupplyLocation $supplyLocation): RedirectResponse
    {
        $this->ensureLocationBelongsToPort($port, $supplyLocation);

        $supplyLocation->update($request->validate($this->rules($port, $supplyLocation)));

        return $this->toast('Supply location saved.');
    }

    public function destroy(Port $port, SupplyLocation $supplyLocation): RedirectResponse
    {
        $this->ensureLocationBelongsToPort($port, $supplyLocation);

        return $this->deleteGuarded($supplyLocation, 'Supply location', [
            'enquiries' => Enquiry::where('supply_location_id', $supplyLocation->id),
            'orders' => Order::where('delivery_location_id', $supplyLocation->id),
            'BDNs' => Bdn::where('delivery_location_id', $supplyLocation->id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(Port $port, ?SupplyLocation $supplyLocation = null): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('supply_locations', 'name')
                    ->where('port_id', $port->id)
                    ->ignore($supplyLocation),
            ],
        ];
    }

    private function ensureLocationBelongsToPort(Port $port, SupplyLocation $supplyLocation): void
    {
        abort_unless($supplyLocation->port_id === $port->id, 404);
    }
}
