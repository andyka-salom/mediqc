<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->load('role');
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'nip' => $user->nip,
                    'no_hp' => $user->no_hp,
                    'role' => $user->role ? [
                        'id' => $user->role->id,
                        'name' => $user->role->name,
                        'display_name' => $user->role->display_name,
                        'permissions' => $user->role->permissions,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'calibrationWarnings' => function () use ($user) {
                if ($user && ($user->role?->name === 'admin' || !empty($user->role?->permissions['equipment.manage']))) {
                    return \App\Models\EquipmentUnit::where('status', 'aktif')
                        ->whereNotNull('tanggal_kalibrasi_berikutnya')
                        ->where('tanggal_kalibrasi_berikutnya', '<=', now()->addDays(30))
                        ->orderBy('tanggal_kalibrasi_berikutnya')
                        ->get(['id', 'name', 'asset_code', 'tanggal_kalibrasi_berikutnya'])
                        ->map(function ($unit) {
                            return [
                                'id' => $unit->id,
                                'name' => $unit->name,
                                'asset_code' => $unit->asset_code,
                                'due_date' => $unit->tanggal_kalibrasi_berikutnya->format('d/m/Y'),
                                'is_overdue' => $unit->tanggal_kalibrasi_berikutnya->isPast(),
                            ];
                        });
                }
                return [];
            },
        ];
    }
}
