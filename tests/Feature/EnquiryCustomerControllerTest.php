<?php

use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\User;

test('store adds a customer to an enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create();

    $this->post(route('enquiries.customers.store', $enquiry), [
        'customer_id' => $customer->sap_id,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->enquiryCustomers()->sole())
        ->customer_id->toBe($customer->sap_id)
        ->status->toBe(EnquiryCustomerStatus::Pending);
});

test('store rejects a customer already on the enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create();
    $enquiry->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);

    $this->post(route('enquiries.customers.store', $enquiry), [
        'customer_id' => $customer->sap_id,
    ])->assertSessionHasErrors(['customer_id']);

    expect($enquiry->enquiryCustomers()->count())->toBe(1);
});

test('marking a customer fixed does not touch the others, and moves the enquiry to completing', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $winner = $enquiry->enquiryCustomers()->create(['customer_id' => 'AAA']);
    $otherA = $enquiry->enquiryCustomers()->create(['customer_id' => 'BBB']);
    $otherB = $enquiry->enquiryCustomers()->create(['customer_id' => 'CCC']);

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'fixed',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($winner->refresh()->status)->toBe(EnquiryCustomerStatus::Fixed);
    expect($otherA->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
    expect($otherB->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
    expect($enquiry->refresh()->status)->toBe(EnquiryStatus::Completing);
});

test('marking a customer lost only affects that customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $target = $enquiry->enquiryCustomers()->create(['customer_id' => 'AAA']);
    $other = $enquiry->enquiryCustomers()->create(['customer_id' => 'BBB']);

    $this->patch(route('enquiry-customers.update-status', $target), [
        'status' => 'lost',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($target->refresh()->status)->toBe(EnquiryCustomerStatus::Lost);
    expect($other->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
    expect($enquiry->refresh()->status)->toBe(EnquiryStatus::Open);
});

test('un-fixing a fixed customer reverts only that customer to pending', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $winner = $enquiry->enquiryCustomers()->create(['customer_id' => 'AAA']);
    $other = $enquiry->enquiryCustomers()->create(['customer_id' => 'BBB']);

    $this->patch(route('enquiry-customers.update-status', $winner), ['status' => 'fixed']);

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'pending',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($winner->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
    expect($other->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
});

test('un-fixing the fixed customer drops the enquiry back to open', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $winner = $enquiry->enquiryCustomers()->create(['customer_id' => 'AAA']);
    $enquiry->enquiryCustomers()->create(['customer_id' => 'BBB']);

    $this->patch(route('enquiry-customers.update-status', $winner), ['status' => 'fixed']);
    expect($enquiry->refresh()->status)->toBe(EnquiryStatus::Completing);

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'pending',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->refresh()->status)->toBe(EnquiryStatus::Open);
});

test('un-losing a lost customer reverts it to pending without touching others', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $target = $enquiry->enquiryCustomers()->create(['customer_id' => 'AAA', 'status' => EnquiryCustomerStatus::Lost]);
    $other = $enquiry->enquiryCustomers()->create(['customer_id' => 'BBB']);

    $this->patch(route('enquiry-customers.update-status', $target), [
        'status' => 'pending',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($target->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
    expect($other->refresh()->status)->toBe(EnquiryCustomerStatus::Pending);
});

test('update saves credit terms and price fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create();
    $enquiryCustomer = $enquiry->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);

    $this->patch(route('enquiry-customers.update', $enquiryCustomer), [
        'customer_id' => $customer->sap_id,
        'credit_terms' => '30_days',
        'vlsfo_initial_offer' => 500,
        'vlsfo_feedback_price' => 480,
        'vlsfo_fixing_counter' => 490,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiryCustomer->refresh())
        ->credit_terms->value->toBe('30_days')
        ->vlsfo_initial_offer->toEqual('500.00')
        ->vlsfo_feedback_price->toEqual('480.00')
        ->vlsfo_fixing_counter->toEqual('490.00');
});

test('update clears a price field when set to null', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create();
    $enquiryCustomer = $enquiry->enquiryCustomers()->create([
        'customer_id' => $customer->sap_id,
        'vlsfo_initial_offer' => 500,
    ]);

    $this->patch(route('enquiry-customers.update', $enquiryCustomer), [
        'customer_id' => $customer->sap_id,
        'vlsfo_initial_offer' => null,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiryCustomer->refresh()->vlsfo_initial_offer)->toBeNull();
});

test('update rejects reassigning to a customer already on the enquiry', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customerA = Customer::factory()->create();
    $customerB = Customer::factory()->create();
    $rowA = $enquiry->enquiryCustomers()->create(['customer_id' => $customerA->sap_id]);
    $enquiry->enquiryCustomers()->create(['customer_id' => $customerB->sap_id]);

    $this->patch(route('enquiry-customers.update', $rowA), [
        'customer_id' => $customerB->sap_id,
    ])->assertSessionHasErrors(['customer_id']);

    expect($rowA->refresh()->customer_id)->toBe($customerA->sap_id);
});

test('update rejects an invalid credit terms value', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create();
    $enquiryCustomer = $enquiry->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);

    $this->patch(route('enquiry-customers.update', $enquiryCustomer), [
        'customer_id' => $customer->sap_id,
        'credit_terms' => 'not_a_term',
    ])->assertSessionHasErrors(['credit_terms']);
});
