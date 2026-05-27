<?php

namespace App\Enums;

enum SubmissionStatus: string
{
    case DRAFT        = 'draft';
    case SUBMITTED    = 'submitted';
    case NEEDS_ACTION = 'needs_action';

    public function label(): string
    {
        return match ($this) {
            self::DRAFT        => 'Draft',
            self::SUBMITTED    => 'Tercatat',
            self::NEEDS_ACTION => 'Perlu Tindak Lanjut',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::DRAFT        => 'gray',
            self::SUBMITTED    => 'green',
            self::NEEDS_ACTION => 'orange',
        };
    }

    public function badgeClass(): string
    {
        return match ($this) {
            self::DRAFT        => 'badge-gray',
            self::SUBMITTED    => 'badge-green',
            self::NEEDS_ACTION => 'badge-orange',
        };
    }
}
