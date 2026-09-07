<?php

namespace App\Models;

use Database\Factories\AgentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @property int $id
 * @property string $name
 * @property string|null $address
 * @property string $contact
 * @property string|null $mail_id
 */
#[Fillable(['name', 'address', 'contact', 'mail_id'])]
class Agent extends Model
{
    /** @use HasFactory<AgentFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::deleting(function (Agent $agent): void {
            $agent->pics()->each(function (AgentPic $pic): void {
                $pic->contactInformation()->delete();
            });

            $agent->contactInformation()->delete();
        });
    }

    /** @return HasMany<AgentPic, $this> */
    public function pics(): HasMany
    {
        return $this->hasMany(AgentPic::class);
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

    /** @return MorphMany<ContactInformation, $this> */
    public function emailAddresses(): MorphMany
    {
        return $this->contactInformation()
            ->where('kind', 'email')
            ->orderByDesc('is_primary')
            ->orderBy('id');
    }
}
