<?php

namespace App\Services;

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\EnquiryStatus;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\PaymentType;
use App\Enums\ProductType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Port;
use App\Models\SupplyLocation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\Process\Process;

class HistoricalOrderImportService
{
    /** @return list<array{row: int, values: array<string, mixed>}> */
    public function read(string $path, string $node = 'node'): array
    {
        if (! is_file($path) || ! is_readable($path) || strtolower(pathinfo($path, PATHINFO_EXTENSION)) !== 'xlsx') {
            throw new RuntimeException('Provide a readable .xlsx file.');
        }
        if (filesize($path) > 32 * 1024 * 1024) {
            throw new RuntimeException('The workbook must be smaller than 32 MB.');
        }
        $resolvedPath = realpath($path);
        if ($resolvedPath === false) {
            throw new RuntimeException('Cannot resolve the workbook path.');
        }
        $process = new Process([$node, base_path('scripts/read-historical-orders.mjs'), $resolvedPath], base_path());
        $process->setTimeout(120)->mustRun();

        return json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * @param  list<array{row: int, values: array<string, mixed>}>  $source
     * @return array{rows: list<array<string, mixed>>, errors: list<string>, skipped: int}
     */
    public function prepare(array $source): array
    {
        $rows = $errors = $seen = $seenOrderNumbers = $seenBdnNumbers = [];
        $skipped = 0;
        $customerRecords = Customer::all(['sap_id', 'name']);
        $customers = $customerRecords->pluck('sap_id')->all();
        $customersByName = $customerRecords->groupBy(fn (Customer $customer): string => $this->cleanName($customer->name));
        $bargeRecords = Barge::all(['imo', 'name']);
        $barges = $bargeRecords->pluck('imo')->all();
        $bargesByName = $bargeRecords->groupBy(fn (Barge $barge): string => $this->cleanBargeName($barge->name));
        $portRecords = Port::all();
        $ports = $portRecords->groupBy(fn (Port $port): string => $this->cleanName($port->name));
        $locationRecords = SupplyLocation::all();
        $locations = $locationRecords->groupBy(fn (SupplyLocation $location): string => $location->port_id.':'.$this->cleanName($location->name));
        $locationsByName = $locationRecords->groupBy(fn (SupplyLocation $location): string => $this->cleanName($location->name));
        $hasImportKeys = Schema::hasColumn('orders', 'historical_import_key');

        foreach ($source as $entry) {
            $data = [];
            foreach ($entry['values'] as $field => $value) {
                $data[$field] = is_string($value) ? trim($value) : $value;
                if ($data[$field] === '') {
                    $data[$field] = null;
                }
            }
            foreach (['customer_sap_id', 'vessel_imo', 'barge_imo', 'bdn_number', 'order_number', 'mobile_no'] as $field) {
                $data[$field] = isset($data[$field]) ? (string) $data[$field] : null;
            }
            $mode = $this->cleanName((string) ($data['delivery_mode'] ?? ''));
            $data['delivery_mode'] = $mode === 'tank truck' ? 'truck' : $mode;
            if ($data['customer_sap_id'] === null && filled($data['customer_name'] ?? null)) {
                $matches = $customersByName->get($this->cleanName((string) $data['customer_name']));
                if ($matches?->count() === 1) {
                    $data['customer_sap_id'] = $matches->first()->sap_id;
                }
            }
            if ($data['delivery_mode'] === 'barge' && $data['barge_imo'] === null && filled($data['barge_name'] ?? null)) {
                $matches = $bargesByName->get($this->cleanBargeName((string) $data['barge_name']));
                if ($matches?->count() === 1) {
                    $data['barge_imo'] = $matches->first()->imo;
                }
            }
            if (blank($data['port_name'] ?? null) && $data['delivery_mode'] === 'barge' && filled($data['supply_location_name'] ?? null)) {
                $matches = $locationsByName->get($this->cleanName((string) $data['supply_location_name']));
                $portIds = $matches?->pluck('port_id')->unique();
                if ($portIds?->count() === 1) {
                    $data['port_name'] = $portRecords->firstWhere('id', $portIds->first())?->name;
                }
            }
            $data['product_type'] = str_replace(' ', '_', $this->cleanName((string) ($data['product_type'] ?? '')));
            $terms = strtolower((string) ($data['credit_terms'] ?? ''));
            $data['credit_terms'] = is_numeric($terms) ? $terms.'_days' : $terms;
            $data['currency'] = strtoupper((string) ($data['currency'] ?? 'USD'));
            $rules = [
                'order_number' => ['nullable', 'string', 'max:255'],
                'bdn_number' => ['nullable', 'string', 'max:255'],
                'order_date' => ['required', 'date_format:Y-m-d'],
                'delivery_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:order_date', 'before_or_equal:today'],
                'customer_sap_id' => ['required', 'string', Rule::in($customers)],
                'vessel_name' => ['required', 'string', 'max:255'],
                'vessel_imo' => ['nullable', 'string', 'max:255'],
                'agent_name' => ['nullable', 'string', 'max:255'],
                'mobile_no' => ['nullable', 'string', 'max:255'],
                'port_name' => ['required', 'string', 'max:255'],
                'supply_location_name' => ['exclude_unless:delivery_mode,barge', 'required', 'string', 'max:255'],
                'delivery_mode' => ['required', Rule::enum(DeliveryMode::class)],
                'product_type' => ['required', Rule::enum(ProductType::class)],
                'credit_terms' => ['required', Rule::enum(CreditTerms::class)],
                'barge_imo' => ['nullable', 'required_if:delivery_mode,barge', Rule::in($barges)],
                'truck_number' => ['nullable', 'string', 'max:255'],
                'currency' => ['required', Rule::in(['USD'])],
                'payment_due_date' => ['nullable', 'date_format:Y-m-d'],
                'barging_cost_usd' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
                'agent_fees_usd' => ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'],
                'invoice_value_usd' => ['nullable', 'numeric', 'min:0'],
                'settled_amount_usd' => ['nullable', 'numeric', 'min:0'],
            ];
            foreach (FuelGrade::keys() as $grade) {
                $rules[$grade.'_delivered_mt'] = ['nullable', 'numeric', 'min:0', 'max:999999999999.999'];
                $rules[$grade.'_rate_usd_per_mt'] = ['nullable', 'numeric', 'min:0', 'max:9999999999999.99'];
            }
            $validator = Validator::make($data, $rules, [
                'customer_sap_id.in' => 'Customer SAP ID '.($data['customer_sap_id'] ?? '(blank)').' was not found.',
                'customer_sap_id.required' => 'Customer "'.($data['customer_name'] ?? '').'" could not be matched uniquely. Add a Customer SAP ID column.',
                'barge_imo.required_if' => 'Barge "'.($data['barge_name'] ?? '').'" could not be matched uniquely. Add a Barge IMO column.',
                'barge_imo.in' => 'Barge IMO '.($data['barge_imo'] ?? '(blank)').' was not found.',
                'port_name.required' => 'Port could not be determined uniquely. Add a Port column for this row.',
            ]);
            if ($validator->fails()) {
                foreach ($validator->errors()->all() as $message) {
                    $errors[] = 'Row '.$entry['row'].': '.$message;
                }

                continue;
            }
            $data = $validator->validated();
            $matchingPorts = $ports->get($this->cleanName($data['port_name']));
            $port = $matchingPorts?->count() === 1 ? $matchingPorts->first() : null;
            $requiresLocation = $data['delivery_mode'] === DeliveryMode::Barge->value;
            $matchingLocations = $port && $requiresLocation
                ? $locations->get($port->id.':'.$this->cleanName($data['supply_location_name']))
                : null;
            $location = $matchingLocations?->count() === 1 ? $matchingLocations->first() : null;
            if (! $port || ($requiresLocation && ! $location)) {
                $errors[] = 'Row '.$entry['row'].': missing or ambiguous port/supply location: '.$data['port_name'].' / '.($data['supply_location_name'] ?? '(not applicable)');

                continue;
            }
            $order = [
                'customer_id' => $data['customer_sap_id'],
                'vessel_id' => $data['vessel_imo'] ?? null,
                'vessel_name' => $data['vessel_name'],
                'port_id' => $port->id,
                'delivery_location_id' => $location?->id,
                'order_date' => $data['order_date'],
                'delivery_mode' => $data['delivery_mode'],
                'product_type' => $data['product_type'],
                'barge_id' => $data['delivery_mode'] === 'barge' ? $data['barge_imo'] : null,
                'credit_terms' => $data['credit_terms'],
                'barging_cost' => number_format((float) ($data['barging_cost_usd'] ?? 0), 2, '.', ''),
                'agent_fees' => number_format((float) ($data['agent_fees_usd'] ?? 0), 2, '.', ''),
            ];
            foreach (['agent_name', 'mobile_no'] as $field) {
                if (filled($data[$field] ?? null)) {
                    $order[$field] = $data[$field];
                }
            }
            $supplied = false;
            foreach (FuelGrade::keys() as $grade) {
                $quantity = round((float) ($data[$grade.'_delivered_mt'] ?? 0), 3);
                $rate = round((float) ($data[$grade.'_rate_usd_per_mt'] ?? 0), 2);
                if ($quantity > 0 && $rate <= 0) {
                    $errors[] = 'Row '.$entry['row'].': '.$grade.' is supplied without a positive rate.';
                }
                $supplied = $supplied || $quantity > 0;
                $order[$grade.'_final_qty'] = $order[$grade.'_bdn_qty'] = number_format($quantity, 3, '.', '');
                $order[$grade.'_rate'] = $quantity > 0 ? number_format($rate, 2, '.', '') : null;
            }
            if (! $supplied) {
                $errors[] = 'Row '.$entry['row'].': at least one supplied product is required.';
            }
            $preview = new Order($order);
            $preview->invoice_value = OrderService::invoiceValue($preview);
            $total = (float) $preview->invoice_value;
            if ($total <= 0 || $total > 9999999999999.99) {
                $errors[] = 'Row '.$entry['row'].': invoice total is outside the supported range.';
            }
            foreach (['invoice_value_usd', 'settled_amount_usd'] as $field) {
                if (isset($data[$field]) && (float) (new Order(['invoice_value' => $data[$field]]))->invoice_value !== $total) {
                    $errors[] = 'Row '.$entry['row'].': '.$field.' does not match the calculated fully paid invoice '.$total.'.';
                }
            }
            $order['payment_due_date'] = $data['payment_due_date'] ?? Carbon::parse($data['delivery_date'])
                ->addDays(CreditTerms::from($data['credit_terms'])->days())->toDateString();
            $bdn = [
                'delivery_date' => $data['delivery_date'],
                'delivery_location_id' => $location?->id,
                'delivery_method' => $data['delivery_mode'],
                'barge_id' => $order['barge_id'],
                'truck_number' => $data['truck_number'] ?? null,
            ];
            foreach (FuelGrade::keys() as $grade) {
                $bdn[$grade.'_metric_ton'] = (float) $order[$grade.'_bdn_qty'] > 0 ? $order[$grade.'_bdn_qty'] : null;
            }
            $key = hash('sha256', json_encode([$order, $bdn, $data['order_number'] ?? null, $data['bdn_number'] ?? null], JSON_THROW_ON_ERROR));
            if (isset($seen[$key])) {
                $errors[] = 'Row '.$entry['row'].': duplicates row '.$seen[$key].'.';

                continue;
            }
            $seen[$key] = $entry['row'];
            $order['historical_import_key'] = $key;
            $order['order_number'] = $data['order_number'] ?? 'HIST-ORD-'.substr($key, 0, 24);
            $bdn['bdn_number'] = $data['bdn_number'] ?? 'HIST-BDN-'.substr($key, 0, 24);
            if ($hasImportKeys && Order::where('historical_import_key', $key)->exists()) {
                $skipped++;

                continue;
            }
            if ($this->matchingDeliveryExists($order, $bdn, $data['bdn_number'] ?? null)) {
                $errors[] = 'Row '.$entry['row'].': a matching completed delivery already exists. Review before importing.';
            }
            if (isset($seenOrderNumbers[$order['order_number']]) || Order::where('order_number', $order['order_number'])->exists()) {
                $errors[] = 'Row '.$entry['row'].': order number already exists: '.$order['order_number'];
            }
            if (isset($seenBdnNumbers[$bdn['bdn_number']]) || Bdn::where('bdn_number', $bdn['bdn_number'])->exists()) {
                $errors[] = 'Row '.$entry['row'].': BDN number already exists: '.$bdn['bdn_number'];
            }
            $seenOrderNumbers[$order['order_number']] = true;
            $seenBdnNumbers[$bdn['bdn_number']] = true;
            $rows[] = ['row' => $entry['row'], 'order' => $order, 'bdn' => $bdn, 'invoice_value' => $total];
        }

        return ['rows' => $rows, 'errors' => $errors, 'skipped' => $skipped];
    }

