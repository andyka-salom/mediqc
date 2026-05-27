<?php

namespace App\Enums;

enum RoleName: string
{
    case ADMIN = 'admin';
    case RADIOGRAFER = 'radiografer';
    case FISIKAWAN_MEDIS = 'fisikawan_medis';
    case ELEKTROMEDIS = 'elektromedis';

    public function label(): string
    {
        return match ($this) {
            self::ADMIN           => 'Administrator',
            self::RADIOGRAFER     => 'Radiografer',
            self::FISIKAWAN_MEDIS => 'Fisikawan Medis',
            self::ELEKTROMEDIS    => 'Elektromedis',
        };
    }

    /** Default qc_type yang boleh diisi role ini. */
    public function defaultQcTypes(): array
    {
        return match ($this) {
            self::ADMIN           => ['harian', 'bulanan', 'tahunan'],
            self::RADIOGRAFER     => ['harian'],
            self::FISIKAWAN_MEDIS => ['bulanan', 'tahunan'],
            self::ELEKTROMEDIS    => ['bulanan'],
        };
    }
}
