<?php

use App\Enums\BargeStatus;
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
        Schema::create('barges', function (Blueprint $table) {
            $table->string('imo')->primary();
            $table->string('name');
            $table->decimal('capacity', 15, 3);
            $table->string('status')->default(BargeStatus::Available->value);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('barges');
    }
};
