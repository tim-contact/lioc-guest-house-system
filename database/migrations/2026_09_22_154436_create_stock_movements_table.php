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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->date('movement_date');
            $table->foreignId('port_id')->constrained()->cascadeOnDelete();
            $table->string('barge_id')->nullable();
            $table->string('movement_scope');
            $table->string('movement_type');
            $table->string('counterparty_name')->nullable();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('bdn_id')->nullable()->constrained('bdns')->nullOnDelete();
            $table->decimal('mgo_qty', 15, 3)->default(0);
            $table->decimal('vlsfo_qty', 15, 3)->default(0);
            $table->decimal('hsfo_qty', 15, 3)->default(0);
            $table->text('notes')->nullable();
            $table->foreignUlid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->foreign('barge_id')->references('imo')->on('barges')->nullOnDelete();
            $table->index(['port_id', 'movement_date']);
            $table->index(['barge_id', 'movement_date']);
            $table->index(['movement_scope', 'movement_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
