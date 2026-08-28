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
        if (! Schema::hasColumn('enquiries', 'supply_location_id')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->foreignId('supply_location_id')->nullable()->after('sampling');
            });
        }

        if (! Schema::hasColumn('orders', 'delivery_location_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->foreignId('delivery_location_id')->nullable()->after('delivery_mode');
            });
        }

        if (! Schema::hasColumn('bdns', 'delivery_location_id')) {
            Schema::table('bdns', function (Blueprint $table) {
                $table->foreignId('delivery_location_id')->nullable()->after('delivery_date');
            });
        }

        Schema::table('enquiries', function (Blueprint $table) {
            $table->foreign('supply_location_id')->references('id')->on('supply_locations')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('delivery_location_id')->references('id')->on('supply_locations')->nullOnDelete();
        });

        Schema::table('bdns', function (Blueprint $table) {
            $table->foreign('delivery_location_id')->references('id')->on('supply_locations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('bdns', 'delivery_location_id')) {
            Schema::table('bdns', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_location_id');
            });
        }

        if (Schema::hasColumn('orders', 'delivery_location_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_location_id');
            });
        }

        if (Schema::hasColumn('enquiries', 'supply_location_id')) {
            Schema::table('enquiries', function (Blueprint $table) {
                $table->dropConstrainedForeignId('supply_location_id');
            });
        }
    }
};
