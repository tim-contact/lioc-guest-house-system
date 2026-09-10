<?php

namespace App\Models;

use App\Enums\DeliveryMode;
use App\Enums\FuelGrade;
use App\Enums\Sampling;
use App\Enums\SamplingMethod;
use Database\Factories\BdnFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Bunker Delivery Note: one per order, filled in by the surveyor during delivery.
 *
 * @property int $id
 * @property int $order_id
 * @property string|null $bdn_number
 * @property Carbon|null $delivery_date
 * @property int|null $delivery_location_id
 * @property string|null $vessel_flag
 * @property float|null $grt
 * @property string|null $pi_club
 * @property int|null $agent_id
 * @property string|null $owner_operator
 * @property string|null $last_port_of_call
 * @property string|null $destination_port
 * @property DeliveryMode|null $delivery_method
 * @property string|null $barge_id
 * @property string|null $truck_number
 * @property Carbon|null $barge_alongside_at
 * @property Carbon|null $vlsfo_hose_connected_at
 * @property Carbon|null $vlsfo_pumping_started_at
 * @property Carbon|null $vlsfo_pumping_ended_at
 * @property Carbon|null $vlsfo_hose_disconnected_at
 * @property Carbon|null $vlsfo_docs_completed_at
 * @property Carbon|null $vlsfo_cast_off_at
 * @property float|null $vlsfo_density_15
 * @property float|null $vlsfo_sulphur_pct
 * @property float|null $vlsfo_viscosity_50
 * @property float|null $vlsfo_flash_point
 * @property float|null $vlsfo_kilo_liter
 * @property float|null $vlsfo_metric_ton
 * @property Carbon|null $mgo_hose_connected_at
 * @property Carbon|null $mgo_pumping_started_at
 * @property Carbon|null $mgo_pumping_ended_at
 * @property Carbon|null $mgo_hose_disconnected_at
 * @property Carbon|null $mgo_docs_completed_at
 * @property Carbon|null $mgo_cast_off_at
 * @property float|null $mgo_density_15
 * @property float|null $mgo_sulphur_pct
 * @property float|null $mgo_viscosity_50
 * @property float|null $mgo_flash_point
 * @property float|null $mgo_kilo_liter
 * @property float|null $mgo_metric_ton
 * @property Carbon|null $hsfo_hose_connected_at
 * @property Carbon|null $hsfo_pumping_started_at
 * @property Carbon|null $hsfo_pumping_ended_at
 * @property Carbon|null $hsfo_hose_disconnected_at
 * @property Carbon|null $hsfo_docs_completed_at
 * @property Carbon|null $hsfo_cast_off_at
 * @property float|null $hsfo_density_15
 * @property float|null $hsfo_sulphur_pct
 * @property float|null $hsfo_viscosity_50
 * @property float|null $hsfo_flash_point
 * @property float|null $hsfo_kilo_liter
 * @property float|null $hsfo_metric_ton
 * @property bool|null $chief_engineer_invited
 * @property bool|null $chief_engineer_witnessed
 * @property bool|null $retained_samples_handed_over
 * @property Sampling|null $sampling_location
 * @property SamplingMethod|null $sampling_method
 * @property string|null $marpol_seal_number
 * @property string|null $marpol_counter_seal_number
 * @property string|null $vessel_seal_number
 * @property string|null $vessel_counter_seal_number
 * @property string|null $barge_seal_number
 * @property string|null $barge_counter_seal_number
 * @property string|null $retention_seal_number
 * @property string|null $retention_counter_seal_number
 */
#[Fillable([
    'order_id', 'bdn_number', 'delivery_date', 'delivery_location_id', 'vessel_flag', 'grt',
    'pi_club', 'agent_id', 'owner_operator', 'last_port_of_call', 'destination_port',
    'delivery_method', 'barge_id', 'truck_number', 'barge_alongside_at',
    'vlsfo_hose_connected_at', 'vlsfo_pumping_started_at', 'vlsfo_pumping_ended_at',
    'vlsfo_hose_disconnected_at', 'vlsfo_docs_completed_at', 'vlsfo_cast_off_at',
    'vlsfo_density_15', 'vlsfo_sulphur_pct', 'vlsfo_viscosity_50', 'vlsfo_flash_point',
    'vlsfo_kilo_liter', 'vlsfo_metric_ton',
    'mgo_hose_connected_at', 'mgo_pumping_started_at', 'mgo_pumping_ended_at',
    'mgo_hose_disconnected_at', 'mgo_docs_completed_at', 'mgo_cast_off_at',
    'mgo_density_15', 'mgo_sulphur_pct', 'mgo_viscosity_50', 'mgo_flash_point',
    'mgo_kilo_liter', 'mgo_metric_ton',
    'hsfo_hose_connected_at', 'hsfo_pumping_started_at', 'hsfo_pumping_ended_at',
    'hsfo_hose_disconnected_at', 'hsfo_docs_completed_at', 'hsfo_cast_off_at',
    'hsfo_density_15', 'hsfo_sulphur_pct', 'hsfo_viscosity_50', 'hsfo_flash_point',
    'hsfo_kilo_liter', 'hsfo_metric_ton',
    'chief_engineer_invited', 'chief_engineer_witnessed', 'retained_samples_handed_over',
    'sampling_location', 'sampling_method',
    'marpol_seal_number', 'marpol_counter_seal_number',
    'vessel_seal_number', 'vessel_counter_seal_number',
    'barge_seal_number', 'barge_counter_seal_number',
    'retention_seal_number', 'retention_counter_seal_number',
])]
class Bdn extends Model
{
    /** @use HasFactory<BdnFactory> */
    use HasFactory;

    /**
     * Timesheet columns, per grade.
     *
     * @var list<string>
     */
    public const TIMESHEET_FIELDS = [
        'hose_connected_at', 'pumping_started_at', 'pumping_ended_at',
        'hose_disconnected_at', 'docs_completed_at', 'cast_off_at',
    ];

    /**
     * Retained-sample types, each backed by `{type}_seal_number` and
     * `{type}_counter_seal_number` columns.
     *
     * @var list<string>
     */
    public const SAMPLE_TYPES = ['marpol', 'vessel', 'barge', 'retention'];

    /**
     * Quality and quantity columns, per grade, mapped to their decimal scale.
     *
     * @var array<string, int>
     */
    public const QUALITY_FIELDS = [
        'density_15' => 4,
        'sulphur_pct' => 3,
        'viscosity_50' => 1,
        'flash_point' => 1,
        'kilo_liter' => 3,
        'metric_ton' => 3,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'delivery_date' => 'date',
            'grt' => 'decimal:2',
            'delivery_method' => DeliveryMode::class,
            // Wall-clock format so the datetime-local inputs round-trip unshifted.
            'barge_alongside_at' => 'datetime:Y-m-d\TH:i',
            'chief_engineer_invited' => 'boolean',
            'chief_engineer_witnessed' => 'boolean',
            'retained_samples_handed_over' => 'boolean',
            'sampling_location' => Sampling::class,
            'sampling_method' => SamplingMethod::class,
        ];

        foreach (FuelGrade::keys() as $grade) {
            foreach (self::TIMESHEET_FIELDS as $field) {
                $casts["{$grade}_{$field}"] = 'datetime:Y-m-d\TH:i';
            }

            foreach (self::QUALITY_FIELDS as $field => $scale) {
                $casts["{$grade}_{$field}"] = "decimal:{$scale}";
            }
        }

        return $casts;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<SupplyLocation, $this> */
    public function deliveryLocation(): BelongsTo
    {
        return $this->belongsTo(SupplyLocation::class, 'delivery_location_id');
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
}
