<?php

use App\Enums\FuelGrade;
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
            $table->string('lost_to')->nullable();
            $table->string('lost_port')->nullable();

            foreach (FuelGrade::keys() as $grade) {
                $table->decimal("{$grade}_lost_price", 15, 2)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enquiries', function (Blueprint $table) {
            $table->dropColumn([
                'lost_to',
                'lost_port',
                ...array_map(fn (string $grade): string => "{$grade}_lost_price", FuelGrade::keys()),
            ]);
        });
    }
};
