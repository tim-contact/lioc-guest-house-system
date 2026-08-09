<?php

namespace App\Models;

use App\Enums\CreditTerms;
use App\Enums\EnquiryCustomerStatus;
use App\Enums\FuelGrade;
use Database\Factories\EnquiryCustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $enquiry_id
 * @property string $customer_id
 * @property CreditTerms|null $credit_terms
 * @property float|null $vlsfo_initial_offer
 * @property float|null $vlsfo_feedback_price
 * @property float|null $vlsfo_fixing_counter
 * @property float|null $mgo_initial_offer
 * @property float|null $mgo_feedback_price
 * @property float|null $mgo_fixing_counter
 * @property float|null $hsfo_initial_offer
 * @property float|null $hsfo_feedback_price
 * @property float|null $hsfo_fixing_counter
 * @property EnquiryCustomerStatus $status
 */
#[Fillable([
    'enquiry_id', 'customer_id', 'credit_terms', 'status',
    'vlsfo_initial_offer', 'vlsfo_feedback_price', 'vlsfo_fixing_counter',
    'mgo_initial_offer', 'mgo_feedback_price', 'mgo_fixing_counter',
    'hsfo_initial_offer', 'hsfo_feedback_price', 'hsfo_fixing_counter',
])]
class EnquiryCustomer extends Model
{
    /** @use HasFactory<EnquiryCustomerFactory> */
    use HasFactory;

    /**
     * The quote columns, per grade — one per negotiation round.
     *
     * @var list<string>
     */
    public const PRICE_FIELDS = ['initial_offer', 'feedback_price', 'fixing_counter'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        $casts = [
            'status' => EnquiryCustomerStatus::class,
            'credit_terms' => CreditTerms::class,
        ];

        foreach (FuelGrade::keys() as $grade) {
            foreach (self::PRICE_FIELDS as $field) {
                $casts["{$grade}_{$field}"] = 'decimal:2';
            }
        }

        return $casts;
    }

    /** @return BelongsTo<Enquiry, $this> */
    public function enquiry(): BelongsTo
    {
        return $this->belongsTo(Enquiry::class);
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }
}
