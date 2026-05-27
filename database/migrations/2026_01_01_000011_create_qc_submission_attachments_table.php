<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_submission_attachments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('submission_id');
            $table->string('file_path', 500);
            $table->string('original_name', 255);
            $table->string('mime_type', 100)->nullable();
            $table->integer('size')->nullable()->comment('Ukuran file dalam bytes');
            $table->string('description', 500)->nullable();
            $table->uuid('uploaded_by');
            $table->timestamps();

            $table->foreign('submission_id')->references('id')->on('qc_submissions')->cascadeOnDelete();
            $table->foreign('uploaded_by')->references('id')->on('users')->restrictOnDelete();

            $table->index('submission_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_submission_attachments');
    }
};
