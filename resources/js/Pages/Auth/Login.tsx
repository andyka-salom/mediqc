import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Lock, Mail, Loader2, ShieldCheck } from 'lucide-react';

declare const route: any;

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk Ke Sistem" />
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 relative overflow-hidden font-sans">
                {/* Background Glows */}
                <div className="absolute top-[-10%] left-[-10%] size-[50vw] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] size-[50vw] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] pointer-events-none"></div>

                {/* Card Container */}
                <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl shadow-slate-100 dark:shadow-2xl relative z-10 mx-4">
                    
                    {/* Header */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="size-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/30 mb-4 animate-pulse">
                            <ShieldCheck className="size-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Selamat Datang di MediQC
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Aplikasi Inspeksi Quality Control Alat Medis Rumah Sakit
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                                Alamat Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                                    <Mail className="size-4" />
                                </div>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@mediqc.local"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500/80 focus:ring-[3px] focus:ring-indigo-500/10 dark:focus:ring-indigo-500/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-600 outline-none transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.email && (
                                <p className="text-xs text-rose-650 dark:text-rose-500 font-medium mt-1 animate-in fade-in-50">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
                                    Kata Sandi
                                </label>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors">
                                    <Lock className="size-4" />
                                </div>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500/80 focus:ring-[3px] focus:ring-indigo-500/10 dark:focus:ring-indigo-500/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-600 outline-none transition-all"
                                    required
                                />
                            </div>
                            {errors.password && (
                                <p className="text-xs text-rose-650 dark:text-rose-500 font-medium mt-1 animate-in fade-in-50">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 focus:ring-2 size-4 cursor-pointer"
                                />
                                Ingat saya di perangkat ini
                            </label>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/15 dark:shadow-indigo-500/20 active:scale-[0.98]"
                            disabled={processing}
                        >
                            {processing ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <Loader2 className="size-4 animate-spin" />
                                    Sedang Masuk...
                                </span>
                            ) : (
                                'Masuk ke Akun'
                            )}
                        </Button>
                    </form>

                    {/* Developer Info */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 text-center">
                        <span className="text-xs text-slate-550 dark:text-slate-500">
                            Demo Akun: <code className="text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono">admin@mediqc.local</code> / <code className="text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded font-mono">password</code>
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}
