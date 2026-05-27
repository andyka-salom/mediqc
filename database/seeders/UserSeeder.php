<?php

namespace Database\Seeders;

use App\Enums\RoleName;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $byRole = Role::all()->keyBy('name');

        $users = [
            [
                'name' => 'Administrator',
                'email' => 'admin@mediqc.local',
                'nip' => 'ADM001',
                'role' => RoleName::ADMIN->value,
            ],
            [
                'name' => 'Radit Pratama',
                'email' => 'radiografer@mediqc.local',
                'nip' => 'RAD001',
                'role' => RoleName::RADIOGRAFER->value,
            ],
            [
                'name' => 'Dr. Fitri Santoso',
                'email' => 'fisikawan@mediqc.local',
                'nip' => 'FIS001',
                'role' => RoleName::FISIKAWAN_MEDIS->value,
            ],
            [
                'name' => 'Eko Wijayanto',
                'email' => 'elektromedis@mediqc.local',
                'nip' => 'ELK001',
                'role' => RoleName::ELEKTROMEDIS->value,
            ],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'nip' => $u['nip'],
                    'password' => Hash::make('password'),
                    'role_id' => $byRole[$u['role']]->id,
                    'is_active' => true,
                ]
            );
        }
    }
}
