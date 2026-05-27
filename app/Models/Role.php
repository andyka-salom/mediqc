<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'permissions',
        'is_active',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_active'   => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function hasPermission(string $key): bool
    {
        $perms = $this->permissions ?? [];
        $val = $perms[$key] ?? null;
        return $val === true || $val == 1 || $val === '*';
    }

    public function canSubmitQcType(string $qcType): bool
    {
        $allowed = $this->permissions['qc.submit'] ?? [];
        if ($allowed === '*' || $allowed === true) {
            return true;
        }
        return in_array($qcType, (array) $allowed, true);
    }
}
