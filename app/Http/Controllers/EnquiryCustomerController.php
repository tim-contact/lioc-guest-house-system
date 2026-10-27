<?php

namespace App\Http\Controllers;

use App\Enums\AccountType;
use App\Enums\CreditTerms;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\FuelGrade;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\EnquiryCustomer;
use App\Services\CreditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EnquiryCustomerController extends Controller
{
    public function storeTemporary(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'country' => ['required', 'string', 'max:255'],
            'account_type' => ['required', Rule::enum(AccountType::class)],
        ]);

        DB::transaction(function () use ($enquiry, $validated): void {
            $customer = Customer::create([
                ...$validated,
                'sap_id' => 'TEMP-'.Str::uuid(),
                'credit_limit' => 0,
            ]);

            $enquiry->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);
        });

        return $this->toast('Temporary customer created and added.');
    }

    public function store(Request $request, Enquiry $enquiry): RedirectResponse
    {
        $validated = $request->validate([
            'customer_id' => [
                'required',
                'exists:customers,sap_id',
                Rule::unique('enquiry_customers')->where('enquiry_id', $enquiry->id),
            ],
        ]);

        $enquiry->enquiryCustomers()->create($validated);

        return $this->toast('Customer added.');
    }

    public function update(Request $request, EnquiryCustomer $enquiryCustomer): RedirectResponse
    {
        $rules = [
            'customer_id' => [
                'required',
                'exists:customers,sap_id',
                Rule::unique('enquiry_customers')
                    ->where('enquiry_id', $enquiryCustomer->enquiry_id)
                    ->ignore($enquiryCustomer->id),
            ],
            'credit_terms' => ['nullable', Rule::enum(CreditTerms::class)],
        ];

        foreach (FuelGrade::keys() as $product) {
            foreach (EnquiryCustomer::PRICE_FIELDS as $field) {
                $rules["{$product}_{$field}"] = ['nullable', 'numeric', 'min:0'];
            }
        }

        $validated = $request->validate($rules);

        $enquiryCustomer->update($validated);

        return $this->toast('Customer saved.');
    }

    public function updateStatus(Request $request, EnquiryCustomer $enquiryCustomer): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(EnquiryCustomerStatus::class)],
        ]);

        $status = EnquiryCustomerStatus::from($validated['status']);

        if ($status === EnquiryCustomerStatus::Fixed) {
            $enquiry = $enquiryCustomer->enquiry;
            $missingRateProducts = collect(FuelGrade::cases())
                ->filter(function (FuelGrade $product) use ($enquiry, $enquiryCustomer): bool {
                    $key = $product->value;
                    $hasQuantity = $enquiry->{"{$key}_quantity_low"} !== null
                        || $enquiry->{"{$key}_quantity_high"} !== null;

                    return $hasQuantity && $enquiryCustomer->{"{$key}_fixing_counter"} === null;
                });

            $errors = $missingRateProducts->mapWithKeys(fn (FuelGrade $product): array => [
                "{$product->value}_fixing_counter" => "{$product->label()} rate required.",
            ])->all();

            if ($enquiryCustomer->credit_terms === null) {
                $errors['credit_terms'] = 'Credit terms required.';
            }

            if ($errors !== []) {
                throw ValidationException::withMessages($errors);
            }

            if (
                ! $enquiryCustomer->credit_terms?->isCashPayment()
                && CreditService::hasExceededEnquiryCreditThreshold($enquiryCustomer->customer_id)
            ) {
                return $this->toast(
                    'The customer has exceeded the credit limit threshold. Select CIA or COD to continue.',
                    'error',
                );
            }

        }

        DB::transaction(function () use ($enquiryCustomer, $status) {
            if ($status === EnquiryCustomerStatus::Fixed) {
                // Fixing commits the stem to this customer, but the others aren't marked Lost
                // yet — that only happens once the order is actually generated
                // (EnquiryController::updateDetails), so it's reversible until then.
                $enquiryCustomer->update(['status' => EnquiryCustomerStatus::Fixed]);

                $enquiryCustomer->enquiry()->update(['status' => EnquiryStatus::Completing]);
            } else {
                // Reversible: un-fixing/un-losing only ever touches this one row, never cascades.
                $enquiryCustomer->update(['status' => $status]);

                // If no box remains fixed, the enquiry drops back to Open.
                $stillFixed = EnquiryCustomer::where('enquiry_id', $enquiryCustomer->enquiry_id)
                    ->where('status', EnquiryCustomerStatus::Fixed)
                    ->exists();

                if (! $stillFixed) {
                    $enquiryCustomer->enquiry()->update(['status' => EnquiryStatus::Open]);
                }
            }
        });

        return back();
    }
}
