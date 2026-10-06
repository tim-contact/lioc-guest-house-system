<?php

namespace App\Console\Commands;

use App\Enums\AccountType;
use App\Models\Customer;
use App\Services\HistoricalOrderImportService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Throwable;

#[Signature('customers:import-history {file : Path to the Orders XLSX}
    {--account-type= : Account type for new customers: fcbu or dbu}
    {--dry-run : List missing customers without creating them}
    {--node=node : Node executable for the XLSX reader}')]
#[Description('Create missing historical customers with blank address/country and zero credit limit')]
class ImportHistoricalCustomers extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(HistoricalOrderImportService $importer): int
    {
        $accountType = AccountType::tryFrom(strtolower((string) $this->option('account-type')));
        if ($accountType === null) {
            $this->error('Specify --account-type=fcbu or --account-type=dbu for the new customers.');

            return self::FAILURE;
        }

        try {
            $source = $importer->read((string) $this->argument('file'), (string) $this->option('node'));
            if ($source === []) {
                $this->error('The Orders sheet has no populated rows.');

                return self::FAILURE;
            }
            $existingIds = Customer::pluck('sap_id')->all();
            $missing = [];
            $errors = [];
            foreach ($source as $row) {
                $id = trim((string) ($row['values']['customer_sap_id'] ?? ''));
                if (in_array($id, $existingIds, true)) {
                    continue;
                }
                $name = preg_replace('/\s+/', ' ', trim((string) ($row['values']['customer_name'] ?? ''))) ?? '';
                $validator = Validator::make(['sap_id' => $id, 'name' => $name], [
                    'sap_id' => ['required', 'string', 'max:255', 'not_regex:/^TEMP-/i'],
                    'name' => ['required', 'string', 'max:255'],
                ]);
                if ($validator->fails()) {
                    foreach ($validator->errors()->all() as $error) {
                        $errors[] = 'Row '.$row['row'].': '.$error;
                    }

                    continue;
                }
                if (isset($missing[$id]) && mb_strtolower($missing[$id]['name']) !== mb_strtolower($name)) {
                    $errors[] = 'Row '.$row['row'].': conflicting customer names for SAP ID '.$id.'.';

                    continue;
                }
                $missing[$id] ??= [
                    'sap_id' => $id,
                    'name' => $name,
                    'address' => '',
                    'country' => '',
                    'credit_limit' => 0,
                    'account_type' => $accountType->value,
                ];
            }
            if ($errors !== []) {
                foreach ($errors as $error) {
                    $this->error($error);
                }
                $this->error('Nothing created.');

                return self::FAILURE;
            }
            $this->table(['SAP ID', 'Customer'], array_map(fn (array $customer): array => [$customer['sap_id'], $customer['name']], array_values($missing)));
            $this->info(count($missing).' missing customers. Address/country blank; credit limit zero; account type '.$accountType->label().'. Existing customers remain unchanged.');
            if ($this->option('dry-run')) {
                $this->info('Dry run complete. No customers created.');

                return self::SUCCESS;
            }
            $created = DB::transaction(function () use ($missing): int {
                $count = 0;
                foreach ($missing as $data) {
                    $customer = Customer::firstOrCreate(['sap_id' => $data['sap_id']], $data);
                    $count += $customer->wasRecentlyCreated ? 1 : 0;
                }

                return $count;
            });
            $this->info($created.' customers created. No orders or payments imported.');

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
