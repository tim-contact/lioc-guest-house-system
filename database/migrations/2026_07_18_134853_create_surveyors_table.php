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
        Schema::create('surveyors', function (Blueprint $table) {
            $table->id();
            $table->string('survey_company');
            $table->string('name');
            $table->string('mail_id')->nullable();
            $table->string('contact')->nullable();
            $table->string('barge_id')->nullable();
            $table->timestamps();

            $table->foreign('barge_id')->references('imo')->on('barges')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surveyors');
    }
};
