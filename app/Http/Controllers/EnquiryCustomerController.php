<?php

namespace App\Http\Controllers;

use App\Enums\CreditTerms;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\FuelGrade;
use App\Models\Enquiry;
use App\Models\EnquiryCustomer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class EnquiryCustomerController extends Controller
{
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

        $enquiryCustomer->update($request->validate($rules));

        return $this->toast('Customer saved.');
    }

    public function updateStatus(Request $request, EnquiryCustomer $enquiryCustomer): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(EnquiryCustomerStatus::class)],
        ]);

        $status = EnquiryCustomerStatus::from($validated['status']);

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
