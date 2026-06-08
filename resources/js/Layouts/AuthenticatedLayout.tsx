import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    PlusCircle, 
    LogOut, 
    Menu, 
    X, 
    User as UserIcon, 
    CheckCircle, 
    AlertCircle,
    AlertTriangle,
    FileText,
    Building,
    Users,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
    id: string;
    name: string;
    email: string;
    nip: string | null;
    no_hp: string | null;
    role: {
        id: number;
        name: string;
        display_name: string;
        permissions: any;
    } | null;
}

interface PageProps {
    auth: {
        user: User | null;
    };
    flash: {
        success: string | null;
        error: string | null;
    };
    calibrationWarnings?: Array<{
        id: number;
        name: string;
        asset_code: string;
        due_date: string;
        is_overdue: boolean;
    }>;
    [key: string]: any;
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { auth, flash, calibrationWarnings } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [calibrationOpen, setCalibrationOpen] = useState(false);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const user = auth.user;

    useEffect(() => {
        if (flash.success) {
            setNotificationMessage({ type: 'success', text: flash.success });
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 5000);
            return () => clearTimeout(timer);
        } else if (flash.error) {
            setNotificationMessage({ type: 'error', text: flash.error });
            setShowNotification(true);
            const timer = setTimeout(() => setShowNotification(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(route('logout'));
    };

    const hasQcSubmitPermission = user?.role?.permissions?.['qc.submit'] === '*' || 
        user?.role?.permissions?.['qc.submit'] === true || 
        (Array.isArray(user?.role?.permissions?.['qc.submit']) && user.role.permissions['qc.submit'].length > 0);
    const canManageEquipment = user?.role?.permissions?.['equipment.manage'] === true || user?.role?.name === 'admin';
    const calibrationWarningHref = canManageEquipment ? route('admin.equipment.index') : route('qc.select-unit');

    const navigation = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutDashboard,
            active: route().current('dashboard'),
            show: true
        },
        { 
            name: 'Riwayat QC', 
            href: route('qc.index'), 
            icon: FileText,
            active: route().current('qc.index') || route().current('qc.show'),
            show: true
        },
        { 
            name: 'Input QC', 
            href: route('qc.select-unit'), 
            icon: PlusCircle,
            active: route().current('qc.select-unit') || route().current('qc.create'),
            show: hasQcSubmitPermission
        },
    ].filter(item => item.show);

    const currentRoute = String(route().current() || '');

    const adminNavigation = [
        {
            name: 'Form Templates',
            href: route('admin.templates.index'),
            icon: FileText,
            active: currentRoute.startsWith('admin.templates'),
            show: user?.role?.permissions?.['template.manage'] === true || user?.role?.name === 'admin'
        },
        {
            name: 'Alat Medis',
            href: route('admin.equipment.index'),
            icon: Building,
            active: currentRoute.startsWith('admin.equipment'),
            show: canManageEquipment
        },
        {
            name: 'Manajemen User',
            href: route('admin.users.index'),
            icon: Users,
            active: currentRoute.startsWith('admin.users'),
            show: user?.role?.permissions?.['user.manage'] === true || user?.role?.name === 'admin'
        }
    ].filter(item => item.show);

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
            {/* Notification Toast */}
            {showNotification && notificationMessage && (
                <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-5 duration-300">
                    <div className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md",
                        notificationMessage.type === 'success' 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                    )}>
                        {notificationMessage.type === 'success' ? (
                            <CheckCircle className="size-5 shrink-0" />
                        ) : (
                            <AlertCircle className="size-5 shrink-0" />
                        )}
                        <p className="text-sm font-medium">{notificationMessage.text}</p>
                        <button 
                            onClick={() => setShowNotification(false)}
                            className="ml-2 hover:opacity-70 transition-opacity"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Sidebar for Desktop */}
            <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-3">
                    <div className="flex items-center gap-2">
                        <img src="/logo_uner.png" alt="Universitas Airlangga" className="h-8 object-contain" />
                        <img src="/logo_mediqc.jpeg" alt="MediQC" className="h-8 object-contain rounded" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        MediQC
                    </span>
                </div>