    /** @param list<array<string, mixed>> $rows */
    public function import(array $rows): int
    {
        if (! Schema::hasColumn('orders', 'historical_import_key')) {
            throw new RuntimeException('Run the historical import migration before importing.');
        }

        return DB::transaction(function () use ($rows): int {
            if (DB::getDriverName() === 'pgsql') {
                DB::select('SELECT pg_advisory_xact_lock(715315)');
            }
            $imported = 0;
            foreach ($rows as $row) {
                $data = $row['order'];
                if (Order::where('historical_import_key', $data['historical_import_key'])->exists()) {
                    continue;
                }
                $enquiry = Enquiry::create([
                    'vessel_name' => $data['vessel_name'],
                    'imo' => $data['vessel_id'],
                    'port_id' => $data['port_id'],
                    'supply_location_id' => $data['delivery_location_id'],
                    'status' => EnquiryStatus::Won,
                    'instructions' => 'Historical completed delivery imported from spreadsheet.',
                ]);
                $enquiry->created_at = $data['order_date'];
                $enquiry->save();
                $enquiry->enquiryCustomers()->create([
                    'customer_id' => $data['customer_id'],
                    'credit_terms' => $data['credit_terms'],
                    'status' => EnquiryCustomerStatus::Fixed,
                ]);
                $order = Order::create([...$data, 'enquiry_id' => $enquiry->id]);
                $order->created_at = $data['order_date'];
                $order->save();
                $order->bdn()->create($row['bdn']);
                OrderService::complete($order);
                if ((float) $order->invoice_value !== $row['invoice_value']) {
                    throw new RuntimeException('Invoice calculation changed for row '.$row['row'].'. Import rolled back.');
                }
                $order->update(['payment_due_date' => $data['payment_due_date']]);
                Payment::create([
                    'order_number' => $order->order_number,
                    'amount' => $order->invoice_value,
                    'date' => null,
                    'type' => PaymentType::Regular,
                ]);
                $order->syncPaymentTotals();
                $imported++;
            }

            return $imported;
        });
    }

