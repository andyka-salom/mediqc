<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => RoleName::ADMIN->value,
                'display_name' => 'Administrator',
                'description' => 'Akses penuh ke seluruh sistem',
                'permissions' => [
                    'qc.submit' => '*',
                    'qc.view_own' => true,
                    'qc.view_all' => true,
                    'qc.review' => false, // tidak ada approval sama sekali
                    'template.manage' => true,
                    'equipment.manage' => true,
                    'user.manage' => true,
                    'report.view' => true,
                    'audit.view' => true,
                ],
            ],
            [
                'name' => RoleName::RADIOGRAFER->value,
                'display_name' => 'Radiografer',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'qc.view_own' => true,
                    'qc.view_all' => true,
                    'qc.review' => false,
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'report.view' => true,
                ],
            ],
            [
                'name' => RoleName::FISIKAWAN_MEDIS->value,
                'display_name' => 'Fisikawan Medis',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'qc.view_own' => true,
                    'qc.view_all' => true,
                    'qc.review' => false,
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'report.view' => true,
                ],
            ],
            [
                'name' => RoleName::ELEKTROMEDIS->value,
                'display_name' => 'Elektromedis',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'qc.view_own' => true,
                    'qc.view_all' => true,
                    'qc.review' => false,
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'report.view' => true,
                ],
            ],
        ];

        foreach ($roles as $r) {
            Role::updateOrCreate(['name' => $r['name']], $r);
        }
    }
}
