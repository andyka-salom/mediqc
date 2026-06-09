import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Search,
    Edit,
    Trash2,
    X,
    Plus,
    Layers,
    Monitor,
    MapPin,
    Tag,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/confirm-modal';

// ────────────── Types ──────────────

interface EquipmentType {
    id: number;
    code: string;
    display_name: string;
    description: string | null;
    icon: string | null;
    order_index: number;
    is_active: boolean;
}

interface EquipmentUnit {
    id: number;
    equipment_type_id: number;
    asset_code: string;
    name: string;
    merk: string | null;
    model: string | null;
    serial_number: string | null;
    nomor_izin_operasional: string | null;
    ruangan: string | null;
    tahun_pengadaan: string | null;
    tanggal_kalibrasi_terakhir: string | null;
    tanggal_kalibrasi_berikutnya: string | null;
    status: 'aktif' | 'maintenance' | 'rusak' | 'dihapus';
    catatan: string | null;
    qc_schedule_config: QcScheduleConfig | null;
    is_active: boolean;
    equipment_type: EquipmentType | null;
}

interface QcScheduleConfig {
    harian: {
        enabled: boolean;
        interval_days: number;
    };
    bulanan: {
        enabled: boolean;
        interval_months: number;
    };
    tahunan: {
        enabled: boolean;
        interval_months: number;
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
    units: PaginatedData<EquipmentUnit>;
    types: EquipmentType[];
    filters: {
        search: string;
        equipment_type_id: string;
        status: string;
    };
}

// ────────────── Helpers ──────────────

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    aktif: { label: 'Aktif', bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
    maintenance: { label: 'Maintenance', bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
    rusak: { label: 'Rusak', bg: 'bg-rose-100 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400' },
    dihapus: { label: 'Dihapus', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400' },
};

const defaultQcScheduleConfig: QcScheduleConfig = {
    harian: { enabled: true, interval_days: 1 },
    bulanan: { enabled: true, interval_months: 1 },
    tahunan: { enabled: true, interval_months: 12 },
};

const normalizeQcScheduleConfig = (config: QcScheduleConfig | null | undefined): QcScheduleConfig => ({
    harian: {
        enabled: config?.harian?.enabled ?? true,
        interval_days: config?.harian?.interval_days ?? 1,
    },
    bulanan: {
        enabled: config?.bulanan?.enabled ?? true,
        interval_months: config?.bulanan?.interval_months ?? 1,
    },
    tahunan: {
        enabled: config?.tahunan?.enabled ?? true,
        interval_months: config?.tahunan?.interval_months ?? 12,
    },
});

const qcIntervalSummary = (config: QcScheduleConfig | null | undefined) => {
    const normalized = normalizeQcScheduleConfig(config);
    const items = [
        normalized.harian.enabled ? `Harian/${normalized.harian.interval_days} hari` : null,
        normalized.bulanan.enabled ? `Bulanan/${normalized.bulanan.interval_months} bln` : null,
        normalized.tahunan.enabled ? `Tahunan/${normalized.tahunan.interval_months} bln` : null,
    ].filter(Boolean);

    return items.length > 0 ? items.join(' · ') : 'Tidak ada QC aktif';
};

// ────────────── Component ──────────────

export default function Index({ units, types, filters }: IndexProps) {
    const [activeTab, setActiveTab] = useState<'units' | 'types'>('units');

    // Filters state
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.equipment_type_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modals state
    const [typeModalOpen, setTypeModalOpen] = useState(false);
    const [unitModalOpen, setUnitModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<EquipmentType | null>(null);
    const [editingUnit, setEditingUnit] = useState<EquipmentUnit | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{
        isOpen: boolean;
        kind: 'type' | 'unit' | null;
        item: EquipmentType | EquipmentUnit | null;
    }>({ isOpen: false, kind: null, item: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Forms
    const typeForm = useForm({
        code: '',
        display_name: '',
        description: '',
        icon: '',
        order_index: 0,
        is_active: true,
    });

    const unitForm = useForm({
        equipment_type_id: '',
        asset_code: '',
        name: '',
        merk: '',
        model: '',
        serial_number: '',
        nomor_izin_operasional: '',
        ruangan: '',
        tahun_pengadaan: '',
        tanggal_kalibrasi_terakhir: '',
        tanggal_kalibrasi_berikutnya: '',
        status: 'aktif',
        catatan: '',
        qc_schedule_config: defaultQcScheduleConfig,
        is_active: true,
    });

    // ────── Handlers ──────

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.equipment.index'), {
            search,
            equipment_type_id: typeFilter,
            status: statusFilter,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearch('');
        setTypeFilter('');
        setStatusFilter('');
        router.get(route('admin.equipment.index'));
    };

    // ── Type CRUD ──
    const openAddTypeModal = () => {
        setEditingType(null);
        typeForm.reset();
        typeForm.setData({ code: '', display_name: '', description: '', icon: '', order_index: types.length, is_active: true });
        setTypeModalOpen(true);
    };

    const openEditTypeModal = (t: EquipmentType) => {
        setEditingType(t);
        typeForm.setData({
            code: t.code,
            display_name: t.display_name,
            description: t.description || '',
            icon: t.icon || '',
            order_index: t.order_index,
            is_active: t.is_active,
        });
        setTypeModalOpen(true);
    };

    const handleTypeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingType) {
            typeForm.put(route('admin.equipment.types.update', editingType.id), { onSuccess: () => setTypeModalOpen(false) });
        } else {
            typeForm.post(route('admin.equipment.types.store'), { onSuccess: () => setTypeModalOpen(false) });
        }
    };

    const handleDeleteType = (t: EquipmentType) => {
        setConfirmDelete({ isOpen: true, kind: 'type', item: t });
    };

    // ── Unit CRUD ──
    const openAddUnitModal = () => {
        setEditingUnit(null);
        unitForm.reset();
        unitForm.setData({
            equipment_type_id: types[0]?.id.toString() || '',
            asset_code: '', name: '', merk: '', model: '', serial_number: '',
            nomor_izin_operasional: '', ruangan: '', tahun_pengadaan: '', tanggal_kalibrasi_terakhir: '',
            tanggal_kalibrasi_berikutnya: '', status: 'aktif', catatan: '', is_active: true,
            qc_schedule_config: defaultQcScheduleConfig,
        });
        setUnitModalOpen(true);
    };

    const openEditUnitModal = (u: EquipmentUnit) => {
        setEditingUnit(u);
        unitForm.setData({
            equipment_type_id: u.equipment_type_id.toString(),
            asset_code: u.asset_code,
            name: u.name,
            merk: u.merk || '',
            model: u.model || '',
            serial_number: u.serial_number || '',
            nomor_izin_operasional: u.nomor_izin_operasional || '',
            ruangan: u.ruangan || '',
            tahun_pengadaan: u.tahun_pengadaan ? u.tahun_pengadaan.substring(0, 10) : '',
            tanggal_kalibrasi_terakhir: u.tanggal_kalibrasi_terakhir ? u.tanggal_kalibrasi_terakhir.substring(0, 10) : '',
            tanggal_kalibrasi_berikutnya: u.tanggal_kalibrasi_berikutnya ? u.tanggal_kalibrasi_berikutnya.substring(0, 10) : '',
            status: u.status,
            catatan: u.catatan || '',
            qc_schedule_config: normalizeQcScheduleConfig(u.qc_schedule_config),
            is_active: u.is_active,
        });
        setUnitModalOpen(true);
    };

    const handleUnitSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUnit) {
            unitForm.put(route('admin.equipment.units.update', editingUnit.id), { onSuccess: () => setUnitModalOpen(false) });
        } else {
            unitForm.post(route('admin.equipment.units.store'), { onSuccess: () => setUnitModalOpen(false) });
        }
    };

    const updateUnitQcSchedule = (qcType: keyof QcScheduleConfig, key: string, value: boolean | number) => {
        unitForm.setData('qc_schedule_config', {
            ...unitForm.data.qc_schedule_config,
            [qcType]: {
                ...unitForm.data.qc_schedule_config[qcType],
                [key]: value,
            },
        });
    };

    const handleDeleteUnit = (u: EquipmentUnit) => {
        setConfirmDelete({ isOpen: true, kind: 'unit', item: u });
    };

    const executeDelete = () => {
        if (!confirmDelete.kind || !confirmDelete.item) return;

        setIsDeleting(true);
        const targetRoute = confirmDelete.kind === 'type'
            ? route('admin.equipment.types.destroy', confirmDelete.item.id)
            : route('admin.equipment.units.destroy', confirmDelete.item.id);

        router.delete(targetRoute, {
            onFinish: () => {
                setIsDeleting(false);
                setConfirmDelete({ isOpen: false, kind: null, item: null });
            },
        });
    };

    // ────────────── Render ──────────────

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Alat Medis" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manajemen Alat Medis</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Kelola tipe dan unit alat medis beserta jadwal kalibrasi dan statusnya.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={openAddTypeModal}
                            variant="outline"
                            className="border-slate-200 dark:border-slate-800 gap-2"
                        >
                            <Layers className="size-4" />
                            Tambah Tipe
                        </Button>
                        <Button
                            onClick={openAddUnitModal}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 gap-2"
                        >
                            <Plus className="size-4" />
                            Tambah Unit
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-0">
                    <button
                        onClick={() => setActiveTab('units')}
                        className={cn(
                            "px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                            activeTab === 'units'
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Monitor className="size-4" />
                            Unit Alat Medis
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-bold">{units.total}</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('types')}
                        className={cn(
                            "px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer",
                            activeTab === 'types'
                                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <Layers className="size-4" />
                            Tipe Alat Medis
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-bold">{types.length}</span>
                        </span>
                    </button>
                </div>

                {/* ───── Tab: Unit Alat Medis ───── */}
                {activeTab === 'units' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari unit (Nama/Kode/Merk/Model/SN/Izin/Ruangan)..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>
                                <div className="w-full md:w-44">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => setTypeFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    >
                                        <option value="">Semua Tipe</option>
                                        {types.map(t => (
                                            <option key={t.id} value={t.id}>{t.display_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-36">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="aktif">Aktif</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="rusak">Rusak</option>
                                        <option value="dihapus">Dihapus</option>
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white">Cari</Button>
                                    <Button type="button" variant="outline" onClick={resetFilters} className="px-3 border-slate-200 dark:border-slate-800">Reset</Button>
                                </div>
                            </form>
                        </div>

                        {/* Units Table */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit & Kode Aset</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipe</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Merk / Model</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ruangan</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kalibrasi</th>
                                            <th className="px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interval QC</th>
                                            <th className="px-5 py-3.5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {units.data.length > 0 ? (
                                            units.data.map((unit) => {
                                                const st = statusConfig[unit.status] || statusConfig['dihapus'];
                                                const kalibrasiBadge = unit.tanggal_kalibrasi_berikutnya
                                                    ? new Date(unit.tanggal_kalibrasi_berikutnya) < new Date()
                                                        ? 'overdue'
                                                        : 'ok'
                                                    : 'unknown';
                                                return (
                                                    <tr key={unit.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors group">
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                                                    <Monitor className="size-4 text-indigo-600 dark:text-indigo-400" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{unit.name}</h4>
                                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">{unit.asset_code}</p>
                                                                    {unit.nomor_izin_operasional && (
                                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">Izin: {unit.nomor_izin_operasional}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                                <Tag className="size-3" />
                                                                {unit.equipment_type?.display_name || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{unit.merk || '—'}</p>
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{unit.model || '—'}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                                                                <MapPin className="size-3 text-slate-400" />
                                                                {unit.ruangan || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            <span className={cn("inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide", st.bg, st.text)}>
                                                                {st.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {unit.tanggal_kalibrasi_berikutnya ? (
                                                                <div className="flex items-center gap-1.5">
                                                                    {kalibrasiBadge === 'overdue' && <AlertTriangle className="size-3 text-amber-500" />}
                                                                    <span className={cn(
                                                                        "text-[11px] font-medium",
                                                                        kalibrasiBadge === 'overdue' ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                                                                    )}>
                                                                        {new Date(unit.tanggal_kalibrasi_berikutnya).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-slate-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <p className="max-w-[180px] text-[11px] leading-5 text-slate-600 dark:text-slate-400">
                                                                {qcIntervalSummary(unit.qc_schedule_config)}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button onClick={() => openEditUnitModal(unit)} variant="outline" size="icon"
                                                                    className="size-8 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850" title="Edit Unit">
                                                                    <Edit className="size-3.5" />
                                                                </Button>
                                                                <Button onClick={() => handleDeleteUnit(unit)} variant="outline" size="icon"
                                                                    className="size-8 border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20" title="Hapus Unit">
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                                                    Tidak ada unit alat medis ditemukan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <span className="text-xs text-slate-500">
                                    Menampilkan {units.data.length} dari {units.total} unit
                                    {units.last_page > 1 ? ` · Halaman ${units.current_page} dari ${units.last_page}` : ''}
                                </span>
                                {units.last_page > 1 && (
                                    <div className="flex gap-1">
                                        {units.links.map((link, i) => (
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
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ───── Tab: Tipe Alat Medis ───── */}
                {activeTab === 'types' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {types.length > 0 ? types.map((t) => (
                            <div key={t.id}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow group relative"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                            {t.icon || t.code.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.display_name}</h4>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{t.code}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide",
                                        t.is_active
                                            ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    )}>
                                        {t.is_active ? 'Aktif' : 'Non-aktif'}
                                    </span>
                                </div>

                                {t.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{t.description}</p>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                        Urutan: {t.order_index}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button onClick={() => openEditTypeModal(t)} variant="outline" size="sm"
                                            className="h-7 text-xs border-slate-200 dark:border-slate-800 gap-1">
                                            <Edit className="size-3" /> Edit
                                        </Button>
                                        <Button onClick={() => handleDeleteType(t)} variant="outline" size="sm"
                                            className="h-7 text-xs border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1">
                                            <Trash2 className="size-3" /> Hapus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-full py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                                Belum ada tipe alat medis. Klik "Tambah Tipe" untuk memulai.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ────── Modal: Add/Edit Equipment Type ────── */}
            {typeModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {editingType ? `Edit Tipe: ${editingType.display_name}` : 'Tambah Tipe Alat Medis'}
                            </h3>
                            <button onClick={() => setTypeModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleTypeSubmit}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kode</label>
                                        <input type="text" required value={typeForm.data.code} onChange={e => typeForm.setData('code', e.target.value.toUpperCase())}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="XRAY" />
                                        {typeForm.errors.code && <p className="text-rose-500 text-[10px] font-bold">{typeForm.errors.code}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Urutan</label>
                                        <input type="number" min="0" required value={typeForm.data.order_index} onChange={e => typeForm.setData('order_index', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nama Tampilan</label>
                                    <input type="text" required value={typeForm.data.display_name} onChange={e => typeForm.setData('display_name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="X-Ray" />
                                    {typeForm.errors.display_name && <p className="text-rose-500 text-[10px] font-bold">{typeForm.errors.display_name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Deskripsi</label>
                                    <textarea value={typeForm.data.description} onChange={e => typeForm.setData('description', e.target.value)} rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                                        placeholder="Deskripsi singkat tipe alat medis..." />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Ikon (Emoji/Karakter)</label>
                                    <input type="text" value={typeForm.data.icon} onChange={e => typeForm.setData('icon', e.target.value)} maxLength={10}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="📡" />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Aktif</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Hanya tipe aktif yang muncul pada pilihan unit.</p>
                                    </div>
                                    <input type="checkbox" checked={typeForm.data.is_active} onChange={e => typeForm.setData('is_active', e.target.checked)}
                                        className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setTypeModalOpen(false)} className="border-slate-200 dark:border-slate-800">Batal</Button>
                                <Button type="submit" disabled={typeForm.processing} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                    {editingType ? 'Simpan Perubahan' : 'Buat Tipe'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ────── Modal: Add/Edit Equipment Unit ────── */}
            {unitModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {editingUnit ? `Edit Unit: ${editingUnit.name}` : 'Tambah Unit Alat Medis'}
                            </h3>
                            <button onClick={() => setUnitModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUnitSubmit}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Tipe */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Tipe Alat Medis</label>
                                    <select value={unitForm.data.equipment_type_id} onChange={e => unitForm.setData('equipment_type_id', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all">
                                        {types.map(t => <option key={t.id} value={t.id}>{t.display_name} ({t.code})</option>)}
                                    </select>
                                    {unitForm.errors.equipment_type_id && <p className="text-rose-500 text-[10px] font-bold">{unitForm.errors.equipment_type_id}</p>}
                                </div>

                                {/* Kode Aset & Nama */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kode Aset</label>
                                        <input type="text" required value={unitForm.data.asset_code} onChange={e => unitForm.setData('asset_code', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="INV-001" />
                                        {unitForm.errors.asset_code && <p className="text-rose-500 text-[10px] font-bold">{unitForm.errors.asset_code}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nama Unit</label>
                                        <input type="text" required value={unitForm.data.name} onChange={e => unitForm.setData('name', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="X-Ray Mobile R. IGD" />
                                        {unitForm.errors.name && <p className="text-rose-500 text-[10px] font-bold">{unitForm.errors.name}</p>}
                                    </div>
                                </div>

                                {/* Merk & Model */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Merk</label>
                                        <input type="text" value={unitForm.data.merk} onChange={e => unitForm.setData('merk', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="Shimadzu" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Model</label>
                                        <input type="text" value={unitForm.data.model} onChange={e => unitForm.setData('model', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="MobileDaRt Evolution" />
                                    </div>
                                </div>

                                {/* Serial & Ruangan */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Serial Number</label>
                                        <input type="text" value={unitForm.data.serial_number} onChange={e => unitForm.setData('serial_number', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="SN-12345" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Ruangan</label>
                                        <input type="text" value={unitForm.data.ruangan} onChange={e => unitForm.setData('ruangan', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="R. Radiologi Lt. 1" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nomor Izin Operasional Alat</label>
                                    <input type="text" value={unitForm.data.nomor_izin_operasional} onChange={e => unitForm.setData('nomor_izin_operasional', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="Contoh: 503/IOA/RS/2026" />
                                    {unitForm.errors.nomor_izin_operasional && <p className="text-rose-500 text-[10px] font-bold">{unitForm.errors.nomor_izin_operasional}</p>}
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Thn Pengadaan</label>
                                        <input type="date" value={unitForm.data.tahun_pengadaan} onChange={e => unitForm.setData('tahun_pengadaan', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kalibrasi Terakhir</label>
                                        <input type="date" value={unitForm.data.tanggal_kalibrasi_terakhir} onChange={e => unitForm.setData('tanggal_kalibrasi_terakhir', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Kalibrasi Berikutnya</label>
                                        <input type="date" value={unitForm.data.tanggal_kalibrasi_berikutnya} onChange={e => unitForm.setData('tanggal_kalibrasi_berikutnya', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all" />
                                    </div>
                                </div>

                                {/* QC Schedule */}
                                <div className="space-y-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Interval Jadwal QC</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Atur frekuensi QC khusus untuk unit ini.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                            <label className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Harian</span>
                                                <input
                                                    type="checkbox"
                                                    checked={unitForm.data.qc_schedule_config.harian.enabled}
                                                    onChange={e => updateUnitQcSchedule('harian', 'enabled', e.target.checked)}
                                                    className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                                                />
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500">Setiap</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={365}
                                                    value={unitForm.data.qc_schedule_config.harian.interval_days}
                                                    onChange={e => updateUnitQcSchedule('harian', 'interval_days', parseInt(e.target.value) || 1)}
                                                    className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500"
                                                />
                                                <span className="text-[10px] text-slate-500">hari</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                            <label className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Bulanan</span>
                                                <input
                                                    type="checkbox"
                                                    checked={unitForm.data.qc_schedule_config.bulanan.enabled}
                                                    onChange={e => updateUnitQcSchedule('bulanan', 'enabled', e.target.checked)}
                                                    className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                                                />
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500">Setiap</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={24}
                                                    value={unitForm.data.qc_schedule_config.bulanan.interval_months}
                                                    onChange={e => updateUnitQcSchedule('bulanan', 'interval_months', parseInt(e.target.value) || 1)}
                                                    className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500"
                                                />
                                                <span className="text-[10px] text-slate-500">bulan</span>
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-2">
                                            <label className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Tahunan</span>
                                                <input
                                                    type="checkbox"
                                                    checked={unitForm.data.qc_schedule_config.tahunan.enabled}
                                                    onChange={e => updateUnitQcSchedule('tahunan', 'enabled', e.target.checked)}
                                                    className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                                                />
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-slate-500">Setiap</span>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={120}
                                                    value={unitForm.data.qc_schedule_config.tahunan.interval_months}
                                                    onChange={e => updateUnitQcSchedule('tahunan', 'interval_months', parseInt(e.target.value) || 12)}
                                                    className="w-16 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs outline-none focus:border-indigo-500"
                                                />
                                                <span className="text-[10px] text-slate-500">bulan</span>
                                            </div>
                                        </div>
                                    </div>

                                    {unitForm.errors.qc_schedule_config && <p className="text-rose-500 text-[10px] font-bold">{unitForm.errors.qc_schedule_config}</p>}
                                </div>

                                {/* Status */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Status</label>
                                    <select value={unitForm.data.status} onChange={e => unitForm.setData('status', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all">
                                        <option value="aktif">Aktif</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="rusak">Rusak</option>
                                        <option value="dihapus">Dihapus</option>
                                    </select>
                                </div>

                                {/* Catatan */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Catatan</label>
                                    <textarea value={unitForm.data.catatan} onChange={e => unitForm.setData('catatan', e.target.value)} rows={2}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                                        placeholder="Catatan tambahan..." />
                                </div>

                                {/* Active toggle */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Status Aktif</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Hanya unit aktif yang mendapatkan jadwal QC.</p>
                                    </div>
                                    <input type="checkbox" checked={unitForm.data.is_active} onChange={e => unitForm.setData('is_active', e.target.checked)}
                                        className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setUnitModalOpen(false)} className="border-slate-200 dark:border-slate-800">Batal</Button>
                                <Button type="submit" disabled={unitForm.processing} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                    {editingUnit ? 'Simpan Perubahan' : 'Buat Unit'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, kind: null, item: null })}
                onConfirm={executeDelete}
                title={confirmDelete.kind === 'type' ? 'Hapus Tipe Alat' : 'Hapus Unit Alat'}
                message={
                    confirmDelete.kind === 'type'
                        ? `Hapus tipe "${(confirmDelete.item as EquipmentType | null)?.display_name}"?\n\nTipe yang masih memiliki unit tidak dapat dihapus.`
                        : `Hapus unit "${(confirmDelete.item as EquipmentUnit | null)?.name}"?\n\nRiwayat unit ini akan mengikuti aturan penghapusan dari server.`
                }
                confirmText={confirmDelete.kind === 'type' ? 'Hapus Tipe' : 'Hapus Unit'}
                variant="danger"
                isLoading={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
