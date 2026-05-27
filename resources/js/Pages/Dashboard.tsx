import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    FileText,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Calendar,
    Award,
    ChevronRight,
    TrendingUp,
    Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

interface User {
    id: string;
    name: string;
    email: string;
    nip: string | null;
    role: {
        id: number;
        name: string;
        display_name: string;
    } | null;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    [key: string]: any;
}

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

interface TrendItem {
    date: string;
    count: number;
}

interface DashboardProps {
    stats: {
        total: number;
        needs_action: number;
        submitted: number;
    };
    byType: {
        harian: number;
        bulanan: number;
        tahunan: number;
    };
    recentActivity: Submission[];
    trendData: TrendItem[];
}

export default function Dashboard({ stats, byType, recentActivity, trendData }: DashboardProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    // Format Indonesian Date helper
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format Date for Chart (e.g. "23 Mei")
    const formatChartDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short'
        });
    };

    // Prepare trend data for Recharts
    const chartData = trendData.map(item => ({
        ...item,
        formattedDate: formatChartDate(item.date),
        'Jumlah Inspeksi': item.count
    }));

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

    // Custom Recharts Tooltip for Premium Feel
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {payload[0].name}: {payload[0].value} Inspeksi
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Ringkasan QC" />

            <div className="space-y-6">
                {/* Hero Header Section */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 p-6 md:p-8 text-white shadow-xl shadow-indigo-950/15 border border-indigo-950">
                    <div className="absolute -top-24 -right-24 size-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-24 size-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                                Halo, {user?.name}! 👋
                            </h2>
                            <p className="text-indigo-200/90 text-sm max-w-xl">
                                Selamat datang kembali di sistem penjaminan mutu alat medis MediQC. Berikut ringkasan operasional peninjauan kualitas hari ini.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link href={route('qc.select-unit')}>
                                <Button className="bg-white hover:bg-slate-50 text-indigo-950 font-bold border border-white hover:border-slate-50 transition-all shadow-md">
                                    Mulai Inspeksi QC
                                </Button>
                            </Link>
                            {user?.role?.name === 'admin' && (
                                <Link href={route('admin.templates.index')}>
                                    <Button variant="outline" className="border-indigo-500/50 hover:bg-indigo-900/40 text-indigo-200 hover:text-white font-medium transition-all">
                                        Kelola Template
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Primary Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Total Submissions */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all group duration-300">
                        <div className="size-12 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Inspeksi</p>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">{stats.total}</h3>
                        </div>
                    </div>

                    {/* Submitted Stats */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all group duration-300">
                        <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tercatat (Tanpa Peringatan)</p>
                            <h3 className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.submitted}</h3>
                        </div>
                    </div>

                    {/* Needs Action Stats */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-all group duration-300">
                        <div className="size-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
                            <AlertTriangle className="size-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Perlu Tindakan (Warning)</p>
                            <h3 className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 mt-0.5">{stats.needs_action}</h3>
                        </div>
                    </div>
                </div>

                {/* Submissions by Frequency (QC Types) Grid */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Frekuensi Pemeriksaan QC</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Harian */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-500/30 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400">Harian</span>
                                <h4 className="text-2xl font-bold tracking-tight">{byType.harian} <span className="text-xs font-normal text-slate-400">inspeksi</span></h4>
                            </div>
                            <div className="size-10 rounded-full bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Clock className="size-5" />
                            </div>
                        </div>

                        {/* Bulanan */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-purple-500/30 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400">Bulanan</span>
                                <h4 className="text-2xl font-bold tracking-tight">{byType.bulanan} <span className="text-xs font-normal text-slate-400">inspeksi</span></h4>
                            </div>
                            <div className="size-10 rounded-full bg-purple-500/5 dark:bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Calendar className="size-5" />
                            </div>
                        </div>

                        {/* Tahunan */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-indigo-500/30 hover:shadow-md transition-all duration-300 flex items-center justify-between">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">Tahunan</span>
                                <h4 className="text-2xl font-bold tracking-tight">{byType.tahunan} <span className="text-xs font-normal text-slate-400">inspeksi</span></h4>
                            </div>
                            <div className="size-10 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                <Award className="size-5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid for Trend Chart & Recent Activities */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* QC Trend Chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs lg:col-span-2 space-y-4 flex flex-col">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="font-bold text-base tracking-tight">Tren Pengajuan Inspeksi</h3>
                                <p className="text-xs text-slate-500">Jumlah laporan pemeriksaan QC per hari dalam 7 hari terakhir.</p>
                            </div>
                            <div className="size-8 rounded-lg bg-indigo-500/5 flex items-center justify-center text-indigo-600">
                                <TrendingUp className="size-4" />
                            </div>
                        </div>

                        <div className="h-64 w-full flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                                    <XAxis
                                        dataKey="formattedDate"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="Jumlah Inspeksi"
                                        stroke="#4f46e5"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h3 className="font-bold text-base tracking-tight">Aktifitas QC Terbaru</h3>
                                <p className="text-xs text-slate-500">5 riwayat pengisian laporan paling baru.</p>
                            </div>
                            <div className="size-8 rounded-lg bg-indigo-500/5 flex items-center justify-center text-indigo-600">
                                <Activity className="size-4" />
                            </div>
                        </div>

                        <div className="flex-1 divide-y divide-slate-100 dark:divide-slate-850 flex flex-col justify-start">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((item) => {
                                    const statusCfg = getStatusConfig(item.overall_status);
                                    const StatusIcon = statusCfg.icon;

                                    return (
                                        <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3 group">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-bold text-slate-400">{formatDate(item.submission_date)}</p>
                                                    <span className={cn(
                                                        "text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide",
                                                        item.qc_type === 'harian' && 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
                                                        item.qc_type === 'bulanan' && 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
                                                        item.qc_type === 'tahunan' && 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                                                    )}>
                                                        {item.qc_type}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-1">
                                                    {item.equipment_unit.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                    <span>Pengisi: <span className="font-medium">{item.submitter.name}</span></span>
                                                    <span>·</span>
                                                    <span className="font-mono">{item.equipment_unit.asset_code}</span>
                                                </p>

                                                <div className="flex items-center justify-between mt-2.5">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border",
                                                        statusCfg.bg
                                                    )}>
                                                        <StatusIcon className="size-2.5 shrink-0" />
                                                        {statusCfg.label}
                                                    </span>

                                                    <Link
                                                        href={route('qc.show', item.id)}
                                                        className="inline-flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 gap-0.5 transition-colors opacity-80 group-hover:opacity-100"
                                                    >
                                                        Lihat
                                                        <ChevronRight className="size-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center my-auto">
                                    <Clock className="size-8 text-slate-300 dark:text-slate-700 mb-2" />
                                    <p className="text-xs font-medium text-slate-400">Belum ada riwayat aktivitas terbaru.</p>
                                </div>
                            )}
                        </div>

                        {recentActivity.length > 0 && (
                            <Link href={route('qc.index')} className="w-full">
                                <Button variant="outline" className="w-full text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 gap-1 mt-2">
                                    Lihat Seluruh Riwayat QC
                                    <ChevronRight className="size-3" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
