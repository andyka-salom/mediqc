<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EquipmentType;
use App\Models\EquipmentUnit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EquipmentController extends Controller
{
    public function index(Request $request): Response
    {
        // Query Units
        $unitQuery = EquipmentUnit::with('equipmentType');

        if ($search = $request->input('search')) {
            $unitQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_code', 'like', "%{$search}%")
                  ->orWhere('merk', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('serial_number', 'like', "%{$search}%")
                  ->orWhere('ruangan', 'like', "%{$search}%");
            });
        }

        if ($typeId = $request->input('equipment_type_id')) {
            $unitQuery->where('equipment_type_id', $typeId);
        }

        if ($status = $request->input('status')) {
            $unitQuery->where('status', $status);
        }

        $units = $unitQuery->paginate(10)->withQueryString();

        // Get Types (sorted by order_index)
        $types = EquipmentType::orderBy('order_index')->get();

        return Inertia::render('Admin/Equipment/Index', [
            'units' => $units,
            'types' => $types,
            'filters' => $request->only(['search', 'equipment_type_id', 'status']),
        ]);
    }

    // Equipment Type CRUD
    public function storeType(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:equipment_types,code',
            'display_name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order_index' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        EquipmentType::create($validated);

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Tipe Alat Medis baru berhasil ditambahkan.');
    }

    public function updateType(Request $request, EquipmentType $type)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('equipment_types', 'code')->ignore($type->id),
            ],
            'display_name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'order_index' => 'required|integer|min:0',
            'is_active' => 'required|boolean',
        ]);

        $type->update($validated);

        return redirect()->route('admin.equipment.index')
            ->with('success', "Tipe Alat Medis {$type->display_name} berhasil diperbarui.");
    }

    public function destroyType(EquipmentType $type)
    {
        if ($type->units()->exists()) {
            return redirect()->route('admin.equipment.index')
                ->with('error', 'Tipe alat tidak dapat dihapus karena masih memiliki unit terdaftar.');
        }

        $type->delete();

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Tipe Alat Medis berhasil dihapus.');
    }

    // Equipment Unit CRUD
    public function storeUnit(Request $request)
    {
        $validated = $request->validate([
            'equipment_type_id' => 'required|exists:equipment_types,id',
            'asset_code' => 'required|string|max:50|unique:equipment_units,asset_code',
            'name' => 'required|string|max:150',
            'merk' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'ruangan' => 'nullable|string|max:100',
            'tahun_pengadaan' => 'nullable|date',
            'tanggal_kalibrasi_terakhir' => 'nullable|date',
            'tanggal_kalibrasi_berikutnya' => 'nullable|date',
            'status' => 'required|string|in:aktif,maintenance,rusak,dihapus',
            'catatan' => 'nullable|string',
            'is_active' => 'required|boolean',
        ]);

        EquipmentUnit::create($validated);

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Unit Alat Medis baru berhasil ditambahkan.');
    }

    public function updateUnit(Request $request, EquipmentUnit $unit)
    {
        $validated = $request->validate([
            'equipment_type_id' => 'required|exists:equipment_types,id',
            'asset_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('equipment_units', 'asset_code')->ignore($unit->id),
            ],
            'name' => 'required|string|max:150',
            'merk' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'ruangan' => 'nullable|string|max:100',
            'tahun_pengadaan' => 'nullable|date',
            'tanggal_kalibrasi_terakhir' => 'nullable|date',
            'tanggal_kalibrasi_berikutnya' => 'nullable|date',
            'status' => 'required|string|in:aktif,maintenance,rusak,dihapus',
            'catatan' => 'nullable|string',
            'is_active' => 'required|boolean',
        ]);

        $unit->update($validated);

        return redirect()->route('admin.equipment.index')
            ->with('success', "Unit Alat Medis {$unit->name} berhasil diperbarui.");
    }

    public function destroyUnit(EquipmentUnit $unit)
    {
        if ($unit->submissions()->exists() || $unit->schedules()->exists()) {
            // Soft delete or flag status as dihapus and make inactive
            $unit->update([
                'status' => 'dihapus',
                'is_active' => false
            ]);
            return redirect()->route('admin.equipment.index')
                ->with('success', 'Unit Alat Medis dinonaktifkan karena memiliki riwayat QC/jadwal.');
        }

        $unit->delete();

        return redirect()->route('admin.equipment.index')
            ->with('success', 'Unit Alat Medis berhasil dihapus secara permanen.');
    }
}
