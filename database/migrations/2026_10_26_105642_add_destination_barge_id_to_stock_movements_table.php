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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('destination_barge_id')->nullable()->after('barge_id');
            $table->foreign('destination_barge_id')
                ->references('imo')
                ->on('barges')
                ->nullOnDelete();
            $table->index(['destination_barge_id', 'movement_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['destination_barge_id']);
            $table->dropIndex(['destination_barge_id', 'movement_date']);
            $table->dropColumn('destination_barge_id');
        });
    }
};
