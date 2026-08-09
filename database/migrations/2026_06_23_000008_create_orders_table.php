<?php

use App\Enums\OrderStatus;
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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            // Plain placeholder column: enquiries are referenced without a DB constraint.
            $table->unsignedBigInteger('enquiry_id');
            $table->string('order_number')->unique();
            $table->date('order_date')->nullable();
            $table->string('customer_id');
            $table->foreign('customer_id')->references('sap_id')->on('customers');
            $table->string('credit_terms')->nullable();
            // Vessel is plain free text for now — the vessels table is deliberately not referenced.
            $table->string('vessel_id')->nullable();
            $table->string('vessel_name')->nullable();
            $table->foreignId('port_id')->nullable()->constrained();
            $table->dateTime('eta')->nullable();
            $table->foreignId('agent_id')->nullable()->constrained();
            $table->string('agent_name')->nullable();
            $table->string('barge_id')->nullable();
            $table->foreign('barge_id')->references('imo')->on('barges');
            $table->string('status')->default(OrderStatus::Pending->value);
            $table->string('delivery_mode')->nullable();
            $table->string('delivery_location')->nullable();
            $table->string('product_type')->nullable();
            $table->date('laycan_from')->nullable();
            $table->date('laycan_to')->nullable();
            $table->string('pic')->nullable();
            $table->string('mobile_no')->nullable();

            foreach (['vlsfo', 'mgo', 'hsfo'] as $product) {
                $table->decimal("{$product}_quantity_low", 15, 3)->nullable();
                $table->decimal("{$product}_quantity_high", 15, 3)->nullable();
                $table->string("{$product}_qty_range")->nullable();
                $table->decimal("{$product}_rate", 15, 2)->nullable();
                $table->decimal("{$product}_final_qty", 15, 3)->nullable();
                $table->decimal("{$product}_bdn_qty", 15, 3)->nullable();
            }

            $table->decimal('invoice_value', 15, 2)->nullable();
            $table->date('invoice_date')->nullable();
            $table->date('payment_due_date')->nullable();
            $table->decimal('amount_received', 15, 2)->nullable();
            $table->date('payment_receipt_date')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
