<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_fields', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_template_id');
            $table->unsignedBigInteger('form_section_id')->nullable();

            // Identitas field
            $table->string('code', 80)->nullable()->comment('Kode internal stabil lintas versi, e.g. "kvp_value"');
            $table->string('label', 300);
            $table->string('hint_text', 500)->nullable();
            $table->string('unit', 30)->nullable()->comment('Satuan: mGy, kVp, mA, mm, dst');

            // Tipe field
            $table->string('field_type', 30)->comment(
                'text, textarea, number, decimal, boolean, radio, select, multiselect, '.
                'checkbox_group, date, time, datetime, pass_fail, range_slider, '.
                'file_upload, signature, table, section_header, info_text'
            );

            // Konfigurasi: opsi, min/max input, dst.
            // Contoh untuk number: {"min":0,"max":150,"step":0.1,"placeholder":"kVp"}
            // Contoh untuk radio:  {"options":[{"value":"baik","label":"Baik"},{"value":"trouble","label":"Trouble"}]}
            $table->jsonb('config')->nullable();

            // Aturan validasi: required, format, dll. Terpisah dari threshold warning.
            // Contoh: {"required":true,"min_length":3}
            $table->jsonb('validation_rules')->nullable();

            // ATURAN WARNING / THRESHOLD — inilah jawaban kasus (1) dan (4) di gambar.
            // Contoh number: {
            //   "warning_below": 70,
            //   "warning_above": 90,
            //   "warning_message": "Nilai di luar batas aman (70-90 kVp)"
            // }
            // Contoh radio:  { "warning_if_value_in": ["trouble","rusak"], "warning_message": "Perlu tindak lanjut" }
            // Contoh boolean: { "warning_if_value": false }
            $table->jsonb('warning_rules')->nullable();

            // CONDITIONAL FIELD — jawaban kasus (3) Yes->input, (4) Terkalibrasi->3 input.
            // Field ini hanya muncul jika field parent dijawab dengan value tertentu.
            // parent_field_id menunjuk ke form_fields.id (parent),
            // show_when berisi value yang memicu kemunculan.
            // Contoh: parent_field_id=42, show_when={"equals":"yes"}
            //          atau {"equals":"terkalibrasi"} atau {"in":["yes","mungkin"]}
            $table->unsignedBigInteger('parent_field_id')->nullable();
            $table->jsonb('show_when')->nullable();

            // LAYOUT — agar field bisa diatur tampil berdampingan (kasus 5 di gambar:
            // "Uji Kebocoran Tabung" + "Tanggal Uji" dalam 1 baris visual).
            // layout_group: nama group (string bebas), field dengan group sama tampil 1 baris.
            // layout_width: lebar kolom 1-12 (grid 12 kolom), default 12 = full width.
            $table->string('layout_group', 50)->nullable();
            $table->unsignedTinyInteger('layout_width')->default(12);

            $table->boolean('is_required')->default(false);
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('form_template_id')
                  ->references('id')->on('form_templates')
                  ->cascadeOnDelete();

            $table->foreign('form_section_id')
                  ->references('id')->on('form_sections')
                  ->nullOnDelete();

            $table->foreign('parent_field_id')
                  ->references('id')->on('form_fields')
                  ->nullOnDelete();

            $table->index(['form_template_id', 'order_index']);
            $table->index('form_section_id');
            $table->index('parent_field_id');
            $table->index('field_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_fields');
    }
};
