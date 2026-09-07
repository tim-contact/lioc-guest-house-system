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
        Schema::create('surveyor_delivery_modes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('surveyor_id')->constrained()->cascadeOnDelete();
            $table->string('delivery_mode');
            $table->timestamps();

            $table->unique(['surveyor_id', 'delivery_mode']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surveyor_delivery_modes');
    }
};
