<?php

namespace App\Models;

use Database\Factories\AgentPicFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $agent_id
 * @property string $name
 * @property string $mobile
 */
#[Fillable(['agent_id', 'name', 'mobile'])]
class AgentPic extends Model
{
    /** @use HasFactory<AgentPicFactory> */
    use HasFactory;

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }
}
