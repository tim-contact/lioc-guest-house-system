<?php

namespace App\Models;

use Database\Factories\AgentPicFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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

    protected static function booted(): void
    {
        static::deleting(function (AgentPic $agentPic): void {
            $agentPic->contactInformation()->delete();
        });
    }

    /** @return BelongsTo<Agent, $this> */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /** @return MorphMany<ContactInformation, $this> */
    public function contactInformation(): MorphMany
    {
        return $this->morphMany(ContactInformation::class, 'contactable');
    }

    /** @return MorphMany<ContactInformation, $this> */
    public function contactNumbers(): MorphMany
    {
        return $this->contactInformation()
            ->where('kind', 'phone')
            ->orderByDesc('is_primary')
            ->orderBy('id');
    }
}
