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
        if (! Schema::hasColumn('orders', 'agent_fees')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->decimal('agent_fees', 15, 2)->default(0)->after('barging_cost');
            });
        }

        DB::table('orders')
            ->where('status', 'delivered')
            ->update([
                'invoice_value' => DB::raw(
                    'COALESCE(vlsfo_bdn_qty, 0) * COALESCE(vlsfo_rate, 0)
                    + COALESCE(mgo_bdn_qty, 0) * COALESCE(mgo_rate, 0)
                    + COALESCE(hsfo_bdn_qty, 0) * COALESCE(hsfo_rate, 0)
                    + COALESCE(barging_cost, 0)
                    + COALESCE(agent_fees, 0)'
                ),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('orders', 'agent_fees')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn('agent_fees');
            });
        }
    }
};
