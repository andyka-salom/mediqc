<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QcAnswer extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'submission_id',
        'form_field_id',
        'field_snapshot_label',
        'field_snapshot_unit',
        'field_snapshot_type',
        'value_text',
        'value_numeric',
        'value_boolean',
        'value_date',
        'value_time',
        'value_json',
        'file_path',
        'has_warning',
        'warning_message',
    ];

    protected $casts = [
        'value_boolean' => 'boolean',
        'value_numeric' => 'float',
        'value_date'    => 'date',
        'value_json'    => 'array',
        'has_warning'   => 'boolean',
    ];

    public function submission(): BelongsTo
    {
        return $this->belongsTo(QcSubmission::class, 'submission_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(FormField::class, 'form_field_id');
    }

    public function getDisplayValueAttribute(): string
    {
        if ($this->value_boolean !== null) {
            return $this->value_boolean ? 'Pass / Ya' : 'Fail / Tidak';
        }
        if ($this->value_numeric !== null) {
            return (string) $this->value_numeric . ($this->field_snapshot_unit ? ' ' . $this->field_snapshot_unit : '');
        }
        if ($this->value_date !== null) {
            return $this->value_date->format('d/m/Y');
        }
        if ($this->value_json !== null) {
            return is_array($this->value_json) ? implode(', ', $this->value_json) : (string) $this->value_json;
        }
        return (string) ($this->value_text ?? '—');
    }
}
