<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     * Usage:  ->middleware('permission:template.manage')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if (! $user || ! $user->is_active) {
            abort(403, 'Akun tidak aktif atau tidak terautentikasi.');
        }

        // Give admin absolute power, or check the specific permission
        if ($user->isAdmin() || $user->hasPermission($permission)) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki hak akses (permission) ke halaman ini.');
    }
}
