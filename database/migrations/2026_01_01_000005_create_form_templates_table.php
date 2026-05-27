<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('equipment_type_id');
            $table->string('qc_type', 20)->comment('harian, bulanan, tahunan');
            $table->string('name', 200);
            $table->string('slug', 220)->nullable();
            $table->text('description')->nullable();
            $table->integer('version')->default(1);
            $table->boolean('is_published')->default(false)->comment('Draft jika false, baru pakai jika true');
            $table->boolean('is_active')->default(true)->comment('Apakah template ini dipakai untuk generate jadwal');
            $table->jsonb('allowed_roles')->nullable()->comment('Array role names, e.g. ["radiografer","fisikawan_medis"]');
            $table->jsonb('scoring_rules')->nullable()->comment('Aturan agregasi has_warning -> overall_status');
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->foreign('equipment_type_id')->references('id')->on('equipment_types')->restrictOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();

            $table->index(['equipment_type_id', 'qc_type', 'is_active']);
            $table->index('is_published');
            // Hanya boleh ada 1 template aktif + terpublish per (equipment_type, qc_type, version)
            $table->unique(['equipment_type_id', 'qc_type', 'version'], 'uniq_template_version');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_templates');
    }
};
