<?php

namespace App\Models;

use App\Enums\CreditTerms;
use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Enums\SupplyLocation;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $enquiry_id
 * @property string $order_number
 * @property Carbon|null $order_date
 * @property string $customer_id
 * @property string|null $vessel_id
 * @property string|null $vessel_name
 * @property int|null $port_id
 * @property Carbon|null $eta
 * @property Carbon|null $laycan_from
 * @property Carbon|null $laycan_to
 * @property DeliveryMode|null $delivery_mode
 * @property SupplyLocation|null $delivery_location
 * @property ProductType|null $product_type
 * @property string|null $barge_id
 * @property int|null $agent_id
 * @property string|null $agent_name
 * @property int|null $agent_pic_id
 * @property string|null $pic
 * @property string|null $mobile_no
 * @property float|null $vlsfo_quantity_low
 * @property float|null $vlsfo_quantity_high
 * @property string|null $vlsfo_qty_range
 * @property float|null $vlsfo_rate
 * @property float|null $vlsfo_final_qty
 * @property float|null $vlsfo_bdn_qty
 * @property float|null $mgo_quantity_low
 * @property float|null $mgo_quantity_high
 * @property string|null $mgo_qty_range
 * @property float|null $mgo_rate
 * @property float|null $mgo_final_qty
 * @property float|null $mgo_bdn_qty
 * @property float|null $hsfo_quantity_low
 * @property float|null $hsfo_quantity_high
 * @property string|null $hsfo_qty_range
 * @property float|null $hsfo_rate
 * @property float|null $hsfo_final_qty
 * @property float|null $hsfo_bdn_qty
 * @property float|null $invoice_value
 * @property Carbon|null $invoice_date
 * @property Carbon|null $payment_due_date
 * @property float|null $amount_received
 * @property Carbon|null $payment_receipt_date
 * @property float $balance_amount
 * @property CreditTerms|null $credit_terms
 * @property OrderStatus $status
 */
#[Fillable([
    'enquiry_id', 'order_number', 'order_date', 'customer_id', 'vessel_id', 'vessel_name',
    'port_id', 'eta', 'laycan_from', 'laycan_to', 'delivery_mode', 'delivery_location',
    'product_type', 'barge_id', 'agent_id', 'agent_name', 'agent_pic_id', 'pic', 'mobile_no',
    'vlsfo_quantity_low', 'vlsfo_quantity_high', 'vlsfo_qty_range', 'vlsfo_rate', 'vlsfo_final_qty', 'vlsfo_bdn_qty',
    'mgo_quantity_low', 'mgo_quantity_high', 'mgo_qty_range', 'mgo_rate', 'mgo_final_qty', 'mgo_bdn_qty',
    'hsfo_quantity_low', 'hsfo_quantity_high', 'hsfo_qty_range', 'hsfo_rate', 'hsfo_final_qty', 'hsfo_bdn_qty',
    'invoice_value', 'invoice_date', 'payment_due_date', 'amount_received', 'payment_receipt_date',
    'credit_terms', 'status',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * Per-grade columns, mapped to their cast. Prefixed with each FuelGrade.
     *
     * @var array<string, string>
     */
    private const GRADE_CASTS = [
        'quantity_low' => 'decimal:3',
        'quantity_high' => 'decimal:3',
        'rate' => 'decimal:2',
        'final_qty' => 'decimal:3',
        'bdn_qty' => 'decimal:3',
    ];

    /**
     * @var list<string>
     */
    protected $appends = ['balance_amount'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'status' => OrderStatus::class,
            'credit_terms' => CreditTerms::class,
            'product_type' => ProductType::class,
            'delivery_mode' => DeliveryMode::class,
            'delivery_location' => SupplyLocation::class,
            'eta' => 'datetime:Y-m-d\TH:i:s',
            'order_date' => 'date',
            'laycan_from' => 'date',
            'laycan_to' => 'date',
            'invoice_date' => 'date',
            'payment_due_date' => 'date',
            'payment_receipt_date' => 'date',
            'invoice_value' => 'decimal:2',
            'amount_received' => 'decimal:2',
        ];

        foreach (FuelGrade::keys() as $grade) {
            foreach (self::GRADE_CASTS as $field => $cast) {
                $casts["{$grade}_{$field}"] = $cast;
            }
        }

        return $casts;
    }

    /**
     * Outstanding balance on the invoice (invoice value less amount received).
     *
     * @return Attribute<float, never>
     */
    protected function balanceAmount(): Attribute
    {
        return Attribute::make(
            get: fn (): float => (float) ($this->invoice_value ?? 0) - (float) ($this->amount_received ?? 0),
        );
    }

    /**
     * An invoiced order whose balance has been fully settled.
     */
    public function isPaidInFull(): bool
    {
        return (float) $this->invoice_value > 0 && $this->balance_amount <= 0;
    }

    /**
     * Refresh the cached amount received (sum of payments) and receipt date
     * (most recent payment) from this order's payments.
     */
    public function syncPaymentTotals(): void
    {
        $this->update([
            'amount_received' => $this->payments()->sum('amount'),
            'payment_receipt_date' => $this->payments()->max('date'),
        ]);
    }

    /** @return BelongsTo<Enquiry, $this> */
    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    /** @return BelongsTo<Port, $this> */
    public function port(): BelongsTo
    {
        return $this->belongsTo(Port::class);
    }

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** @return BelongsTo<Barge, $this> */
    public function barge(): BelongsTo
    {
        return $this->belongsTo(Barge::class, 'barge_id');
    }

    /** @return HasOne<Bdn, $this> */
    public function bdn(): HasOne
    {
        return $this->hasOne(Bdn::class);
    }

    /** @return HasMany<Dispute, $this> */
    public function disputes(): HasMany
    {
        return $this->hasMany(Dispute::class)->latest();
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'order_number', 'order_number');
    }
}
