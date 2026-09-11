<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dateTime('etb')->nullable()->after('eta');
            $table->dateTime('etd')->nullable()->after('etb');
            $table->dateTime('ata')->nullable()->after('etd');
            $table->dateTime('atb')->nullable()->after('ata');
            $table->dateTime('atd')->nullable()->after('atb');
            $table->dateTime('bunker_started_at')->nullable()->after('atd');
            $table->dateTime('bunker_completed_at')->nullable()->after('bunker_started_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn([
                'etb',
                'etd',
                'ata',
                'atb',
                'atd',
                'bunker_started_at',
                'bunker_completed_at',
            ]);
        });
    }
};
