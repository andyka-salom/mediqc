import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle, 
    Clock, 
    Calendar, 
    Building, 
    User, 
    FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

declare const route: any;

interface UserInfo {
    id: string;
    name: string;
    role?: {
        display_name: string;
    } | null;
}

interface FormField {
    id: number;
    code: string;
    label: string;
    hint_text: string | null;
    unit: string | null;
    field_type: string;
    config: any;
    parent_field_id: number | null;
    layout_group: string | null;
    layout_width: number | null;
}

interface FormSection {
    id: number;
    title: string;
    description: string | null;
    order_index: number;
    fields: FormField[];
}

interface FormTemplate {
    id: number;
    name: string;
    description: string;
    sections: FormSection[];
}

interface EquipmentUnit {
    id: number;
    name: string;
    asset_code: string;
    ruangan: string;
    merk: string;
    model: string;
    equipment_type?: {
        display_name: string;
    };
}

interface QcAnswer {
    id: number;
    form_field_id: number;
    field_snapshot_label: string;
    field_snapshot_unit: string | null;
    field_snapshot_type: string;
    value_text: string | null;
    value_numeric: number | null;
    value_boolean: boolean | null;
    value_date: string | null;
    value_time: string | null;
    value_json: any | null;
    file_path: string | null;
    has_warning: boolean;
    warning_message: string | null;
}

interface QcSubmission {
    id: string;
    qc_type: string;
    submission_date: string;
    period_label: string | null;
    overall_status: string;
    warning_count: number;
    catatan_masalah: string | null;
    is_complete: boolean;
    submitted_at: string | null;
    form_template: FormTemplate;
    equipment_unit: EquipmentUnit;
    answers: QcAnswer[];
    submitter: UserInfo;
}

interface ShowProps {
    submission: QcSubmission;
    canEdit: boolean;
}

