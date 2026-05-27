<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_sections', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_template_id');
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->integer('order_index')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('form_template_id')
                  ->references('id')->on('form_templates')
                  ->cascadeOnDelete();

            $table->index(['form_template_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_sections');
    }
};
