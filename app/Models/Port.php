<?php

namespace App\Models;

use Database\Factories\PortFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 */
#[Fillable(['name'])]
class Port extends Model
{
    /** @use HasFactory<PortFactory> */
    use HasFactory;

    /** @return HasMany<SupplyLocation, $this> */
    public function supplyLocations(): HasMany
    {
        return $this->hasMany(SupplyLocation::class);
    }
}
