import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    Search, 
    Edit, 
    Trash2, 
    Shield, 
    X, 
    UserPlus, 
    Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    permissions: Record<string, any>;
}

interface User {
    id: string;
    name: string;
    email: string;
    nip: string | null;
    no_hp: string | null;
    role_id: number;
    is_active: boolean;
    role: Role | null;
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
    users: PaginatedData<User>;
    roles: Role[];
    filters: {
        search: string;
        role_id: string;
    };
}

export default function Index({ users, roles, filters }: IndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role_id || '');
    
    // Modals visibility state
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; user: User | null }>({ isOpen: false, user: null });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form for User CRUD
    const userForm = useForm({
        name: '',
        email: '',
        nip: '',
        no_hp: '',
        role_id: '',
        password: '',
        is_active: true,
    });

    // Form for Permissions Edit
    const permissionsForm = useForm<{ permissions: Record<string, any> }>({
        permissions: {},
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), {
            search,
            role_id: roleFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setRoleFilter('');
        router.get(route('admin.users.index'));
    };

    const openAddUserModal = () => {
        setEditingUser(null);
        userForm.reset();
        userForm.setData({
            name: '',
            email: '',
            nip: '',
            no_hp: '',
            role_id: roles[0]?.id.toString() || '',
            password: '',
            is_active: true,
        });
        setUserModalOpen(true);
    };

    const openEditUserModal = (user: User) => {
        setEditingUser(user);
        userForm.reset();
        userForm.setData({
            name: user.name,
            email: user.email,
            nip: user.nip || '',
            no_hp: user.no_hp || '',
            role_id: user.role_id.toString(),
            password: '',
            is_active: user.is_active,
        });
        setUserModalOpen(true);
    };

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            userForm.put(route('admin.users.update', editingUser.id), {
                onSuccess: () => setUserModalOpen(false),
            });
        } else {
            userForm.post(route('admin.users.store'), {
                onSuccess: () => setUserModalOpen(false),
            });
        }
    };

    const handleDeleteUser = (user: User) => {
        setConfirmDelete({ isOpen: true, user });
    };

    const executeDeleteUser = () => {
        if (!confirmDelete.user) return;

        setIsDeleting(true);
        router.delete(route('admin.users.destroy', confirmDelete.user.id), {
            onFinish: () => {
                setIsDeleting(false);
                setConfirmDelete({ isOpen: false, user: null });
            },
        });
    };

    const openPermissionsModal = (role: Role) => {
        setSelectedRole(role);
        permissionsForm.setData({
            permissions: role.permissions || {},
        });
        setPermissionsModalOpen(true);
    };

    const handlePermissionToggle = (key: string, value: any) => {
        permissionsForm.setData('permissions', {
            ...permissionsForm.data.permissions,
            [key]: value,
        });
    };


    const handleQcSubmitToggle = (type: string, isChecked: boolean) => {
        const currentSubmit = permissionsForm.data.permissions['qc.submit'];
        let updated: any = [];
        
        if (currentSubmit === '*' || currentSubmit === true) {
            updated = ['harian', 'bulanan', 'tahunan'];
        } else if (Array.isArray(currentSubmit)) {
            updated = [...currentSubmit];
        }

        if (isChecked) {
            if (!updated.includes(type)) {
                updated.push(type);
            }
        } else {
            updated = updated.filter((t: string) => t !== type);
        }

        permissionsForm.setData('permissions', {
            ...permissionsForm.data.permissions,
            'qc.submit': updated,
        });
    };

    const handlePermissionsSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole) {
            permissionsForm.put(route('admin.roles.update-permissions', selectedRole.id), {
                onSuccess: () => setPermissionsModalOpen(false),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Manajemen Pengguna & Izin Akses" />

            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Kelola data operator QC, Fisikawan Medis, dan sesuaikan izin akses masing-masing peran.
                        </p>
                    </div>
                    <Button 
                        onClick={openAddUserModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/15 gap-2"
                    >
                        <UserPlus className="size-4" />
                        Tambah User
                    </Button>
                </div>

                {/* Grid layout for Roles Permissions Card & Users Table */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Roles & Permissions Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs h-fit space-y-4">
                        <div>
                            <h3 className="text-md font-bold tracking-tight">Peran & Izin Akses</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                Klik tombol konfigurasi pada peran untuk membatasi aksi pengisian form atau persetujuan.
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {roles.map((role) => (
                                <div key={role.id} className="py-3.5 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <h4 className="text-sm font-semibold truncate text-slate-850 dark:text-slate-200">{role.display_name}</h4>
                                        <p className="text-slate-400 dark:text-slate-500 text-xs truncate mt-0.5">{role.description}</p>
                                    </div>
                                    <Button
                                        onClick={() => openPermissionsModal(role)}
                                        variant="outline"
                                        size="sm"
                                        className="h-8 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 gap-1 text-xs"
                                    >
                                        <Sliders className="size-3.5" />
                                        Atur
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Users list */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari user (Nama/Email/NIP)..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    />
                                </div>

                                <div className="w-full md:w-48">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                    >
                                        <option value="">Semua Peran</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.display_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="submit" className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-850 dark:hover:bg-slate-800 text-white">
                                        Cari
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={resetFilters}
                                        className="px-3 border-slate-200 dark:border-slate-800"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Users Table */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-955 border-b border-slate-200 dark:border-slate-800">
                                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama & NIP</th>
                                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kontak</th>
                                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peran</th>
                                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                            <th className="px-6 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {users.data.length > 0 ? (
                                            users.data.map((user) => (
                                                <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{user.name}</h4>
                                                                <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">NIP: {user.nip || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs font-medium text-slate-800 dark:text-slate-355">{user.email}</p>
                                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user.no_hp || '—'}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800">
                                                            <Shield className="size-3.5 text-slate-400" />
                                                            {user.role?.display_name || 'Tanpa Peran'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {user.is_active ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 uppercase tracking-wide">
                                                                Aktif
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                Non-aktif
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                onClick={() => openEditUserModal(user)}
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-8 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850"
                                                                title="Edit User"
                                                            >
                                                                <Edit className="size-3.5" />
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteUser(user)}
                                                                variant="outline"
                                                                size="icon"
                                                                className="size-8 border-slate-200 dark:border-slate-800 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                                                title="Hapus User"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                                                    Tidak ada user ditemukan
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination links */}
                            {users.last_page > 1 && (
                                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">
                                        Menampilkan {users.data.length} dari {users.total} pengguna
                                    </span>
                                    <div className="flex gap-1">
                                        {users.links.map((link, i) => (
                                            <Link
                                                key={i}
                                                href={link.url || '#'}
                                                as="button"
                                                disabled={!link.url}
                                                className={cn(
                                                    "px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
                                                    link.active 
                                                        ? "bg-indigo-650 text-white border-transparent"
                                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-300"
                                                )}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Add/Edit User */}
            {userModalOpen && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">
                                {editingUser ? `Edit Data: ${editingUser.name}` : 'Tambah User Baru'}
                            </h3>
                            <button 
                                onClick={() => setUserModalOpen(false)}
                                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUserSubmit}>
                            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        value={userForm.data.name}
                                        onChange={e => userForm.setData('name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="Ketik nama lengkap..."
                                    />
                                    {userForm.errors.name && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.name}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">NIP</label>
                                        <input
                                            type="text"
                                            value={userForm.data.nip}
                                            onChange={e => userForm.setData('nip', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="NIP Pegawai"
                                        />
                                        {userForm.errors.nip && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.nip}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">No. Handphone</label>
                                        <input
                                            type="text"
                                            value={userForm.data.no_hp}
                                            onChange={e => userForm.setData('no_hp', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                            placeholder="081xxx..."
                                        />
                                        {userForm.errors.no_hp && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.no_hp}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Alamat Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={userForm.data.email}
                                        onChange={e => userForm.setData('email', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="user@mediqc.local"
                                    />
                                    {userForm.errors.email && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.email}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Peran (Role)</label>
                                    <select
                                        value={userForm.data.role_id}
                                        onChange={e => userForm.setData('role_id', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                    >
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.display_name}</option>
                                        ))}
                                    </select>
                                    {userForm.errors.role_id && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.role_id}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                        Kata Sandi {editingUser && '(Kosongkan jika tidak ingin diubah)'}
                                    </label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={userForm.data.password}
                                        onChange={e => userForm.setData('password', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    {userForm.errors.password && <p className="text-rose-500 text-[10px] font-bold">{userForm.errors.password}</p>}
                                </div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-250">Status Pengguna Aktif</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-550">Hanya user aktif yang dapat login.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={userForm.data.is_active}
                                        onChange={e => userForm.setData('is_active', e.target.checked)}
                                        className="size-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setUserModalOpen(false)}
                                    className="border-slate-200 dark:border-slate-800"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={userForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    {editingUser ? 'Simpan Perubahan' : 'Buat User'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Manage Role Permissions */}
            {permissionsModalOpen && selectedRole && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">
                                    Konfigurasi Izin: {selectedRole.display_name}
                                </h3>
                                <p className="text-slate-400 dark:text-slate-500 text-[11px] mt-0.5">{selectedRole.description}</p>
                            </div>
                            <button 
                                onClick={() => setPermissionsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-250 cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePermissionsSubmit}>
                            <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                                {/* QC Submission Checkboxes */}
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800/80 rounded-xl space-y-3">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-250 uppercase tracking-wider">Akses Pengisian Formulir QC</p>
                                        <p className="text-[10px] text-slate-450 dark:text-slate-500">Tentukan periode formulir QC mana yang diizinkan untuk diisi peran ini.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        {['harian', 'bulanan', 'tahunan'].map(type => {
                                            const currentVal = permissionsForm.data.permissions['qc.submit'];
                                            const isChecked = currentVal === '*' || currentVal === true || (Array.isArray(currentVal) && currentVal.includes(type));
                                            return (
                                                <label key={type} className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={e => handleQcSubmitToggle(type, e.target.checked)}
                                                        className="size-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <span className="capitalize">{type}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                {/* Toggle switches for admin permissions */}
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Akses Manajemen Administrasi</h4>
                                    
                                    {[
                                        { key: 'template.manage', title: 'Manajemen Template Formulir', desc: 'Membuat, mengubah struktur field, mempublikasikan, dan menghapus template form.' },
                                        { key: 'equipment.manage', title: 'Manajemen Peralatan Medis', desc: 'Mengelola unit dan tipe peralatan medis fisik beserta status kalibrasi.' },
                                        { key: 'user.manage', title: 'Manajemen Pengguna & Izin Akses', desc: 'Mengelola data kredensial pegawai, aktif/non-aktif akun, dan peran.' },
                                    ].map(item => {
                                        const isGranted = !!permissionsForm.data.permissions[item.key];
                                        return (
                                            <div key={item.key} className="flex items-start justify-between gap-4 p-2 rounded-lg hover:bg-slate-50/40 dark:hover:bg-slate-850/40 transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{item.title}</p>
                                                    <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-tight mt-0.5">{item.desc}</p>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isGranted}
                                                    onChange={e => handlePermissionToggle(item.key, e.target.checked)}
                                                    className="size-4 text-indigo-650 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer mt-0.5 shrink-0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-955 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setPermissionsModalOpen(false)}
                                    className="border-slate-200 dark:border-slate-800"
                                >
                                    Batal
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={permissionsForm.processing}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                                >
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, user: null })}
                onConfirm={executeDeleteUser}
                title="Hapus Pengguna"
                message={`Hapus pengguna "${confirmDelete.user?.name}"?\n\nAkun ini tidak akan bisa digunakan lagi setelah dihapus.`}
                confirmText="Hapus Pengguna"
                variant="danger"
                isLoading={isDeleting}
            />
        </AuthenticatedLayout>
    );
}
