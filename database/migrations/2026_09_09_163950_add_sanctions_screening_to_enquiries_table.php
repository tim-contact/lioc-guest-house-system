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
        Schema::table('enquiries', function (Blueprint $table) {
            $table->string('sanctions_screening_status')->default('pending')->after('imo');
            $table->timestamp('sanctions_screened_at')->nullable()->after('sanctions_screening_status');
            $table->text('sanctions_screening_error')->nullable()->after('sanctions_screened_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn([
                'sanctions_screening_status',
                'sanctions_screened_at',
                'sanctions_screening_error',
            ]);
        });
    }
};
