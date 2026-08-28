<?php

use App\Enums\ActionStatus;
use App\Enums\DisputeStatus;
use App\Enums\DisputeType;
use App\Enums\OrderStatus;
use App\Enums\ProposedActionPlan;
use App\Enums\UserType;
use App\Models\Customer;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\Port;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

test('guests are redirected from the disputes page', function () {
    $this->get(route('disputes'))->assertForbidden();
});

test('index renders disputes with their order details', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'order_number' => 'ORD-DISPUTE-1',
        'customer_id' => Customer::factory()->create(['name' => 'Blue Ocean Ltd'])->sap_id,
        'port_id' => Port::factory()->create(['name' => 'Colombo'])->id,
        'vlsfo_bdn_qty' => 500,
        'invoice_value' => 1000,
        'amount_received' => 400,
    ]);

    Dispute::factory()->create([
        'order_id' => $order->id,
        'type_of_dispute' => DisputeType::QualitySulphur,
    ]);

    $this->get(route('disputes'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('disputes/dashboard')
            ->has('disputes', 1)
            ->where('disputes.0.order_number', 'ORD-DISPUTE-1')
            ->where('disputes.0.customer_name', 'Blue Ocean Ltd')
            ->where('disputes.0.port', 'Colombo')
            ->where('disputes.0.type_of_dispute', 'quality_sulphur')
            ->where('disputes.0.type_of_dispute_label', 'Quality_Sulphur')
            ->where('disputes.0.vlsfo_qty', '500.000')
            ->where('disputes.0.balance_amount', 600)
            ->has('disputeTypeOptions'));
});

test('guests are redirected from the disputes table page', function () {
    $this->get(route('disputes.table'))->assertForbidden();
});

test('table renders disputes with the same row shape as the dashboard', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['order_number' => 'ORD-DISPUTE-TABLE']);
    Dispute::factory()->create(['order_id' => $order->id]);

    $this->get(route('disputes.table'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('disputes/table')
            ->has('disputes', 1)
            ->where('disputes.0.order_number', 'ORD-DISPUTE-TABLE')
            ->has('disputeTypeOptions')
            ->has('proposedActionPlanOptions')
            ->has('actionStatusOptions'));
});

test('guests cannot create a dispute', function () {
    $order = Order::factory()->create();

    $this->post(route('disputes.store', $order))->assertForbidden();
});

test('store creates a dispute for the order, defaulting the status to open', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->post(route('disputes.store', $order), [
        'type_of_dispute' => DisputeType::Quantity->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->disputes()->sole())
        ->type_of_dispute->toBe(DisputeType::Quantity)
        ->dispute_status->toBe(DisputeStatus::Open);
});

test('store requires a dispute type', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();

    $this->post(route('disputes.store', $order), [])
        ->assertSessionHasErrors('type_of_dispute');
});

