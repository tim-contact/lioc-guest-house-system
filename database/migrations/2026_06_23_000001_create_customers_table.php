<?php

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
        Schema::create('customers', function (Blueprint $table) {
            $table->string('sap_id')->primary();
            $table->string('name');
            $table->string('address');
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->string('country');
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('mail_id')->nullable();
            $table->string('invoice_mail_ids', 1000)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
