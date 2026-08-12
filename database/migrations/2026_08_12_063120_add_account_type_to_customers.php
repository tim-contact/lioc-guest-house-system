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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('account_type')->nullable()->after('country');
        });

        // Backfill existing rows before making the column required.
        \App\Models\Customer::whereNull('account_type')->update(['account_type' => 'fcbu']);

        Schema::table('customers', function (Blueprint $table) {
            $table->string('account_type')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('account_type');
        });
    }
};