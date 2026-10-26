<?php

use App\Enums\CreditTerms;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\User;

test('sales and privileged users can create and attach temporary customers', function (UserType $type) {
    $this->actingAs(User::factory()->create(['type' => $type]));
    $enquiry = Enquiry::factory()->create();

    $this->post(route('enquiries.customers.store-temporary', $enquiry), [
        'name' => 'New Shipping Ltd',
        'address' => 'Harbour Road',
        'country' => 'Sri Lanka',
        'account_type' => 'fcbu',
        'sap_id' => 'CLIENT-SUPPLIED',
        'credit_limit' => 100000,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $customer = Customer::sole();
    expect($customer->isTemporary())->toBeTrue();
    expect($customer->credit_limit)->toEqual('0.00');
    expect($customer->name)->toBe('New Shipping Ltd');
    expect($enquiry->enquiryCustomers()->sole())
        ->customer_id->toBe($customer->sap_id)
        ->status->toBe(EnquiryCustomerStatus::Pending);
})->with([UserType::Sales, UserType::Master, UserType::SuperAdmin]);

test('temporary customer creation validates required details without inserting rows', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Sales]));
    $enquiry = Enquiry::factory()->create();

    $this->post(route('enquiries.customers.store-temporary', $enquiry), [])
        ->assertSessionHasErrors(['name', 'address', 'country', 'account_type']);

    expect(Customer::count())->toBe(0);
    expect($enquiry->enquiryCustomers()->count())->toBe(0);
});

test('temporary ids are unique even for customers with the same name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Sales]));
    $enquiry = Enquiry::factory()->create();
    $details = ['name' => 'Shipping Ltd', 'address' => 'Road', 'country' => 'Sri Lanka', 'account_type' => 'dbu'];

    $this->post(route('enquiries.customers.store-temporary', $enquiry), $details)->assertSessionHasNoErrors();
    $this->post(route('enquiries.customers.store-temporary', $enquiry), $details)->assertSessionHasNoErrors();

    expect(Customer::count())->toBe(2);
    expect($enquiry->enquiryCustomers()->pluck('customer_id')->unique()->count())->toBe(2);
});

test('other roles cannot create temporary customers', function (UserType $type) {
    $this->actingAs(User::factory()->create(['type' => $type]));
    $enquiry = Enquiry::factory()->create();

    $this->post(route('enquiries.customers.store-temporary', $enquiry), [])
        ->assertForbidden();

    expect(Customer::count())->toBe(0);
})->with([UserType::Operations, UserType::Finance, UserType::Surveyor]);

test('guests cannot create temporary customers', function () {
    $enquiry = Enquiry::factory()->create();
    $this->post(route('enquiries.customers.store-temporary', $enquiry), [])
        ->assertRedirect(route('login'));
    expect(Customer::count())->toBe(0);
});

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

test('store allows a customer below the enquiry credit threshold before fixing', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create(['credit_limit' => -100000.01]);

    $this->post(route('enquiries.customers.store', $enquiry), [
        'customer_id' => $customer->sap_id,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->enquiryCustomers()->sole()->customer_id)->toBe($customer->sap_id);
});

test('store allows a customer exactly at the enquiry credit threshold', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $customer = Customer::factory()->create(['credit_limit' => -100000]);

    $this->post(route('enquiries.customers.store', $enquiry), [
        'customer_id' => $customer->sap_id,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiry->enquiryCustomers()->sole()->customer_id)->toBe($customer->sap_id);
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

    $enquiry = Enquiry::factory()->create([
        'status' => EnquiryStatus::Open,
        'vlsfo_quantity_low' => 100,
    ]);
    $winner = $enquiry->enquiryCustomers()->create([
        'customer_id' => 'AAA',
        'vlsfo_fixing_counter' => 650,
    ]);
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

test('marking a customer fixed requires a fixing rate for each selected product', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create([
        'status' => EnquiryStatus::Open,
        'vlsfo_quantity_low' => 100,
        'mgo_quantity_high' => 50,
    ]);
    $winner = $enquiry->enquiryCustomers()->create([
        'customer_id' => 'AAA',
        'vlsfo_fixing_counter' => 650,
    ]);

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'fixed',
    ])
        ->assertRedirect()
        ->assertSessionHasErrors([
            'mgo_fixing_counter' => 'MGO rate required.',
        ]);

    expect($winner->refresh()->status)->toBe(EnquiryCustomerStatus::Pending)
        ->and($enquiry->refresh()->status)->toBe(EnquiryStatus::Open);
});

test('a customer below the credit threshold can be fixed with cash payment terms', function (CreditTerms $creditTerms) {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['credit_limit' => -100000.01]);
    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $winner = $enquiry->enquiryCustomers()->create([
        'customer_id' => $customer->sap_id,
        'credit_terms' => $creditTerms,
    ]);

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'fixed',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($winner->refresh()->status)->toBe(EnquiryCustomerStatus::Fixed)
        ->and($enquiry->refresh()->status)->toBe(EnquiryStatus::Completing);
})->with([CreditTerms::Cia, CreditTerms::Cod]);

test('a customer below the credit threshold cannot be fixed without cash payment terms', function (?CreditTerms $creditTerms) {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['credit_limit' => -100000.01]);
    $enquiry = Enquiry::factory()->create(['status' => EnquiryStatus::Open]);
    $winner = $enquiry->enquiryCustomers()->create([
        'customer_id' => $customer->sap_id,
        'credit_terms' => $creditTerms,
    ]);

    $firstResponse = $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'fixed',
    ]);
    $firstResponse->assertRedirect()
        ->assertSessionHas('toast.id')
        ->assertSessionHas('toast.type', 'error')
        ->assertSessionHas(
            'toast.message',
            'The customer has exceeded the credit limit threshold. Select CIA or COD to continue.',
        );
    $firstToastId = session('toast.id');

    $this->patch(route('enquiry-customers.update-status', $winner), [
        'status' => 'fixed',
    ])->assertRedirect()
        ->assertSessionHas('toast.id', fn (string $id): bool => $id !== $firstToastId)
        ->assertSessionHas('toast.type', 'error');

    expect($winner->refresh()->status)->toBe(EnquiryCustomerStatus::Pending)
        ->and($enquiry->refresh()->status)->toBe(EnquiryStatus::Open);
})->with([
    CreditTerms::Days7,
    CreditTerms::Days14,
    CreditTerms::Days30,
    CreditTerms::Days45,
    CreditTerms::Days60,
    null,
]);

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

test('update allows reassignment to a customer below the enquiry credit threshold before fixing', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $enquiry = Enquiry::factory()->create();
    $currentCustomer = Customer::factory()->create();
    $blockedCustomer = Customer::factory()->create(['credit_limit' => -100000.01]);
    $enquiryCustomer = $enquiry->enquiryCustomers()->create([
        'customer_id' => $currentCustomer->sap_id,
    ]);

    $this->patch(route('enquiry-customers.update', $enquiryCustomer), [
        'customer_id' => $blockedCustomer->sap_id,
        'credit_terms' => CreditTerms::Days30->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($enquiryCustomer->refresh()->customer_id)->toBe($blockedCustomer->sap_id);
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