export default function Show({ submission, canEdit }: ShowProps) {
    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'needs_action':
                return { 
                    label: 'Perlu Tindakan (Ada Peringatan)', 
                    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-500/20',
                    icon: AlertTriangle 
                };
            case 'submitted':
                return { 
                    label: 'Tercatat', 
                    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                    icon: CheckCircle2 
                };
            default:
                return { 
                    label: 'Draft', 
                    bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
                    icon: Clock 
                };
        }
    };

    const formatAnswerValue = (answer: QcAnswer) => {
        const type = answer.field_snapshot_type;

        if (answer.value_numeric !== null) {
            return `${answer.value_numeric} ${answer.field_snapshot_unit || ''}`.trim();
        }

        if (answer.value_boolean !== null) {
            if (type === 'pass_fail') {
                return answer.value_boolean ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="size-3" /> PASS
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                        <X className="size-3" /> FAIL
                    </span>
                );
            }
            return answer.value_boolean ? 'Ya' : 'Tidak';
        }

        if (answer.value_date) {
            return new Date(answer.value_date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        }

        if (answer.value_time) {
            return answer.value_time;
        }

        if (answer.value_json) {
            if (type === 'table') {
                const tableData = answer.value_json;
                if (!Array.isArray(tableData) || tableData.length === 0) return '—';
                const keys = Object.keys(tableData[0]);
                return (
                    <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-lg max-w-full my-2 bg-slate-50 dark:bg-slate-950">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    {keys.map((k, idx) => (
                                        <th key={idx} className="px-3 py-1.5 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">{k}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                {tableData.map((row: any, rIdx: number) => (
                                    <tr key={rIdx}>
                                        {keys.map((k, cIdx) => (
                                            <td key={cIdx} className="px-3 py-1 text-slate-800 dark:text-slate-350">{row[k] ?? '—'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }

            if (Array.isArray(answer.value_json)) {
                return answer.value_json.join(', ');
            }

            return JSON.stringify(answer.value_json);
        }

        if (answer.file_path) {
            if (answer.file_path.startsWith('/uploads/qc/')) {
                return (
                    <a 
                        href="#" 
                        onClick={e => e.preventDefault()}
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        <FileSpreadsheet className="size-4" />
                        {answer.file_path.replace('/uploads/qc/', '')}
                    </a>
                );
            }
            return answer.file_path;
        }

        if (answer.value_text) {
            if (answer.value_text.startsWith('sig:')) {
                return (
                    <span className="font-serif italic text-lg text-slate-700 dark:text-slate-300 border-b border-dashed border-slate-300 dark:border-slate-700 px-2 py-0.5">
                        {answer.value_text.replace('sig:', '')}
                    </span>
                );
            }
            return answer.value_text;
        }

        return '—';
    };

    const statusCfg = getStatusConfig(submission.overall_status);
    const StatusIcon = statusCfg.icon;

    const renderAnswers = (fields: FormField[]) => {
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
                                    {renderFieldDetail(field)}
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
            const answer = submission.answers.find(a => a.form_field_id === field.id);

            if (!answer && field.field_type !== 'section_header' && field.field_type !== 'info_text') {
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
                        {renderFieldDetail(field)}
                    </div>
                );
            }
        });

        flushGroup();
        return elements;
    };

    const renderFieldDetail = (field: FormField) => {
        if (field.field_type === 'section_header') {
            return (
                <div className="pt-4 pb-2 border-b border-slate-100 dark:border-slate-850 mt-4 first:mt-0">
                    <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 uppercase tracking-wider">{field.label}</h4>
                </div>
            );
        }

        if (field.field_type === 'info_text') {
            return null;
        }

        const answer = submission.answers.find(a => a.form_field_id === field.id);
        if (!answer) return null;

        return (
            <div className={cn(
                "p-4 rounded-xl border transition-all duration-300 space-y-1.5",
                answer.has_warning 
                    ? "bg-rose-500/[0.01] border-rose-500/20 shadow-xs" 
                    : "bg-transparent border-transparent"
            )}>
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{field.label}</span>
                    {answer.has_warning && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <AlertTriangle className="size-3 shrink-0" /> WARNING
                        </span>
                    )}
                </div>

                <div className="text-sm font-semibold text-slate-900 dark:text-white leading-normal">
                    {formatAnswerValue(answer)}
                </div>

                {answer.has_warning && answer.warning_message && (
                    <div className="text-[10px] font-bold text-rose-500 leading-tight">
                        Detail: {answer.warning_message}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Hasil QC: ${submission.form_template.name}`} />

            <div className="space-y-6 max-w-4xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <Link 
                            href={route('qc.index')} 
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase tracking-wider"
                        >
                            <ArrowLeft className="size-4" />
                            Kembali ke Riwayat
                        </Link>
                        <h2 className="text-xl font-bold tracking-tight mt-1">{submission.form_template.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">ID Pemeriksaan: <span className="font-mono">{submission.id}</span></p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border",
                            statusCfg.bg
                        )}>
                            <StatusIcon className="size-4 shrink-0" />
                            {statusCfg.label}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex items-start gap-3">
                        <User className="size-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemeriksa (Submitter)</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{submission.submitter.name}</p>
                            <p className="text-xs text-slate-500">{submission.submitter.role?.display_name || 'Petugas'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Building className="size-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Alat Medis</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{submission.equipment_unit.name}</p>
                            <p className="text-xs text-slate-500">{submission.equipment_unit.merk} {submission.equipment_unit.model} · <span className="font-mono text-[10px]">{submission.equipment_unit.asset_code}</span></p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <Calendar className="size-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Inspeksi</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {new Date(submission.submission_date).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                            {submission.submitted_at && (
                                <p className="text-xs text-slate-400">Jam Submit: {new Date(submission.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                            )}
                        </div>
                    </div>
                </div>

                {submission.warning_count > 0 && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="size-5 text-rose-600 dark:text-rose-450 shrink-0 mt-0.5" />
                        <div className="text-xs">
                            <p className="font-bold">Ditemukan {submission.warning_count} Penyimpangan Parameter</p>
                            <p className="mt-0.5 opacity-90">Pemeriksaan ini mengandung parameter di luar batas aman yang ditentukan sistem. Status ditandai sebagai "Perlu Tindakan" demi keselamatan operasional pasien dan alat.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {submission.form_template.sections.map((section) => {
                        const visibleFields = section.fields.filter(field => {
                            const answer = submission.answers.find(a => a.form_field_id === field.id);
                            return answer || field.field_type === 'section_header';
                        });

                        // Don't render sections with no fields
                        if (visibleFields.length === 0) return null;

                        return (
                            <div 
                                key={section.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs"
                            >
                                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{section.title}</h3>
                                    {section.description && (
                                        <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                                    )}
                                </div>

                                <div className="p-6 space-y-3 divide-y divide-slate-100 dark:divide-slate-850">
                                    {renderAnswers(section.fields)}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional Catatan Masalah */}
                {submission.catatan_masalah && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-3 shadow-xs">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Catatan Masalah Tambahan</h4>
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-lg p-4 text-sm text-slate-800 dark:text-slate-350">
                            {submission.catatan_masalah}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