test('store creates a second dispute for the same order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create();
    Dispute::factory()->create([
        'order_id' => $order->id,
        'type_of_dispute' => DisputeType::QualitySulphur,
    ]);

    $this->post(route('disputes.store', $order), [
        'type_of_dispute' => DisputeType::Quantity->value,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($order->disputes()->pluck('type_of_dispute')->all())
        ->toEqualCanonicalizing([DisputeType::QualitySulphur, DisputeType::Quantity]);
});

test('guests cannot update a dispute', function () {
    $dispute = Dispute::factory()->create();

    $this->patch(route('disputes.update', $dispute))->assertForbidden();
});

test('update saves the dispute fields', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create(['dispute_status' => DisputeStatus::Open]);

    $this->patch(route('disputes.update', $dispute), [
        'type_of_dispute' => DisputeType::DelayClaim->value,
        'dispute_value' => 1500.5,
        'value_as_per_supply' => 0.48,
        'value_as_per_claim' => 0.61,
        'value_as_per_testing' => 0.52,
        'testing_date' => '2026-07-01',
        'proposed_action_plan' => ProposedActionPlan::SettlementCreditNote->value,
        'action_status' => ActionStatus::TestingDone->value,
        'dispute_closure_remark' => 'Settled at 50%.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $fresh = $dispute->fresh();

    expect($fresh)
        ->type_of_dispute->toBe(DisputeType::DelayClaim)
        ->testing_date->toDateString()->toBe('2026-07-01')
        ->proposed_action_plan->toBe(ProposedActionPlan::SettlementCreditNote)
        ->action_status->toBe(ActionStatus::TestingDone)
        ->dispute_closure_remark->toBe('Settled at 50%.')
        ->dispute_status->toBe(DisputeStatus::Open);

    expect((float) $fresh->dispute_value)->toBe(1500.5);
    expect((float) $fresh->value_as_per_supply)->toBe(0.48);
    expect((float) $fresh->value_as_per_claim)->toBe(0.61);
    expect((float) $fresh->value_as_per_testing)->toBe(0.52);
});

test('update clears the optional dispute fields when they are sent empty', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create();

    $this->patch(route('disputes.update', $dispute), [
        'type_of_dispute' => DisputeType::Quantity->value,
        'dispute_value' => null,
        'value_as_per_supply' => null,
        'value_as_per_claim' => null,
        'value_as_per_testing' => null,
        'testing_date' => null,
        'proposed_action_plan' => null,
        'action_status' => null,
        'dispute_closure_remark' => null,
    ])->assertSessionHasNoErrors();

    expect($dispute->fresh())
        ->type_of_dispute->toBe(DisputeType::Quantity)
        ->dispute_value->toBeNull()
        ->value_as_per_supply->toBeNull()
        ->value_as_per_claim->toBeNull()
        ->value_as_per_testing->toBeNull()
        ->testing_date->toBeNull()
        ->proposed_action_plan->toBeNull()
        ->action_status->toBeNull()
        ->dispute_closure_remark->toBeNull();
});

test('update requires a dispute type', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create();

    $this->patch(route('disputes.update', $dispute), ['type_of_dispute' => null])
        ->assertSessionHasErrors('type_of_dispute');
});

test('guests cannot close a dispute', function () {
    $dispute = Dispute::factory()->create();

    $this->patch(route('disputes.close', $dispute))->assertForbidden();
});

test('close requires a closure remark', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create(['dispute_status' => DisputeStatus::Open]);

    $this->patch(route('disputes.close', $dispute), [
        'type_of_dispute' => DisputeType::Quantity->value,
        'dispute_closure_remark' => null,
    ])->assertSessionHasErrors('dispute_closure_remark');

    expect($dispute->fresh())->dispute_status->toBe(DisputeStatus::Open);
});

test('close saves edits and sets the dispute to closed', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create(['dispute_status' => DisputeStatus::Open]);

    $this->patch(route('disputes.close', $dispute), [
        'type_of_dispute' => DisputeType::Quantity->value,
        'dispute_value' => 2000,
        'dispute_closure_remark' => 'Settled in full.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $fresh = $dispute->fresh();

    expect($fresh)
        ->dispute_closure_remark->toBe('Settled in full.')
        ->dispute_status->toBe(DisputeStatus::Closed);

    expect((float) $fresh->dispute_value)->toBe(2000.0);
});

test('reopen sets a closed dispute back to open', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create(['dispute_status' => DisputeStatus::Closed]);

    $this->patch(route('disputes.reopen', $dispute))->assertRedirect()->assertSessionHasNoErrors();

    expect($dispute->fresh())->dispute_status->toBe(DisputeStatus::Open);
});

test('guests cannot delete a dispute', function () {
    $dispute = Dispute::factory()->create();

    $this->delete(route('disputes.destroy', $dispute))->assertForbidden();
});

test('destroy deletes the dispute', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $dispute = Dispute::factory()->create();

    $this->delete(route('disputes.destroy', $dispute))->assertRedirect()->assertSessionHasNoErrors();

    expect(Dispute::find($dispute->id))->toBeNull();
});

test('the orders dashboard reports every dispute on a disputed completed order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
    ]);
    Dispute::factory()->count(2)->create(['order_id' => $order->id]);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders', 1)
            ->has('completedOrders.0.disputes', 2));
});

test('the orders dashboard reports no disputes for an undisputed completed order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    Order::factory()->create([
        'status' => OrderStatus::Delivered,
        'invoice_date' => now(),
    ]);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('completedOrders.0.disputes', 0));
});

test('the orders dashboard reports the dispute on a disputed pending order', function () {
    $this->actingAs(User::factory()->create(['type' => UserType::SuperAdmin]));

    $order = Order::factory()->create(['status' => OrderStatus::Pending]);
    $dispute = Dispute::factory()->create(['order_id' => $order->id]);

    $this->get(route('orders'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('pendingOrders', 1)
            ->where('pendingOrders.0.disputes.0.id', $dispute->id));
});
