<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('form_template_id')->comment('Versi template yang dipakai saat submit');
            $table->unsignedBigInteger('equipment_unit_id');
            $table->unsignedBigInteger('qc_schedule_id')->nullable();
            $table->string('qc_type', 20);
            $table->uuid('submitted_by');
            $table->date('submission_date');
            $table->string('period_label', 20)->nullable()->comment('e.g. 2026-05-20 (harian), 2026-05 (bulanan), 2026 (tahunan)');

            $table->string('overall_status', 20)->default('draft')
                  ->comment('draft, submitted, under_review, approved, rejected, needs_action');
            $table->integer('warning_count')->default(0)->comment('Jumlah jawaban yang memicu warning');
            $table->text('catatan_masalah')->nullable();
            $table->text('catatan_tindak_lanjut')->nullable();
            $table->boolean('is_complete')->default(false);

            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_notes')->nullable();

            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->foreign('form_template_id')->references('id')->on('form_templates')->restrictOnDelete();
            $table->foreign('equipment_unit_id')->references('id')->on('equipment_units')->restrictOnDelete();
            $table->foreign('qc_schedule_id')->references('id')->on('qc_schedules')->nullOnDelete();
            $table->foreign('submitted_by')->references('id')->on('users')->restrictOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['equipment_unit_id', 'qc_type', 'submission_date'], 'idx_sub_unit_type_date');
            $table->index('overall_status');
            $table->index('submitted_by');
            $table->index('period_label');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE qc_submissions ALTER COLUMN id SET DEFAULT gen_random_uuid()');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_submissions');
    }
};
