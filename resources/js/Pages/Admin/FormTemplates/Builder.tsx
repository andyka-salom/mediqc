import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Save,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    ChevronRight,
    GripVertical,
    Settings2,
    AlertTriangle,
    Eye,
    Type,
    Hash,
    ToggleLeft,
    Calendar,
    List,
    FileText,
    Info,
    ArrowLeft,
    Layers,
    Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ────────────── Types ──────────────

interface EquipmentType {
    id: number;
    code: string;
    display_name: string;
}

interface Role {
    id: number;
    name: string;
    display_name: string;
}

interface FieldData {
    id: string | number;
    code: string;
    label: string;
    hint_text: string;
    unit: string;
    field_type: string;
    config: any;
    validation_rules: any;
    warning_rules: any;
    parent_field_id: string | number | null;
    show_when: any;
    layout_group: string;
    layout_width: number;
    is_required: boolean;
    order_index: number;
    is_active: boolean;
}

interface SectionData {
    id: string | number;
    title: string;
    description: string;
    order_index: number;
    fields: FieldData[];
}

interface FormTemplateData {
    id: number;
    equipment_type_id: number;
    qc_type: string;
    name: string;
    description: string | null;
    version: number;
    is_published: boolean;
    is_active: boolean;
    allowed_roles: string[] | null;
    equipment_type: EquipmentType | null;
    sections: Array<{
        id: number;
        title: string;
        description: string | null;
        order_index: number;
        fields: Array<{
            id: number;
            code: string | null;
            label: string;
            hint_text: string | null;
            unit: string | null;
            field_type: string;
            config: any;
            validation_rules: any;
            warning_rules: any;
            parent_field_id: number | null;
            show_when: any;
            layout_group: string | null;
            layout_width: number;
            is_required: boolean;
            order_index: number;
            is_active: boolean;
        }>;
    }>;
}

interface BuilderProps {
    template: FormTemplateData;
    equipmentTypes: EquipmentType[];
    roles: Role[];
}

// ────────────── Field Type Definitions ──────────────

const fieldTypeOptions: { value: string; label: string; icon: React.ReactNode; group: string }[] = [
    { value: 'text', label: 'Teks Singkat', icon: <Type className="size-3.5" />, group: 'Teks' },
    { value: 'textarea', label: 'Teks Panjang', icon: <FileText className="size-3.5" />, group: 'Teks' },
    { value: 'number', label: 'Angka', icon: <Hash className="size-3.5" />, group: 'Numerik' },
    { value: 'decimal', label: 'Desimal', icon: <Hash className="size-3.5" />, group: 'Numerik' },
    { value: 'boolean', label: 'Ya/Tidak', icon: <ToggleLeft className="size-3.5" />, group: 'Pilihan' },
    { value: 'radio', label: 'Radio (Pilihan Tunggal)', icon: <List className="size-3.5" />, group: 'Pilihan' },
    { value: 'select', label: 'Dropdown', icon: <List className="size-3.5" />, group: 'Pilihan' },
    { value: 'multiselect', label: 'Multi Pilihan', icon: <List className="size-3.5" />, group: 'Pilihan' },
    { value: 'checkbox_group', label: 'Checkbox Group', icon: <List className="size-3.5" />, group: 'Pilihan' },
    { value: 'pass_fail', label: 'Pass/Fail', icon: <ToggleLeft className="size-3.5" />, group: 'Pilihan' },
    { value: 'date', label: 'Tanggal', icon: <Calendar className="size-3.5" />, group: 'Waktu' },
    { value: 'time', label: 'Waktu', icon: <Calendar className="size-3.5" />, group: 'Waktu' },
    { value: 'datetime', label: 'Tanggal & Waktu', icon: <Calendar className="size-3.5" />, group: 'Waktu' },
    { value: 'range_slider', label: 'Range Slider', icon: <Hash className="size-3.5" />, group: 'Numerik' },
    { value: 'file_upload', label: 'Upload File', icon: <FileText className="size-3.5" />, group: 'Lainnya' },
    { value: 'signature', label: 'Tanda Tangan', icon: <Type className="size-3.5" />, group: 'Lainnya' },
    { value: 'section_header', label: 'Header Seksi', icon: <Info className="size-3.5" />, group: 'Tampilan' },
    { value: 'info_text', label: 'Teks Informasi', icon: <Info className="size-3.5" />, group: 'Tampilan' },
];

