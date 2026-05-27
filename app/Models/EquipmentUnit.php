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
        'ruangan',
        'tahun_pengadaan',
        'tanggal_kalibrasi_terakhir',
        'tanggal_kalibrasi_berikutnya',
        'status',
        'catatan',
        'is_active',
    ];

    protected $casts = [
        'tahun_pengadaan'              => 'date',
        'tanggal_kalibrasi_terakhir'   => 'date',
        'tanggal_kalibrasi_berikutnya' => 'date',
        'is_active'                    => 'boolean',
    ];

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
