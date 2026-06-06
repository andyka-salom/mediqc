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
                    'template.manage' => true,
                    'equipment.manage' => true,
                    'user.manage' => true,
                ],
            ],
            [
                'name' => RoleName::RADIOGRAFER->value,
                'display_name' => 'Radiografer',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'user.manage' => false,
                ],
            ],
            [
                'name' => RoleName::FISIKAWAN_MEDIS->value,
                'display_name' => 'Fisikawan Medis',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'user.manage' => false,
                ],
            ],
            [
                'name' => RoleName::ELEKTROMEDIS->value,
                'display_name' => 'Elektromedis',
                'description' => 'Petugas pencatatan & tracking QC alat medis',
                'permissions' => [
                    'qc.submit' => ['harian', 'bulanan', 'tahunan'],
                    'template.manage' => false,
                    'equipment.manage' => false,
                    'user.manage' => false,
                ],
            ],
        ];

        foreach ($roles as $r) {
            Role::updateOrCreate(['name' => $r['name']], $r);
        }
    }
}
