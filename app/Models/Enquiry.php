<?php

namespace App\Models;

use App\Enums\DeliveryMode;
use App\Enums\EnquiryStatus;
use App\Enums\FuelGrade;
use App\Enums\ProductType;
use App\Enums\QualityClaim;
use App\Enums\Sampling;
use App\Enums\SupplyLocation;
use Database\Factories\EnquiryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $vessel_name
 * @property string|null $imo
 * @property int|null $port_id
 * @property Carbon|null $laycan_from
 * @property Carbon|null $laycan_to
 * @property Carbon|null $eta
 * @property EnquiryStatus $status
 * @property int|null $agent_id
 * @property Sampling $sampling
 * @property SupplyLocation|null $supply_location
 * @property QualityClaim|null $quality_claim
 * @property string|null $instructions
 * @property float $barging_cost
 * @property string|null $lost_to
 * @property string|null $lost_port
 * @property float|null $vlsfo_quantity_low
 * @property float|null $vlsfo_quantity_high
 * @property ProductType|null $vlsfo_product_type
 * @property DeliveryMode|null $vlsfo_delivery_mode
 * @property float|null $vlsfo_lost_price
 * @property float|null $mgo_quantity_low
 * @property float|null $mgo_quantity_high
 * @property ProductType|null $mgo_product_type
 * @property DeliveryMode|null $mgo_delivery_mode
 * @property float|null $mgo_lost_price
 * @property float|null $hsfo_quantity_low
 * @property float|null $hsfo_quantity_high
 * @property ProductType|null $hsfo_product_type
 * @property DeliveryMode|null $hsfo_delivery_mode
 * @property float|null $hsfo_lost_price
 */
#[Fillable([
    'vessel_name', 'imo', 'port_id', 'laycan_from', 'laycan_to', 'eta', 'status', 'agent_id', 'sampling', 'supply_location', 'quality_claim', 'instructions', 'barging_cost',
    'lost_to', 'lost_port',
    'vlsfo_quantity_low', 'vlsfo_quantity_high', 'vlsfo_product_type', 'vlsfo_delivery_mode', 'vlsfo_lost_price',
    'mgo_quantity_low', 'mgo_quantity_high', 'mgo_product_type', 'mgo_delivery_mode', 'mgo_lost_price',
    'hsfo_quantity_low', 'hsfo_quantity_high', 'hsfo_product_type', 'hsfo_delivery_mode', 'hsfo_lost_price',
])]
class Enquiry extends Model
{
    /** @use HasFactory<EnquiryFactory> */
    use HasFactory;

    /**
     * Per-grade columns, mapped to their cast. Prefixed with each FuelGrade.
     *
     * @var array<string, string>
     */
    private const GRADE_CASTS = [
        'quantity_low' => 'decimal:3',
        'quantity_high' => 'decimal:3',
        'product_type' => ProductType::class,
        'delivery_mode' => DeliveryMode::class,
        'lost_price' => 'decimal:2',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'status' => EnquiryStatus::class,
            'eta' => 'datetime',
            'laycan_from' => 'date',
            'laycan_to' => 'date',
            'sampling' => Sampling::class,
            'supply_location' => SupplyLocation::class,
            'quality_claim' => QualityClaim::class,
            'barging_cost' => 'decimal:2',
        ];

        foreach (FuelGrade::keys() as $grade) {
            foreach (self::GRADE_CASTS as $field => $cast) {
                $casts["{$grade}_{$field}"] = $cast;
            }
        }

        return $casts;
    }

    /** @return HasOne<Order, $this> */
    public function order(): HasOne
    {
        return $this->hasOne(Order::class);
    }

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** @return HasMany<EnquiryCustomer, $this> */
    public function enquiryCustomers(): HasMany
    {
        // Explicit order: without it, Postgres may return rows in a different order after
        // an UPDATE, making the UI appear to swap which customer is "first"/"second".
        return $this->hasMany(EnquiryCustomer::class)->orderBy('id');
    }

    /** @return BelongsTo<Port, $this> */
    public function port(): BelongsTo
    {
        return $this->belongsTo(Port::class);
    }
}