                {/* Profile Card Summary */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800/30">
                        <div className="size-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium">
                            {user?.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate leading-tight">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.role?.display_name}</p>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                item.active
                                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className={cn(
                                    "size-5 transition-transform group-hover:scale-105",
                                    item.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                                )} />
                                {item.name}
                            </div>
                        </Link>
                    ))}

                    {/* Admin Navigation Section */}
                    {adminNavigation.length > 0 && (
                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                            <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Administrasi</p>
                            <div className="space-y-1">
                                {adminNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                            item.active
                                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className={cn(
                                                "size-5 transition-transform group-hover:scale-105",
                                                item.active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                                            )} />
                                            {item.name}
                                        </div>
                                    </Link>
                                ))}
                                
                                {/* Calibration Warnings Dropdown */}
                                {calibrationWarnings && calibrationWarnings.length > 0 && (
                                    <div className="mt-4 p-3 bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 rounded-xl border border-rose-200/60 dark:border-rose-800/60 shadow-sm relative overflow-hidden group/warning">
                                        {/* Subtle background glow effect */}
                                        <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none transition-opacity group-hover/warning:opacity-40">
                                            <div className="w-16 h-16 bg-rose-500 rounded-full blur-2xl"></div>
                                        </div>
                                        <button 
                                            onClick={() => setCalibrationOpen(!calibrationOpen)}
                                            className="relative w-full flex items-center justify-between text-sm font-bold text-rose-700 dark:text-rose-400 transition-all z-10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 bg-rose-200/50 dark:bg-rose-900/50 rounded-md">
                                                    <AlertTriangle className="size-4 animate-pulse text-rose-600 dark:text-rose-400" />
                                                </div>
                                                <span className="flex-1 text-left">Peringatan Kalibrasi</span>
                                                <span className="bg-rose-600 text-white dark:bg-rose-500 py-0.5 px-2.5 rounded-full text-[10px] font-black shadow-md shadow-rose-500/30">
                                                    {calibrationWarnings.length}
                                                </span>
                                            </div>
                                            <ChevronRight className={cn("size-4 text-rose-500 transition-transform duration-300", calibrationOpen && "rotate-90")} />
                                        </button>
                                        
                                        {calibrationOpen && (
                                            <div className="relative z-10 mt-3 pt-3 space-y-1.5 border-t border-rose-200/60 dark:border-rose-800/60 animate-in slide-in-from-top-2 fade-in duration-200 ease-out">
                                                {calibrationWarnings.map(warning => (
                                                    <Link 
                                                        key={warning.id}
                                                        href={calibrationWarningHref}
                                                        className="block px-3 py-2.5 text-xs rounded-lg bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                                                    >
                                                        <div className="font-semibold truncate">{warning.name}</div>
                                                        <div className={cn(
                                                            "text-[10px] mt-0.5", 
                                                            warning.is_overdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-amber-600 dark:text-amber-500 font-semibold"
                                                        )}>
                                                            {warning.is_overdue ? 'Lewat: ' : 'Tenggat: '} {warning.due_date}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </nav>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <form onSubmit={handleLogout}>
                        <button
                            type="submit"
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 transition-colors"
                        >
                            <LogOut className="size-5 shrink-0" />
                            Keluar
                        </button>
                    </form>
                </div>
            </aside>

            {/* Mobile Navigation Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-2">
                    <img src="/logo_uner.png" alt="Universitas Airlangga" className="h-8 object-contain" />
                    <img src="/logo_mediqc.jpeg" alt="MediQC" className="h-8 object-contain rounded" />
                    <span className="font-bold text-lg ml-1">MediQC</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                    {sidebarOpen ? <X className="size-6" /> : <Menu className="size-6" />}
                </button>
            </div>

            {/* Mobile Sidebar overlay */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40" onClick={() => setSidebarOpen(false)}>
                    <aside className="w-64 max-w-[80vw] h-full bg-white dark:bg-slate-900 flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/logo_uner.png" alt="Universitas Airlangga" className="h-8 object-contain" />
                                <img src="/logo_mediqc.jpeg" alt="MediQC" className="h-8 object-contain rounded" />
                                <span className="font-bold text-lg ml-1">MediQC</span>
                            </div>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
                            <p className="text-sm font-semibold">{user?.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.role?.display_name}</p>
                        </div>
                        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                        item.active
                                            ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon className="size-5" />
                                        {item.name}
                                    </div>
                                </Link>
                            ))}

                            {/* Mobile Admin Navigation */}
                            {adminNavigation.length > 0 && (
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                                    <p className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Administrasi</p>
                                    <div className="space-y-1">
                                        {adminNavigation.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={cn(
                                                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                                    item.active
                                                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="size-5" />
                                                    {item.name}
                                                </div>
                                            </Link>
                                        ))}

                                        {/* Mobile Calibration Warnings Dropdown */}
                                        {calibrationWarnings && calibrationWarnings.length > 0 && (
                                            <div className="mt-4 p-3 bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 rounded-xl border border-rose-200/60 dark:border-rose-800/60 shadow-sm relative overflow-hidden group/warning">
                                                {/* Subtle background glow effect */}
                                                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none transition-opacity group-hover/warning:opacity-40">
                                                    <div className="w-16 h-16 bg-rose-500 rounded-full blur-2xl"></div>
                                                </div>
                                                <button 
                                                    onClick={() => setCalibrationOpen(!calibrationOpen)}
                                                    className="relative w-full flex items-center justify-between text-sm font-bold text-rose-700 dark:text-rose-400 transition-all z-10"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 bg-rose-200/50 dark:bg-rose-900/50 rounded-md">
                                                            <AlertTriangle className="size-4 animate-pulse text-rose-600 dark:text-rose-400" />
                                                        </div>
                                                        <span className="flex-1 text-left">Peringatan Kalibrasi</span>
                                                        <span className="bg-rose-600 text-white dark:bg-rose-500 py-0.5 px-2.5 rounded-full text-[10px] font-black shadow-md shadow-rose-500/30">
                                                            {calibrationWarnings.length}
                                                        </span>
                                                    </div>
                                                    <ChevronRight className={cn("size-4 text-rose-500 transition-transform duration-300", calibrationOpen && "rotate-90")} />
                                                </button>
                                                
                                                {calibrationOpen && (
                                                    <div className="relative z-10 mt-3 pt-3 space-y-1.5 border-t border-rose-200/60 dark:border-rose-800/60 animate-in slide-in-from-top-2 fade-in duration-200 ease-out">
                                                        {calibrationWarnings.map(warning => (
                                                            <Link 
                                                                key={warning.id}
                                                                href={calibrationWarningHref}
                                                                onClick={() => setSidebarOpen(false)}
                                                                className="block px-3 py-2.5 text-xs rounded-lg bg-white/70 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 text-slate-700 dark:text-slate-300 transition-colors shadow-xs"
                                                            >
                                                                <div className="font-semibold truncate">{warning.name}</div>
                                                                <div className={cn(
                                                                    "text-[10px] mt-0.5", 
                                                                    warning.is_overdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-amber-600 dark:text-amber-500 font-semibold"
                                                                )}>
                                                                    {warning.is_overdue ? 'Lewat: ' : 'Tenggat: '} {warning.due_date}
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </nav>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                            <form onSubmit={handleLogout}>
                                <button
                                    type="submit"
                                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <LogOut className="size-5 shrink-0" />
                                    Keluar
                                </button>
                            </form>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
                <header className="hidden md:flex h-16 sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8">
                    <h1 className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {route().current('dashboard') && 'Dashboard Ringkasan Operasional QC'}
                        {route().current('qc.index') && 'Dashboard Riwayat Hasil Pemeriksaan QC'}
                        {route().current('qc.select-unit') && 'Pilih Unit Alat Medis untuk Input QC'}
                        {route().current('qc.create') && 'Pengisian Formulir Inspeksi QC'}
                        {route().current('qc.show') && 'Detail Hasil Inspeksi & Peninjauan QC'}
                        {currentRoute.startsWith('admin.users') && 'Manajemen Data Pengguna Sistem'}
                        {currentRoute.startsWith('admin.equipment') && 'Manajemen Tipe & Unit Alat Medis'}
                        {currentRoute.startsWith('admin.templates') && 'Manajemen Template Formulir Inspeksi QC'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="size-4 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                NIP: {user?.nip || '—'}
                            </span>
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
