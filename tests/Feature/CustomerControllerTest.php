<?php

use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('customer export filters by customer creation date', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));
    Customer::factory()->create(['created_at' => '2026-10-15 12:00:00']);
    Customer::factory()->create(['created_at' => '2026-09-15 12:00:00']);

    $this->getJson(route('customers.export', ['date_from' => '2026-10-01', 'date_to' => '2026-10-31']))
        ->assertOk()->assertJsonCount(1, 'rows');
});

test('guests are redirected from the customers page', function () {
    $this->get(route('customers.index'))->assertRedirect(route('login'));
});

test('index lists customers ordered by name', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Customer::factory()->create(['name' => 'Zeta Shipping']);
    Customer::factory()->create(['name' => 'Alpha Marine']);

    $this->get(route('customers.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('customers/index')
            ->has('customers', 2)
            ->where('customers.0.name', 'Alpha Marine')
            ->where('customers.1.name', 'Zeta Shipping'));
});

test('store creates a customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('customers.store'), [
        'sap_id' => 'SAP-10001',
        'name' => 'Blue Ocean Ltd',
        'address' => '1 Harbour Road',
        'credit_limit' => 50000,
        'country' => 'Singapore',
        'account_type' => 'fcbu',
        'contact_person' => 'Jane Doe',
        'contact_phone' => '+65 6123 4567',
        'mail_id' => 'jane.doe@blueocean.example',
        'invoice_mail_ids' => 'billing@blueocean.example, ap@blueocean.example',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Customer::sole())
        ->sap_id->toBe('SAP-10001')
        ->name->toBe('Blue Ocean Ltd')
        ->contact_person->toBe('Jane Doe')
        ->contact_phone->toBe('+65 6123 4567')
        ->mail_id->toBe('jane.doe@blueocean.example')
        ->invoice_mail_ids->toBe('billing@blueocean.example, ap@blueocean.example');
});

test('store allows the new contact fields to be omitted', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('customers.store'), [
        'sap_id' => 'SAP-10002',
        'name' => 'Green Harbor Ltd',
        'address' => '2 Harbour Road',
        'credit_limit' => 25000,
        'country' => 'Malaysia',
        'account_type' => 'dbu',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Customer::sole())
        ->contact_person->toBeNull()
        ->contact_phone->toBeNull()
        ->mail_id->toBeNull()
        ->invoice_mail_ids->toBeNull();
});

test('store rejects an invalid mail id', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('customers.store'), [
        'sap_id' => 'SAP-10003',
        'name' => 'Bad Mail Ltd',
        'address' => '3 Harbour Road',
        'credit_limit' => 1000,
        'country' => 'Singapore',
        'account_type' => 'fcbu',
        'mail_id' => 'not-an-email',
    ])->assertSessionHasErrors('mail_id');
});

test('store requires the core fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $this->post(route('customers.store'), [])
        ->assertSessionHasErrors(['sap_id', 'name', 'address', 'credit_limit', 'country', 'account_type']);
});

test('store rejects a duplicate sap id', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Customer::factory()->create(['sap_id' => 'SAP-10001']);

    $this->post(route('customers.store'), [
        'sap_id' => 'SAP-10001',
        'name' => 'Blue Ocean Ltd',
        'address' => '1 Harbour Road',
        'credit_limit' => 50000,
        'country' => 'Singapore',
        'account_type' => 'fcbu',
    ])->assertSessionHasErrors('sap_id');
});

test('update saves edits to a customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create(['name' => 'Old Name']);

    $this->put(route('customers.update', $customer), [
        'sap_id' => $customer->sap_id,
        'name' => 'New Name',
        'address' => 'Updated Address',
        'credit_limit' => 75000,
        'country' => 'Malaysia',
        'account_type' => 'dbu',
        'contact_person' => 'John Smith',
        'contact_phone' => '0123456789',
        'mail_id' => 'john.smith@example.com',
        'invoice_mail_ids' => 'ap@example.com',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($customer->refresh())
        ->name->toBe('New Name')
        ->country->toBe('Malaysia')
        ->credit_limit->toEqual(75000)
        ->contact_person->toBe('John Smith')
        ->contact_phone->toBe('0123456789')
        ->mail_id->toBe('john.smith@example.com')
        ->invoice_mail_ids->toBe('ap@example.com');
});

test('destroy deletes a customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create();

    $this->delete(route('customers.destroy', $customer))->assertRedirect();

    expect(Customer::find($customer->sap_id))->toBeNull();
});

