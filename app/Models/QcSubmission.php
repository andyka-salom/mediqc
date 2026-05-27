<?php

namespace App\Models;

use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QcSubmission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'form_template_id',
        'equipment_unit_id',
        'qc_schedule_id',
        'qc_type',
        'submitted_by',
        'submission_date',
        'period_label',
        'overall_status',
        'warning_count',
        'catatan_masalah',
        'catatan_tindak_lanjut',
        'is_complete',
        'reviewed_by',
        'reviewed_at',
        'review_notes',
        'submitted_at',
    ];

    protected $casts = [
        'submission_date' => 'date',
        'submitted_at'    => 'datetime',
        'reviewed_at'     => 'datetime',
        'is_complete'     => 'boolean',
        'warning_count'   => 'integer',
    ];

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function equipmentUnit(): BelongsTo
    {
        return $this->belongsTo(EquipmentUnit::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(QcSchedule::class, 'qc_schedule_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QcAnswer::class, 'submission_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(QcSubmissionAttachment::class, 'submission_id');
    }

    public function statusEnum(): SubmissionStatus
    {
        return SubmissionStatus::from($this->overall_status);
    }

    public function scopeForUser(Builder $q, User $user): Builder
    {
        return $q->where('submitted_by', $user->id);
    }

    public function scopePendingReview(Builder $q): Builder
    {
        return $q->where('overall_status', SubmissionStatus::SUBMITTED->value)
                 ->whereNull('reviewed_at');
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->statusEnum()->label();
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return $this->statusEnum()->badgeClass();
    }
}
