<?php

namespace App\Enums;

enum QcType: string
{
    case HARIAN  = 'harian';
    case BULANAN = 'bulanan';
    case TAHUNAN = 'tahunan';

    public function label(): string
    {
        return match ($this) {
            self::HARIAN  => 'Harian',
            self::BULANAN => 'Bulanan',
            self::TAHUNAN => 'Tahunan',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::HARIAN  => 'badge-blue',
            self::BULANAN => 'badge-violet',
            self::TAHUNAN => 'badge-amber',
        };
    }
}