const getFieldTypeLabel = (ft: string) => fieldTypeOptions.find(o => o.value === ft)?.label || ft;

let tempIdCounter = 0;
const genTempId = () => `temp_${++tempIdCounter}_${Date.now()}`;

// ────────────── Component ──────────────

export default function Builder({ template }: BuilderProps) {
    // Convert server data to mutable state
    const [sections, setSections] = useState<SectionData[]>(() =>
        template.sections.map((s, si) => ({
            id: s.id,
            title: s.title,
            description: s.description || '',
            order_index: si,
            fields: s.fields.map((f, fi) => ({
                id: f.id,
                code: f.code || '',
                label: f.label,
                hint_text: f.hint_text || '',
                unit: f.unit || '',
                field_type: f.field_type,
                config: f.config || {},
                validation_rules: f.validation_rules || {},
                warning_rules: f.warning_rules || {},
                parent_field_id: f.parent_field_id,
                show_when: f.show_when || {},
                layout_group: f.layout_group || '',
                layout_width: f.layout_width || 12,
                is_required: f.is_required,
                order_index: fi,
                is_active: f.is_active,
            })),
        }))
    );

    const [saving, setSaving] = useState(false);
    const [expandedField, setExpandedField] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string | number>>(new Set());

    // ────── Section Handlers ──────

    const addSection = () => {
        setSections(prev => [...prev, {
            id: genTempId(),
            title: `Seksi ${prev.length + 1}`,
            description: '',
            order_index: prev.length,
            fields: [],
        }]);
    };

    const updateSection = (sectionId: string | number, key: keyof SectionData, value: any) => {
        setSections(prev => prev.map(s => s.id === sectionId ? { ...s, [key]: value } : s));
    };

    const removeSection = (sectionId: string | number) => {
        if (confirm('Hapus seksi ini beserta semua field di dalamnya?')) {
            setSections(prev => prev.filter(s => s.id !== sectionId));
        }
    };

    const moveSection = (index: number, direction: -1 | 1) => {
        setSections(prev => {
            const arr = [...prev];
            const newIndex = index + direction;
            if (newIndex < 0 || newIndex >= arr.length) return arr;
            [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
            return arr.map((s, i) => ({ ...s, order_index: i }));
        });
    };

    const toggleSectionCollapse = (sectionId: string | number) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) next.delete(sectionId);
            else next.add(sectionId);
            return next;
        });
    };

    // ────── Field Handlers ──────

    const addField = (sectionId: string | number, fieldType: string = 'text') => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                fields: [...s.fields, {
                    id: genTempId(),
                    code: '',
                    label: `Field baru`,
                    hint_text: '',
                    unit: '',
                    field_type: fieldType,
                    config: {},
                    validation_rules: {},
                    warning_rules: {},
                    parent_field_id: null,
                    show_when: {},
                    layout_group: '',
                    layout_width: 12,
                    is_required: false,
                    order_index: s.fields.length,
                    is_active: true,
                }],
            };
        }));
    };

    const updateField = (sectionId: string | number, fieldId: string | number, key: keyof FieldData, value: any) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                fields: s.fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f),
            };
        }));
    };

    const removeField = (sectionId: string | number, fieldId: string | number) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return { ...s, fields: s.fields.filter(f => f.id !== fieldId) };
        }));
    };

    const moveField = (sectionId: string | number, fieldIndex: number, direction: -1 | 1) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const arr = [...s.fields];
            const newIndex = fieldIndex + direction;
            if (newIndex < 0 || newIndex >= arr.length) return s;
            [arr[fieldIndex], arr[newIndex]] = [arr[newIndex], arr[fieldIndex]];
            return { ...s, fields: arr.map((f, i) => ({ ...f, order_index: i })) };
        }));
    };

    const duplicateField = (sectionId: string | number, field: FieldData) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            const newField: FieldData = {
                ...field,
                id: genTempId(),
                label: `${field.label} (Salinan)`,
                code: field.code ? `${field.code}_copy` : '',
                parent_field_id: null,
                show_when: {},
                order_index: s.fields.length,
            };
            return { ...s, fields: [...s.fields, newField] };
        }));
    };

    // ────── Save ──────

    const handleSave = () => {
        setSaving(true);
        const payload = {
            sections: sections.map((s, si) => ({
                id: s.id,
                title: s.title,
                description: s.description || null,
                order_index: si,
                fields: s.fields.map((f, fi) => ({
                    id: f.id,
                    code: f.code || null,
                    label: f.label,
                    hint_text: f.hint_text || null,
                    unit: f.unit || null,
                    field_type: f.field_type,
                    config: Object.keys(f.config || {}).length > 0 ? f.config : null,
                    validation_rules: Object.keys(f.validation_rules || {}).length > 0 ? f.validation_rules : null,
                    warning_rules: Object.keys(f.warning_rules || {}).length > 0 ? f.warning_rules : null,
                    parent_field_id: f.parent_field_id || null,
                    show_when: Object.keys(f.show_when || {}).length > 0 ? f.show_when : null,
                    layout_group: f.layout_group || null,
                    layout_width: f.layout_width,
                    is_required: f.is_required,
                    order_index: fi,
                })),
            })),
        };

        router.post(route('admin.templates.builder.save', template.id), payload, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    // ────── Options Editor for radio/select/multiselect/checkbox_group ──────

    const OptionsEditor = ({ field, sectionId }: { field: FieldData; sectionId: string | number }) => {
        const options: { value: string; label: string }[] = field.config?.options || [];

        const setOptions = (newOptions: { value: string; label: string }[]) => {
            updateField(sectionId, field.id, 'config', { ...field.config, options: newOptions });
        };

        return (
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Opsi Pilihan</label>
                {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                        <input type="text" placeholder="value" value={opt.value}
                            onChange={e => {
                                const updated = [...options];
                                updated[i] = { ...updated[i], value: e.target.value };
                                setOptions(updated);
                            }}
                            className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono outline-none focus:border-indigo-500 transition-all" />
                        <input type="text" placeholder="Label" value={opt.label}
                            onChange={e => {
                                const updated = [...options];
                                updated[i] = { ...updated[i], label: e.target.value };
                                setOptions(updated);
                            }}
                            className="flex-1 px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all" />
                        <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))}
                            className="text-rose-400 hover:text-rose-600 transition-colors cursor-pointer">
                            <Trash2 className="size-3.5" />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={() => setOptions([...options, { value: '', label: '' }])}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer flex items-center gap-1">
                    <Plus className="size-3" /> Tambah Opsi
                </button>
            </div>
        );
    };

    // ────── Warning Rules Editor ──────

    const WarningEditor = ({ field, sectionId }: { field: FieldData; sectionId: string | number }) => {
        const rules = field.warning_rules || {};
        const isNumeric = ['number', 'decimal', 'range_slider'].includes(field.field_type);
        const hasOptions = ['radio', 'select', 'pass_fail'].includes(field.field_type);
        const isBool = field.field_type === 'boolean';

        const setRule = (key: string, value: any) => {
            const updated = { ...rules };
            if (value === '' || value === null || value === undefined) {
                delete updated[key];
            } else {
                updated[key] = value;
            }
            updateField(sectionId, field.id, 'warning_rules', updated);
        };

        return (
            <div className="space-y-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Aturan Peringatan</span>
                </div>

                {isNumeric && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Warning jika di bawah</label>
                            <input type="number" step="any" value={rules.warning_below ?? ''}
                                onChange={e => setRule('warning_below', e.target.value ? parseFloat(e.target.value) : '')}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-amber-500 transition-all" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Warning jika di atas</label>
                            <input type="number" step="any" value={rules.warning_above ?? ''}
                                onChange={e => setRule('warning_above', e.target.value ? parseFloat(e.target.value) : '')}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-amber-500 transition-all" />
                        </div>
                    </div>
                )}

                {hasOptions && (
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-medium">Warning jika nilai termasuk (pisahkan koma)</label>
                        <input type="text" value={(rules.warning_if_value_in || []).join(', ')}
                            onChange={e => setRule('warning_if_value_in', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                            placeholder="trouble, rusak"
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-amber-500 transition-all" />
                    </div>
                )}

                {isBool && (
                    <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-medium">Warning jika nilai</label>
                        <select value={rules.warning_if_value !== undefined ? String(rules.warning_if_value) : ''}
                            onChange={e => setRule('warning_if_value', e.target.value === '' ? '' : e.target.value === 'true')}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-amber-500 transition-all">
                            <option value="">— Tidak ada —</option>
                            <option value="true">Ya (true)</option>
                            <option value="false">Tidak (false)</option>
                        </select>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Pesan peringatan kustom</label>
                    <input type="text" value={rules.warning_message || ''}
                        onChange={e => setRule('warning_message', e.target.value)}
                        placeholder="Nilai di luar batas aman"
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-amber-500 transition-all" />
                </div>
            </div>
        );
    };

    // ────── Conditional Visibility Editor ──────

    const ConditionalEditor = ({ field, sectionId }: { field: FieldData; sectionId: string | number }) => {
        const showWhen = field.show_when || {};
        const hasCondition = !!field.parent_field_id;

        // Only show fields from the SAME section that come before this field as potential parents
        const currentSection = sections.find(s => s.id === sectionId);
        const potentialParents = currentSection?.fields.filter(f => f.id !== field.id) || [];

        const setParent = (parentId: string) => {
            updateField(sectionId, field.id, 'parent_field_id', parentId || null);
            if (!parentId) {
                updateField(sectionId, field.id, 'show_when', {});
            }
        };

        const setShowWhen = (key: string, value: any) => {
            updateField(sectionId, field.id, 'show_when', { ...showWhen, [key]: value });
        };

        return (
            <div className="space-y-3 p-3 bg-sky-50/50 dark:bg-sky-950/10 border border-sky-200/50 dark:border-sky-900/30 rounded-lg">
                <div className="flex items-center gap-1.5">
                    <Eye className="size-3.5 text-sky-600" />
                    <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">Kondisi Tampil</span>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-medium">Field Induk (Parent)</label>
                    <select value={String(field.parent_field_id || '')} onChange={e => setParent(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-sky-500 transition-all">
                        <option value="">— Tidak ada (selalu tampil) —</option>
                        {potentialParents.map(pf => (
                            <option key={String(pf.id)} value={String(pf.id)}>
                                {pf.label} ({pf.field_type})
                            </option>
                        ))}
                    </select>
                </div>

                {hasCondition && (
                    <>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 font-medium">Operator</label>
                            <select value={showWhen.operator || 'equals'} onChange={e => setShowWhen('operator', e.target.value)}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-sky-500 transition-all">
                                <option value="equals">Sama dengan (equals)</option>
                                <option value="not_equals">Tidak sama dengan (not_equals)</option>
                                <option value="in">Termasuk dalam (in)</option>
                                <option value="not_in">Tidak termasuk (not_in)</option>
                                <option value="truthy">Bernilai benar (truthy)</option>
                                <option value="falsy">Bernilai salah (falsy)</option>
                                <option value="gte">Lebih besar sama (≥)</option>
                                <option value="lte">Lebih kecil sama (≤)</option>
                            </select>
                        </div>
                        {!['truthy', 'falsy'].includes(showWhen.operator || 'equals') && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-slate-500 font-medium">Nilai pemicu</label>
                                <input type="text" value={Array.isArray(showWhen.value) ? showWhen.value.join(', ') : (showWhen.value ?? '')}
                                    onChange={e => {
                                        const op = showWhen.operator || 'equals';
                                        if (op === 'in' || op === 'not_in') {
                                            setShowWhen('value', e.target.value.split(',').map(v => v.trim()).filter(Boolean));
                                        } else {
                                            setShowWhen('value', e.target.value);
                                        }
                                    }}
                                    placeholder={(['in', 'not_in'].includes(showWhen.operator || 'equals')) ? 'val1, val2' : 'yes'}
                                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-sky-500 transition-all" />
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    // ────────────── Render ──────────────

    return (
        <AuthenticatedLayout>
            <Head title={`Builder: ${template.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.visit(route('admin.templates.index'))}
                            className="size-9 border-slate-200 dark:border-slate-800 shrink-0">
                            <ArrowLeft className="size-4" />
                        </Button>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight">{template.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                                v{template.version} • {template.equipment_type?.display_name} • {template.qc_type}
                                {template.is_published && <span className="text-emerald-600 dark:text-emerald-400 ml-2 font-semibold">● Published</span>}
                            </p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 gap-2">
                        <Save className="size-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Struktur'}
                    </Button>
                </div>

                {/* Builder Canvas */}
                <div className="space-y-4">
                    {sections.map((section, sectionIndex) => {
                        const isCollapsed = collapsedSections.has(section.id);
                        return (
                            <div key={String(section.id)}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                                {/* Section Header */}
                                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                                    <button onClick={() => toggleSectionCollapse(section.id)}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                                        <ChevronRight className={cn("size-4 transition-transform", !isCollapsed && "rotate-90")} />
                                    </button>
                                    <Layers className="size-4 text-indigo-500 shrink-0" />
                                    <input type="text" value={section.title}
                                        onChange={e => updateSection(section.id, 'title', e.target.value)}
                                        className="flex-1 bg-transparent text-sm font-bold text-slate-900 dark:text-white outline-none placeholder-slate-400"
                                        placeholder="Nama Seksi" />
                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">{section.fields.length} field</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => moveSection(sectionIndex, -1)} disabled={sectionIndex === 0}
                                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                            <ChevronUp className="size-3.5" />
                                        </button>
                                        <button onClick={() => moveSection(sectionIndex, 1)} disabled={sectionIndex === sections.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                            <ChevronDown className="size-3.5" />
                                        </button>
                                        <button onClick={() => removeSection(section.id)}
                                            className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer ml-1">
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Section Description */}
                                {!isCollapsed && (
                                    <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800/50">
                                        <input type="text" value={section.description}
                                            onChange={e => updateSection(section.id, 'description', e.target.value)}
                                            className="w-full bg-transparent text-xs text-slate-500 outline-none placeholder-slate-400"
                                            placeholder="Deskripsi seksi (opsional)..." />
                                    </div>
                                )}

                                {/* Fields */}
                                {!isCollapsed && (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {section.fields.map((field, fieldIndex) => {
                                            const isExpanded = expandedField === String(field.id);
                                            const hasOptions = ['radio', 'select', 'multiselect', 'checkbox_group'].includes(field.field_type);
                                            const fieldTypeLabel = getFieldTypeLabel(field.field_type);

                                            return (
                                                <div key={String(field.id)} className="group">
                                                    {/* Field Row */}
                                                    <div className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors">
                                                        <GripVertical className="size-4 text-slate-300 dark:text-slate-700 shrink-0" />

                                                        {/* Field type badge */}
                                                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap shrink-0">
                                                            {fieldTypeLabel}
                                                        </span>

                                                        {/* Label */}
                                                        <input type="text" value={field.label}
                                                            onChange={e => updateField(section.id, field.id, 'label', e.target.value)}
                                                            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder-slate-400 min-w-0"
                                                            placeholder="Label field" />

                                                        {/* Badges */}
                                                        {field.is_required && (
                                                            <span className="text-[9px] text-rose-500 font-bold shrink-0">WAJIB</span>
                                                        )}
                                                        {field.parent_field_id && (
                                                            <span title="Conditional"><Eye className="size-3 text-sky-500 shrink-0" /></span>
                                                        )}
                                                        {Object.keys(field.warning_rules || {}).length > 0 && (
                                                            <span title="Warning rules"><AlertTriangle className="size-3 text-amber-500 shrink-0" /></span>
                                                        )}

                                                        {/* Actions */}
                                                        <div className="flex gap-0.5 shrink-0">
                                                            <button onClick={() => setExpandedField(isExpanded ? null : String(field.id))}
                                                                className={cn("p-1 transition-colors cursor-pointer rounded", isExpanded ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" : "text-slate-400 hover:text-slate-600")}>
                                                                <Settings2 className="size-3.5" />
                                                            </button>
                                                            <button onClick={() => duplicateField(section.id, field)}
                                                                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                                                <Copy className="size-3.5" />
                                                            </button>
                                                            <button onClick={() => moveField(section.id, fieldIndex, -1)} disabled={fieldIndex === 0}
                                                                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                                                <ChevronUp className="size-3.5" />
                                                            </button>
                                                            <button onClick={() => moveField(section.id, fieldIndex, 1)} disabled={fieldIndex === section.fields.length - 1}
                                                                className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-not-allowed">
                                                                <ChevronDown className="size-3.5" />
                                                            </button>
                                                            <button onClick={() => removeField(section.id, field.id)}
                                                                className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer">
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Field Config Panel */}
                                                    {isExpanded && (
                                                        <div className="px-5 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/50">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                                                {/* Left Column: Basic Config */}
                                                                <div className="space-y-3">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kode Internal</label>
                                                                            <input type="text" value={field.code}
                                                                                onChange={e => updateField(section.id, field.id, 'code', e.target.value)}
                                                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs font-mono outline-none focus:border-indigo-500 transition-all"
                                                                                placeholder="kvp_value" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipe Field</label>
                                                                            <select value={field.field_type}
                                                                                onChange={e => updateField(section.id, field.id, 'field_type', e.target.value)}
                                                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all">
                                                                                {fieldTypeOptions.map(o => (
                                                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                                                ))}
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hint / Petunjuk</label>
                                                                        <input type="text" value={field.hint_text}
                                                                            onChange={e => updateField(section.id, field.id, 'hint_text', e.target.value)}
                                                                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all"
                                                                            placeholder="Petunjuk pengisian..." />
                                                                    </div>

                                                                    <div className="grid grid-cols-3 gap-3">
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Satuan</label>
                                                                            <input type="text" value={field.unit}
                                                                                onChange={e => updateField(section.id, field.id, 'unit', e.target.value)}
                                                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all"
                                                                                placeholder="mGy" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lebar (1-12)</label>
                                                                            <input type="number" min={1} max={12} value={field.layout_width}
                                                                                onChange={e => updateField(section.id, field.id, 'layout_width', parseInt(e.target.value) || 12)}
                                                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Layout Group</label>
                                                                            <input type="text" value={field.layout_group}
                                                                                onChange={e => updateField(section.id, field.id, 'layout_group', e.target.value)}
                                                                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500 transition-all"
                                                                                placeholder="row_1" />
                                                                        </div>
                                                                    </div>

                                                                    {/* Required toggle */}
                                                                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-lg">
                                                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Wajib diisi</span>
                                                                        <input type="checkbox" checked={field.is_required}
                                                                            onChange={e => updateField(section.id, field.id, 'is_required', e.target.checked)}
                                                                            className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                                                                    </div>

                                                                    {/* Options editor */}
                                                                    {hasOptions && <OptionsEditor field={field} sectionId={section.id} />}
                                                                </div>

                                                                {/* Right Column: Warning & Conditional */}
                                                                <div className="space-y-3">
                                                                    <WarningEditor field={field} sectionId={section.id} />
                                                                    <ConditionalEditor field={field} sectionId={section.id} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Add Field */}
                                        <div className="px-5 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                {['text', 'number', 'boolean', 'radio', 'date', 'pass_fail', 'section_header'].map(ft => (
                                                    <button key={ft} onClick={() => addField(section.id, ft)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-md transition-all cursor-pointer uppercase tracking-wider">
                                                        <Plus className="size-3" />
                                                        {getFieldTypeLabel(ft)}
                                                    </button>
                                                ))}
                                                <select onChange={e => { if (e.target.value) { addField(section.id, e.target.value); e.target.value = ''; } }}
                                                    className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md cursor-pointer outline-none uppercase tracking-wider"
                                                    defaultValue="">
                                                    <option value="" disabled>+ Tipe lainnya...</option>
                                                    {fieldTypeOptions.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add Section Button */}
                    <button onClick={addSection}
                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-all cursor-pointer flex items-center justify-center gap-2">
                        <Plus className="size-4" />
                        Tambah Seksi Baru
                    </button>
                </div>

                {/* Bottom Save Bar */}
                <div className="sticky bottom-6 flex justify-end">
                    <Button onClick={handleSave} disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 gap-2 h-11 px-6">
                        <Save className="size-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Struktur Form'}
                    </Button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
