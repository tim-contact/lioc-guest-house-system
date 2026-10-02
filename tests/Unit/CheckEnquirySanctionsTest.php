<?php

use App\Jobs\CheckEnquirySanctions;
use App\Models\Enquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('the database queue worker processes sanctions screening jobs', function () {
    config()->set('queue.default', 'database');

    $enquiry = Enquiry::factory()->create(['imo' => null]);

    CheckEnquirySanctions::dispatch($enquiry->id);

    $this->assertDatabaseCount('jobs', 1);

    $this->artisan('queue:work', [
        '--once' => true,
        '--force' => true,
        '--sleep' => 0,
        '--tries' => 2,
        '--timeout' => 90,
    ])->assertSuccessful();

    $this->assertDatabaseCount('jobs', 0);
    $this->assertDatabaseCount('failed_jobs', 0);

    expect($enquiry->refresh())
        ->sanctions_screening_status->toBe('skipped')
        ->sanctions_screened_at->not->toBeNull();
});

test('it skips sanctions screening when an enquiry has no IMO number', function () {
    $enquiry = Enquiry::factory()->create(['imo' => null]);

    (new CheckEnquirySanctions($enquiry->id))->handle();

    expect($enquiry->refresh())
        ->sanctions_screening_status->toBe('skipped')
        ->sanctions_screening_error->toBe('No IMO number provided.')
        ->sanctions_screened_at->not->toBeNull();
});
