import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    Edit,
    Trash2,
    X,
    Plus,
    FileText,
    Send,
    Eye,
    Calendar,
    Tag,
    CheckCircle,
    Clock,
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

interface FormTemplate {
    id: number;
    equipment_type_id: number;
    qc_type: string;
    name: string;
    description: string | null;
    version: number;
    is_published: boolean;
    is_active: boolean;
    allowed_roles: string[] | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    equipment_type: EquipmentType | null;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface IndexProps {
    templates: PaginatedData<FormTemplate>;
    equipmentTypes: EquipmentType[];
    roles: Role[];
}

// ────────────── Helpers ──────────────

const qcTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
    harian:  { label: 'Harian',  bg: 'bg-sky-100 dark:bg-sky-950/30',    text: 'text-sky-700 dark:text-sky-400' },
    bulanan: { label: 'Bulanan', bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
    tahunan: { label: 'Tahunan', bg: 'bg-amber-100 dark:bg-amber-950/30',  text: 'text-amber-700 dark:text-amber-400' },
};

// ────────────── Component ──────────────

export default function Index({ templates, equipmentTypes, roles }: IndexProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const createForm = useForm({
        equipment_type_id: '',
        qc_type: 'harian',
        name: '',
        description: '',
        allowed_roles: [] as string[],
    });

    const openCreateModal = () => {
        createForm.reset();
        createForm.setData({
            equipment_type_id: equipmentTypes[0]?.id.toString() || '',
            qc_type: 'harian',
            name: '',
            description: '',
            allowed_roles: [],
        });
        setCreateModalOpen(true);
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.templates.store'), {
            onSuccess: () => setCreateModalOpen(false),
        });
    };

    const handleDelete = (t: FormTemplate) => {
        if (confirm(`Apakah Anda yakin ingin menghapus template "${t.name}" (v${t.version})?`)) {
            router.delete(route('admin.templates.destroy', t.id));
        }
    };

    const handlePublish = (t: FormTemplate) => {
        if (confirm(`Publikasikan template "${t.name}" (v${t.version})?\n\nTemplate lain dengan tipe QC & alat yang sama akan di-nonaktifkan.`)) {
            router.post(route('admin.templates.publish', t.id));
        }
    };

    const toggleRole = (roleName: string) => {
        const current = createForm.data.allowed_roles;
        if (current.includes(roleName)) {
            createForm.setData('allowed_roles', current.filter(r => r !== roleName));
        } else {
            createForm.setData('allowed_roles', [...current, roleName]);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Template Formulir" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Template Formulir QC</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Buat dan kelola template formulir inspeksi Quality Control untuk setiap tipe alat dan periode.
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 gap-2"
                    >
                        <Plus className="size-4" />
                        Buat Template Baru
                    </Button>
                </div>

                {/* Templates Grid */}
                {templates.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.data.map((t) => {
                            const qcConf = qcTypeConfig[t.qc_type] || qcTypeConfig['harian'];
                            return (
                                <div key={t.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all group"
                                >
                                    {/* Card Header */}
                                    <div className="p-5 pb-3">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                                                    <FileText className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.name}</h4>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                                                        v{t.version} • {t.equipment_type?.display_name || '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Status badge */}
                                            {t.is_published ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide shrink-0">
                                                    <CheckCircle className="size-3" />
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide shrink-0">
                                                    <Clock className="size-3" />
                                                    Draft
                                                </span>
                                            )}
                                        </div>

                                        {/* QC Type & Active badge */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide", qcConf.bg, qcConf.text)}>
                                                {qcConf.label}
                                            </span>
                                            {!t.is_active && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                                                    Non-aktif
                                                </span>
                                            )}
                                        </div>

                                        {/* Description */}
                                        {t.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{t.description}</p>
                                        )}

                                        {/* Allowed roles */}
                                        {t.allowed_roles && t.allowed_roles.length > 0 && (
                                            <div className="flex items-center gap-1 mt-3 flex-wrap">
                                                <Tag className="size-3 text-slate-400 shrink-0" />
                                                {t.allowed_roles.map(r => (
                                                    <span key={r} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium capitalize">{r.replace('_', ' ')}</span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Published date */}
                                        {t.published_at && (
                                            <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                                                <Calendar className="size-3" />
                                                Dipublikasikan: {new Date(t.published_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Actions */}
                                    <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-2">
                                        <Link
                                            href={route('admin.templates.edit', t.id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                                        >
                                            <Edit className="size-3.5" />
                                            Edit / Builder
                                        </Link>
                                        <div className="flex gap-1.5">
                                            {!t.is_published && (
                                                <Button onClick={() => handlePublish(t)} variant="outline" size="sm"
                                                    className="h-7 text-xs border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1">
                                                    <Send className="size-3" />
                                                    Publish
                                                </Button>
                                            )}
                                            <Button onClick={() => handleDelete(t)} variant="outline" size="icon"
                                                className="size-7 border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20">
                                                <Trash2 className="size-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-16 text-center">
                        <FileText className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Belum ada template formulir QC.</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Klik "Buat Template Baru" untuk memulai.</p>
                    </div>
                )}

                {/* Pagination */}
                {templates.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Menampilkan {templates.data.length} dari {templates.total} template</span>
                        <div className="flex gap-1">
                            {templates.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'} as="button" disabled={!link.url}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
                                        link.active
                                            ? "bg-indigo-600 text-white border-transparent"
                                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ────── Modal: Create Template ────── */}
            {createModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Buat Template Formulir Baru</h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateSubmit}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Name */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nama Template</label>
                                    <input type="text" required value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="QC Harian X-Ray v2" />
                                    {createForm.errors.name && <p className="text-rose-500 text-[10px] font-bold">{createForm.errors.name}</p>}
                                </div>

                                {/* Equipment Type & QC Type */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipe Alat Medis</label>
                                        <select value={createForm.data.equipment_type_id} onChange={e => createForm.setData('equipment_type_id', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all">
                                            {equipmentTypes.map(t => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                                        </select>
                                        {createForm.errors.equipment_type_id && <p className="text-rose-500 text-[10px] font-bold">{createForm.errors.equipment_type_id}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipe QC</label>
                                        <select value={createForm.data.qc_type} onChange={e => createForm.setData('qc_type', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all">
                                            <option value="harian">Harian</option>
                                            <option value="bulanan">Bulanan</option>
                                            <option value="tahunan">Tahunan</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Deskripsi</label>
                                    <textarea value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)} rows={3}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                                        placeholder="Deskripsi singkat template..." />
                                </div>

                                {/* Allowed Roles */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Peran yang Diizinkan</label>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Kosongkan untuk mengizinkan semua peran.</p>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {roles.map(r => {
                                            const selected = createForm.data.allowed_roles.includes(r.name);
                                            return (
                                                <button key={r.id} type="button" onClick={() => toggleRole(r.name)}
                                                    className={cn(
                                                        "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                                                        selected
                                                            ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400"
                                                            : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                                                    )}>
                                                    {r.display_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="border-slate-200 dark:border-slate-800">Batal</Button>
                                <Button type="submit" disabled={createForm.processing} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                    Buat Draft Template
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
