<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_types', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code', 50)->unique()->comment('e.g. XRAY, CT_SCAN, MRI, USG, MAMMOGRAPHY');
            $table->string('display_name', 150);
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->index('order_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_types');
    }
};
