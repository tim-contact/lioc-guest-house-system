<?php

namespace App\Http\Controllers;

use App\Enums\BargeStatus;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BargeController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('barges/edit', [
            'barges' => Barge::orderBy('name')->get(),
            'statusOptions' => $this->enumOptions(BargeStatus::cases()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Barge::create($request->validate($this->rules()));

        return $this->toast('Barge created.');
    }

    public function update(Request $request, Barge $barge): RedirectResponse
    {
        $barge->update($request->validate($this->rules($barge)));

        return $this->toast('Barge saved.');
    }

    public function destroy(Barge $barge): RedirectResponse
    {
        return $this->deleteGuarded($barge, 'Barge', [
            'orders' => Order::where('barge_id', $barge->imo),
            'BDNs' => Bdn::where('barge_id', $barge->imo),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Barge $barge = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'imo' => ['required', 'integer', 'min:1', Rule::unique('barges', 'imo')->ignore($barge)],
            'vlsfo_capacity' => ['nullable', 'numeric', 'min:0'],
            'mgo_capacity' => ['nullable', 'numeric', 'min:0'],
            'hsfo_capacity' => ['nullable', 'numeric', 'min:0'],
            'status' => ['required', Rule::enum(BargeStatus::class)],
        ];
    }
}
