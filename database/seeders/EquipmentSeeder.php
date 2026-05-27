<?php

namespace Database\Seeders;

use App\Models\EquipmentType;
use App\Models\EquipmentUnit;
use Illuminate\Database\Seeder;

class EquipmentSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'XRAY',          'display_name' => 'X-Ray Konvensional', 'icon' => 'radio', 'order_index' => 1],
            ['code' => 'XRAY_MOBILE',   'display_name' => 'X-Ray Mobile',       'icon' => 'truck', 'order_index' => 2],
            ['code' => 'CT_SCAN',       'display_name' => 'CT Scan',            'icon' => 'scan',  'order_index' => 3],
            ['code' => 'MRI',           'display_name' => 'MRI',                'icon' => 'magnet','order_index' => 4],
            ['code' => 'USG',           'display_name' => 'USG',                'icon' => 'wave',  'order_index' => 5],
            ['code' => 'MAMMOGRAPHY',   'display_name' => 'Mammografi',         'icon' => 'scan',  'order_index' => 6],
            ['code' => 'FLUOROSCOPY',   'display_name' => 'Fluoroscopy',        'icon' => 'tv',    'order_index' => 7],
        ];

        foreach ($types as $t) {
            EquipmentType::updateOrCreate(['code' => $t['code']], $t + ['is_active' => true]);
        }

        $units = [
            [
                'type_code' => 'XRAY',
                'asset_code' => 'XR-001',
                'name' => 'X-Ray Konvensional R. Radiologi 1',
                'merk' => 'Shimadzu', 'model' => 'MobileDaRt Evolution',
                'serial_number' => 'SH-2022-0011',
                'ruangan' => 'Radiologi 1',
                'tahun_pengadaan' => '2022-03-15',
            ],
            [
                'type_code' => 'XRAY_MOBILE',
                'asset_code' => 'XRM-001',
                'name' => 'X-Ray Mobile R. IGD',
                'merk' => 'GE', 'model' => 'AMX 240',
                'serial_number' => 'GE-2021-7788',
                'ruangan' => 'IGD',
                'tahun_pengadaan' => '2021-08-20',
            ],
            [
                'type_code' => 'CT_SCAN',
                'asset_code' => 'CT-001',
                'name' => 'CT Scan 64 Slice',
                'merk' => 'Siemens', 'model' => 'Somatom Definition AS',
                'serial_number' => 'SIE-CT-1023',
                'ruangan' => 'Radiologi 2',
                'tahun_pengadaan' => '2020-01-10',
            ],
            [
                'type_code' => 'USG',
                'asset_code' => 'USG-001',
                'name' => 'USG Poli Kandungan',
                'merk' => 'Mindray', 'model' => 'DC-70',
                'serial_number' => 'MR-2023-001',
                'ruangan' => 'Poli Kandungan',
                'tahun_pengadaan' => '2023-06-01',
            ],
        ];

        $byCode = EquipmentType::all()->keyBy('code');

        foreach ($units as $u) {
            $typeId = $byCode[$u['type_code']]->id;
            EquipmentUnit::updateOrCreate(
                ['asset_code' => $u['asset_code']],
                [
                    'equipment_type_id' => $typeId,
                    'name' => $u['name'],
                    'merk' => $u['merk'],
                    'model' => $u['model'],
                    'serial_number' => $u['serial_number'],
                    'ruangan' => $u['ruangan'],
                    'tahun_pengadaan' => $u['tahun_pengadaan'],
                    'status' => 'aktif',
                    'is_active' => true,
                ]
            );
        }
    }
}
