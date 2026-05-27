import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    ChevronRight,
    Monitor,
    MapPin,
    CheckCircle2,
    Activity,
    UserCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EquipmentType {
    id: number;
    code: string;
    display_name: string;
}

interface EquipmentUnit {
    id: number;
    name: string;
    asset_code: string;
    merk: string;
    model: string;
    ruangan: string;
    equipment_type: EquipmentType;
}

interface Submission {
    id: string;
    qc_type: string;
    submitted_by: string;
    submitter: {
        id: string;
        name: string;
    };
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    links: { url: string | null; label: string; active: boolean }[];
    total: number;
}

interface SelectUnitProps {
    units: PaginatedData<EquipmentUnit>;
    todaysSubmissions: Record<number, Submission[]>;
    allowedQcTypes: string[];
    equipmentTypes: EquipmentType[];
    filters: {
        search: string;
        equipment_type_id: string;
    };
}

const qcTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
    harian: { label: 'Harian', bg: 'bg-blue-100 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-400' },
    bulanan: { label: 'Bulanan', bg: 'bg-purple-100 dark:bg-purple-950/40', text: 'text-purple-700 dark:text-purple-400' },
    tahunan: { label: 'Tahunan', bg: 'bg-indigo-100 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-400' },
};

export default function SelectUnit({ units, todaysSubmissions, allowedQcTypes, equipmentTypes, filters }: SelectUnitProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.equipment_type_id || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('qc.select-unit'), { search, equipment_type_id: typeFilter }, { preserveState: true });
    };

    const resetFilters = () => {
        setSearch('');
        setTypeFilter('');
        router.get(route('qc.select-unit'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Input QC - Pilih Unit" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Pilih Alat Medis</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Pilih alat medis di bawah ini untuk memulai pengisian form Quality Control.
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari unit (Nama/Kode/Merk/Ruangan)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="w-full md:w-56">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 transition-all"
                            >
                                <option value="">Semua Tipe Alat</option>
                                {equipmentTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.display_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">Cari</Button>
                            <Button type="button" variant="outline" onClick={resetFilters}>Reset</Button>
                        </div>
                    </form>
                </div>

                {/* Units List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {units.data.length > 0 ? units.data.map(unit => {
                        const submittedToday = todaysSubmissions[unit.id] || [];

                        return (
                            <div key={unit.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="size-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center shrink-0">
                                                <Monitor className="size-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{unit.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">{unit.asset_code}</span>
                                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{unit.equipment_type.display_name}</span>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                                        <span className="font-medium">Merk/Model:</span> {unit.merk || '-'} {unit.model ? `/ ${unit.model}` : ''}
                                                    </p>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                                        <MapPin className="size-3" /> {unit.ruangan || 'Ruangan tidak ditentukan'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* QC Type Action Bar */}
                                <div className="bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-100 dark:border-slate-800/50 p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tindakan QC</h4>
                                    
                                    {allowedQcTypes.length > 0 ? allowedQcTypes.map(qcType => {
                                        const config = qcTypeConfig[qcType] || qcTypeConfig['harian'];
                                        // Cek apakah sudah ada submission hari ini untuk qcType ini
                                        const submission = submittedToday.find(s => s.qc_type === qcType);
                                        
                                        return (
                                            <div key={qcType} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider", config.bg, config.text)}>
                                                        {config.label}
                                                    </span>
                                                    {submission && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                                                            <CheckCircle2 className="size-3" /> Selesai Hari Ini
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    {submission ? (
                                                        // Sudah ada submission hari ini
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mr-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                                <UserCircle2 className="size-3" />
                                                                <span className="max-w-[100px] truncate">{submission.submitter.name}</span>
                                                            </div>
                                                            <Link href={route('qc.show', submission.id)}>
                                                                <Button variant="outline" size="sm" className="h-7 text-xs border-slate-200">Lihat</Button>
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        // Belum ada submission hari ini
                                                        <Link href={route('qc.create', { unit: unit.id, qc_type: qcType })}>
                                                            <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white">
                                                                Input QC
                                                                <ChevronRight className="size-3 ml-1" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-sm text-slate-500 dark:text-slate-400 p-2 text-center bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                            Anda tidak memiliki akses untuk menginput QC.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                            <Activity className="size-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                            <h3 className="text-base font-semibold">Alat Medis Tidak Ditemukan</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {units.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Halaman {units.current_page} dari {units.last_page}</span>
                        <div className="flex gap-1">
                            {units.links.map((link, i) => (
                                <Link key={i} href={link.url || '#'} as="button" disabled={!link.url}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
                                        link.active ? "bg-indigo-600 text-white border-transparent" : "bg-white dark:bg-slate-900 border-slate-200 hover:bg-slate-50 text-slate-700"
                                    )}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
