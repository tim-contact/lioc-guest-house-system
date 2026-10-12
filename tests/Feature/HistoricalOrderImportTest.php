<?php

use App\Enums\OrderStatus;
use App\Enums\UserType;
use App\Models\Barge;
use App\Models\Bdn;
use App\Models\Customer;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Port;
use App\Models\SupplyLocation;
use App\Models\User;
use App\Services\HistoricalOrderImportService;
use App\Services\StockMovementService;
use Carbon\CarbonImmutable;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia;
use Symfony\Component\Process\Process;

beforeEach(function () {
    $this->withoutVite();
    $this->travelTo(now()->setDate(2026, 10, 5));
    $this->directory = sys_get_temp_dir().'/historical-import-'.bin2hex(random_bytes(8));
    File::makeDirectory($this->directory);
    $this->customer = Customer::factory()->create(['sap_id' => '00104221']);
    $this->port = Port::factory()->create(['name' => 'Colombo']);
    $this->location = SupplyLocation::factory()->create(['port_id' => $this->port->id, 'name' => 'JCT BERTH']);
    $this->barge = Barge::factory()->create(['imo' => '8923844']);
    $this->values = [
        'order_number' => null, 'bdn_number' => null,
        'order_date' => '2025-12-24', 'delivery_date' => '2026-01-04',
        'customer_sap_id' => '00104221', 'vessel_name' => 'MV Historical', 'vessel_imo' => null,
        'port_name' => 'COLOMBO', 'supply_location_name' => 'jct berth',
        'delivery_mode' => 'BARGE', 'product_type' => 'DUTY PAID', 'credit_terms' => 30,
        'barge_imo' => 8923844,
        'mgo_delivered_mt' => 10.125, 'mgo_rate_usd_per_mt' => 750,
        'vlsfo_delivered_mt' => 100, 'vlsfo_rate_usd_per_mt' => 500,
        'barging_cost_usd' => 100, 'agent_fees_usd' => 50,
    ];
});

afterEach(function () {
    File::deleteDirectory($this->directory);
    $this->travelBack();
});

/** @param list<array<string, mixed>> $rows */
function historicalWorkbook(string $directory, array $rows, string $sheet = 'Orders'): string
{
    $path = $directory.'/orders.xlsx';
    $process = new Process(['node', '-e',
        'const X=require("xlsx"); const w=X.utils.book_new(); X.utils.book_append_sheet(w,X.utils.json_to_sheet(JSON.parse(process.argv[2])),process.argv[3]); X.writeFile(w,process.argv[1]);',
        $path, json_encode($rows, JSON_THROW_ON_ERROR), $sheet,
    ], base_path());
    $process->mustRun();

    return $path;
}

/** @param array<int, mixed> $changes */
function operationsWorkbook(string $directory, array $changes = [], bool $identifiers = true, bool $swapProducts = false, bool $alternateHeaders = false): string
{
    $headers = ['NO', 'CUSTOMER VESSEL', 'CUSTOMER', 'PRODUCT', null, 'TOTAL', 'PRESENT ETA/ETB', 'TIME', 'DELIVERY LOCATION', 'MODE OF DELIVERY (Barge / TT/ PL)', 'PDT TYPE (Prod nature)', 'UNIT RATE (USD/MT)', null, 'LAYCAN', 'NOM QTY', 'AGENT NAME', 'MOBILE', 'IMO', 'DATE OF BOOKING', 'Credit period / Payment Terms (CIA not required)', 'Credit date exceed'];
    $subheaders = array_fill(0, count($headers), null);
    $subheaders[3] = $swapProducts ? 'LSFO' : 'MGO';
    $subheaders[4] = $swapProducts ? 'MGO' : 'LSFO';
    $subheaders[11] = 'MGO';
    $subheaders[12] = 'LSFO';
    $values = [1, 'MV Historical', 'Exact Shipping', $swapProducts ? 100 : 10.125, $swapProducts ? 10.125 : 100, 110.125, 46026, 0.5, 'JCT BERTH', 'Historic Barge', 'BONDED', 750, 500, null, 9999, 'Historical Agent', '0712345678', null, 46015, 30, null];
    if ($identifiers) {
        $headers[] = 'Port';
        $headers[] = 'Customer SAP ID';
        $values[] = 'Colombo';
        $values[] = '00104221';
    }
    if ($alternateHeaders) {
        $headers[3] = 'PRODUCT QTY (MT)';
        $headers[9] = 'DELIVERY MODE (Barge / TT)';
        $headers[10] = 'PDT TYPE';
        if ($identifiers) {
            $headers[22] = 'CUSTOMER CODE';
        }
    }
    foreach ($changes as $column => $value) {
        $values[$column] = $value;
    }
    $path = $directory.'/operations.xlsx';
    $process = new Process(['node', '-e',
        'const X=require("xlsx"); const w=X.utils.book_new(); const s=X.utils.aoa_to_sheet(JSON.parse(process.argv[2])); s["!merges"]=[{s:{r:0,c:3},e:{r:0,c:4}},{s:{r:0,c:11},e:{r:0,c:12}},{s:{r:2,c:0},e:{r:2,c:20}}]; X.utils.book_append_sheet(w,s,"Sheet1"); X.writeFile(w,process.argv[1]);',
        $path, json_encode([$headers, $subheaders, ['Completed deliveries at Colombo / Galle / Hambantota'], $values], JSON_THROW_ON_ERROR),
    ], base_path());
    $process->mustRun();

    return $path;
}

