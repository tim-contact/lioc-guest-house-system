<?php

namespace App\Models;

use App\Enums\BargeStatus;
use Database\Factories\BargeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $imo
 * @property string $name
 * @property float|null $vlsfo_capacity
 * @property float|null $mgo_capacity
 * @property float|null $hsfo_capacity
 * @property BargeStatus $status
 */
#[Fillable(['imo', 'name', 'vlsfo_capacity', 'mgo_capacity', 'hsfo_capacity', 'status'])]
class Barge extends Model
{
    /** @use HasFactory<BargeFactory> */
    use HasFactory;

    protected $primaryKey = 'imo';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => BargeStatus::class,
            'vlsfo_capacity' => 'decimal:3',
            'mgo_capacity' => 'decimal:3',
            'hsfo_capacity' => 'decimal:3',
        ];
    }
}
