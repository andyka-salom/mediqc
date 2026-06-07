<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('submission_id');
            $table->unsignedBigInteger('form_field_id');

            // Snapshot label & unit pada saat dijawab, supaya jika template di-edit/baru,
            // tampilan riwayat tetap konsisten.
            $table->string('field_snapshot_label', 300)->nullable();
            $table->string('field_snapshot_unit', 30)->nullable();
            $table->string('field_snapshot_type', 30)->nullable();

            // Kolom typed — pilih yang sesuai field_type
            $table->decimal('value_numeric', 18, 6)->nullable();
            $table->boolean('value_boolean')->nullable();
            $table->text('value_text')->nullable();
            $table->date('value_date')->nullable();
            $table->time('value_time')->nullable();
            $table->jsonb('value_json')->nullable()->comment('untuk multiselect, table, kompleks');
            $table->string('file_path', 500)->nullable();

            // Warning hasil evaluasi warning_rules saat submit
            $table->boolean('has_warning')->default(false);
            $table->string('warning_message', 500)->nullable();

            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('qc_submissions')->cascadeOnDelete();
            $table->foreign('form_field_id')->references('id')->on('form_fields')->restrictOnDelete();

            $table->index('submission_id');
            $table->index('form_field_id');
            $table->index('has_warning');
            $table->unique(['submission_id', 'form_field_id'], 'uniq_answer_per_field');
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE qc_answers ALTER COLUMN id SET DEFAULT gen_random_uuid()');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_answers');
    }
};
