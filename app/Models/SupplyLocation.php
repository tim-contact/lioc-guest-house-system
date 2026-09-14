<?php

namespace App\Models;

use App\Enums\SupplyLocationType;
use Database\Factories\SupplyLocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $port_id
 * @property string $name
 * @property SupplyLocationType $location_type
 */
#[Fillable(['port_id', 'name', 'location_type'])]
class SupplyLocation extends Model
{
    /** @use HasFactory<SupplyLocationFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'location_type' => SupplyLocationType::class,
        ];
    }

    public function isNonBerthOperation(): bool
    {
        return $this->location_type->isNonBerthOperation();
    }

    /** @return BelongsTo<Port, $this> */
    public function port(): BelongsTo
    {
        return $this->belongsTo(Port::class);
    }

    /** @return HasMany<Enquiry, $this> */
    public function enquiries(): HasMany
    {
        return $this->hasMany(Enquiry::class);
    }

    /** @return HasMany<Order, $this> */
    public function deliveryOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'delivery_location_id');
    }

    /** @return HasMany<Bdn, $this> */
    public function deliveryBdns(): HasMany
    {
        return $this->hasMany(Bdn::class, 'delivery_location_id');
    }
}
