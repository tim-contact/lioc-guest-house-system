<?php

namespace App\Jobs;

use App\Models\Enquiry;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Symfony\Component\Process\Process;
use Throwable;

class CheckEnquirySanctions implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 90;

    /**
     * Create a new job instance.
     */
    public function __construct(public int $enquiryId) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $enquiry = Enquiry::find($this->enquiryId);

        if ($enquiry === null) {
            return;
        }

        if (blank($enquiry->imo)) {
            $enquiry->forceFill([
                'sanctions_screening_status' => 'skipped',
                'sanctions_screened_at' => now(),
                'sanctions_screening_error' => 'No IMO number provided.',
            ])->save();

            return;
        }

        $enquiry->forceFill([
            'sanctions_screening_status' => 'checking',
            'sanctions_screening_error' => null,
        ])->save();

        $process = new Process([
            'bash',
            base_path('scripts/ofac-check.sh'),
            (string) $enquiry->imo,
        ]);
        $process->setTimeout(60);

        try {
            $process->mustRun();

            $result = trim($process->getOutput());

            $enquiry->forceFill([
                'sanctions_screening_status' => $this->normalizeResult($result),
                'sanctions_screened_at' => now(),
                'sanctions_screening_error' => null,
            ])->save();
        } catch (Throwable $exception) {
            $enquiry->forceFill([
                'sanctions_screening_status' => 'error',
                'sanctions_screened_at' => now(),
                'sanctions_screening_error' => mb_strimwidth($exception->getMessage(), 0, 2000),
            ])->save();

            throw $exception;
        }
    }

    private function normalizeResult(string $result): string
    {
        return match ($result) {
            'NOT_LISTED' => 'not_listed',
            'POSSIBLE_MATCH' => 'possible_match',
            default => 'error',
        };
    }
}
