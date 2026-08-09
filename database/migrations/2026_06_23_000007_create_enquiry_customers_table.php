<?php

use App\Enums\EnquiryCustomerStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('enquiry_customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enquiry_id')->constrained()->cascadeOnDelete();
            // Plain foreign key without a DB constraint: customer_id references customers.sap_id.
            $table->string('customer_id');
            $table->string('status')->default(EnquiryCustomerStatus::Pending->value);
            $table->string('credit_terms')->nullable();

            foreach (['vlsfo', 'mgo', 'hsfo'] as $product) {
                $table->decimal("{$product}_initial_offer", 15, 2)->nullable();
                $table->decimal("{$product}_feedback_price", 15, 2)->nullable();
                $table->decimal("{$product}_fixing_counter", 15, 2)->nullable();
            }

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enquiry_customers');
    }
};
