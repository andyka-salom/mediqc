<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentUnit extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_type_id',
        'asset_code',
        'name',
        'merk',
        'model',
        'serial_number',
        'nomor_izin_operasional',
        'ruangan',
        'tahun_pengadaan',
        'tanggal_kalibrasi_terakhir',
        'tanggal_kalibrasi_berikutnya',
        'status',
        'catatan',
        'qc_schedule_config',
        'is_active',
    ];

    protected $casts = [
        'tahun_pengadaan'              => 'date',
        'tanggal_kalibrasi_terakhir'   => 'date',
        'tanggal_kalibrasi_berikutnya' => 'date',
        'qc_schedule_config'            => 'array',
        'is_active'                    => 'boolean',
    ];

    public const DEFAULT_QC_SCHEDULE_CONFIG = [
        'harian' => [
            'enabled' => true,
            'interval_days' => 1,
        ],
        'bulanan' => [
            'enabled' => true,
            'interval_months' => 1,
        ],
        'tahunan' => [
            'enabled' => true,
            'interval_months' => 12,
        ],
    ];

    public function qcScheduleConfig(): array
    {
        return array_replace_recursive(
            self::DEFAULT_QC_SCHEDULE_CONFIG,
            $this->qc_schedule_config ?? []
        );
    }

    public function qcTypeEnabled(string $qcType): bool
    {
        return (bool) ($this->qcScheduleConfig()[$qcType]['enabled'] ?? false);
    }

    public function qcIntervalValue(string $qcType): int
    {
        $config = $this->qcScheduleConfig()[$qcType] ?? [];

        return match ($qcType) {
            'harian' => max(1, (int) ($config['interval_days'] ?? 1)),
            'bulanan' => max(1, (int) ($config['interval_months'] ?? 1)),
            'tahunan' => max(1, (int) ($config['interval_months'] ?? 12)),
            default => 1,
        };
    }

    public function equipmentType(): BelongsTo
    {
        return $this->belongsTo(EquipmentType::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(QcSchedule::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(QcSubmission::class);
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            'aktif'       => 'badge-green',
            'maintenance' => 'badge-amber',
            'rusak'       => 'badge-red',
            'dihapus'     => 'badge-gray',
            default       => 'badge-gray',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'aktif'       => 'Aktif',
            'maintenance' => 'Maintenance',
            'rusak'       => 'Rusak',
            'dihapus'     => 'Dihapus',
            default       => ucfirst($this->status ?? '—'),
        };
    }
}
