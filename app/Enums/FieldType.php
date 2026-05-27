<?php

namespace App\Enums;

enum FieldType: string
{
    case TEXT           = 'text';
    case TEXTAREA       = 'textarea';
    case NUMBER         = 'number';
    case DECIMAL        = 'decimal';
    case BOOLEAN        = 'boolean';
    case RADIO          = 'radio';
    case SELECT         = 'select';
    case MULTISELECT    = 'multiselect';
    case CHECKBOX_GROUP = 'checkbox_group';
    case DATE           = 'date';
    case TIME           = 'time';
    case DATETIME       = 'datetime';
    case PASS_FAIL      = 'pass_fail';
    case RANGE_SLIDER   = 'range_slider';
    case FILE_UPLOAD    = 'file_upload';
    case SIGNATURE      = 'signature';
    case TABLE          = 'table';
    case SECTION_HEADER = 'section_header';
    case INFO_TEXT      = 'info_text';

    /** Apakah field type ini menerima nilai (selain hanya tampilan). */
    public function isAnswerable(): bool
    {
        return ! in_array($this, [self::SECTION_HEADER, self::INFO_TEXT], true);
    }

    /** Kolom mana di qc_answers yang dipakai untuk menyimpan nilai. */
    public function valueColumn(): string
    {
        return match ($this) {
            self::NUMBER, self::DECIMAL, self::RANGE_SLIDER       => 'value_numeric',
            self::BOOLEAN, self::PASS_FAIL                         => 'value_boolean',
            self::DATE                                             => 'value_date',
            self::TIME                                             => 'value_time',
            self::MULTISELECT, self::CHECKBOX_GROUP, self::TABLE  => 'value_json',
            self::FILE_UPLOAD, self::SIGNATURE                    => 'file_path',
            default                                                => 'value_text',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::TEXT           => 'Teks Singkat',
            self::TEXTAREA       => 'Teks Panjang',
            self::NUMBER         => 'Angka',
            self::DECIMAL        => 'Desimal',
            self::BOOLEAN        => 'Ya/Tidak',
            self::RADIO          => 'Pilihan Tunggal (Radio)',
            self::SELECT         => 'Dropdown',
            self::MULTISELECT    => 'Multi Pilihan',
            self::CHECKBOX_GROUP => 'Checkbox Group',
            self::DATE           => 'Tanggal',
            self::TIME           => 'Waktu',
            self::DATETIME       => 'Tanggal & Waktu',
            self::PASS_FAIL      => 'Pass/Fail',
            self::RANGE_SLIDER   => 'Range Slider',
            self::FILE_UPLOAD    => 'Upload File',
            self::SIGNATURE      => 'Tanda Tangan',
            self::TABLE          => 'Tabel',
            self::SECTION_HEADER => 'Header Seksi',
            self::INFO_TEXT      => 'Teks Informasi',
        };
    }
}
