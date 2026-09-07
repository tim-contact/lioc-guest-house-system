<?php

namespace App\Models;

use App\Enums\DeliveryMode;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $surveyor_id
 * @property DeliveryMode $delivery_mode
 */
#[Fillable(['surveyor_id', 'delivery_mode'])]
class SurveyorDeliveryMode extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'delivery_mode' => DeliveryMode::class,
        ];
    }

    /** @return BelongsTo<Surveyor, $this> */
    public function surveyor(): BelongsTo
    {
        return $this->belongsTo(Surveyor::class);
    }
}
