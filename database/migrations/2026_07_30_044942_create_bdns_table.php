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
        Schema::create('bdns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('bdn_number')->unique()->nullable();

            $table->date('delivery_date')->nullable();
            $table->string('delivery_location')->nullable();
            $table->string('vessel_flag')->nullable();
            $table->decimal('grt', 12, 2)->nullable();
            $table->string('pi_club')->nullable();
            $table->foreignId('agent_id')->nullable()->constrained();
            $table->string('owner_operator')->nullable();
            $table->string('last_port_of_call')->nullable();
            $table->string('destination_port')->nullable();
            $table->string('delivery_method')->nullable();
            $table->string('barge_id')->nullable();
            $table->foreign('barge_id')->references('imo')->on('barges');
            $table->dateTime('barge_alongside_at')->nullable();

            foreach (['vlsfo', 'mgo', 'hsfo'] as $grade) {
                $table->dateTime("{$grade}_hose_connected_at")->nullable();
                $table->dateTime("{$grade}_pumping_started_at")->nullable();
                $table->dateTime("{$grade}_pumping_ended_at")->nullable();
                $table->dateTime("{$grade}_hose_disconnected_at")->nullable();
                $table->dateTime("{$grade}_docs_completed_at")->nullable();
                $table->dateTime("{$grade}_cast_off_at")->nullable();
                $table->decimal("{$grade}_density_15", 10, 4)->nullable();
                $table->decimal("{$grade}_sulphur_pct", 6, 3)->nullable();
                $table->decimal("{$grade}_viscosity_50", 8, 1)->nullable();
                $table->decimal("{$grade}_flash_point", 6, 1)->nullable();
                $table->decimal("{$grade}_kilo_liter", 15, 3)->nullable();
                $table->decimal("{$grade}_metric_ton", 15, 3)->nullable();
            }

            // Nullable so an unanswered declaration stays distinct from "No".
            $table->boolean('chief_engineer_invited')->nullable();
            $table->boolean('chief_engineer_witnessed')->nullable();
            $table->boolean('retained_samples_handed_over')->nullable();

            $table->string('sampling_location')->nullable();
            $table->string('sampling_method')->nullable();

            foreach (['marpol', 'vessel', 'barge', 'retention'] as $sample) {
                $table->string("{$sample}_seal_number")->nullable();
                $table->string("{$sample}_counter_seal_number")->nullable();
            }

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bdns');
    }
};
