<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_type_id',
        'qc_type',
        'name',
        'slug',
        'description',
        'version',
        'is_published',
        'is_active',
        'allowed_roles',
        'scoring_rules',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'allowed_roles' => 'array',
        'scoring_rules' => 'array',
        'is_published'  => 'boolean',
        'is_active'     => 'boolean',
        'version'       => 'integer',
        'published_at'  => 'datetime',
    ];

    public function equipmentType(): BelongsTo
    {
        return $this->belongsTo(EquipmentType::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function sections(): HasMany
    {
        return $this->hasMany(FormSection::class)->orderBy('order_index');
    }

    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('order_index');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(QcSubmission::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(QcSchedule::class);
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('is_published', true)->where('is_active', true);
    }

    public function scopeForRole(Builder $q, string $roleName): Builder
    {
        return $q->where(function (Builder $w) use ($roleName) {
            $w->whereJsonContains('allowed_roles', $roleName)
              ->orWhereNull('allowed_roles');
        });
    }

    public function isAccessibleByRole(string $roleName): bool
    {
        $roles = $this->allowed_roles;
        return empty($roles) || in_array($roleName, $roles, true);
    }
}