test('operations template maps merged product headers and confirmed dates', function (bool $swapProducts, bool $alternateHeaders) {
    $this->barge->update(['name' => 'MT Historic Barge']);
    $path = operationsWorkbook($this->directory, swapProducts: $swapProducts, alternateHeaders: $alternateHeaders);
    $source = app(HistoricalOrderImportService::class)->read($path);
    expect($source)->toHaveCount(1);
    expect($source[0]['row'])->toBe(4);
    expect($source[0]['values']['mgo_delivered_mt'])->toBe(10.125);
    expect($source[0]['values']['vlsfo_delivered_mt'])->toBe(100);
    expect($source[0]['values']['mgo_rate_usd_per_mt'])->toBe(750);
    expect($source[0]['values']['vlsfo_rate_usd_per_mt'])->toBe(500);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    $order = Order::sole();
    expect($order->order_date->toDateString())->toBe('2025-12-24');
    expect($order->invoice_date->toDateString())->toBe('2026-01-04');
    expect($order->vlsfo_final_qty)->toBe('100.000');
    expect($order->mgo_final_qty)->toBe('10.125');
    expect($order->invoice_value)->toBe('57593.75');
    expect($order->agent_name)->toBe('Historical Agent');
    expect($order->mobile_no)->toBe('0712345678');
    expect($order->order_number)->toStartWith('HIST-ORD-');
    expect($order->barge_id)->toBe($this->barge->imo);
})->with([false, true])->with([false, true]);

test('operations template resolves only unique exact customer and location names', function () {
    $this->customer->update(['name' => 'EXACT SHIPPING']);
    $this->barge->update(['name' => 'MT Historic Barge']);
    $path = operationsWorkbook($this->directory, identifiers: false);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    expect(Order::sole()->customer_id)->toBe($this->customer->sap_id);
    expect(Order::sole()->port_id)->toBe($this->port->id);
});

test('operations template rejects ambiguous customer and supply location names', function () {
    $this->customer->update(['name' => 'Exact Shipping']);
    Customer::factory()->create(['name' => 'Exact Shipping']);
    $this->barge->update(['name' => 'MT Historic Barge']);
    $otherPort = Port::factory()->create(['name' => 'Galle']);
    SupplyLocation::factory()->create(['port_id' => $otherPort->id, 'name' => 'JCT BERTH']);
    $path = operationsWorkbook($this->directory, identifiers: false);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])
        ->expectsOutputToContain('Add a Customer SAP ID column')
        ->expectsOutputToContain('Add a Port column')->assertFailed();
    expect(Order::count())->toBe(0);
});

test('operations template does not silently replace shortened customer names', function () {
    $this->customer->update(['name' => 'Exact Shipping Ltd']);
    $this->barge->update(['name' => 'MT Historic Barge']);
    $path = operationsWorkbook($this->directory, identifiers: false);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])
        ->expectsOutputToContain('Add a Customer SAP ID column')->assertFailed();
    expect(Order::count())->toBe(0);
});

test('operations template resolves tt and pl without inventing barge or location', function (string $mode, string $expected) {
    $path = operationsWorkbook($this->directory, [9 => $mode, 8 => 'Customer address']);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    expect(Order::sole()->delivery_mode->value)->toBe($expected);
    expect(Order::sole()->delivery_location_id)->toBeNull();
    expect(Order::sole()->barge_id)->toBeNull();
})->with([['TT', 'truck'], ['PL', 'pipeline'], ['TRUCKS', 'truck'], ['PIPE LINE', 'pipeline']]);

