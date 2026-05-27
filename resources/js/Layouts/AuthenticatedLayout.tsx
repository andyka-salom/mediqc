import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    PlusCircle, 
    LogOut, 
    Menu, 
    X, 
    User as UserIcon, 
    Bell, 
    CheckCircle, 
    AlertCircle,
    FileText,
    Building,
    Users
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
    [key: string]: any;
}

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
    const { auth, flash } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
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

    const navigation = [
        {
            name: 'Dashboard',
            href: route('dashboard'),
            icon: LayoutDashboard,
            active: route().current('dashboard')
        },
        { 
            name: 'Riwayat QC', 
            href: route('qc.index'), 
            icon: FileText,
            active: route().current('qc.index') || route().current('qc.show')
        },
        { 
            name: 'Input QC', 
            href: route('qc.select-unit'), 
            icon: PlusCircle,
            active: route().current('qc.select-unit') || route().current('qc.create'),
        },
    ];

    const currentRoute = String(route().current() || '');

    const adminNavigation = [
        {
            name: 'Form Templates',
            href: route('admin.templates.index'),
            icon: FileText,
            active: currentRoute.startsWith('admin.templates')
        },
        {
            name: 'Alat Medis',
            href: route('admin.equipment.index'),
            icon: Building,
            active: currentRoute.startsWith('admin.equipment')
        },
        {
            name: 'Manajemen User',
            href: route('admin.users.index'),
            icon: Users,
            active: currentRoute.startsWith('admin.users')
        }
    ];

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
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 gap-2">
                    <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                        M
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
                    {user?.role?.name === 'admin' && (
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
                    <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-lg">MediQC</span>
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
                            <span className="font-bold text-lg">MediQC Navigation</span>
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
                            {user?.role?.name === 'admin' && (
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
                <header className="hidden md:flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8">
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
                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 relative">
                            <Bell className="size-5" />
                            <span className="absolute top-1.5 right-1.5 size-2 bg-indigo-600 rounded-full"></span>
                        </button>
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>
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
