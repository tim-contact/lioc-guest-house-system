<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Models\Customer;
use App\Models\EnquiryCustomer;
use App\Models\Order;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customers/index', [
            'customers' => Customer::orderBy('name')->get([
                'sap_id', 'name', 'address', 'credit_limit', 'country', 'account_type',
                'contact_person', 'contact_phone', 'mail_id', 'invoice_mail_ids',
            ]),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $dates = $request->validate([
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        ]);

        return response()->json(['rows' => Customer::query()
            ->whereDate('created_at', '>=', $dates['date_from'])
            ->whereDate('created_at', '<=', $dates['date_to'])
            ->orderBy('name')
            ->get(['sap_id', 'name', 'address', 'credit_limit', 'country', 'account_type', 'contact_person', 'contact_phone', 'mail_id', 'invoice_mail_ids'])]);
    }

    public function store(Request $request): RedirectResponse
    {
        Customer::create($request->validate($this->rules()));

        return $this->toast('Customer created.');
    }

    public function update(Request $request, Customer $customer): RedirectResponse
    {
        $validated = $request->validate($this->rules($customer));

        DB::transaction(function () use ($customer, $validated): void {
            $customer = Customer::whereKey($customer->sap_id)->lockForUpdate()->firstOrFail();

            if ($validated['sap_id'] === $customer->sap_id) {
                $customer->update($validated);

                return;
            }

            // Create the new parent first so immediate foreign keys remain valid.
            $replacement = $customer->replicate();
            $replacement->fill($validated);
            $replacement->created_at = $customer->created_at;
            $replacement->save();

            Order::where('customer_id', $customer->sap_id)->update(['customer_id' => $replacement->sap_id]);
            EnquiryCustomer::where('customer_id', $customer->sap_id)->update(['customer_id' => $replacement->sap_id]);
            $customer->delete();
        });

        return $this->toast('Customer saved.');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        return $this->deleteGuarded($customer, 'Customer', [
            'orders' => Order::where('customer_id', $customer->sap_id),
            'enquiries' => EnquiryCustomer::where('customer_id', $customer->sap_id),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function rules(?Customer $customer = null): array
    {
        return [
            'sap_id' => [
                'required', 'string', 'max:255', Rule::unique('customers', 'sap_id')->ignore($customer),
                function (string $attribute, mixed $value, Closure $fail) use ($customer): void {
                    if ($customer !== null && $value === $customer->sap_id) {
                        return;
                    }

                    if ($customer !== null && ! $customer->isTemporary()) {
                        $fail('Only temporary SAP IDs can be replaced.');
                    } elseif (str_starts_with(strtoupper((string) $value), 'TEMP-')) {
                        $fail('Enter the actual SAP ID. Temporary IDs are generated automatically.');
                    }
                },
            ],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'credit_limit' => ['required', 'numeric', 'min:0'],
            'country' => ['required', 'string', 'max:255'],
            'account_type' => ['required', Rule::enum(AccountType::class)],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:255'],
            'mail_id' => ['nullable', 'email', 'max:255'],
            'invoice_mail_ids' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
