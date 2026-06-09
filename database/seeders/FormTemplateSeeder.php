<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\EquipmentType;
use App\Models\FormField;
use App\Models\FormSection;
use App\Models\FormTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FormTemplateSeeder extends Seeder
{
    private const TEMPLATE_VERSION = 7;

    private ?string $adminId = null;

    public function run(): void
    {
        $admin = User::where('email', 'admin@mediqc.local')->first();
        if (! $admin) {
            return;
        }

        $this->adminId = $admin->id;
        $types = EquipmentType::all()->keyBy('code');

        foreach ($this->templateDefinitions() as $definition) {
            $type = $types->get($definition['equipment_type']);
            if (! $type) {
                continue;
            }

            $this->seedTemplate($type, $definition);
        }
    }

    private function seedTemplate(EquipmentType $type, array $definition): void
    {
        $version = $definition['version'] ?? self::TEMPLATE_VERSION;

        FormTemplate::where('equipment_type_id', $type->id)
            ->where('qc_type', $definition['qc_type'])
            ->where('version', '!=', $version)
            ->update(['is_active' => false]);

        $template = FormTemplate::updateOrCreate(
            [
                'equipment_type_id' => $type->id,
                'qc_type' => $definition['qc_type'],
                'version' => $version,
            ],
            [
                'name' => $definition['name'],
                'slug' => Str::slug($definition['name'])."-v{$version}",
                'description' => $definition['description'],
                'is_published' => true,
                'is_active' => true,
                'allowed_roles' => $definition['allowed_roles'],
                'created_by' => $this->adminId,
                'updated_by' => $this->adminId,
                'published_at' => now(),
            ]
        );

        $hasSubmittedData = $template->submissions()->exists()
            || $template->fields()->whereHas('answers')->exists();

        if ($hasSubmittedData && $template->sections()->exists()) {
            return;
        }

        $template->fields()->delete();
        $template->sections()->delete();

        foreach ($definition['sections'] as $sectionIndex => $sectionDefinition) {
            $section = FormSection::create([
                'form_template_id' => $template->id,
                'title' => $sectionDefinition['title'],
                'description' => $sectionDefinition['description'] ?? null,
                'order_index' => $sectionIndex + 1,
                'is_active' => true,
                'hidden_by_default' => $sectionDefinition['hidden_by_default'] ?? false,
            ]);

            foreach ($sectionDefinition['fields'] as $fieldIndex => $fieldDefinition) {
                $this->createField($template, $section, $fieldDefinition, ($fieldIndex + 1) * 10);
            }
        }
    }

    private function createField(
        FormTemplate $template,
        FormSection $section,
        array $definition,
        int $orderIndex,
        ?FormField $parent = null
    ): FormField {
        $field = FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $section->id,
            'parent_field_id' => $parent?->id,
            'show_when' => $definition['show_when'] ?? null,
            'code' => $definition['code'],
            'label' => $definition['label'],
            'hint_text' => $definition['hint_text'] ?? null,
            'unit' => $definition['unit'] ?? null,
            'field_type' => $definition['field_type'],
            'config' => $definition['config'] ?? null,
            'validation_rules' => $definition['validation_rules'] ?? null,
            'warning_rules' => $definition['warning_rules'] ?? null,
            'layout_group' => $this->normalizeLayoutGroup($definition['layout_group'] ?? null),
            'layout_width' => $definition['layout_width'] ?? 12,
            'is_required' => $definition['is_required'] ?? true,
            'order_index' => $orderIndex,
            'is_active' => true,
        ]);

        foreach ($definition['children'] ?? [] as $childIndex => $childDefinition) {
            $this->createField($template, $section, $childDefinition, $orderIndex + $childIndex + 1, $field);
        }

        return $field;
    }

    private function templateDefinitions(): array
    {
        $dailyRoles = [RoleName::RADIOGRAFER->value];
        $periodicRoles = [RoleName::FISIKAWAN_MEDIS->value, RoleName::ELEKTROMEDIS->value];
        $annualRoles = [RoleName::FISIKAWAN_MEDIS->value];

        $definitions = [
            $this->dailyTemplate('XRAY', 'X-Ray', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Cek Lampu Kolimasi', 2],
                ['Cek Pergerakan Tube X - Ray', 2],
                ['Cek Bucky Stand', 2],
                ['Cek Konsol & Tombol Eksposi', 2],
                ['Cek Warning Light', 2],
                ['Cek Door Interlock', 2],
                ['Cek Emergency Stop', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('XRAY', 'X-Ray', [
                ['Uji Iluminasi', 1],
                ['Uji Lapangan Kolimasi', 3],
                ['Uji Ketegaklurusan Berkas', 1],
            ], $periodicRoles),
            $this->annualTemplate('XRAY', 'X-Ray', [
                ['Kalibrasi Pesawat', 4],
                ['Uji Kebocoran Tabung', 5],
            ], [
                ['Akurasi Tegangan', 1],
                ['Akurasi Waktu Penyinaran', 1],
                ['Linearitas Keluaran Radiasi', 1],
                ['Reproduksibilitas Output', 1],
                ['Reproduksibilitas kVp', 1],
                ['Reproduksibilitas ms', 1],
                ['AEC Timer Darurat', 3],
                ['Kualitas Berkas Sinar-X (HVL)', 3],
                ['AEC Densitas Standar dan Uniformitas', 3],
                ['AEC Penjejakan', 3],
                ['AEC Waktu Respon Minimum', 3],
                ['Akurasi Indikator Eksposi', 3],
                ['Keseragaman Citra dan Artefak', 2],
                ['Resolusi Spesial', 2],
                ['Low Contrast Detectability atau Deteksi Objek Berkontras Rendah', 2],
                ['Dark Noise', 3],
                ['Akurasi KAP Meter', 3],
                ['Image Uniformity', 1],
            ], $annualRoles),

            $this->dailyTemplate('CT_SCAN', 'CT Scan', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Restart System', 2],
                ['Check Up', 2],
                ['Cek Pergerakan Sistem', 2],
                ['Cek Penanda Sinar Laser', 2],
                ['Cek Warning Light', 2],
                ['Cek Warning Sound', 2],
                ['Cek Door Interlock', 2],
                ['Cek Emergency Stop', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('CT_SCAN', 'CT Scan', [
                ['Uji Kualitas Citra CT Number', 1],
                ['Uji Kualitas Citra Keseragaman CT Number', 3],
                ['Uji Kualitas Citra Keseragaman Noise', 3],
                ['Callibration', 2],
                ['Uji Indikator Posisi Meja', 3],
            ], $periodicRoles),
            $this->annualTemplate('CT_SCAN', 'CT Scan', [
                ['Kalibrasi Pesawat', 4],
                ['Constancy', 3],
            ], [
                ['Reproduksibilitas Keluaran Radiasi', 1],
                ['Linearitas Keluaran Radiasi', 1],
                ['Keluaran Radiasi (CTDI100 udara)', 3],
                ['Kualitas Berkas Sinar-X (HVL)a', 3],
                ['Perkiraan Dosis Permukaan Kulit', 3],
                ['Linieritas CT Number dengan Densitas Elektron Obyek', 1],
                ['Resolusi dengan Kontras Tinggi (MTF cut off)', 3],
                ['Resolusi dengan Kontras Tinggi (Res. Spasial)', 3],
                ['Resolusi dengan Kontras Tinggi (D lubang)', 3],
                ['Kesesuaian Tebal Slice dengan Setting Semua Slice (Delta Slice)', 3],
                ['Kesesuaian Pusat Penandaan Laser dengan Pusat Slice', 3],
                ['Akurasi Dimensi Hasil Pengukuran', 3],
                ['Deteksi Detail Kontras Rendah', 2],
                ['X Ray Beam Width / Lebar Berkas Sinar X', 3],
                ['Lebar Irisan Gambar yang Direkonstruksi', 3],
                ['CT Dosimetry', 3],
                ['Penilaian Tingkat Reject Citra', 1],
                ['Image Uniformity', 1],
            ], $annualRoles),

            $this->dailyTemplate('DENTAL', 'Dental', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Cek Pergerakan Sistem', 2],
                ['Cek Laser Penanda', 2],
                ['Cek Koneksi Detektor', 2],
                ['Cek Tombol Eksposi', 2],
                ['Cek Warning Light', 2],
                ['Cek Warning Sound', 2],
                ['Cek Door Interlock', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('DENTAL', 'Dental', [
                ['Cephalometri - Kesesuaian Dimensi Berkas Sinar-X dengan Reseptor Citra', 2],
                ['Cephalometri - Jarak Titik Fokus ke Posisi Mid Sagital', 1],
                ['Panoramik - Kesesuaian Dimensi Berkas Sinar-X dengan Dimensi Slit', 2],
                ['Panoramik - Kesesuaian Dimensi Berkas Sinar-X dengan Reseptor Citra', 2],
            ], $periodicRoles),
            $this->annualTemplate('DENTAL', 'Dental', [
                ['Kalibrasi Pesawat', 4],
                ['Uji Kebocoran Tabung', 5],
            ], [
                ['Cephalometri - Akurasi Tegangan', 1],
                ['Cephalometri - Akurasi Waktu', 1],
                ['Cephalometri - Linieritas', 1],
                ['Cephalometri - Reproduksibilitas Output', 1],
                ['Cephalometri - Reproduksibilitas kVp', 1],
                ['Cephalometri - Reproduksibilitas ms', 1],
                ['Cephalometri - Kualitas Berkas Sinar-X (HVL)a', 3],
                ['Cephalometri - Image Uniformity', 3],
                ['Cephalometri - Evaluasi Kualitas Citra', 2],
                ['Panoramik - Akurasi Tegangan', 1],
                ['Panoramik - Linieritas', 1],
                ['Panoramik - Reproduksibilitas Output', 1],
                ['Panoramik - Reproduksibilitas kVp', 1],
                ['Panoramik - Kualitas Berkas Sinar-X (HVL)a', 3],
                ['Panoramik - Image Uniformity', 3],
                ['Panoramik - Detektor Artefak', 2],
                ['Intraoral - Diameter / Diagonal Maksimum Berkas Sinar-X', 1],
                ['Intraoral - Diameter / Diagonal Maksimum Ujung Aplikator (Konus)', 2],
                ['Intraoral - Jarak Titik Fokus ke Kulit Pasien / Panjang Konus (SSD)', 3],
                ['Intraoral - Akurasi Tegangan', 1],
                ['Intraoral - Akurasi Waktu pada t >= 200 ms', 1],
                ['Intraoral - Linieritas Keluaran Radiasi', 1],
                ['Intraoral - Reproduksibilitas Output', 1],
                ['Intraoral - Reproduksibilitas kVp', 1],
                ['Intraoral - Reproduksibilitas ms', 1],
                ['Intraoral - Kualitas Berkas Sinar-X (HVL)a', 3],
                ['Intraoral - Detektor Artefak', 2],
                ['Intraoral - Image Uniformity', 3],
            ], $annualRoles),

            $this->dailyTemplate('MAMMOGRAPHY', 'Mammografi', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Cek Lampu Kolimasi', 2],
                ['Cek Pergerakan Rotasi', 2],
                ['Cek Pergerakan Vertikal', 2],
                ['Cek Kondisi Unit Kompresi', 2],
                ['Cek Pedal Kompresi', 2],
                ['Cek Motion Enable pada P >= 30 N', 2],
                ['Cek Kalibrasi Ketebalan Kompresi (5 mm)', 2],
                ['Cek Kompresi Manual', 2],
                ['Cek Konsol Kontrol', 2],
                ['Cek Warning Light', 2],
                ['Cek Warning Sound', 2],
                ['Cek Emergency Stop', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('MAMMOGRAPHY', 'Mammografi', [
                ['Uji Iluminasi', 1],
                ['Uji Missing Tissue di Chest Wall (Fokus kecil)', 1],
                ['Uji Missing Tissue di Chest Wall (Fokus besar)', 1],
                ['Uji Selisih Lapangan Kolimasi dengan Berkas Sinar - X', 3],
                ['Uji Kualitas Citra (Artefak)', 2],
                ['Uji Sistem Otomatisasi Kompresi', 2],
            ], $periodicRoles),
            $this->annualTemplate('MAMMOGRAPHY', 'Mammografi', [
                ['Kalibrasi Pesawat', 4],
                ['Uji Kebocoran Tabung', 5],
                ['Uji Kebocoran Tabir Radiasi', 5],
            ], [
                ['Akurasi Tegangan', 1],
                ['Akurasi Waktu Penyinaran', 1],
                ['Linieritas Keluaran Radiasi', 1],
                ['Reproduksibilitas b Output', 1],
                ['Reproduksibilitas b kVp', 1],
                ['Reproduksibilitas b ms', 1],
                ['Kualitas Berkas Sinar-X (HVL)a', 3],
                ['AEC Timer Darurat', 3],
                ['AEC Penjejakan', 3],
                ['Reproduksibilitas c OD atau MPV', 1],
                ['Reproduksibilitas c Tegangan', 1],
                ['Reproduksibilitas c mAs', 1],
                ['Waktu Eksposi', 3],
                ['Penilaian Fantom ACR', 3],
                ['Resolusi Spasial dan Kaliper Jarak (distance calipers) untuk Film', 3],
                ['Perkiraan Dosis Permukaan Kulit', 3],
                ['Kekuatan Kompresi', 1],
                ['Image Uniformity', 1],
            ], $annualRoles),

            $this->dailyTemplate('XRAY_MOBILE', 'X-Ray Mobile', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Cek Lampu Kolimasi', 2],
                ['Cek Pergerakan Lengan dan Tube', 2],
                ['Cek Hand Brake', 2],
                ['Cek Pergerakan Sistem', 2],
                ['Cek Control Display', 2],
                ['Cek Tombol Eksposi', 2],
                ['Cek Warning Sound', 2],
                ['Cek Key Switch', 2],
                ['Cek Transfer Image System', 2],
                ['Cek Emergency Stop', 2],
                ['Cek Posisi Parkir', 2],
                ['Cek Koneksi Detektor', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('XRAY_MOBILE', 'X-Ray Mobile', [
                ['Uji Iluminasi', 1],
                ['Uji Lapangan Kolimasi', 3],
                ['Uji Ketegaklurusan Berkas', 1],
            ], $periodicRoles),
            $this->annualTemplate('XRAY_MOBILE', 'X-Ray Mobile', [
                ['Kalibrasi Pesawat', 4],
                ['Uji Kebocoran Tabung', 5],
            ], [
                ['Akurasi Tegangan', 1],
                ['Akurasi Waktu Penyinaran', 3],
                ['Linieritas Keluaran Radiasi', 1],
                ['Reproduksibilitas Output', 1],
                ['Reproduksibilitas kVp', 1],
                ['Reproduksibilitas ms', 1],
                ['Kualitas Berkas Sinar-X (HVL)', 3],
                ['Focal Spot Size', 3],
                ['Image Uniformity', 1],
                ['Evaluasi Artefak', 2],
                ['Beam Alignment', 1],
            ], $annualRoles),

            $this->dailyTemplate('FLUOROSCOPY', 'Fluoroskopi', [
                ['Cek Suhu', 1],
                ['Cek Kelembapan Ruang', 1],
                ['Cek Lampu Kolimasi', 2],
                ['Cek Pergerakan Tube X - Ray', 2],
                ['Cek Bucky Stand', 2],
                ['Cek Konsol & Tombol Eksposi', 2],
                ['Cek Warning Light', 2],
                ['Cek Door Interlock', 2],
                ['Cek Emergency Stop', 2],
            ], $dailyRoles),
            $this->monthlyTemplate('FLUOROSCOPY', 'Fluoroskopi', [
                ['Uji Iluminasi', 1],
                ['Uji Lapangan Kolimasi', 3],
                ['Uji Ketegaklurusan Berkas', 1],
                ['Kesesuaian Lapangan Berkas dengan Monitor', 3],
            ], $periodicRoles),
            $this->annualTemplate('FLUOROSCOPY', 'Fluoroskopi', [
                ['Kalibrasi Pesawat', 4],
                ['Uji Kebocoran Tabung', 5],
            ], [
                ['Akurasi Tegangan', 1],
                ['Akurasi Waktu Penyinaran', 1],
                ['Linieritas Keluaran Radiasi', 1],
                ['Reproduksibilitas Output', 1],
                ['Reproduksibilitas kVp', 1],
                ['Reproduksibilitas ms', 1],
                ['Kualitas Berkas Sinar-X (HVL)a', 3],
                ['Kesesuaian Lapangan Berkas dengan II', 3],
                ['Kesesuaian Titik Pusat II dengan Monitor', 3],
                ['Waktu Fluoroskopik Maksimum', 1],
                ['Laju Dosis Tipikal', 1],
                ['Laju Dosis Maksimum di Udara', 3],
                ['Laju Dosis di Permukaan Image Receptor', 3],
                ['Kualitas Citra di Monitor', 3],
                ['Fluoroscopy Dose Rate', 1],
                ['High Dose Mode', 1],
                ['Focal Spot Size', 3],
            ], $annualRoles),
        ];

        return $this->withSharedQcSections($definitions);
    }

    private function withSharedQcSections(array $definitions): array
    {
        $byEquipment = collect($definitions)
            ->groupBy('equipment_type')
            ->map(fn ($items) => collect($items)->keyBy('qc_type'));

        return array_map(function (array $definition) use ($byEquipment) {
            $group = $byEquipment->get($definition['equipment_type']);
            if (! $group || ! $group->has('harian') || ! $group->has('bulanan') || ! $group->has('tahunan')) {
                return $definition;
            }

            $qcType = $definition['qc_type'];
            $daily = $group->get('harian');
            $monthly = $group->get('bulanan');
            $annual = $group->get('tahunan');

            $definition['description'] .= ' Form memuat pertanyaan harian, bulanan, dan tahunan; seksi yang sesuai jadwal tampil otomatis.';
            $definition['sections'] = [
                ...$this->questionSectionsForQcType($daily['sections'][0], 'harian', $qcType),
                ...$this->questionSectionsForQcType($monthly['sections'][0], 'bulanan', $qcType),
                ...$this->questionSectionsForQcType($annual['sections'][0], 'tahunan', $qcType),
                ...$this->questionSectionsForQcType($annual['sections'][1], 'tahunan', $qcType, true),
                $this->notesSection(),
            ];

            return $definition;
        }, $definitions);
    }

    private function questionSectionsForQcType(
        array $section,
        string $sectionQcType,
        string $activeQcType,
        bool $alwaysHidden = false
    ): array {
        return array_map(function (array $field) use ($section, $sectionQcType, $activeQcType, $alwaysHidden) {
            return [
                'title' => $field['label'],
                'description' => $this->questionSectionDescription($sectionQcType, $section['description'] ?? null),
                'hidden_by_default' => $alwaysHidden || $sectionQcType !== $activeQcType,
                'fields' => [$field],
            ];
        }, $section['fields']);
    }

    private function questionSectionDescription(string $qcType, ?string $fallback): string
    {
        return match ($qcType) {
            'harian' => 'Pertanyaan QC harian.',
            'bulanan' => 'Pertanyaan QC bulanan.',
            'tahunan' => 'Pertanyaan QC tahunan.',
            default => $fallback ?? 'Pertanyaan QC.',
        };
    }

    private function dailyTemplate(string $equipmentCode, string $displayName, array $checks, array $roles): array
    {
        return [
            'equipment_type' => $equipmentCode,
            'qc_type' => 'harian',
            'name' => "QC Harian {$displayName}",
            'description' => "Checklist QC harian {$displayName} sesuai rekap pertanyaan web.",
            'allowed_roles' => $roles,
            'sections' => [
                [
                    'title' => 'Pertanyaan',
                    'description' => 'Pertanyaan sesuai tabel rekap; opsi mengikuti pola jawaban QC.',
                    'fields' => $this->fieldsFromSelections($equipmentCode, $checks),
                ],
                $this->notesSection(),
            ],
        ];
    }

    private function monthlyTemplate(string $equipmentCode, string $displayName, array $checks, array $roles): array
    {
        return [
            'equipment_type' => $equipmentCode,
            'qc_type' => 'bulanan',
            'name' => "QC Bulanan {$displayName}",
            'description' => "Checklist QC bulanan {$displayName} sesuai rekap pertanyaan web.",
            'allowed_roles' => $roles,
            'sections' => [
                [
                    'title' => 'Pertanyaan',
                    'description' => 'Pertanyaan sesuai tabel rekap; opsi mengikuti pola jawaban QC.',
                    'fields' => $this->fieldsFromSelections($equipmentCode, $checks),
                ],
                $this->notesSection(),
            ],
        ];
    }

    private function annualTemplate(string $equipmentCode, string $displayName, array $visibleSelections, array $hiddenSelections, array $roles): array
    {
        return [
            'equipment_type' => $equipmentCode,
            'qc_type' => 'tahunan',
            'name' => "QC Tahunan {$displayName}",
            'description' => "Checklist QC tahunan {$displayName} dan parameter hidden selections sesuai rekap pertanyaan web.",
            'allowed_roles' => $roles,
            'sections' => [
                [
                    'title' => 'Pertanyaan',
                    'description' => 'Pertanyaan yang selalu muncul.',
                    'fields' => $this->fieldsFromSelections($equipmentCode, $visibleSelections),
                ],
                [
                    'title' => 'Hidden Selections',
                    'description' => 'Parameter tambahan tahunan yang dapat ditambahkan bila diperlukan.',
                    'hidden_by_default' => true,
                    'fields' => $this->fieldsFromSelections($equipmentCode, $hiddenSelections),
                ],
                $this->notesSection(),
            ],
        ];
    }

    private function notesSection(): array
    {
        return [
            'title' => 'Catatan / Masalah',
            'description' => 'Catatan temuan, masalah, dan tindak lanjut singkat.',
            'fields' => [
                [
                    'code' => 'catatan_masalah',
                    'label' => 'Catatan / Masalah',
                    'field_type' => 'textarea',
                    'config' => ['rows' => 4, 'placeholder' => 'Tulis catatan jika ada masalah.'],
                    'is_required' => false,
                ],
            ],
        ];
    }

    private function fieldsFromSelections(string $equipmentCode, array $selections): array
    {
        return collect($selections)
            ->reject(fn (array $selection) => $this->isCalibrationQuestion($selection[0]))
            ->map(fn (array $selection) => $this->fieldByChoice($equipmentCode, $selection[0], $selection[1]))
            ->values()
            ->all();
    }

    private function isCalibrationQuestion(string $label): bool
    {
        $normalized = Str::of($label)->ascii()->lower()->toString();

        return str_contains($normalized, 'kalibrasi')
            || str_contains($normalized, 'callibration')
            || str_contains($normalized, 'calibration');
    }

    private function fieldByChoice(string $equipmentCode, string $label, int $choice): array
    {
        return match ($choice) {
            2 => $this->baikTroubleField($label),
            3 => $this->yesNoValueField($label),
            5 => $this->leakageField($this->codeFromLabel($label), $label),
            6 => $this->yesNoDateField($this->codeFromLabel($label), $label),
            default => $this->measurementField($equipmentCode, $label),
        };
    }

    private function measurementField(string $equipmentCode, string $label): array
    {
        $code = $this->codeFromLabel($label);
        $warningRules = $this->passRule($equipmentCode, $label) ?? [
            'warning_if_empty' => true,
            'warning_message' => "{$label} belum diisi.",
        ];

        return [
            'code' => $code,
            'label' => $label,
            'unit' => $this->unitFor($equipmentCode, $label),
            'field_type' => 'decimal',
            'hint_text' => 'Isi nilai hasil uji sesuai standar alat.',
            'config' => ['step' => 0.01, 'placeholder' => 'Nilai hasil uji'],
            'warning_rules' => $warningRules,
            'is_required' => false,
        ];
    }

    private function numberField(string $code, string $label, string $unit, ?array $warningRules = null): array
    {
        return [
            'code' => $code,
            'label' => $label,
            'unit' => $unit,
            'field_type' => 'number',
            'config' => ['min' => 0, 'max' => 100, 'step' => 1],
            'warning_rules' => $warningRules,
            'is_required' => true,
        ];
    }

    private function baikTroubleField(string $label): array
    {
        return [
            'code' => $this->codeFromLabel($label),
            'label' => $label,
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'baik', 'label' => 'Baik'],
                    ['value' => 'trouble', 'label' => 'Trouble'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['trouble'],
                'warning_message' => "{$label} berstatus Trouble.",
            ],
            'is_required' => true,
        ];
    }

    private function yesNoField(string $label): array
    {
        return [
            'code' => $this->codeFromLabel($label),
            'label' => $label,
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no', 'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['no'],
                'warning_message' => "{$label} belum sesuai.",
            ],
            'is_required' => true,
        ];
    }

    private function yesNoValueField(string $label): array
    {
        $code = $this->codeFromLabel($label);
        $layoutGroup = $this->layoutGroupFromCode($code);

        return [
            'code' => $code,
            'label' => $label,
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no', 'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['no'],
                'warning_message' => "{$label} belum sesuai.",
            ],
            'layout_group' => $layoutGroup,
            'layout_width' => 6,
            'is_required' => true,
            'children' => [
                [
                    'code' => "{$code}_nilai",
                    'label' => 'Nilai',
                    'field_type' => 'text',
                    'config' => ['placeholder' => 'Nilai / keterangan hasil uji'],
                    'show_when' => ['operator' => 'equals', 'value' => 'yes'],
                    'layout_group' => $layoutGroup,
                    'layout_width' => 6,
                    'is_required' => true,
                ],
            ],
        ];
    }

    private function leakageField(string $code, string $label): array
    {
        $layoutGroup = $this->layoutGroupFromCode($code);

        return [
            'code' => $code,
            'label' => $label,
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no', 'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['yes'],
                'warning_message' => "{$label} terdeteksi.",
            ],
            'layout_group' => $layoutGroup,
            'layout_width' => 6,
            'is_required' => true,
            'children' => [
                [
                    'code' => "{$code}_nilai_kebocoran",
                    'label' => 'Nilai Kebocoran',
                    'unit' => 'mGy/jam',
                    'field_type' => 'decimal',
                    'hint_text' => 'Isi nilai kebocoran hasil ukur.',
                    'config' => ['min' => 0, 'step' => 0.001, 'placeholder' => 'mGy/jam'],
                    'show_when' => ['operator' => 'in', 'value' => ['yes', 'no']],
                    'layout_group' => $layoutGroup,
                    'layout_width' => 6,
                    'is_required' => true,
                ],
                [
                    'code' => "{$code}_tanggal_uji",
                    'label' => 'Tanggal Uji',
                    'field_type' => 'date',
                    'show_when' => ['operator' => 'in', 'value' => ['yes', 'no']],
                    'layout_group' => $layoutGroup,
                    'layout_width' => 6,
                    'is_required' => true,
                ],
            ],
        ];
    }

    private function yesNoDateField(string $code, string $label): array
    {
        $layoutGroup = $this->layoutGroupFromCode($code);

        return [
            'code' => $code,
            'label' => $label,
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no', 'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['yes'],
                'warning_message' => "{$label} terdeteksi.",
            ],
            'layout_group' => $layoutGroup,
            'layout_width' => 6,
            'is_required' => true,
            'children' => [
                [
                    'code' => "{$code}_tanggal_uji",
                    'label' => 'Tanggal Uji',
                    'field_type' => 'date',
                    'show_when' => ['operator' => 'in', 'value' => ['yes', 'no']],
                    'layout_group' => $layoutGroup,
                    'layout_width' => 6,
                    'is_required' => true,
                ],
            ],
        ];
    }

    private function passRule(string $equipmentCode, string $label): ?array
    {
        $code = $this->codeFromLabel($label);

        if (str_contains($code, 'suhu')) {
            return $this->rangeRule(18, 26, 'Suhu harus berada pada rentang 18-26 C.');
        }

        if (str_contains($code, 'kelembapan') || str_contains($code, 'kelembaban')) {
            return $this->rangeRule(50, 60, 'Kelembapan ruang harus berada pada rentang 50-60%.');
        }

        $rules = [
            'XRAY' => [
                'uji_iluminasi' => $this->minRule(100, 'Nilai lolos uji minimal 100 lux.'),
                'uji_ketegaklurusan_berkas' => $this->maxRule(3, 'Nilai lolos uji maksimal 3 derajat.'),
                'uji_kualitas_citra_ct_number' => $this->rangeRule(-4, 4, 'Nilai lolos uji -4 sampai +4 HU.'),
                'uji_kualitas_ct_number' => $this->rangeRule(-4, 4, 'Nilai lolos uji -4 sampai +4 HU.'),
                'akurasi_tegangan' => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                'akurasi_waktu_penyinaran' => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                'linearitas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'reproduksibilitas_output' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_kvp' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_ms' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'image_uniformity' => $this->rangeRule(-20, 20, 'Nilai lolos uji +/-20%.'),
            ],
            'CT_SCAN' => [
                'uji_kualitas_citra_ct_number' => $this->rangeRule(-4, 4, 'Nilai lolos uji -4 sampai +4 HU.'),
                'reproduksibilitas_keluaran_radiasi' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'linearitas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'linieritas_ct_number_dengan_densitas_elektron_obyek' => $this->minRule(0.99, 'Nilai lolos uji minimal 0,99.'),
                'linearitas_ct_number_dengan_densitas_elektron_obyek' => $this->minRule(0.99, 'Nilai lolos uji minimal 0,99.'),
                'penilaian_tingkat_reject_citra' => $this->maxRule(8, 'Nilai lolos uji kurang dari 8%.'),
                'image_uniformity' => $this->rangeRule(-10, 10, 'Nilai lolos uji +/-10 HU.'),
            ],
            'DENTAL' => [
                'jarak_titik_fokus_ke_posisi_mid_sagital' => $this->minRule(150, 'Nilai lolos uji minimal 150 cm.'),
            ],
            'MAMMOGRAPHY' => [
                'uji_iluminasi' => $this->minRule(100, 'Nilai lolos uji minimal 100 lux.'),
                'uji_missing_tissue_di_chest_wall_fokus_kecil' => $this->maxRule(7, 'Nilai lolos uji maksimal 7 mm.'),
                'uji_missing_tissue_di_chest_wall_fokus_besar' => $this->maxRule(5, 'Nilai lolos uji maksimal 5 mm.'),
                'akurasi_tegangan' => $this->maxRule(5, 'Nilai lolos uji maksimal 5%.'),
                'akurasi_waktu_penyinaran' => $this->maxRule(5, 'Nilai lolos uji maksimal 5%.'),
                'linearitas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'linieritas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'reproduksibilitas_output' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_b_output' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_kvp' => $this->maxRule(0.02, 'Nilai lolos uji maksimal 0,02.'),
                'reproduksibilitas_b_kvp' => $this->maxRule(0.02, 'Nilai lolos uji maksimal 0,02.'),
                'reproduksibilitas_ms' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_b_ms' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_od_atau_mpv' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_c_od_atau_mpv' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_tegangan' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_c_tegangan' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_mas' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_c_mas' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'kekuatan_kompresi' => $this->rangeRule(11, 20, 'Nilai lolos uji 11-20 kg.'),
                'image_uniformity' => $this->rangeRule(-15, 15, 'Nilai lolos uji +/-15%.'),
            ],
            'XRAY_MOBILE' => [
                'uji_iluminasi' => $this->minRule(100, 'Nilai lolos uji minimal 100 lux.'),
                'uji_ketegaklurusan_berkas' => $this->maxRule(3, 'Nilai lolos uji maksimal 3 derajat.'),
                'akurasi_tegangan' => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                'linearitas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'linieritas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'reproduksibilitas_output' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_kvp' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_ms' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'image_uniformity' => $this->rangeRule(-20, 20, 'Nilai lolos uji +/-20%.'),
                'beam_alignment' => $this->maxRule(1.5, 'Nilai lolos uji maksimal 1,5 derajat.'),
            ],
            'FLUOROSCOPY' => [
                'uji_iluminasi' => $this->minRule(100, 'Nilai lolos uji minimal 100 lux.'),
                'uji_ketegaklurusan_berkas' => $this->maxRule(3, 'Nilai lolos uji maksimal 3 derajat.'),
                'akurasi_tegangan' => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                'akurasi_waktu_penyinaran' => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                'linearitas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'linieritas_keluaran_radiasi' => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                'reproduksibilitas_output' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_kvp' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'reproduksibilitas_ms' => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                'waktu_fluoroskopi_maksimum' => $this->maxRule(5, 'Nilai lolos uji maksimal 5 menit.'),
                'waktu_fluoroskopik_maksimum' => $this->maxRule(5, 'Nilai lolos uji maksimal 5 menit.'),
                'laju_dosis_tipikal' => $this->maxRule(17, 'Nilai lolos uji maksimal 17 mGy/menit.'),
                'fluoroscopy_dose_rate' => $this->maxRule(88, 'Nilai lolos uji maksimal 88 mGy/min.'),
                'high_dose_mode' => $this->maxRule(176, 'Nilai lolos uji maksimal 176 mGy/min.'),
            ],
        ];

        $rule = $rules[$equipmentCode][$code] ?? null;
        if ($rule) {
            return $rule;
        }

        if ($equipmentCode === 'DENTAL') {
            return match (true) {
                str_contains($code, 'jarak_titik_fokus') => $this->minRule(150, 'Nilai lolos uji minimal 150 cm.'),
                str_contains($code, 'akurasi_tegangan') => $this->maxRule(6, 'Nilai lolos uji maksimal 6%.'),
                str_contains($code, 'akurasi_waktu') => $this->maxRule(10, 'Nilai lolos uji maksimal 10%.'),
                str_contains($code, 'linearitas') || str_contains($code, 'linieritas') => $this->maxRule(0.1, 'Nilai lolos uji maksimal 0,1.'),
                str_contains($code, 'reproduksibilitas_output') => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                str_contains($code, 'reproduksibilitas_kvp') => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                str_contains($code, 'reproduksibilitas_ms') => $this->maxRule(0.05, 'Nilai lolos uji maksimal 0,05.'),
                str_contains($code, 'diameter_diagonal_maksimum_berkas') => $this->maxRule(60, 'Nilai lolos uji maksimal 60 mm.'),
                default => null,
            };
        }

        return null;
    }

    private function minRule(float $min, string $message): array
    {
        return ['warning_below' => $min, 'warning_message' => $message];
    }

    private function maxRule(float $max, string $message): array
    {
        return ['warning_above' => $max, 'warning_message' => $message];
    }

    private function rangeRule(float $min, float $max, string $message): array
    {
        return ['warning_below' => $min, 'warning_above' => $max, 'warning_message' => $message];
    }

    private function unitFor(string $equipmentCode, string $label): ?string
    {
        $code = $this->codeFromLabel($label);

        if (str_contains($code, 'suhu')) {
            return 'C';
        }

        if (str_contains($code, 'kelembapan') || str_contains($code, 'kelembaban')) {
            return '%';
        }

        if (str_contains($code, 'iluminasi')) {
            return 'lux';
        }

        if (str_contains($code, 'ketegaklurusan') || str_contains($code, 'beam_alignment')) {
            return 'derajat';
        }

        if (str_contains($code, 'ct_number') || $code === 'image_uniformity' && $equipmentCode === 'CT_SCAN') {
            return 'HU';
        }

        if (str_contains($code, 'tegangan') || str_contains($code, 'waktu_penyinaran') || str_contains($code, 'image_uniformity')) {
            return '%';
        }

        if (str_contains($code, 'missing_tissue') || str_contains($code, 'diameter_diagonal')) {
            return 'mm';
        }

        if (str_contains($code, 'jarak_titik_fokus')) {
            return 'cm';
        }

        if (str_contains($code, 'kekuatan_kompresi')) {
            return 'kg';
        }

        if (str_contains($code, 'waktu_fluoroskopi')) {
            return 'menit';
        }

        if (str_contains($code, 'laju_dosis_tipikal')) {
            return 'mGy/menit';
        }

        if (str_contains($code, 'dose_rate') || str_contains($code, 'high_dose_mode')) {
            return 'mGy/min';
        }

        return null;
    }

    private function codeFromLabel(string $label): string
    {
        return Str::of($label)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '_')
            ->trim('_')
            ->limit(76, '')
            ->toString();
    }

    private function layoutGroupFromCode(string $code): string
    {
        return $this->normalizeLayoutGroup("{$code}_row") ?? 'row';
    }

    private function normalizeLayoutGroup(?string $layoutGroup): ?string
    {
        if (! $layoutGroup) {
            return null;
        }

        return Str::of($layoutGroup)->limit(50, '')->toString();
    }
}
