<?php

namespace App\Models;

use App\Enums\FieldType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormField extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_template_id',
        'form_section_id',
        'code',
        'label',
        'hint_text',
        'unit',
        'field_type',
        'config',
        'validation_rules',
        'warning_rules',
        'parent_field_id',
        'show_when',
        'layout_group',
        'layout_width',
        'is_required',
        'order_index',
        'is_active',
    ];

    protected $casts = [
        'config'           => 'array',
        'validation_rules' => 'array',
        'warning_rules'    => 'array',
        'show_when'        => 'array',
        'is_required'      => 'boolean',
        'is_active'        => 'boolean',
        'order_index'      => 'integer',
        'layout_width'     => 'integer',
    ];

    public function formTemplate(): BelongsTo
    {
        return $this->belongsTo(FormTemplate::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(FormSection::class, 'form_section_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_field_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_field_id')->orderBy('order_index');
    }

    public function answers(): HasMany
    {
        return $this->hasMany(QcAnswer::class);
    }

    public function typeEnum(): FieldType
    {
        return FieldType::from($this->field_type);
    }
}
