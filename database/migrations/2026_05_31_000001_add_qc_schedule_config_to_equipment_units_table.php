<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('equipment_units', function (Blueprint $table) {
            $table->jsonb('qc_schedule_config')
                ->nullable()
                ->after('catatan')
                ->comment('Konfigurasi interval QC per unit alat: harian/bulanan/tahunan');
        });
    }

    public function down(): void
    {
        Schema::table('equipment_units', function (Blueprint $table) {
            $table->dropColumn('qc_schedule_config');
        });
    }
};
