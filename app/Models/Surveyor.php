<?php

namespace App\Models;

use Database\Factories\SurveyorFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string|null $user_id
 * @property string $survey_company
 * @property string $name
 * @property string|null $mail_id
 * @property string|null $contact
 * @property string|null $barge_id
 */
#[Fillable(['survey_company', 'name', 'mail_id', 'contact', 'barge_id', 'user_id'])]
class Surveyor extends Model
{
    /** @use HasFactory<SurveyorFactory> */
    use HasFactory;

    /** @return BelongsTo<Barge, $this> */
    public function barge(): BelongsTo
    {
        return $this->belongsTo(Barge::class, 'barge_id');
    }

    /** @return BelongsToMany<Barge, $this> */
    public function barges(): BelongsToMany
    {
        return $this->belongsToMany(Barge::class, 'barge_surveyor', 'surveyor_id', 'barge_id', 'id', 'imo')
            ->orderBy('barge_surveyor.id')
            ->withTimestamps();
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
