<?php

namespace App\Models;

use App\Enums\ActionStatus;
use App\Enums\DisputeStatus;
use App\Enums\DisputeType;
use App\Enums\ProposedActionPlan;
use Database\Factories\DisputeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property DisputeType|null $type_of_dispute
 * @property float|null $dispute_value
 * @property float|null $value_as_per_supply
 * @property float|null $value_as_per_claim
 * @property float|null $value_as_per_testing
 * @property Carbon|null $testing_date
 * @property ProposedActionPlan|null $proposed_action_plan
 * @property ActionStatus|null $action_status
 * @property string|null $dispute_closure_remark
 * @property DisputeStatus $dispute_status
 */
#[Fillable([
    'order_id', 'type_of_dispute', 'dispute_value', 'testing_date',
    'value_as_per_supply', 'value_as_per_claim', 'value_as_per_testing',
    'proposed_action_plan', 'action_status', 'dispute_closure_remark', 'dispute_status',
])]
class Dispute extends Model
{
    /** @use HasFactory<DisputeFactory> */
    use HasFactory;

    /**
     * The disputed parameter read three ways; distinct from the monetary `dispute_value`.
     *
     * @var list<string>
     */
    public const PARAMETER_FIELDS = ['value_as_per_supply', 'value_as_per_claim', 'value_as_per_testing'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'type_of_dispute' => DisputeType::class,
            'dispute_value' => 'decimal:2',
            'testing_date' => 'date',
            'proposed_action_plan' => ProposedActionPlan::class,
            'action_status' => ActionStatus::class,
            'dispute_status' => DisputeStatus::class,
        ];

        foreach (self::PARAMETER_FIELDS as $field) {
            $casts[$field] = 'decimal:3';
        }

        return $casts;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
