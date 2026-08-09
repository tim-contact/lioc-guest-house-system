<?php

use App\Enums\EnquiryStatus;
use App\Enums\Sampling;
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
        Schema::create('enquiries', function (Blueprint $table) {
            $table->id();
            // Vessel is plain free text for now — the vessels table is deliberately not referenced.
            $table->string('vessel_name')->nullable();
            $table->string('imo')->nullable();
            $table->foreignId('port_id')->nullable();
            $table->date('laycan_from')->nullable();
            $table->date('laycan_to')->nullable();
            // Unused for now (kept for a future live-arrival-estimate feature); laycan is authoritative.
            $table->dateTime('eta')->nullable();
            $table->string('status')->default(EnquiryStatus::Open->value);
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete();
            $table->string('sampling')->default(Sampling::BargeManifold->value);
            $table->string('supply_location')->nullable();
            $table->string('quality_claim')->nullable();
            $table->text('instructions')->nullable();
            $table->decimal('barging_cost', 15, 2)->default(0);

            foreach (['vlsfo', 'mgo', 'hsfo'] as $product) {
                $table->decimal("{$product}_quantity_low", 15, 3)->nullable();
                $table->decimal("{$product}_quantity_high", 15, 3)->nullable();
                $table->string("{$product}_product_type")->nullable();
                $table->string("{$product}_delivery_mode")->nullable();
            }

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
