<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\QC\QcController;
use Illuminate\Support\Facades\Route;

// Guest Routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

// Authenticated Routes
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    
    // Redirect root to dashboard
    Route::get('/', function () {
        return redirect()->route('dashboard');
    });

    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // QC Operations
    Route::get('/qc', [QcController::class, 'index'])->name('qc.index');
    Route::get('/qc/export', [QcController::class, 'export'])->name('qc.export');
    Route::get('/qc/export/pdf', [QcController::class, 'exportPdf'])->name('qc.export.pdf');
    Route::get('/qc/input', [QcController::class, 'selectUnit'])->name('qc.select-unit');
    Route::get('/qc/input/{unit}/submit', [QcController::class, 'create'])->name('qc.create');
    Route::post('/qc/submissions', [QcController::class, 'store'])->name('qc.store');
    Route::get('/qc/submissions/{submission}', [QcController::class, 'show'])->name('qc.show');
    Route::put('/qc/submissions/{submission}', [QcController::class, 'update'])->name('qc.update');
    Route::delete('/qc/submissions/{submission}', [QcController::class, 'destroy'])->name('qc.destroy');
    Route::post('/qc/submissions/{submission}/review', [QcController::class, 'review'])->name('qc.review');

    // Admin Panel Routes
    Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
        // User & Permission Management
        Route::middleware('permission:user.manage')->group(function () {
            Route::get('/users', [App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
            Route::post('/users', [App\Http\Controllers\Admin\UserController::class, 'store'])->name('users.store');
            Route::put('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
            Route::delete('/users/{user}', [App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('users.destroy');
            Route::put('/roles/{role}', [App\Http\Controllers\Admin\UserController::class, 'updateRolePermissions'])->name('roles.update-permissions');
        });

        // Equipment Management
        Route::middleware('permission:equipment.manage')->group(function () {
            Route::get('/equipment', [App\Http\Controllers\Admin\EquipmentController::class, 'index'])->name('equipment.index');
            Route::post('/equipment/types', [App\Http\Controllers\Admin\EquipmentController::class, 'storeType'])->name('equipment.types.store');
            Route::put('/equipment/types/{type}', [App\Http\Controllers\Admin\EquipmentController::class, 'updateType'])->name('equipment.types.update');
            Route::delete('/equipment/types/{type}', [App\Http\Controllers\Admin\EquipmentController::class, 'destroyType'])->name('equipment.types.destroy');
            Route::post('/equipment/units', [App\Http\Controllers\Admin\EquipmentController::class, 'storeUnit'])->name('equipment.units.store');
            Route::put('/equipment/units/{unit}', [App\Http\Controllers\Admin\EquipmentController::class, 'updateUnit'])->name('equipment.units.update');
            Route::delete('/equipment/units/{unit}', [App\Http\Controllers\Admin\EquipmentController::class, 'destroyUnit'])->name('equipment.units.destroy');
        });

        // Form Templates Management (Form Builder)
        Route::middleware('permission:template.manage')->group(function () {
            Route::get('/templates', [App\Http\Controllers\Admin\FormTemplateController::class, 'index'])->name('templates.index');
            Route::get('/templates/create', [App\Http\Controllers\Admin\FormTemplateController::class, 'create'])->name('templates.create');
            Route::post('/templates', [App\Http\Controllers\Admin\FormTemplateController::class, 'store'])->name('templates.store');
            Route::get('/templates/{template}/edit', [App\Http\Controllers\Admin\FormTemplateController::class, 'edit'])->name('templates.edit');
            Route::put('/templates/{template}', [App\Http\Controllers\Admin\FormTemplateController::class, 'update'])->name('templates.update');
            Route::delete('/templates/{template}', [App\Http\Controllers\Admin\FormTemplateController::class, 'destroy'])->name('templates.destroy');
            Route::post('/templates/{template}/publish', [App\Http\Controllers\Admin\FormTemplateController::class, 'publish'])->name('templates.publish');
            Route::post('/templates/{template}/builder', [App\Http\Controllers\Admin\FormTemplateController::class, 'saveBuilderStructure'])->name('templates.builder.save');
        });
    });
});

