<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supply_locations', function (Blueprint $table): void {
            $table->string('location_type')->default('berth')->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('supply_locations', function (Blueprint $table): void {
            $table->dropColumn('location_type');
        });
    }
};
