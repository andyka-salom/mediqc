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

        return DB::transaction(function () use ($qcType, $reference) {
            $units = EquipmentUnit::with('equipmentType')
                ->where('is_active', true)
                ->where('status', 'aktif')
                ->get();

            $created = 0;
            foreach ($units as $unit) {
                if (! $unit->qcTypeEnabled($qcType->value)) {
                    continue;
                }

                if (! $this->shouldGenerateForUnit($unit, $qcType, $reference)) {
                    continue;
                }

                [$periodStart, $periodEnd, $dueDate] = $this->resolvePeriodForUnit($unit, $qcType, $reference);

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

    protected function resolvePeriodForUnit(EquipmentUnit $unit, QcType $qcType, Carbon $ref): array
    {
        $interval = $unit->qcIntervalValue($qcType->value);

        return match ($qcType) {
            QcType::HARIAN => [
                $ref->copy()->startOfDay()->toDateString(),
                $ref->copy()->addDays($interval - 1)->endOfDay()->toDateString(),
                $ref->copy()->addDays($interval - 1)->endOfDay()->toDateString(),
                $ref->copy()->toDateString(),
            ],
            QcType::BULANAN => [
                $ref->copy()->startOfMonth()->toDateString(),
                $ref->copy()->addMonthsNoOverflow($interval - 1)->endOfMonth()->toDateString(),
                $ref->copy()->addMonthsNoOverflow($interval - 1)->endOfMonth()->toDateString(),
                $ref->copy()->format('Y-m'),
            ],
            QcType::TAHUNAN => [
                $ref->copy()->startOfMonth()->toDateString(),
                $ref->copy()->addMonthsNoOverflow($interval - 1)->endOfMonth()->toDateString(),
                $ref->copy()->addMonthsNoOverflow($interval - 1)->endOfMonth()->toDateString(),
                $ref->copy()->format('Y-m'),
            ],
        };
    }

    protected function shouldGenerateForUnit(EquipmentUnit $unit, QcType $qcType, Carbon $ref): bool
    {
        $latestSchedule = QcSchedule::where('equipment_unit_id', $unit->id)
            ->where('qc_type', $qcType->value)
            ->orderByDesc('period_start')
            ->first();

        if (! $latestSchedule) {
            return true;
        }

        $interval = $unit->qcIntervalValue($qcType->value);
        $lastPeriodStart = $latestSchedule->period_start->copy()->startOfDay();
        $nextAllowedStart = match ($qcType) {
            QcType::HARIAN => $lastPeriodStart->addDays($interval),
            QcType::BULANAN, QcType::TAHUNAN => $lastPeriodStart->addMonthsNoOverflow($interval)->startOfMonth(),
        };

        $referenceStart = match ($qcType) {
            QcType::HARIAN => $ref->copy()->startOfDay(),
            QcType::BULANAN, QcType::TAHUNAN => $ref->copy()->startOfMonth(),
        };

        return $referenceStart->gte($nextAllowedStart);
    }

    public function markOverdue(): int
    {
        return QcSchedule::where('status', 'pending')
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);
    }
}
