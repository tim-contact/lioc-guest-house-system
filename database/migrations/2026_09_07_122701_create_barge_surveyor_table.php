<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('barge_surveyor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surveyor_id')->constrained()->cascadeOnDelete();
            $table->string('barge_id');
            $table->foreign('barge_id')->references('imo')->on('barges')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['surveyor_id', 'barge_id']);
        });

        $now = now();

        DB::table('surveyors')
            ->whereNotNull('barge_id')
            ->orderBy('id')
            ->get(['id', 'barge_id'])
            ->each(fn (object $surveyor): int => DB::table('barge_surveyor')->insertOrIgnore([
                'surveyor_id' => $surveyor->id,
                'barge_id' => $surveyor->barge_id,
                'created_at' => $now,
                'updated_at' => $now,
            ]));
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barge_surveyor');
    }
};
