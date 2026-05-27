<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 50)->unique()->comment('admin, radiografer, fisikawan_medis, elektromedis');
            $table->string('display_name', 100);
            $table->text('description')->nullable();
            $table->jsonb('permissions')->nullable()->comment('granular permissions, e.g. {"qc.submit":["harian"],"template.manage":false}');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('name');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