test('operations template reports own bunker rows instead of silently importing or dropping them', function () {
    $this->barge->update(['name' => 'MT Historic Barge']);
    $path = operationsWorkbook($this->directory, [1 => 'OWN BUNKER', 18 => null, 19 => null, 11 => '-']);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertFailed();
    expect(Order::count())->toBe(0);
});

test('dry run reads real xlsx and changes no records', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true, '--dry-run' => true])
        ->expectsOutputToContain('1 new orders')
        ->expectsOutputToContain('Dry run complete')
        ->assertSuccessful();
    expect(Order::count())->toBe(0);
    expect(Bdn::count())->toBe(0);
    expect(Payment::count())->toBe(0);
    expect(Enquiry::count())->toBe(0);
});

test('imports completed deliveries fully paid with undated settlements', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    $order = Order::sole();
    expect($order->status)->toBe(OrderStatus::Delivered);
    expect($order->invoice_value)->toBe('57743.75');
    expect($order->amount_received)->toBe('57743.75');
    expect($order->isPaidInFull())->toBeTrue();
    expect($order->balance_amount)->toBe(0.0);
    expect($order->vessel_id)->toBeNull();
    expect($order->customer_id)->toBe('00104221');
    expect($order->payment_receipt_date)->toBeNull();
    expect(Payment::sole()->date)->toBeNull();
    expect($order->invoice_date->toDateString())->toBe('2026-01-04');
    expect($order->created_at->toDateString())->toBe('2025-12-24');
    expect($order->payment_due_date->toDateString())->toBe('2026-02-03');
    expect($order->order_number)->toStartWith('HIST-ORD-');
    expect($order->bdn->bdn_number)->toStartWith('HIST-BDN-');
    expect($order->bdn->vlsfo_metric_ton)->toBe('100.000');
    expect($order->bdn->hsfo_metric_ton)->toBeNull();
    expect($order->enquiry->enquiryCustomers()->sole()->customer_id)->toBe('00104221');
    $order->syncPaymentTotals();
    expect($order->balance_amount)->toBe(0.0);
});

test('half cent invoices use the same decimal rounding during validation and import', function () {
    $path = historicalWorkbook($this->directory, [[
        ...$this->values,
        'vlsfo_delivered_mt' => 229.861,
        'vlsfo_rate_usd_per_mt' => 495,
        'mgo_delivered_mt' => 0,
        'mgo_rate_usd_per_mt' => 0,
        'barging_cost_usd' => 0,
        'agent_fees_usd' => 0,
        'invoice_value_usd' => 113781.20,
        'settled_amount_usd' => 113781.20,
    ]]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true, '--dry-run' => true])
        ->expectsOutputToContain('113,781.20')->assertSuccessful();
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();

    $order = Order::sole()->refresh();
    expect($order->invoice_value)->toBe('113781.20');
    expect($order->amount_received)->toBe('113781.20');
    expect(Payment::sole()->amount)->toBe('113781.20');
    expect($order->balance_amount)->toBe(0.0);
    expect($order->isPaidInFull())->toBeTrue();
});

test('undated historical settlements sort after dated payments', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    Payment::factory()->create(['date' => '2026-10-01']);
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));
    $this->get(route('payments.index'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('payments.data.0.date', '2026-10-01')
        ->where('payments.data.1.date', null));
});

test('rerunning the workbook does not duplicate orders payments or enquiries', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])
        ->expectsOutputToContain('1 previously imported rows skipped')->assertSuccessful();
    expect(Order::count())->toBe(1);
    expect(Payment::count())->toBe(1);
    expect(Enquiry::count())->toBe(1);
});

