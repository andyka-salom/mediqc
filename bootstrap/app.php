<?php

use App\Http\Middleware\EnsureUserHasRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'role' => EnsureUserHasRole::class,
            'permission' => \App\Http\Middleware\EnsureUserHasPermission::class,
        ]);
        $middleware->preventRequestForgery(except: [
            'logout',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return $response;
            }

            $status = $response->getStatusCode();
            if (! in_array($status, [403, 404, 419, 429, 500, 503], true)) {
                return $response;
            }

            $messages = [
                403 => [
                    'title' => 'Akses Ditolak',
                    'description' => 'Anda tidak memiliki izin untuk membuka halaman atau menjalankan aksi ini.',
                    'actionLabel' => 'Kembali ke Dashboard',
                ],
                404 => [
                    'title' => 'Halaman Tidak Ditemukan',
                    'description' => 'Alamat yang Anda buka tidak tersedia, sudah dipindahkan, atau tidak lagi aktif.',
                    'actionLabel' => 'Kembali ke Dashboard',
                ],
                419 => [
                    'title' => 'Sesi Berakhir',
                    'description' => 'Sesi keamanan Anda sudah kedaluwarsa. Silakan masuk kembali sebelum melanjutkan.',
                    'actionLabel' => 'Masuk Kembali',
                ],
                429 => [
                    'title' => 'Terlalu Banyak Permintaan',
                    'description' => 'Sistem menerima terlalu banyak permintaan dalam waktu singkat. Tunggu sebentar lalu coba lagi.',
                    'actionLabel' => 'Coba Lagi',
                ],
                500 => [
                    'title' => 'Terjadi Gangguan Sistem',
                    'description' => 'Sistem belum dapat memproses permintaan Anda. Tim teknis dapat menelusuri kejadian ini melalui log server.',
                    'actionLabel' => 'Kembali ke Dashboard',
                ],
                503 => [
                    'title' => 'Layanan Sementara Tidak Tersedia',
                    'description' => 'MediQC sedang dalam pemeliharaan atau menerima beban tinggi. Silakan coba lagi beberapa saat.',
                    'actionLabel' => 'Coba Lagi',
                ],
            ];

            return Inertia::render('Error', [
                'status' => $status,
                ...$messages[$status],
                'homeUrl' => $request->user() ? route('dashboard') : route('login'),
                'loginUrl' => route('login'),
                'canGoBack' => $request->headers->has('referer'),
                'referenceId' => substr(hash('sha256', now()->toIso8601String().$request->ip().$status), 0, 10),
            ])->toResponse($request)->setStatusCode($status);
        });
    })
    ->create();
