<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('user_id');
            $table->string('type', 80)->comment('e.g. qc_due, qc_warning, qc_reviewed');
            $table->string('title', 200);
            $table->text('body')->nullable();
            $table->jsonb('data')->nullable()->comment('payload, e.g. submission_id, schedule_id');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->index(['user_id', 'read_at']);
            $table->index('type');
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->uuid('user_id')->nullable();
            $table->string('action', 80)->comment('created, updated, deleted, published, submitted, reviewed');
            $table->string('auditable_type', 100)->nullable()->comment('FQCN model, e.g. App\\Models\\FormTemplate');
            $table->string('auditable_id', 50)->nullable()->comment('id of subject (bigint or uuid sebagai string)');
            $table->jsonb('payload')->nullable()->comment('old + new values');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->index(['auditable_type', 'auditable_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
    }
};
