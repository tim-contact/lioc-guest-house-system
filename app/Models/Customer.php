<?php

namespace App\Models;

use App\Enums\AccountType;
use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property string $sap_id
 * @property string $name
 * @property string $address
 * @property float $credit_limit
 * @property string $country
 * @property AccountType|null $account_type
 * @property string|null $contact_person
 * @property string|null $contact_phone
 * @property string|null $mail_id
 * @property string|null $invoice_mail_ids
 */
#[Fillable(['sap_id', 'name', 'address', 'credit_limit', 'country', 'account_type', 'contact_person', 'contact_phone', 'mail_id', 'invoice_mail_ids'])]
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $primaryKey = 'sap_id';

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'account_type' => AccountType::class,
            'credit_limit' => 'decimal:2',
        ];
    }

    /**
     * The orders placed by this customer.
     *
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'customer_id');
    }
}