test('preserves supplied identifiers and spreadsheet payment due dates', function () {
    $path = historicalWorkbook($this->directory, [[...$this->values,
        'order_number' => 'OLD-001', 'bdn_number' => '11405;11406', 'payment_due_date' => '2026-02-05',
    ]]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    expect(Order::sole()->order_number)->toBe('OLD-001');
    expect(Order::sole()->payment_due_date->toDateString())->toBe('2026-02-05');
    expect(Bdn::sole()->bdn_number)->toBe('11405;11406');
});

test('truck and pipeline deliveries need neither barge nor supply location', function (string $mode, string $expected, ?string $location) {
    $path = historicalWorkbook($this->directory, [[...$this->values, 'delivery_mode' => $mode, 'barge_imo' => null, 'supply_location_name' => $location]]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    expect(Order::sole()->barge_id)->toBeNull();
    expect(Order::sole()->delivery_mode->value)->toBe($expected);
    expect(Bdn::sole()->delivery_method->value)->toBe($expected);
    expect(Order::sole()->delivery_location_id)->toBeNull();
    expect(Bdn::sole()->delivery_location_id)->toBeNull();
    expect(Enquiry::sole()->supply_location_id)->toBeNull();
    expect(Order::sole()->port_id)->toBe($this->port->id);
})->with([
    ['TANK TRUCK', 'truck', null],
    ['TANK TRUCK', 'truck', 'Customer delivery address'],
    ['TANK TRUCK', 'truck', 'JCT BERTH'],
    ['PIPELINE', 'pipeline', null],
    ['PIPELINE', 'pipeline', 'Unknown pipeline location'],
    ['PIPELINE', 'pipeline', 'JCT BERTH'],
]);

test('validation errors prevent the whole workbook from importing', function (array $changes) {
    $path = historicalWorkbook($this->directory, [$this->values, [...$this->values, ...$changes]]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertFailed();
    expect(Order::count())->toBe(0);
    expect(Payment::count())->toBe(0);
    expect(Enquiry::count())->toBe(0);
})->with([
    [['customer_sap_id' => 'MISSING']],
    [['barge_imo' => 'MISSING']],
    [['supply_location_name' => 'MISSING']],
    [['supply_location_name' => null]],
    [['delivery_mode' => 'TRUCK', 'barge_imo' => null, 'supply_location_name' => null, 'port_name' => 'MISSING']],
    [['port_name' => 'MISSING']],
    [['credit_terms' => 3]],
    [['vlsfo_rate_usd_per_mt' => '520 + 570']],
    [['vlsfo_rate_usd_per_mt' => 0]],
    [['delivery_date' => '2024-01-01']],
    [['currency' => 'USD']],
    [['invoice_value_usd' => 1]],
    [['settled_amount_usd' => 1]],
]);

test('exact duplicate spreadsheet rows are rejected', function () {
    $path = historicalWorkbook($this->directory, [$this->values, $this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])
        ->expectsOutputToContain('duplicates row 2')->assertFailed();
    expect(Order::count())->toBe(0);
});

test('existing identifiers cannot be overwritten', function () {
    Order::factory()->create(['order_number' => 'OLD-001']);
    $path = historicalWorkbook($this->directory, [[...$this->values, 'order_number' => 'OLD-001']]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertFailed();
    expect(Order::count())->toBe(1);
    expect(Enquiry::count())->toBe(1);
    expect(Payment::count())->toBe(0);
});

test('import requires explicit fully paid confirmation', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path])->assertFailed();
    expect(Order::count())->toBe(0);
});

test('other sheets cannot be imported accidentally', function () {
    $path = historicalWorkbook($this->directory, [$this->values], 'Examples - DO NOT IMPORT');
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertFailed();
    expect(Order::count())->toBe(0);
});

test('excel serial dates are read without timezone shifts', function () {
    $path = historicalWorkbook($this->directory, [[...$this->values, 'order_date' => 46015, 'delivery_date' => 46026]]);
    $source = app(HistoricalOrderImportService::class)->read($path);
    expect($source[0]['values']['order_date'])->toBe('2025-12-24');
    expect($source[0]['values']['delivery_date'])->toBe('2026-01-04');
});

test('historical deliveries do not reduce operational stock without a cutoff', function () {
    config(['stock.barge_stock_start_date' => null]);
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    $date = CarbonImmutable::parse('2026-01-04');
    $report = app(StockMovementService::class)->report($this->port->id, $date, $date);
    expect($report['totals']['barge_closing']['vlsfo'])->toBe(0.0);
    expect($report['totals']['barge_closing']['mgo'])->toBe(0.0);
});

test('finance and payment pages support historical undated settlements', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertSuccessful();
    $this->actingAs(User::factory()->create(['type' => UserType::Finance]));
    $this->get(route('payments.index'))->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->where('payments.data.0.date', null));
    $this->get(route('finance'))->assertOk();
});

