<?php

use App\Jobs\CheckEnquirySanctions;
use App\Models\Enquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

test('it skips sanctions screening when an enquiry has no IMO number', function () {
    $enquiry = Enquiry::factory()->create(['imo' => null]);

    (new CheckEnquirySanctions($enquiry->id))->handle();

    expect($enquiry->refresh())
        ->sanctions_screening_status->toBe('skipped')
        ->sanctions_screening_error->toBe('No IMO number provided.')
        ->sanctions_screened_at->not->toBeNull();
});
