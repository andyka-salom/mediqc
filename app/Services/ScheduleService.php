<?php

namespace App\Services;

use App\Enums\QcType;
use App\Models\EquipmentUnit;
use App\Models\FormTemplate;
use App\Models\QcSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ScheduleService
{
    /**
     * Generate jadwal untuk semua unit aktif sesuai qc_type & periode.
     *
     * @return int jumlah jadwal yang dibuat (baru, tidak dobel)
     */
    public function generateForPeriod(QcType $qcType, ?Carbon $reference = null): int
    {
        $reference = $reference ?: now();
        [$periodStart, $periodEnd, $dueDate, $periodLabel] = $this->resolvePeriod($qcType, $reference);

        return DB::transaction(function () use ($qcType, $periodStart, $periodEnd, $dueDate) {
            $units = EquipmentUnit::with('equipmentType')
                ->where('is_active', true)
                ->where('status', 'aktif')
                ->get();

            $created = 0;
            foreach ($units as $unit) {
                $template = FormTemplate::published()
                    ->where('equipment_type_id', $unit->equipment_type_id)
                    ->where('qc_type', $qcType->value)
                    ->orderByDesc('version')
                    ->first();

                if (! $template) {
                    continue; // tidak ada template untuk tipe alat ini
                }

                $exists = QcSchedule::where('equipment_unit_id', $unit->id)
                    ->where('qc_type', $qcType->value)
                    ->where('period_start', $periodStart)
                    ->exists();

                if ($exists) {
                    continue;
                }

                QcSchedule::create([
                    'equipment_unit_id' => $unit->id,
                    'form_template_id' => $template->id,
                    'qc_type' => $qcType->value,
                    'period_start' => $periodStart,
                    'period_end' => $periodEnd,
                    'due_date' => $dueDate,
                    'status' => 'pending',
                ]);
                $created++;
            }

            return $created;
        });
    }

    /**
     * Tentukan range periode + due_date untuk qc_type.
     *
     * @return array{0: string, 1: string, 2: string, 3: string}
     */
    protected function resolvePeriod(QcType $qcType, Carbon $ref): array
    {
        return match ($qcType) {
            QcType::HARIAN => [
                $ref->copy()->startOfDay()->toDateString(),
                $ref->copy()->endOfDay()->toDateString(),
                $ref->copy()->endOfDay()->toDateString(),
                $ref->copy()->toDateString(),
            ],
            QcType::BULANAN => [
                $ref->copy()->startOfMonth()->toDateString(),
                $ref->copy()->endOfMonth()->toDateString(),
                $ref->copy()->endOfMonth()->toDateString(),
                $ref->copy()->format('Y-m'),
            ],
            QcType::TAHUNAN => [
                $ref->copy()->startOfYear()->toDateString(),
                $ref->copy()->endOfYear()->toDateString(),
                $ref->copy()->endOfYear()->toDateString(),
                $ref->copy()->format('Y'),
            ],
        };
    }

    public function markOverdue(): int
    {
        return QcSchedule::where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);
    }
}
