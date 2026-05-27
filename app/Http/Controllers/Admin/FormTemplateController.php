<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EquipmentType;
use App\Models\FormTemplate;
use App\Models\FormSection;
use App\Models\FormField;
use App\Models\Role;
use App\Enums\QcType;
use App\Services\ScheduleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FormTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $templates = FormTemplate::with('equipmentType')
            ->orderBy('equipment_type_id')
            ->orderBy('qc_type')
            ->orderByDesc('version')
            ->paginate(10);

        $equipmentTypes = EquipmentType::where('is_active', true)->orderBy('order_index')->get();
        $roles = Role::all();

        return Inertia::render('Admin/FormTemplates/Index', [
            'templates' => $templates,
            'equipmentTypes' => $equipmentTypes,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment_type_id' => 'required|exists:equipment_types,id',
            'qc_type' => 'required|string|in:harian,bulanan,tahunan',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'allowed_roles' => 'nullable|array',
        ]);

        $maxVersion = FormTemplate::where('equipment_type_id', $validated['equipment_type_id'])
            ->where('qc_type', $validated['qc_type'])
            ->max('version') ?? 0;

        $template = FormTemplate::create([
            'equipment_type_id' => $validated['equipment_type_id'],
            'qc_type' => $validated['qc_type'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'slug' => Str::slug($validated['name']) . '-' . time(),
            'version' => $maxVersion + 1,
            'is_published' => false,
            'is_active' => true,
            'allowed_roles' => $validated['allowed_roles'] ?? [],
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('admin.templates.edit', $template->id)
            ->with('success', 'Draft template berhasil dibuat. Silakan susun formulir Anda.');
    }

    public function edit(FormTemplate $template): Response
    {
        $template->load(['equipmentType', 'sections.fields' => function ($q) {
            $q->orderBy('order_index');
        }]);

        $equipmentTypes = EquipmentType::where('is_active', true)->orderBy('order_index')->get();
        $roles = Role::all();

        return Inertia::render('Admin/FormTemplates/Builder', [
            'template' => $template,
            'equipmentTypes' => $equipmentTypes,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request, FormTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'allowed_roles' => 'nullable|array',
            'scoring_rules' => 'nullable|array',
        ]);

        $template->update($validated + [
            'updated_by' => Auth::id()
        ]);

        return redirect()->back()
            ->with('success', 'Metadata template berhasil diperbarui.');
    }

    public function destroy(FormTemplate $template)
    {
        if ($template->submissions()->exists()) {
            return redirect()->route('admin.templates.index')
                ->with('error', 'Template tidak dapat dihapus karena sudah memiliki data pengisian QC.');
        }

        $template->delete();

        return redirect()->route('admin.templates.index')
            ->with('success', 'Template berhasil dihapus.');
    }

    public function publish(FormTemplate $template)
    {
        DB::transaction(function () use ($template) {
            // Deactivate other templates of the same equipment_type & qc_type
            FormTemplate::where('equipment_type_id', $template->equipment_type_id)
                ->where('qc_type', $template->qc_type)
                ->where('id', '!=', $template->id)
                ->update(['is_active' => false]);

            $template->update([
                'is_published' => true,
                'is_active' => true,
                'published_at' => now(),
                'updated_by' => Auth::id(),
            ]);
        });

        // Trigger schedule generation for the new template
        try {
            $qcTypeEnum = QcType::from($template->qc_type);
            app(ScheduleService::class)->generateForPeriod($qcTypeEnum);
        } catch (\Throwable $e) {
            // Log or ignore schedule gen error so template still gets published successfully
        }

        return redirect()->route('admin.templates.index')
            ->with('success', "Template '{$template->name}' berhasil dipublikasikan dan jadwal baru telah disesuaikan.");
    }

    public function saveBuilderStructure(Request $request, FormTemplate $template)
    {
        $request->validate([
            'sections' => 'present|array',
            'sections.*.title' => 'required|string|max:200',
            'sections.*.description' => 'nullable|string',
            'sections.*.order_index' => 'required|integer',
            'sections.*.fields' => 'present|array',
        ]);

        DB::transaction(function () use ($request, $template) {
            $sectionsData = $request->input('sections', []);

            // 1. Fetch current sections/fields to handle deletions later
            $existingSectionIds = $template->sections()->pluck('id')->toArray();
            $existingFieldIds = $template->fields()->pluck('id')->toArray();

            $processedSectionIds = [];
            $processedFieldIds = [];

            // Maps to translate client temporary IDs (e.g. 'temp_123') to real DB IDs
            $sectionIdMap = [];
            $fieldIdMap = [];

            // 2. First Pass: Create/Update sections and create mapping
            foreach ($sectionsData as $sectionIndex => $sec) {
                $secId = $sec['id'] ?? null;
                $isTempSection = is_string($secId) && str_starts_with($secId, 'temp_');

                if ($secId && !$isTempSection) {
                    // Update section
                    $section = FormSection::findOrFail($secId);
                    $section->update([
                        'title' => $sec['title'],
                        'description' => $sec['description'] ?? null,
                        'order_index' => $sec['order_index'] ?? $sectionIndex,
                    ]);
                    $processedSectionIds[] = $section->id;
                    $sectionIdMap[$secId] = $section->id;
                } else {
                    // Create section
                    $section = FormSection::create([
                        'form_template_id' => $template->id,
                        'title' => $sec['title'],
                        'description' => $sec['description'] ?? null,
                        'order_index' => $sec['order_index'] ?? $sectionIndex,
                    ]);
                    $processedSectionIds[] = $section->id;
                    if ($secId) {
                        $sectionIdMap[$secId] = $section->id;
                    }
                }

                // 3. First Pass for fields: Insert fields, generate IDs, ignore parent_field_id first
                $fieldsData = $sec['fields'] ?? [];
                foreach ($fieldsData as $fieldIndex => $f) {
                    $fId = $f['id'] ?? null;
                    $isTempField = is_string($fId) && str_starts_with($fId, 'temp_');

                    $fieldPayload = [
                        'form_template_id' => $template->id,
                        'form_section_id' => $section->id,
                        'code' => $f['code'] ?? null,
                        'label' => $f['label'],
                        'hint_text' => $f['hint_text'] ?? null,
                        'unit' => $f['unit'] ?? null,
                        'field_type' => $f['field_type'],
                        'config' => $f['config'] ?? null,
                        'validation_rules' => $f['validation_rules'] ?? null,
                        'warning_rules' => $f['warning_rules'] ?? null,
                        'show_when' => $f['show_when'] ?? null,
                        'layout_group' => $f['layout_group'] ?? null,
                        'layout_width' => $f['layout_width'] ?? 12,
                        'is_required' => (bool) ($f['is_required'] ?? false),
                        'order_index' => $f['order_index'] ?? $fieldIndex,
                        'is_active' => true,
                    ];

                    if ($fId && !$isTempField) {
                        $field = FormField::findOrFail($fId);
                        $field->update($fieldPayload);
                        $processedFieldIds[] = $field->id;
                        $fieldIdMap[$fId] = $field->id;
                    } else {
                        $field = FormField::create($fieldPayload);
                        $processedFieldIds[] = $field->id;
                        if ($fId) {
                            $fieldIdMap[$fId] = $field->id;
                        }
                    }
                }
            }

            // 4. Second Pass for fields: Resolve parent_field_id conditional mapping
            foreach ($sectionsData as $sec) {
                $fieldsData = $sec['fields'] ?? [];
                foreach ($fieldsData as $f) {
                    $fId = $f['id'] ?? null;
                    $parentFieldId = $f['parent_field_id'] ?? null;

                    if ($parentFieldId) {
                        $dbFieldId = $fieldIdMap[$fId] ?? $fId;
                        $resolvedParentId = $fieldIdMap[$parentFieldId] ?? $parentFieldId;

                        if ($dbFieldId && $resolvedParentId) {
                            FormField::where('id', $dbFieldId)->update([
                                'parent_field_id' => $resolvedParentId
                            ]);
                        }
                    }
                }
            }

            // 5. Clean up deleted sections and fields
            $sectionsToDelete = array_diff($existingSectionIds, $processedSectionIds);
            FormSection::whereIn('id', $sectionsToDelete)->delete();

            $fieldsToDelete = array_diff($existingFieldIds, $processedFieldIds);
            FormField::whereIn('id', $fieldsToDelete)->delete();
        });

        return redirect()->route('admin.templates.edit', $template->id)
            ->with('success', 'Struktur form builder berhasil disimpan.');
    }
}
