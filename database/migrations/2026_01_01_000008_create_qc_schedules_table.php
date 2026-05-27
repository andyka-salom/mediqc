<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_schedules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('equipment_unit_id');
            $table->unsignedBigInteger('form_template_id');
            $table->string('qc_type', 20)->comment('harian, bulanan, tahunan');
            $table->date('period_start')->comment('Awal periode (mis. 2026-05-01 untuk bulanan Mei)');
            $table->date('period_end')->comment('Akhir periode');
            $table->date('due_date')->comment('Tanggal jatuh tempo pengisian');
            $table->unsignedBigInteger('assigned_role_id')->nullable();
            $table->uuid('assigned_user_id')->nullable();
            $table->string('status', 20)->default('pending')->comment('pending, in_progress, done, overdue, skipped');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('equipment_unit_id')->references('id')->on('equipment_units')->cascadeOnDelete();
            $table->foreign('form_template_id')->references('id')->on('form_templates')->restrictOnDelete();
            $table->foreign('assigned_role_id')->references('id')->on('roles')->nullOnDelete();
            $table->foreign('assigned_user_id')->references('id')->on('users')->nullOnDelete();

            $table->index(['equipment_unit_id', 'qc_type', 'period_start'], 'idx_schedule_unit_period');
            $table->index(['status', 'due_date']);
            $table->unique(['equipment_unit_id', 'qc_type', 'period_start'], 'uniq_schedule_period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_schedules');
    }
};
