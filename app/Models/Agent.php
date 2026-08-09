<?php

namespace App\Models;

use Database\Factories\AgentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    /** @return HasMany<AgentPic, $this> */
    public function pics(): HasMany
    {
        return $this->hasMany(AgentPic::class);
    }
}
