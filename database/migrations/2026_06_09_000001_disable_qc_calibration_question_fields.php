<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $calibrationFieldIds = DB::table('form_fields')
            ->where(function ($query) {
                $query->whereRaw('LOWER(label) LIKE ?', ['%kalibrasi%'])
                    ->orWhereRaw('LOWER(label) LIKE ?', ['%callibration%'])
                    ->orWhereRaw('LOWER(label) LIKE ?', ['%calibration%'])
                    ->orWhereRaw('LOWER(code) LIKE ?', ['%kalibrasi%'])
                    ->orWhereRaw('LOWER(code) LIKE ?', ['%callibration%'])
                    ->orWhereRaw('LOWER(code) LIKE ?', ['%calibration%']);
            })
            ->pluck('id');

        $childFieldIds = DB::table('form_fields')
            ->whereIn('parent_field_id', $calibrationFieldIds)
            ->pluck('id');

        DB::table('form_fields')
            ->whereIn('id', $calibrationFieldIds->merge($childFieldIds)->unique()->values())
            ->update([
                'is_active' => false,
                'warning_rules' => null,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // No automatic rollback: calibration details now live in equipment data,
        // not in QC answer fields.
    }
};
