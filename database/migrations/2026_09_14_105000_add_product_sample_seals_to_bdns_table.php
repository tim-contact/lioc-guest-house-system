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
        Schema::table('bdns', function (Blueprint $table) {
            $table->json('product_sample_seals')->nullable()->after('sampling_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bdns', function (Blueprint $table) {
            $table->dropColumn('product_sample_seals');
        });
    }
};
