import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    Calendar, 
    AlertTriangle, 
    Save, 
    Send, 
    Info, 
    Building, 
    FileText,
    X,
    Plus,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare const route: any;

interface Option {
    value: string;
    label: string;
}

interface FormFieldConfig {
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    options?: (string | Option)[];
    columns?: string[];
}

interface FormField {
    id: number;
    form_template_id: number;
    form_section_id: number;
    code: string;
    label: string;
    hint_text: string | null;
    unit: string | null;
    field_type: string;
    config: FormFieldConfig | null;
    validation_rules: any | null;
    warning_rules: any | null;
    parent_field_id: number | null;
    show_when: any | null;
    layout_group: string | null;
    layout_width: number | null;
    is_required: boolean;
    order_index: number;
    is_active: boolean;
}

interface FormSection {
    id: number;
    title: string;
    description: string | null;
    order_index: number;
    hidden_by_default?: boolean;
    fields: FormField[];
}

interface FormTemplate {
    id: number;
    name: string;
    description: string;
    qc_type: string;
    sections: FormSection[];
}

interface EquipmentUnit {
    id: number;
    name: string;
    asset_code: string;
    ruangan: string;
    merk: string;
    model: string;
}

interface SubmitProps {
    equipmentUnit: EquipmentUnit;
    template: FormTemplate;
    qcType: string;
}

