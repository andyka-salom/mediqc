<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('form_fields')
            ->where('code', 'like', '%\_tenggat\_kalibrasi')
            ->where('label', 'Tenggat Kalibrasi')
            ->update([
                'is_active' => false,
                'warning_rules' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('form_fields')
            ->where('code', 'like', '%\_tenggat\_kalibrasi')
            ->where('label', 'Tenggat Kalibrasi')
            ->update([
                'is_active' => true,
                'warning_rules' => json_encode([
                    'warning_if_past_due' => true,
                    'warning_message' => 'Due date kalibrasi sudah lewat.',
                ]),
                'updated_at' => now(),
            ]);
    }
};
