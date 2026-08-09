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
        $now = now();

        DB::table('agents')->whereNotNull('pic')->orderBy('id')->each(function (object $agent) use ($now): void {
            DB::table('agent_pics')->insert([
                'agent_id' => $agent->id,
                'name' => $agent->pic,
                'mobile' => $agent->contact,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });

        Schema::table('agents', function (Blueprint $table) {
            $table->dropColumn('pic');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('agents', function (Blueprint $table) {
            $table->string('pic')->nullable();
        });
    }
};
