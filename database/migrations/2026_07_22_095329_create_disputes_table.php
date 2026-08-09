<?php

use App\Enums\DisputeStatus;
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
        Schema::create('disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('type_of_dispute')->nullable();
            $table->string('proposed_action_plan')->nullable();
            $table->string('action_status')->nullable();
            $table->text('dispute_closure_remark')->nullable();
            $table->string('dispute_status')->default(DisputeStatus::Open->value);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
