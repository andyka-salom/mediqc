<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class QcSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_unit_id',
        'form_template_id',
        'qc_type',
        'period_start',
        'period_end',
        'due_date',
        'assigned_role_id',
        'assigned_user_id',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end'   => 'date',
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    public function equipmentUnit(): BelongsTo
    {
        return $this->belongsTo(EquipmentUnit::class);
    }

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function assignedRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'assigned_role_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function submission(): HasOne
    {
        return $this->hasOne(QcSubmission::class);
    }

    public function scopePending(Builder $q): Builder
    {
        return $q->whereIn('status', ['pending', 'in_progress']);
    }

    public function scopeDue(Builder $q, $date = null): Builder
    {
        $date = $date ?: now()->toDateString();
        return $q->where('due_date', '<=', $date)->whereIn('status', ['pending', 'in_progress']);
    }

    public function isOverdue(): bool
    {
        return $this->due_date && $this->due_date->isPast() && in_array($this->status, ['pending', 'in_progress']);
    }

    public function getDaysUntilDueAttribute(): int
    {
        if (!$this->due_date) return 0;
        return (int) now()->startOfDay()->diffInDays($this->due_date->startOfDay(), false);
    }
}