test('a preexisting completed delivery is flagged even without source order numbers', function () {
    $importer = app(HistoricalOrderImportService::class);
    $plan = $importer->prepare([['row' => 2, 'values' => $this->values]]);
    $importer->import($plan['rows']);
    Order::sole()->update(['historical_import_key' => null]);

    $plan = $importer->prepare([['row' => 2, 'values' => $this->values]]);
    expect(implode(' ', $plan['errors']))->toContain('matching completed delivery already exists');
});

test('write failures roll back the entire import including earlier rows', function () {
    $importer = app(HistoricalOrderImportService::class);
    $plan = $importer->prepare([
        ['row' => 2, 'values' => $this->values],
        ['row' => 3, 'values' => [...$this->values, 'vessel_name' => 'MV Other Historical']],
    ]);
    expect($plan['errors'])->toBe([]);
    $plan['rows'][1]['bdn']['bdn_number'] = $plan['rows'][0]['bdn']['bdn_number'];

    expect(fn () => $importer->import($plan['rows']))->toThrow(QueryException::class);
    expect(Order::count())->toBe(0);
    expect(Enquiry::count())->toBe(0);
    expect(Bdn::count())->toBe(0);
    expect(Payment::count())->toBe(0);
});

test('duplicate supplied bdn numbers are rejected before writing', function () {
    $path = historicalWorkbook($this->directory, [
        [...$this->values, 'bdn_number' => 'BDN-SAME'],
        [...$this->values, 'bdn_number' => 'BDN-SAME', 'vessel_name' => 'MV Other'],
    ]);
    $this->artisan('orders:import-history', ['file' => $path, '--fully-paid' => true])->assertFailed();
    expect(Order::count())->toBe(0);
});

test('customer import creates only missing sap ids with approved defaults', function () {
    $path = historicalWorkbook($this->directory, [
        [...$this->values, 'customer_name' => 'Do not overwrite existing'],
        [...$this->values, 'customer_sap_id' => '000109771', 'customer_name' => 'Hamka Shipping'],
        [...$this->values, 'customer_sap_id' => '000109771', 'customer_name' => 'Hamka Shipping'],
    ]);
    $oldName = $this->customer->name;
    $this->artisan('customers:import-history', ['file' => $path, '--account-type' => 'fcbu'])
        ->expectsOutputToContain('1 customers created')->assertSuccessful();
    $customer = Customer::findOrFail('000109771');
    expect($customer->name)->toBe('Hamka Shipping');
    expect($customer->address)->toBe('');
    expect($customer->country)->toBe('');
    expect($customer->credit_limit)->toBe('0.00');
    expect($customer->account_type->value)->toBe('fcbu');
    expect($this->customer->refresh()->name)->toBe($oldName);
    expect(Order::count())->toBe(0);
    expect(Payment::count())->toBe(0);
    $this->artisan('customers:import-history', ['file' => $path, '--account-type' => 'fcbu'])
        ->expectsOutputToContain('0 customers created')->assertSuccessful();
    expect(Customer::count())->toBe(2);
});

test('customer import dry run leaves the database unchanged', function () {
    $path = historicalWorkbook($this->directory, [[...$this->values, 'customer_sap_id' => '109771', 'customer_name' => 'Hamka Shipping']]);
    $this->artisan('customers:import-history', ['file' => $path, '--account-type' => 'fcbu', '--dry-run' => true])
        ->expectsOutputToContain('1 missing customers')->assertSuccessful();
    expect(Customer::count())->toBe(1);
});

test('customer import rejects conflicting names without partial inserts', function () {
    $path = historicalWorkbook($this->directory, [
        [...$this->values, 'customer_sap_id' => '109771', 'customer_name' => 'Hamka Shipping'],
        [...$this->values, 'customer_sap_id' => '109771', 'customer_name' => 'Another Company'],
    ]);
    $this->artisan('customers:import-history', ['file' => $path, '--account-type' => 'fcbu'])
        ->expectsOutputToContain('conflicting customer names')->assertFailed();
    expect(Customer::count())->toBe(1);
});

test('customer import requires explicit valid account type', function () {
    $path = historicalWorkbook($this->directory, [$this->values]);
    $this->artisan('customers:import-history', ['file' => $path])->assertFailed();
    $this->artisan('customers:import-history', ['file' => $path, '--account-type' => 'invalid'])->assertFailed();
    expect(Customer::count())->toBe(1);
});