    private function cleanName(string $value): string
    {
        return mb_strtolower(preg_replace('/\s+/', ' ', trim($value)) ?? '');
    }

    private function cleanBargeName(string $value): string
    {
        return preg_replace('/^mt\s+/', '', $this->cleanName($value)) ?? '';
    }

    /**
     * @param  array<string, mixed>  $order
     * @param  array<string, mixed>  $bdn
     */
    private function matchingDeliveryExists(array $order, array $bdn, ?string $providedBdnNumber): bool
    {
        $query = Order::where('customer_id', $order['customer_id'])
            ->where('port_id', $order['port_id'])
            ->where('vessel_name', $order['vessel_name'])
            ->where('delivery_mode', $order['delivery_mode'])
            ->where('product_type', $order['product_type'])
            ->where('barge_id', $order['barge_id'])
            ->whereIn('status', [OrderStatus::Delivered, OrderStatus::Closed])
            ->whereHas('bdn', fn ($delivery) => $delivery
                ->whereDate('delivery_date', $bdn['delivery_date'])
                ->when($providedBdnNumber !== null, fn ($number) => $number->where('bdn_number', $providedBdnNumber)));

        foreach ([
            'mgo' => ['COALESCE(mgo_bdn_qty, mgo_final_qty, 0) = CAST(? AS NUMERIC)', 'COALESCE(mgo_rate, 0) = CAST(? AS NUMERIC)'],
            'vlsfo' => ['COALESCE(vlsfo_bdn_qty, vlsfo_final_qty, 0) = CAST(? AS NUMERIC)', 'COALESCE(vlsfo_rate, 0) = CAST(? AS NUMERIC)'],
            'hsfo' => ['COALESCE(hsfo_bdn_qty, hsfo_final_qty, 0) = CAST(? AS NUMERIC)', 'COALESCE(hsfo_rate, 0) = CAST(? AS NUMERIC)'],
        ] as $grade => [$quantitySql, $rateSql]) {
            $query->whereRaw($quantitySql, [$order[$grade.'_bdn_qty']])
                ->whereRaw($rateSql, [$order[$grade.'_rate'] ?? 0]);
        }

        return $query->exists();
    }
}
