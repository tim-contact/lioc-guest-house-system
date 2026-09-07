<?php

namespace App\Models;

use Database\Factories\ContactInformationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property string $contactable_type
 * @property int $contactable_id
 * @property string $kind
 * @property string $value
 * @property bool $is_primary
 */
#[Fillable(['contactable_type', 'contactable_id', 'kind', 'value', 'is_primary'])]
class ContactInformation extends Model
{
    /** @use HasFactory<ContactInformationFactory> */
    use HasFactory;

    protected $table = 'contact_information';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    /** @return MorphTo<Model, $this> */
    public function contactable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param  array<string, string|null>  $contactsByKind
     */
    public static function syncFor(Model $contactable, array $contactsByKind): void
    {
        $contactableId = $contactable->getKey();

        if ($contactableId === null) {
            return;
        }

        foreach ($contactsByKind as $kind => $values) {
            self::query()
                ->where('contactable_type', $contactable->getMorphClass())
                ->where('contactable_id', $contactableId)
                ->where('kind', $kind)
                ->delete();

            foreach (self::splitValues($values) as $index => $value) {
                self::query()->create([
                    'contactable_type' => $contactable->getMorphClass(),
                    'contactable_id' => $contactableId,
                    'kind' => $kind,
                    'value' => $value,
                    'is_primary' => $index === 0,
                ]);
            }
        }
    }

    /**
     * @return list<string>
     */
    public static function splitValues(mixed $values): array
    {
        return collect(preg_split('/\s*[;\/,]\s*/', trim((string) $values)) ?: [])
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
