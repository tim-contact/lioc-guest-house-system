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
        Schema::table('orders', function (Blueprint $table): void {
            $table->string('historical_import_key', 64)->nullable()->unique();
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->date('date')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::table('payments')->whereNull('date')->exists() || DB::table('orders')->whereNotNull('historical_import_key')->exists()) {
            throw new RuntimeException('Remove historical imports and undated settlements before rolling back this migration.');
        }

        Schema::table('payments', function (Blueprint $table): void {
            $table->date('date')->nullable(false)->change();
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->dropUnique(['historical_import_key']);
            $table->dropColumn('historical_import_key');
        });
    }
};
