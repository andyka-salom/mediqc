import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    isLoading = false
}: ConfirmModalProps) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: <AlertTriangle className="size-6 text-rose-600" />,
            iconBg: 'bg-rose-100 dark:bg-rose-900/30',
            button: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500'
        },
        warning: {
            icon: <AlertTriangle className="size-6 text-amber-600" />,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            button: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500'
        },
        info: {
            icon: <AlertTriangle className="size-6 text-indigo-600" />,
            iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
            button: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500'
        }
    };

    const currentVariant = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={() => !isLoading && onClose()}
                aria-hidden="true"
            />

            {/* Modal Panel */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-description"
                className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800"
            >
                <div className="bg-white dark:bg-slate-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className={cn("mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10", currentVariant.iconBg)}>
                            {currentVariant.icon}
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                            <h3 id="confirm-modal-title" className="text-lg font-bold leading-6 text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p id="confirm-modal-description" className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-950/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                        type="button"
                        disabled={isLoading}
                        className={cn(
                            "inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            currentVariant.button
                        )}
                        onClick={onConfirm}
                    >
                        {isLoading ? 'Memproses...' : confirmText}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        className="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 sm:mt-0 sm:w-auto transition-colors"
                        onClick={onClose}
                    >
                        {cancelText}
                    </button>
                </div>

                <button 
                    onClick={() => !isLoading && onClose()}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
                    aria-label="Tutup modal konfirmasi"
                    type="button"
                >
                    <X className="size-5" />
                </button>
            </div>
        </div>
    );
}
