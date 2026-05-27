import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Search, 
    ChevronRight, 
    AlertTriangle, 
    CheckCircle2, 
    FileText, 
    Clock,
    Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Submission {
    id: string;
    qc_type: string;
    submission_date: string;
    submitted_by: string;
    overall_status: string;
    warning_count: number;
    catatan_masalah: string | null;
    equipment_unit: {
        id: number;
        name: string;
        asset_code: string;
        merk: string;
        model: string;
    };
    submitter: {
        id: string;
        name: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface IndexProps {
    submissions: PaginatedData<Submission>;
    filters: {
        search: string;
        qc_type: string;
        status: string;
    };
    isAdmin: boolean;
    currentUserId: string;
}

export default function Index({ submissions, filters, isAdmin, currentUserId }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [qcType, setQcType] = useState(filters.qc_type || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        router.get(route('qc.index'), {
            search,
            qc_type: qcType,
            status,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setQcType('');
        setStatus('');
        router.get(route('qc.index'));
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'needs_action':
                return { 
                    label: 'Perlu Tindakan', 
                    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
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

    return (
        <AuthenticatedLayout>
            <Head title="Riwayat Pemeriksaan QC" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Riwayat Inspeksi QC</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Daftar hasil pengisian inspeksi alat medis yang telah diajukan atau disimpan sebagai draf.
                        </p>
                    </div>
                    <Link href={route('qc.select-unit')}>
                        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15">
                            Isi Inspeksi Baru
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                    <form onSubmit={handleSearch} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari Alat (Nama/Merk/Model/Aset)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                />
                            </div>

                            {/* Tipe QC */}
                            <div>
                                <select
                                    value={qcType}
                                    onChange={(e) => setQcType(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="">Semua Periode QC</option>
                                    <option value="harian">Harian</option>
                                    <option value="bulanan">Bulanan</option>
                                    <option value="tahunan">Tahunan</option>
                                </select>
                            </div>

                            {/* Status */}
                            <div>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="draft">Draf (Belum Selesai)</option>
                                    <option value="submitted">Tercatat</option>
                                    <option value="needs_action">Perlu Tindakan (Ada Peringatan)</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white">
                                    Cari
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={resetFilters}
                                    className="px-3 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Table / List */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    {submissions.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tanggal</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peralatan Medis</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe QC</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengisi</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peringatan</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {submissions.data.map((sub) => {
                                        const statusCfg = getStatusConfig(sub.overall_status);
                                        const StatusIcon = statusCfg.icon;

                                        return (
                                            <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {new Date(sub.submission_date).toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                            {sub.equipment_unit.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                            {sub.equipment_unit.merk} {sub.equipment_unit.model} · <span className="font-mono">{sub.equipment_unit.asset_code}</span>
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "text-[11px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                                        sub.qc_type === 'harian' && 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
                                                        sub.qc_type === 'bulanan' && 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400',
                                                        sub.qc_type === 'tahunan' && 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                                                    )}>
                                                        {sub.qc_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                    {sub.submitter.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                                        statusCfg.bg
                                                    )}>
                                                        <StatusIcon className="size-3 shrink-0" />
                                                        {statusCfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {sub.warning_count > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                                                            <AlertTriangle className="size-3" />
                                                            {sub.warning_count} Warning
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 dark:text-slate-600 font-medium">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link 
                                                            href={route('qc.show', sub.id)}
                                                            className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 gap-0.5 transition-colors bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded"
                                                        >
                                                            Lihat
                                                            <ChevronRight className="size-3.5" />
                                                        </Link>
                                                        
                                                        {(isAdmin || sub.submitted_by === currentUserId) && (
                                                            <>
                                                                {/* Optional Edit button, currently pointing to Submit view which acts as edit if we pass submission - we will just delete for now or you can implement full edit flow */}
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="icon" 
                                                                    className="size-7 border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                                                    onClick={() => {
                                                                        if (confirm('Apakah Anda yakin ingin menghapus data QC ini?')) {
                                                                            router.delete(route('qc.destroy', sub.id));
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="size-3" />
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <div className="size-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4">
                                <FileText className="size-8" />
                            </div>
                            <h3 className="text-base font-semibold">Belum Ada Riwayat QC</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                                Hasil pemeriksaan belum ditemukan. Selesaikan jadwal pending untuk mengisi inspeksi QC baru.
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {submissions.last_page > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="text-sm text-slate-500">
                                Halaman <span className="font-semibold text-slate-800 dark:text-slate-200">{submissions.current_page}</span> dari <span className="font-semibold text-slate-800 dark:text-slate-200">{submissions.last_page}</span> ({submissions.total} total data)
                            </span>
                            <div className="flex gap-2">
                                {submissions.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        disabled={!link.url}
                                        onClick={(e) => !link.url && e.preventDefault()}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                                            link.active 
                                                ? "bg-slate-900 text-white dark:bg-slate-800 border-transparent"
                                                : link.url
                                                    ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                                    : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800/40 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
