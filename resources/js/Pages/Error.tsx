import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Home,
    LockKeyhole,
    LogIn,
    RefreshCcw,
    SearchX,
    ShieldAlert,
    TimerReset,
    Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
    status: number;
    title: string;
    description: string;
    actionLabel: string;
    homeUrl: string;
    loginUrl: string;
    canGoBack: boolean;
    referenceId?: string;
}

const statusMeta: Record<number, { icon: React.ReactNode; tone: string; label: string }> = {
    403: {
        icon: <LockKeyhole className="size-7" />,
        tone: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900/60',
        label: 'Permission',
    },
    404: {
        icon: <SearchX className="size-7" />,
        tone: 'text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/30 dark:border-sky-900/60',
        label: 'Not Found',
    },
    419: {
        icon: <TimerReset className="size-7" />,
        tone: 'text-indigo-700 bg-indigo-50 border-indigo-200 dark:text-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-900/60',
        label: 'Session',
    },
    429: {
        icon: <ShieldAlert className="size-7" />,
        tone: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/30 dark:border-orange-900/60',
        label: 'Rate Limit',
    },
    500: {
        icon: <AlertTriangle className="size-7" />,
        tone: 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/30 dark:border-rose-900/60',
        label: 'Server Error',
    },
    503: {
        icon: <Wrench className="size-7" />,
        tone: 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-900 dark:border-slate-800',
        label: 'Unavailable',
    },
};

export default function Error({
    status,
    title,
    description,
    actionLabel,
    homeUrl,
    loginUrl,
    canGoBack,
    referenceId,
}: ErrorProps) {
    const meta = statusMeta[status] ?? statusMeta[500];
    const isSessionExpired = status === 419;
    const isRetryable = status === 429 || status === 503;

    const handleBack = () => {
        window.history.back();
    };

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <>
            <Head title={`${status} - ${title}`} />

            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center px-4 py-8">
                <section className="w-full max-w-3xl">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl overflow-hidden">
                        <div className="p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
                                <div className={`size-14 rounded-2xl border flex items-center justify-center shrink-0 ${meta.tone}`}>
                                    {meta.icon}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            Error {status}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            {meta.label}
                                        </span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
                                        {title}
                                    </h1>

                                    <p className="mt-3 text-sm sm:text-base leading-7 text-slate-600 dark:text-slate-350 max-w-2xl">
                                        {description}
                                    </p>

                                    {referenceId && (
                                        <div className="mt-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                Kode referensi
                                            </p>
                                            <p className="mt-1 font-mono text-sm text-slate-800 dark:text-slate-200">
                                                {referenceId}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-6 py-4 sm:px-8">
                            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Detail teknis disembunyikan untuk menjaga keamanan sistem.
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                    {canGoBack && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleBack}
                                            className="gap-2 border-slate-200 dark:border-slate-800"
                                        >
                                            <ArrowLeft className="size-4" />
                                            Kembali
                                        </Button>
                                    )}

                                    {isRetryable ? (
                                        <Button type="button" onClick={handleRetry} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
                                            <RefreshCcw className="size-4" />
                                            {actionLabel}
                                        </Button>
                                    ) : (
                                        <Link href={isSessionExpired ? loginUrl : homeUrl}>
                                            <Button className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-500 text-white">
                                                {isSessionExpired ? <LogIn className="size-4" /> : <Home className="size-4" />}
                                                {actionLabel}
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
