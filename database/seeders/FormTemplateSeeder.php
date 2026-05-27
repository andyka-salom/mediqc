<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\EquipmentType;
use App\Models\FormField;
use App\Models\FormSection;
use App\Models\FormTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;

class FormTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@mediqc.local')->first();
        $xray = EquipmentType::where('code', 'XRAY')->first();
        if (! $xray || ! $admin) {
            return;
        }

        $template = FormTemplate::updateOrCreate(
            [
                'equipment_type_id' => $xray->id,
                'qc_type' => 'harian',
                'version' => 1,
            ],
            [
                'name' => 'QC Harian X-Ray Konvensional',
                'slug' => 'qc-harian-xray-konvensional-v1',
                'description' => 'Form pemeriksaan QC harian untuk pesawat X-Ray konvensional, '.
                                 'mencakup uji visual, kalibrasi, dan keselamatan radiasi.',
                'is_published' => true,
                'is_active' => true,
                'allowed_roles' => [RoleName::RADIOGRAFER->value, RoleName::FISIKAWAN_MEDIS->value],
                'created_by' => $admin->id,
                'published_at' => now(),
            ]
        );

        // Bersihkan field & section sebelumnya untuk seeder idempotent
        $template->fields()->delete();
        $template->sections()->delete();

        // === Section 1: Pemeriksaan Visual ===
        $sec1 = FormSection::create([
            'form_template_id' => $template->id,
            'title' => 'Pemeriksaan Visual & Fungsi Dasar',
            'description' => 'Cek fisik & fungsi dasar sebelum pemakaian.',
            'order_index' => 1,
            'is_active' => true,
        ]);

        // (1) Input angka dengan WARNING — kasus pertama di gambar referensi
        FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec1->id,
            'code' => 'kvp_uji',
            'label' => 'Hasil Uji kVp',
            'hint_text' => 'Masukkan nilai kVp hasil pengukuran',
            'unit' => 'kVp',
            'field_type' => 'decimal',
            'config' => ['min' => 0, 'max' => 200, 'step' => 0.1, 'placeholder' => 'mis. 80.0'],
            'validation_rules' => ['required' => true],
            'warning_rules' => [
                'warning_below' => 70,
                'warning_above' => 90,
                'warning_message' => 'Nilai di luar batas aman (70-90 kVp). Segera kalibrasi.',
            ],
            'is_required' => true,
            'order_index' => 1,
            'is_active' => true,
        ]);

        // (2) Radio sederhana
        FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec1->id,
            'code' => 'kondisi_visual',
            'label' => 'Kondisi visual alat',
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'baik',    'label' => 'Baik'],
                    ['value' => 'trouble', 'label' => 'Trouble'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['trouble'],
                'warning_message' => 'Kondisi trouble — perlu tindak lanjut.',
            ],
            'is_required' => true,
            'order_index' => 2,
            'is_active' => true,
        ]);

        // (3) Yes/No + conditional text input
        $adaKerusakan = FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec1->id,
            'code' => 'ada_kerusakan',
            'label' => 'Apakah ada kerusakan?',
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no',  'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['yes'],
                'warning_message' => 'Ada kerusakan terdeteksi.',
            ],
            'is_required' => true,
            'order_index' => 3,
            'is_active' => true,
        ]);
        FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec1->id,
            'parent_field_id' => $adaKerusakan->id,
            'show_when' => ['equals' => 'yes'],
            'code' => 'detail_kerusakan',
            'label' => 'Jelaskan kerusakan',
            'field_type' => 'text',
            'is_required' => true,
            'order_index' => 4,
            'is_active' => true,
        ]);

        // === Section 2: Kalibrasi ===
        $sec2 = FormSection::create([
            'form_template_id' => $template->id,
            'title' => 'Status Kalibrasi',
            'description' => 'Verifikasi kalibrasi & izin operasional.',
            'order_index' => 2,
            'is_active' => true,
        ]);

        // (4) Radio dengan 3 sub-field wajib
        $kal = FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec2->id,
            'code' => 'status_kalibrasi',
            'label' => 'Kalibrasi Pesawat',
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'terkalibrasi',       'label' => 'Terkalibrasi'],
                    ['value' => 'belum_terkalibrasi', 'label' => 'Belum Terkalibrasi'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['belum_terkalibrasi'],
                'warning_message' => 'Alat belum terkalibrasi — wajib kalibrasi sebelum dipakai rutin.',
            ],
            'is_required' => true,
            'order_index' => 1,
            'is_active' => true,
        ]);
        $children = [
            ['code' => 'nomor_izin',        'label' => 'Nomor Izin Operasional Alat', 'field_type' => 'text'],
            ['code' => 'tanggal_kalibrasi', 'label' => 'Tanggal Kalibrasi',           'field_type' => 'date'],
            ['code' => 'tenggat_kalibrasi', 'label' => 'Tenggat Kalibrasi',           'field_type' => 'date',
             'warning_rules' => ['warning_if_past_due' => true, 'warning_message' => 'Tenggat kalibrasi sudah lewat.']],
        ];
        foreach ($children as $i => $c) {
            FormField::create(array_merge($c, [
                'form_template_id' => $template->id,
                'form_section_id' => $sec2->id,
                'parent_field_id' => $kal->id,
                'show_when' => ['equals' => 'terkalibrasi'],
                'is_required' => true,
                'order_index' => 2 + $i,
                'is_active' => true,
            ]));
        }

        // === Section 3: Uji Kebocoran (layout group) ===
        $sec3 = FormSection::create([
            'form_template_id' => $template->id,
            'title' => 'Uji Kebocoran Tabung',
            'description' => 'Pemeriksaan kebocoran tabung X-Ray.',
            'order_index' => 3,
            'is_active' => true,
        ]);

        // (5) Radio + date dalam 1 baris (layout_group)
        FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec3->id,
            'code' => 'uji_kebocoran',
            'label' => 'Hasil Uji Kebocoran',
            'field_type' => 'radio',
            'config' => [
                'options' => [
                    ['value' => 'yes', 'label' => 'Yes'],
                    ['value' => 'no',  'label' => 'No'],
                ],
            ],
            'warning_rules' => [
                'warning_if_value_in' => ['yes'],
                'warning_message' => 'Tabung bocor — hentikan pemakaian segera.',
            ],
            'layout_group' => 'kebocoran_row',
            'layout_width' => 6,
            'is_required' => true,
            'order_index' => 1,
            'is_active' => true,
        ]);
        FormField::create([
            'form_template_id' => $template->id,
            'form_section_id' => $sec3->id,
            'code' => 'tanggal_uji_kebocoran',
            'label' => 'Tanggal Uji',
            'field_type' => 'date',
            'layout_group' => 'kebocoran_row',
            'layout_width' => 6,
            'is_required' => true,
            'order_index' => 2,
            'is_active' => true,
        ]);
    }
}
