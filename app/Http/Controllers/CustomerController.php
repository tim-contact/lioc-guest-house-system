<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::orderBy('name')->get([
                'sap_id', 'name', 'address', 'credit_limit', 'country',
                'contact_person', 'contact_phone', 'mail_id', 'invoice_mail_ids',
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        Customer::create($request->validate($this->rules()));

        return $this->toast('Customer created.');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validate($this->rules($customer)));

        return $this->toast('Customer saved.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        return $this->deleteGuarded($customer, 'Customer', [
            'orders' => Order::where('customer_id', $customer->sap_id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Customer $customer = null): array
    {
        return [
            'sap_id' => ['required', 'string', 'max:255', Rule::unique('customers', 'sap_id')->ignore($customer)],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'country' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'mail_id' => ['nullable', 'email', 'max:255'],
            'invoice_mail_ids' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
