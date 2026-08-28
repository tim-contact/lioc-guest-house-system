<?php

namespace App\Models;

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
 */
#[Fillable(['port_id', 'name'])]
class SupplyLocation extends Model
{
    /** @use HasFactory<SupplyLocationFactory> */
    use HasFactory;

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
