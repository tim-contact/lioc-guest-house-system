<?php

namespace App\Console\Commands;

use App\Services\HistoricalOrderImportService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

#[Signature('orders:import-history {file : Path to the completed Orders XLSX}
    {--dry-run : Validate without writing any records}
    {--fully-paid : Confirm every imported order is fully paid with an unknown payment date}
    {--currency=USD : Currency for blank cells; only USD is supported}
    {--node=node : Node executable used by the existing XLSX reader}
    {--show-all-errors : Print all validation errors instead of the first 25}')]
#[Description('Import historical completed USD deliveries and undated settlements atomically')]
class ImportHistoricalOrders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(HistoricalOrderImportService $importer): int
    {
        if (! $this->option('fully-paid') || strtoupper((string) $this->option('currency')) !== 'USD') {
            $this->error('This importer requires --fully-paid and supports USD only. Payment dates remain NULL.');

            return self::FAILURE;
        }

        try {
            $source = $importer->read((string) $this->argument('file'), (string) $this->option('node'));
            if ($source === []) {
                $this->error('The Orders sheet has no populated rows.');

                return self::FAILURE;
            }
            $result = $importer->prepare($source);
            $this->info(count($source).' worksheet rows; '.$result['skipped'].' previously imported rows skipped.');
            if ($result['errors'] !== []) {
                $this->error(count($result['errors']).' validation errors. Nothing imported.');
                foreach ($this->option('show-all-errors') ? $result['errors'] : array_slice($result['errors'], 0, 25) as $error) {
                    $this->line($error);
                }
                if (count($result['errors']) > 25 && ! $this->option('show-all-errors')) {
                    $this->line('Use --show-all-errors to see the remaining errors.');
                }

                return self::FAILURE;
            }
            $this->info(count($result['rows']).' new orders; calculated invoice total USD '.number_format(array_sum(array_column($result['rows'], 'invoice_value')), 2));
            $this->line('Missing identifiers are generated with HIST- prefixes. Payment dates remain NULL. Historical deliveries are excluded from operational stock.');
            if ($this->option('dry-run')) {
                $this->info('Dry run complete. No database records changed.');

                return self::SUCCESS;
            }
            $this->info($importer->import($result['rows']).' historical orders imported.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