test('master can replace a temporary sap id without losing orders or quotes', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    $customer = Customer::factory()->create(['sap_id' => 'TEMP-original', 'contact_person' => 'Jane']);
    $createdAt = $customer->created_at;
    $order = Order::factory()->create(['customer_id' => $customer->sap_id]);
    $quote = Enquiry::factory()->create()->enquiryCustomers()->create([
        'customer_id' => $customer->sap_id,
        'vlsfo_initial_offer' => 500,
    ]);

    $this->put(route('customers.update', $customer), [
        ...$customer->toArray(), 'sap_id' => 'SAP-REAL',
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect(Customer::find('TEMP-original'))->toBeNull();
    $resolved = Customer::findOrFail('SAP-REAL');
    expect($resolved->isTemporary())->toBeFalse();
    expect($resolved->contact_person)->toBe('Jane');
    expect($resolved->created_at->equalTo($createdAt))->toBeTrue();
    expect($order->refresh()->customer_id)->toBe('SAP-REAL');
    expect($order->customer->sap_id)->toBe('SAP-REAL');
    expect($quote->refresh()->customer_id)->toBe('SAP-REAL');
    expect($quote->vlsfo_initial_offer)->toBe('500.00');
    expect($quote->customer->sap_id)->toBe('SAP-REAL');
});

test('temporary sap id cannot be replaced by an existing or another temporary id', function (string $sapId) {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    Customer::factory()->create(['sap_id' => 'SAP-EXISTING']);
    $customer = Customer::factory()->create(['sap_id' => 'TEMP-original']);
    $order = Order::factory()->create(['customer_id' => $customer->sap_id]);

    $this->put(route('customers.update', $customer), [...$customer->toArray(), 'sap_id' => $sapId])
        ->assertSessionHasErrors('sap_id');

    expect($customer->refresh()->sap_id)->toBe('TEMP-original');
    expect($order->refresh()->customer_id)->toBe('TEMP-original');
})->with(['SAP-EXISTING', 'TEMP-another']);

test('real sap ids remain immutable', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    $customer = Customer::factory()->create(['sap_id' => 'SAP-original']);

    $this->put(route('customers.update', $customer), [...$customer->toArray(), 'sap_id' => 'SAP-changed'])
        ->assertSessionHasErrors('sap_id');
    expect($customer->refresh()->sap_id)->toBe('SAP-original');
});

test('temporary customers can be edited without changing their id', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    $customer = Customer::factory()->create(['sap_id' => 'TEMP-original']);

    $this->put(route('customers.update', $customer), [...$customer->toArray(), 'name' => 'Updated'])
        ->assertSessionHasNoErrors();
    expect($customer->refresh()->name)->toBe('Updated');
});

test('sales cannot resolve temporary sap ids', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Sales]));
    $customer = Customer::factory()->create(['sap_id' => 'TEMP-original']);

    $this->put(route('customers.update', $customer), [...$customer->toArray(), 'sap_id' => 'SAP-real'])
        ->assertForbidden();
    expect($customer->refresh()->sap_id)->toBe('TEMP-original');
});

test('customers linked only to an enquiry cannot be deleted', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::Master]));
    $customer = Customer::factory()->create(['sap_id' => 'TEMP-original']);
    Enquiry::factory()->create()->enquiryCustomers()->create(['customer_id' => $customer->sap_id]);

    $this->delete(route('customers.destroy', $customer))->assertSessionHas('toast.type', 'error');
    expect(Customer::find($customer->sap_id))->not->toBeNull();
});

test('destroy is refused with an error toast when an order references the customer', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $customer = Customer::factory()->create();
    Order::factory()->create(['customer_id' => $customer->sap_id]);

    $this->delete(route('customers.destroy', $customer))
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    expect(Customer::find($customer->sap_id))->not->toBeNull();
});
