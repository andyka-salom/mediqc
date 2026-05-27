<?php

namespace App\Http\Controllers\QC;

use App\Http\Controllers\Controller;
use App\Models\EquipmentUnit;
use App\Models\FormTemplate;
use App\Models\QcSubmission;
use App\Services\SubmissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class QcController extends Controller
{
    public function __construct(
        protected SubmissionService $submissionService
    ) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $query = QcSubmission::with(['formTemplate', 'equipmentUnit', 'submitter'])
            ->orderByDesc('created_at');

        // Semua pengguna yang terautentikasi dapat melihat semua submission (tracking bersama)
        // Filter pencarian unit
        if ($search = $request->input('search')) {
            $query->whereHas('equipmentUnit', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('merk', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('asset_code', 'like', "%{$search}%");
            });
        }

        // Filter tipe QC
        if ($qcType = $request->input('qc_type')) {
            $query->where('qc_type', $qcType);
        }

        // Filter status
        if ($status = $request->input('status')) {
            $query->where('overall_status', $status);
        }

        $submissions = $query->paginate(10)->withQueryString();

        return Inertia::render('QC/Index', [
            'submissions' => $submissions,
            'filters' => $request->only(['search', 'qc_type', 'status']),
            'isAdmin' => $user->isAdmin(),
            'currentUserId' => $user->id,
        ]);
    }

    public function selectUnit(Request $request): Response
    {
        $user = Auth::user();
        
        $query = EquipmentUnit::with(['equipmentType'])
            ->where('is_active', true)
            ->where('status', 'aktif');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('asset_code', 'like', "%{$search}%")
                  ->orWhere('merk', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%")
                  ->orWhere('ruangan', 'like', "%{$search}%");
            });
        }

        if ($type = $request->input('equipment_type_id')) {
            $query->where('equipment_type_id', $type);
        }

        $units = $query->paginate(15)->withQueryString();

        // Get today's submissions for these units to know if they were already QC'd today
        $today = now()->format('Y-m-d');
        $unitIds = $units->pluck('id')->toArray();
        $todaysSubmissions = QcSubmission::with('submitter')
            ->whereIn('equipment_unit_id', $unitIds)
            ->where('submission_date', $today)
            ->get()
            ->groupBy('equipment_unit_id');

        // Which QC types is this user allowed to submit?
        $allowedQcTypes = $user->role->permissions['qc.submit'] ?? [];
        if ($allowedQcTypes === '*' || $allowedQcTypes === true) {
            $availableQcTypes = ['harian', 'bulanan', 'tahunan'];
        } else {
            $availableQcTypes = is_array($allowedQcTypes) ? $allowedQcTypes : [];
        }

        return Inertia::render('QC/SelectUnit', [
            'units' => $units,
            'todaysSubmissions' => $todaysSubmissions,
            'allowedQcTypes' => $availableQcTypes,
            'filters' => $request->only(['search', 'equipment_type_id']),
            'equipmentTypes' => \App\Models\EquipmentType::where('is_active', true)->get(),
            'currentUserId' => $user->id,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function create(EquipmentUnit $unit, Request $request): Response|RedirectResponse
    {
        $user = Auth::user();
        $qcType = $request->input('qc_type', 'harian');
        
        // Cek otorisasi pengisian tipe QC
        if (!$user->canSubmitQcType($qcType) && !$user->isAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengisi QC tipe ' . $qcType);
        }

        $today = now()->format('Y-m-d');

        // Cek apakah sudah ada QC hari ini untuk tipe ini
        $existing = QcSubmission::where('equipment_unit_id', $unit->id)
            ->where('qc_type', $qcType)
            ->where('submission_date', $today)
            ->first();

        if ($existing) {
            return redirect()->route('qc.show', $existing->id)
                ->with('warning', 'Alat ini sudah di-QC untuk periode ini pada hari ini.');
        }

        // Cari template terbaru yang published
        $template = FormTemplate::where('equipment_type_id', $unit->equipment_type_id)
            ->where('qc_type', $qcType)
            ->where('is_active', true)
            ->where('is_published', true)
            ->with(['sections.fields' => function ($q) {
                $q->where('is_active', true)->orderBy('order_index');
            }])
            ->orderByDesc('version')
            ->first();

        if (!$template) {
            return redirect()->route('qc.select-unit')->with('error', 'Belum ada template formulir aktif untuk alat ini pada tipe QC ' . $qcType . '.');
        }

        $unit->load('equipmentType');

        return Inertia::render('QC/Submit', [
            'equipmentUnit' => $unit,
            'template' => $template,
            'qcType' => $qcType,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'form_template_id' => 'required|exists:form_templates,id',
            'equipment_unit_id' => 'required|exists:equipment_units,id',
            'qc_type' => 'required|string',
            'submission_date' => 'required|date',
            'answers' => 'required|array',
            'catatan_masalah' => 'nullable|string',
            'submit' => 'required|boolean',
        ]);

        $payload = $request->all();
        $payload['qc_schedule_id'] = null; // No longer using schedules

        // Otorisasi submission
        if (!$user->canSubmitQcType($payload['qc_type']) && !$user->isAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengirimkan QC tipe ' . $payload['qc_type']);
        }

        // Prevent double submission
        $existing = QcSubmission::where('equipment_unit_id', $payload['equipment_unit_id'])
            ->where('qc_type', $payload['qc_type'])
            ->where('submission_date', $payload['submission_date'])
            ->first();

        if ($existing) {
            return redirect()->route('qc.show', $existing->id)
                ->with('error', 'Pemeriksaan QC untuk alat ini pada tanggal ini sudah dilakukan.');
        }

        $submission = $this->submissionService->submit($user, $payload);

        $message = $payload['submit'] 
            ? 'Hasil pemeriksaan QC berhasil dikirimkan.' 
            : 'Draft pemeriksaan QC berhasil disimpan.';

        return redirect()->route('qc.index')->with('success', $message);
    }

    public function update(QcSubmission $submission, Request $request)
    {
        $user = Auth::user();

        // Otorisasi edit (hanya creator atau admin)
        if ($submission->submitted_by !== $user->id && !$user->isAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses untuk mengedit pemeriksaan QC ini.');
        }

        $request->validate([
            'answers' => 'required|array',
            'catatan_masalah' => 'nullable|string',
            'submit' => 'required|boolean',
        ]);

        $payload = $request->all();
        
        $this->submissionService->updateSubmission($submission, $payload, $user);

        $message = $payload['submit'] 
            ? 'Hasil pemeriksaan QC berhasil diperbarui dan dikirimkan.' 
            : 'Draft pemeriksaan QC berhasil diperbarui.';

        return redirect()->route('qc.index')->with('success', $message);
    }

    public function destroy(QcSubmission $submission)
    {
        $user = Auth::user();

        // Otorisasi hapus (hanya creator atau admin)
        if ($submission->submitted_by !== $user->id && !$user->isAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses untuk menghapus pemeriksaan QC ini.');
        }

        $submission->answers()->delete();
        $submission->delete();

        return redirect()->route('qc.index')->with('success', 'Riwayat pemeriksaan QC berhasil dihapus.');
    }

    public function show(QcSubmission $submission): Response
    {
        $user = Auth::user();

        // Semua pengguna terautentikasi dapat melihat seluruh rekam QC (tracking bersama)
        $submission->load([
            'formTemplate.sections.fields' => function ($q) {
                $q->where('is_active', true)->orderBy('order_index');
            },
            'answers.field',
            'equipmentUnit.equipmentType',
            'submitter.role',
        ]);

        return Inertia::render('QC/Show', [
            'submission' => $submission,
            'canEdit' => $submission->submitted_by === $user->id || $user->isAdmin(),
        ]);
    }

    public function review(QcSubmission $submission, Request $request)
    {
        // Fitur review/approval telah dinonaktifkan.
        // Sistem QC hanya untuk pencatatan dan tracking.
        abort(403, 'Fitur review/approval tidak tersedia dalam sistem ini.');
    }
}
