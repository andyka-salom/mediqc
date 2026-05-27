<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_units', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('equipment_type_id');
            $table->string('asset_code', 50)->unique()->comment('Kode inventaris RS');
            $table->string('name', 150)->comment('Nama panggilan unit, e.g. X-Ray Mobile R. IGD');
            $table->string('merk', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->string('ruangan', 100)->nullable()->comment('Lokasi penempatan alat');
            $table->date('tahun_pengadaan')->nullable();
            $table->date('tanggal_kalibrasi_terakhir')->nullable();
            $table->date('tanggal_kalibrasi_berikutnya')->nullable();
            $table->string('status', 30)->default('aktif')->comment('aktif, maintenance, rusak, dihapus');
            $table->text('catatan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('equipment_type_id')->references('id')->on('equipment_types')->restrictOnDelete();
            $table->index('equipment_type_id');
            $table->index('status');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_units');
    }
};
