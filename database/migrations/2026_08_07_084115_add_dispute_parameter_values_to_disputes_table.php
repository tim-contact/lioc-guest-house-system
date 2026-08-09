<?php

use App\Enums\ProposedActionPlan;
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
        Schema::table('disputes', function (Blueprint $table) {
            $table->renameColumn('testing_value', 'value_as_per_testing');
            $table->decimal('value_as_per_supply', 15, 3)->nullable();
            $table->decimal('value_as_per_claim', 15, 3)->nullable();
        });

        DB::table('disputes')
            ->where('proposed_action_plan', 'settlement')
            ->update(['proposed_action_plan' => ProposedActionPlan::SettlementCreditNote->value]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('disputes')
            ->whereIn('proposed_action_plan', [
                ProposedActionPlan::SettlementCreditNote->value,
                ProposedActionPlan::SettlementDebitNote->value,
            ])
            ->update(['proposed_action_plan' => 'settlement']);

        Schema::table('disputes', function (Blueprint $table) {
            $table->dropColumn(['value_as_per_supply', 'value_as_per_claim']);
            $table->renameColumn('value_as_per_testing', 'testing_value');
        });
    }
};
