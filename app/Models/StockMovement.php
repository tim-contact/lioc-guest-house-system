<?php

namespace App\Models;

use App\Enums\StockMovementScope;
use App\Enums\StockMovementType;
use Database\Factories\StockMovementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property Carbon $movement_date
 * @property int $port_id
 * @property string|null $barge_id
 * @property string|null $destination_barge_id
 * @property StockMovementScope $movement_scope
 * @property StockMovementType $movement_type
 * @property string|null $counterparty_name
 * @property int|null $order_id
 * @property int|null $bdn_id
 * @property float $mgo_qty
 * @property float $vlsfo_qty
 * @property float $hsfo_qty
 * @property string|null $notes
 * @property string|null $created_by
 */
#[Fillable([
    'movement_date', 'port_id', 'barge_id', 'destination_barge_id', 'movement_scope', 'movement_type',
    'counterparty_name', 'order_id', 'bdn_id', 'mgo_qty', 'vlsfo_qty',
    'hsfo_qty', 'notes', 'created_by',
])]
class StockMovement extends Model
{
    /** @use HasFactory<StockMovementFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'movement_date' => 'date',
            'movement_scope' => StockMovementScope::class,
            'movement_type' => StockMovementType::class,
            'mgo_qty' => 'decimal:3',
            'vlsfo_qty' => 'decimal:3',
            'hsfo_qty' => 'decimal:3',
        ];
    }

    /** @return BelongsTo<Port, $this> */
    public function port(): BelongsTo
    {
        return $this->belongsTo(Port::class);
    }

    /** @return BelongsTo<Barge, $this> */
    public function barge(): BelongsTo
    {
        return $this->belongsTo(Barge::class, 'barge_id', 'imo');
    }

    /** @return BelongsTo<Barge, $this> */
    public function destinationBarge(): BelongsTo
    {
        return $this->belongsTo(Barge::class, 'destination_barge_id', 'imo');
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Bdn, $this> */
    public function bdn(): BelongsTo
    {
        return $this->belongsTo(Bdn::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
