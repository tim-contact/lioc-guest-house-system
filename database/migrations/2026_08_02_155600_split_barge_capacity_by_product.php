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
        Schema::table('barges', function (Blueprint $table) {
            $table->decimal('vlsfo_capacity', 15, 3)->nullable();
            $table->decimal('mgo_capacity', 15, 3)->nullable();
            $table->decimal('hsfo_capacity', 15, 3)->nullable();
            $table->dropColumn('capacity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('barges', function (Blueprint $table) {
            $table->decimal('capacity', 15, 3)->default(0);
            $table->dropColumn(['vlsfo_capacity', 'mgo_capacity', 'hsfo_capacity']);
        });
    }
};