export default function Submit({ equipmentUnit, template, qcType }: SubmitProps) {
    const today = new Date().toISOString().split('T')[0];

    // Initialize form answers
    const initialAnswers: Record<number, any> = {};
    template.sections.forEach(section => {
        section.fields.forEach(field => {
            if (field.field_type !== 'section_header' && field.field_type !== 'info_text') {
                if (field.field_type === 'boolean' || field.field_type === 'pass_fail') {
                    initialAnswers[field.id] = null;
                } else if (field.field_type === 'range_slider') {
                    initialAnswers[field.id] = field.config?.min ?? 0;
                } else if (field.field_type === 'multiselect' || field.field_type === 'checkbox_group' || field.field_type === 'table') {
                    initialAnswers[field.id] = [];
                } else {
                    initialAnswers[field.id] = '';
                }
            }
        });
    });

    const { data, setData, processing } = useForm({
        form_template_id: template.id,
        equipment_unit_id: equipmentUnit.id,
        qc_type: qcType,
        submission_date: today,
        answers: initialAnswers,
        catatan_masalah: '',
        submit: false,
    });

    // Track active status for optional sections (hidden by default)
    const [activeOptionalSections, setActiveOptionalSections] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        template.sections.forEach(section => {
            if (section.hidden_by_default) {
                initial[section.id] = false;
            } else {
                initial[section.id] = true;
            }
        });
        return initial;
    });

    const [optionalSearch, setOptionalSearch] = useState('');

    const handleRemoveOptionalSection = (sectionId: number) => {
        setActiveOptionalSections(prev => ({
            ...prev,
            [sectionId]: false
        }));
        
        // Reset answer values for all fields in this section
        const section = template.sections.find(s => s.id === sectionId);
        if (section) {
            const nextAnswers = { ...data.answers };
            section.fields.forEach(field => {
                let resetVal: any = '';
                if (field.field_type === 'boolean' || field.field_type === 'pass_fail') {
                    resetVal = null;
                } else if (field.field_type === 'range_slider') {
                    resetVal = field.config?.min ?? 0;
                } else if (field.field_type === 'multiselect' || field.field_type === 'checkbox_group' || field.field_type === 'table') {
                    resetVal = [];
                }
                nextAnswers[field.id] = resetVal;
            });
            setData('answers', nextAnswers);
        }
    };

    const handleAddOptionalSection = (sectionId: number) => {
        setActiveOptionalSections(prev => ({
            ...prev,
            [sectionId]: true
        }));
    };

    const handleAnswerChange = (fieldId: number, val: any) => {
        setData('answers', {
            ...data.answers,
            [fieldId]: val
        });
    };

    // Evaluator for conditional fields
    const evaluateConditional = (showWhen: any, parentValue: any): boolean => {
        if (!showWhen) return true;
        
        let operator = showWhen.operator;
        let expected = showWhen.value;

        // Support {"equals": "value"} shorthand
        if (!operator && !expected) {
            const keys = Object.keys(showWhen);
            if (keys.length > 0) {
                operator = keys[0];
                expected = showWhen[keys[0]];
            }
        }

        if (!operator) operator = 'equals';

        switch (operator) {
            case 'equals':
                return String(parentValue) === String(expected);
            case 'not_equals':
                return String(parentValue) !== String(expected);
            case 'in':
                return Array.isArray(expected) && expected.map(String).includes(String(parentValue));
            case 'not_in':
                return Array.isArray(expected) && !expected.map(String).includes(String(parentValue));
            case 'truthy':
                return !!parentValue && parentValue !== 'false' && parentValue !== '0';
            case 'falsy':
                return !parentValue || parentValue === 'false' || parentValue === '0';
            case 'gte':
                return typeof parentValue !== 'undefined' && parentValue !== null && parseFloat(parentValue) >= parseFloat(expected);
            case 'lte':
                return typeof parentValue !== 'undefined' && parentValue !== null && parseFloat(parentValue) <= parseFloat(expected);
            case 'gt':
                return typeof parentValue !== 'undefined' && parentValue !== null && parseFloat(parentValue) > parseFloat(expected);
            case 'lt':
                return typeof parentValue !== 'undefined' && parentValue !== null && parseFloat(parentValue) < parseFloat(expected);
            default:
                return true;
        }
    };

    const allFields = template.sections.flatMap(s => s.fields);

    const shouldShowField = (field: FormField): boolean => {
        if (!activeOptionalSections[field.form_section_id]) {
            return false;
        }
        if (!field.parent_field_id) {
            return true;
        }
        const parent = allFields.find(f => f.id === field.parent_field_id);
        if (!parent) {
            return true;
        }
        if (!shouldShowField(parent)) {
            return false;
        }
        const parentValue = data.answers[parent.id];
        return evaluateConditional(field.show_when, parentValue);
    };

    // Evaluator for warnings
    const evaluateWarning = (warningRules: any, val: any): { has_warning: boolean; message: string | null } => {
        if (!warningRules || Object.keys(warningRules).length === 0) {
            return { has_warning: false, message: null };
        }

        let triggered = false;
        const reasons: string[] = [];
        const isNumeric = (n: any) => !isNaN(parseFloat(n)) && isFinite(n);

        // 1) Numeric thresholds
        if (warningRules.hasOwnProperty('warning_below') && isNumeric(val)) {
            if (parseFloat(val) < parseFloat(warningRules.warning_below)) {
                triggered = true;
                reasons.push(`Nilai di bawah batas minimum (${warningRules.warning_below})`);
            }
        }

        if (warningRules.hasOwnProperty('warning_above') && isNumeric(val)) {
            if (parseFloat(val) > parseFloat(warningRules.warning_above)) {
                triggered = true;
                reasons.push(`Nilai di atas batas maksimum (${warningRules.warning_above})`);
            }
        }

        // 2) Exact-match
        if (warningRules.hasOwnProperty('warning_if_value')) {
            const expected = warningRules.warning_if_value;
            const valBoolOrStr = typeof expected === 'boolean' 
                ? !!val === expected 
                : String(val) === String(expected);
            if (valBoolOrStr) {
                triggered = true;
                reasons.push('Nilai memicu peringatan');
            }
        }

        // 3) Value in set
        if (warningRules.hasOwnProperty('warning_if_value_in') && Array.isArray(warningRules.warning_if_value_in)) {
            const set = warningRules.warning_if_value_in.map((v: any) => String(v));
            const needle = String(val);
            if (set.includes(needle)) {
                triggered = true;
                reasons.push('Pilihan memicu peringatan');
            }
        }

        if (warningRules.hasOwnProperty('warning_if_value_not_in') && Array.isArray(warningRules.warning_if_value_not_in)) {
            const set = warningRules.warning_if_value_not_in.map((v: any) => String(v));
            const needle = String(val);
            if (!set.includes(needle)) {
                triggered = true;
                reasons.push('Nilai tidak termasuk dalam pilihan yang diharapkan');
            }
        }

        // 4) Empty
        if (warningRules.warning_if_empty && (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0))) {
            triggered = true;
            reasons.push('Wajib diisi');
        }

        // 5) Date past due
        if (warningRules.warning_if_past_due && val) {
            try {
                const d = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (d < today) {
                    triggered = true;
                    reasons.push('Tanggal sudah lewat dari hari ini');
                }
            } catch (e) {
                // ignore
            }
        }

        if (!triggered) {
            return { has_warning: false, message: null };
        }

        const message = warningRules.warning_message || reasons.join('; ');
        return { has_warning: true, message };
    };

    // Calculate active warning counts
    const activeWarnings = allFields.filter(field => {
        if (!shouldShowField(field)) return false;
        const val = data.answers[field.id];
        return evaluateWarning(field.warning_rules, val).has_warning;
    });

    const activeWarningsCount = activeWarnings.length;

    const handleSubmit = (isSubmit: boolean) => {
        // Inertia useForm allows passing values to options or we can call post
        // Wait, we need to make sure the submit boolean is sent correctly
        const updatedData = { ...data, submit: isSubmit };
        
        // We set the field locally first to make sure it's correct
        setData('submit', isSubmit);
        
        // In useForm, setting data is async, so we pass the updated payload directly to post
        router.post(route('qc.store'), updatedData as any);
    };

    const renderInputField = (field: FormField) => {
        const val = data.answers[field.id];
        const warning = evaluateWarning(field.warning_rules, val);

        switch (field.field_type) {
            case 'text':
                return (
                    <input
                        type="text"
                        value={val ?? ''}
                        onChange={e => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.config?.placeholder || 'Ketik jawaban...'}
                        className={cn(
                            "w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-sm placeholder-slate-400 outline-none focus:ring-2 transition-all",
                            warning.has_warning 
                                ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/10" 
                                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                        )}
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={val ?? ''}
                        onChange={e => handleAnswerChange(field.id, e.target.value)}
                        placeholder={field.config?.placeholder || 'Ketik catatan lengkap...'}
                        rows={3}
                        className={cn(
                            "w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-sm placeholder-slate-400 outline-none focus:ring-2 transition-all",
                            warning.has_warning 
                                ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/10" 
                                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                        )}
                    />
                );

            case 'number':
            case 'decimal':
                return (
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            step={field.config?.step || (field.field_type === 'decimal' ? '0.1' : '1')}
                            min={field.config?.min}
                            max={field.config?.max}
                            value={val ?? ''}
                            onChange={e => handleAnswerChange(field.id, e.target.value === '' ? '' : parseFloat(e.target.value))}
                            placeholder={field.config?.placeholder || '0'}
                            className={cn(
                                "flex-1 px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-sm placeholder-slate-400 outline-none focus:ring-2 transition-all",
                                warning.has_warning 
                                    ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/10" 
                                    : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                            )}
                        />
                        {field.unit && (
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-lg">
                                {field.unit}
                            </span>
                        )}
                    </div>
                );

            case 'radio':
                return (
                    <div className="flex flex-wrap gap-2">
                        {field.config?.options?.map((opt: any, idx: number) => {
                            const optVal = typeof opt === 'object' ? opt.value : opt;
                            const optLbl = typeof opt === 'object' ? opt.label : opt;
                            const isSelected = val === optVal;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAnswerChange(field.id, optVal)}
                                    className={cn(
                                        "px-4 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 text-center select-none",
                                        isSelected
                                            ? warning.has_warning
                                                ? "bg-amber-500 border-transparent text-white shadow-xs"
                                                : "bg-indigo-600 border-transparent text-white shadow-xs"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    )}
                                >
                                    {optLbl}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'boolean':
                return (
                    <div className="flex gap-2">
                        {[
                            { value: true, label: 'Ya' },
                            { value: false, label: 'Tidak' }
                        ].map((opt, idx) => {
                            const isSelected = val === opt.value;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAnswerChange(field.id, opt.value)}
                                    className={cn(
                                        "px-4 py-2 border rounded-lg text-xs font-semibold transition-all cursor-pointer flex-1 text-center select-none",
                                        isSelected
                                            ? warning.has_warning
                                                ? "bg-amber-500 border-transparent text-white"
                                                : "bg-indigo-600 border-transparent text-white"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'pass_fail':
                return (
                    <div className="flex gap-2">
                        {[
                            { value: true, label: 'PASS' },
                            { value: false, label: 'FAIL' }
                        ].map((opt, idx) => {
                            const isSelected = val === opt.value;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAnswerChange(field.id, opt.value)}
                                    className={cn(
                                        "px-4 py-2 border rounded-lg text-xs font-bold tracking-wider transition-all cursor-pointer flex-1 text-center select-none",
                                        isSelected
                                            ? opt.value
                                                ? "bg-emerald-600 border-transparent text-white shadow-md shadow-emerald-500/10"
                                                : "bg-rose-600 border-transparent text-white shadow-md shadow-rose-500/10"
                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                );

            case 'select':
                return (
                    <select
                        value={val ?? ''}
                        onChange={e => handleAnswerChange(field.id, e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-sm outline-none focus:ring-2 transition-all",
                            warning.has_warning 
                                ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/10" 
                                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                        )}
                    >
                        <option value="">-- Pilih --</option>
                        {field.config?.options?.map((opt: any, idx: number) => {
                            const optVal = typeof opt === 'object' ? opt.value : opt;
                            const optLbl = typeof opt === 'object' ? opt.label : opt;
                            return (
                                <option key={idx} value={optVal}>{optLbl}</option>
                            );
                        })}
                    </select>
                );

            case 'date':
            case 'time':
            case 'datetime':
                return (
                    <input
                        type={field.field_type === 'datetime' ? 'datetime-local' : field.field_type}
                        value={val ?? ''}
                        onChange={e => handleAnswerChange(field.id, e.target.value)}
                        className={cn(
                            "w-full px-3 py-2 bg-white dark:bg-slate-950 border rounded-lg text-sm outline-none focus:ring-2 transition-all",
                            warning.has_warning 
                                ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500/10" 
                                : "border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                        )}
                    />
                );

            case 'range_slider':
                const sliderMin = field.config?.min ?? 0;
                const sliderMax = field.config?.max ?? 100;
                const sliderStep = field.config?.step ?? 1;
                return (
                    <div className="space-y-2 py-1">
                        <input
                            type="range"
                            min={sliderMin}
                            max={sliderMax}
                            step={sliderStep}
                            value={val ?? sliderMin}
                            onChange={e => handleAnswerChange(field.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                            <span>{sliderMin} {field.unit}</span>
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                                {val ?? sliderMin} {field.unit}
                            </span>
                            <span>{sliderMax} {field.unit}</span>
                        </div>
                    </div>
                );

            case 'file_upload':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                id={`file-${field.id}`}
                                className="hidden"
                                onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        handleAnswerChange(field.id, `/uploads/qc/${file.name}`);
                                    }
                                }}
                            />
                            <label
                                htmlFor={`file-${field.id}`}
                                className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg text-xs font-bold cursor-pointer transition-all select-none"
                            >
                                Pilih Berkas
                            </label>
                            <span className="text-xs text-slate-500 truncate max-w-xs">
                                {val ? val.replace('/uploads/qc/', '') : 'Belum ada berkas dipilih'}
                            </span>
                        </div>
                    </div>
                );

            case 'signature':
                return (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950">
                        <div className="bg-slate-50 dark:bg-slate-900 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanda Tangan Digital</span>
                            {val && (
                                <button
                                    type="button"
                                    onClick={() => handleAnswerChange(field.id, '')}
                                    className="text-xs font-semibold text-rose-500 hover:underline"
                                >
                                    Hapus
                                </button>
                            )}
                        </div>
                        <div className="p-3">
                            {val ? (
                                <div className="h-16 flex items-center justify-center font-serif text-2xl italic select-none text-slate-800 dark:text-slate-200 border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg">
                                    {val.replace('sig:', '')}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Ketik nama Anda sebagai tanda tangan..."
                                    onChange={e => handleAnswerChange(field.id, e.target.value ? `sig:${e.target.value}` : '')}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm italic placeholder-slate-350 outline-none focus:border-indigo-500 transition-all font-serif"
                                />
                            )}
                        </div>
                    </div>
                );

            case 'table':
                const columns = field.config?.columns || ['Parameter', 'Target', 'Hasil'];
                const currentTableData = Array.isArray(val) ? val : [{}];

                const addRow = () => {
                    handleAnswerChange(field.id, [...currentTableData, {}]);
                };

                const deleteRow = (rowIndex: number) => {
                    const next = currentTableData.filter((_: any, idx: number) => idx !== rowIndex);
                    handleAnswerChange(field.id, next.length > 0 ? next : [{}]);
                };

                const updateCell = (rowIndex: number, colKey: string, cellVal: string) => {
                    const next = currentTableData.map((row: any, idx: number) => {
                        if (idx === rowIndex) {
                            return { ...row, [colKey]: cellVal };
                        }
                        return row;
                    });
                    handleAnswerChange(field.id, next);
                };

                return (
                    <div className="space-y-3">
                        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs bg-white dark:bg-slate-950">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                        {columns.map((col: any, colIdx: number) => {
                                            const colLbl = typeof col === 'object' ? col.label : col;
                                            return (
                                                <th key={colIdx} className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{colLbl}</th>
                                            );
                                        })}
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {currentTableData.map((row: any, rowIndex: number) => (
                                        <tr key={rowIndex}>
                                            {columns.map((col: any, colIndex: number) => {
                                                const key = typeof col === 'object' ? col.key : col;
                                                return (
                                                    <td key={colIndex} className="p-2">
                                                        <input
                                                            type="text"
                                                            value={row[key] ?? ''}
                                                            onChange={e => updateCell(rowIndex, key, e.target.value)}
                                                            className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded outline-none focus:border-indigo-500 text-xs"
                                                            placeholder="..."
                                                        />
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    disabled={currentTableData.length <= 1}
                                                    onClick={() => deleteRow(rowIndex)}
                                                    className="text-slate-400 hover:text-rose-500 text-base font-bold disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            type="button"
                            onClick={addRow}
                            className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            + Tambah Baris
                        </button>
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        value={val ?? ''}
                        onChange={e => handleAnswerChange(field.id, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm"
                    />
                );
        }
    };

    const renderField = (field: FormField) => {
        const val = data.answers[field.id];
        const warning = evaluateWarning(field.warning_rules, val);

        if (field.field_type === 'section_header') {
            return (
                <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-850 mt-4 first:mt-0">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{field.label}</h4>
                    {field.hint_text && <p className="text-xs text-slate-500 mt-0.5">{field.hint_text}</p>}
                </div>
            );
        }

        if (field.field_type === 'info_text') {
            return (
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 text-xs text-blue-700 dark:text-blue-400 my-2">
                    <Info className="size-4 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold">{field.label}</p>
                        {field.hint_text && <p className="mt-0.5 opacity-90">{field.hint_text}</p>}
                    </div>
                </div>
            );
        }

        return (
            <div className={cn(
                "space-y-1.5 p-4 rounded-xl border transition-all duration-300",
                warning.has_warning 
                    ? "bg-amber-500/[0.02] border-amber-500/30 shadow-xs" 
                    : "bg-transparent border-transparent"
            )}>
                <label className="flex items-center justify-between gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    <span className="flex items-center gap-1.5">
                        {field.label}
                        {field.is_required && (
                            <span className="text-rose-500" title="Wajib diisi">*</span>
                        )}
                    </span>
                </label>

                {renderInputField(field)}

                {field.hint_text && !warning.has_warning && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight">{field.hint_text}</p>
                )}

                {warning.has_warning && (
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-in fade-in duration-300">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>{warning.message}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderFields = (fields: FormField[]) => {
        const elements: React.ReactNode[] = [];
        let currentGroup: FormField[] = [];
        let currentGroupName: string | null = null;

        const flushGroup = () => {
            if (currentGroup.length > 0) {
                elements.push(
                    <div key={`group-${currentGroupName}-${currentGroup[0].id}`} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {currentGroup.map(field => {
                            const width = field.layout_width || 12;
                            const colSpanClass = width === 6 ? "md:col-span-6" : width === 4 ? "md:col-span-4" : width === 3 ? "md:col-span-3" : width === 8 ? "md:col-span-8" : "md:col-span-12";
                            return (
                                <div key={field.id} className={colSpanClass}>
                                    {renderField(field)}
                                </div>
                            );
                        })}
                    </div>
                );
                currentGroup = [];
                currentGroupName = null;
            }
        };

        fields.forEach(field => {
            if (!shouldShowField(field)) {
                return;
            }

            if (field.layout_group) {
                if (currentGroupName && currentGroupName !== field.layout_group) {
                    flushGroup();
                }
                currentGroupName = field.layout_group;
                currentGroup.push(field);
            } else {
                flushGroup();
                elements.push(
                    <div key={field.id} className="w-full">
                        {renderField(field)}
                    </div>
                );
            }
        });

        flushGroup();
        return elements;
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Form QC: ${template.name}`} />

            <div className="space-y-6 max-w-7xl mx-auto pb-20 px-4 md:px-6">
                {/* Header Back & Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href={route('qc.select-unit')} 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase tracking-wider"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Pilih Unit
                        </Link>
                        <h2 className="text-xl font-bold tracking-tight mt-1">{template.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs max-w-2xl">{template.description}</p>
                    </div>
                </div>

                {/* Equipment Unit Meta Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="flex items-start gap-3">
                            <Building className="size-5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peralatan Medis</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{equipmentUnit.name}</p>
                                <p className="text-xs text-slate-500">{equipmentUnit.merk} {equipmentUnit.model}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FileText className="size-5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Aset & Ruang</p>
                                <p className="text-sm font-mono font-medium text-slate-800 dark:text-slate-200">{equipmentUnit.asset_code}</p>
                                <p className="text-xs text-slate-500">{equipmentUnit.ruangan}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Calendar className="size-5 text-slate-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal & Batas Jadwal</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <input 
                                        type="date" 
                                        value={data.submission_date}
                                        onChange={e => setData('submission_date', e.target.value)}
                                        className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5 outline-none font-semibold focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warnings Alert Banner (Dynamic) */}
                {activeWarningsCount > 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                        <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <p className="font-bold">Perhatian: Terdeteksi {activeWarningsCount} Parameter Peringatan (Warning)</p>
                            <p className="mt-0.5 opacity-90">Sistem mendeteksi nilai yang di luar batas toleransi normal. Anda tetap bisa mengajukan hasil ini, status pemeriksaan akan secara otomatis diset ke <span className="font-semibold">"Needs Action"</span> dan memerlukan tinjauan supervisor.</p>
                        </div>
                    </div>
                )}

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Panel: Form Sections and Actions */}
                    <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
                        {/* Form Sections */}
                        <div className="space-y-6">
                            {template.sections.map((section) => {
                                const hasVisibleFields = section.fields.some(shouldShowField);
                                if (!hasVisibleFields) return null;

                                return (
                                    <div 
                                        key={section.id}
                                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs animate-in fade-in duration-300"
                                    >
                                        {/* Section Header */}
                                        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-955 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{section.title}</h3>
                                                {section.description && (
                                                    <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                                )}
                                            </div>
                                            {section.hidden_by_default && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveOptionalSection(section.id)}
                                                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 p-1.5 rounded transition-colors cursor-pointer shrink-0"
                                                    title="Sembunyikan seksi ini"
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Section Fields */}
                                        <div className="p-6 space-y-4">
                                            {renderFields(section.fields)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Catatan Masalah / Tambahan */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-xs">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Catatan Masalah Tambahan (Opsional)</label>
                            <textarea
                                value={data.catatan_masalah}
                                onChange={e => setData('catatan_masalah', e.target.value)}
                                placeholder="Masukkan catatan kendala fisik alat medis jika ada..."
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="text-xs text-slate-400 dark:text-slate-500 text-center sm:text-left">
                                Pastikan semua parameter terisi dengan benar sebelum diajukan.
                            </div>
                            
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    onClick={() => handleSubmit(false)}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 font-semibold cursor-pointer"
                                >
                                    <Save className="size-4" />
                                    Simpan Draft
                                </Button>

                                <Button
                                    type="button"
                                    disabled={processing}
                                    onClick={() => handleSubmit(true)}
                                    className={cn(
                                        "flex-1 sm:flex-initial flex items-center justify-center gap-2 text-white font-semibold cursor-pointer",
                                        activeWarningsCount > 0 
                                            ? "bg-amber-600 hover:bg-amber-500" 
                                            : "bg-indigo-600 hover:bg-indigo-500"
                                    )}
                                >
                                    <Send className="size-4" />
                                    {activeWarningsCount > 0 ? 'Ajukan (Needs Action)' : 'Kirim Pemeriksaan'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Sticky Optional Parameters Card */}
                    <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-4 order-1 lg:order-2">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Parameter Opsional</h3>
                                <p className="text-slate-400 dark:text-slate-500 text-[10px] mt-0.5">Daftar parameter tambahan yang dapat ditambahkan.</p>
                            </div>

                            {/* Search Box */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 size-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari parameter..."
                                    value={optionalSearch}
                                    onChange={e => setOptionalSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Available Optional Sections List */}
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                                {(() => {
                                    const hiddenSections = template.sections.filter(section => 
                                        section.hidden_by_default && 
                                        !activeOptionalSections[section.id] &&
                                        (optionalSearch ? section.title.toLowerCase().includes(optionalSearch.toLowerCase()) : true)
                                    );

                                    if (hiddenSections.length === 0) {
                                        const totalAny = template.sections.some(section => 
                                            section.hidden_by_default && !activeOptionalSections[section.id]
                                        );

                                        if (!totalAny) {
                                            return (
                                                <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-955 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                                    <p className="text-[10px] text-slate-400 font-medium">Semua seksi opsional telah ditambahkan ke form.</p>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div className="text-center py-8">
                                                <p className="text-[10px] text-slate-400 font-medium">Tidak ada hasil cocok.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-1.5">
                                            {hiddenSections.map(section => (
                                                <button
                                                    key={section.id}
                                                    type="button"
                                                    onClick={() => handleAddOptionalSection(section.id)}
                                                    className="w-full flex items-center justify-between text-left p-3 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-955 dark:hover:bg-indigo-950/20 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-150 dark:border-slate-850 rounded-lg text-xs font-bold transition-all group cursor-pointer select-none"
                                                >
                                                    <span className="truncate pr-2">{section.title}</span>
                                                    <Plus className="size-3.5 text-slate-450 group-hover:text-indigo-500 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
