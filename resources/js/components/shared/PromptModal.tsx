import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (value: string) => Promise<void> | void;
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    processing?: boolean;
    confirmText?: string;
};

export default function PromptModal({
    open,
    onClose,
    onConfirm,
    title,
    message,
    defaultValue = '',
    placeholder = 'Escribe aquí...',
    processing = false,
    confirmText = 'Aceptar'
}: Props) {
    const [value, setValue] = useState(defaultValue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        if (open) {
            setValue(defaultValue);
            setIsSubmitting(false);
            setStatus(null);
        }
    }, [open, defaultValue]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!value.trim()) return;
        
        try {
            setIsSubmitting(true);
            setStatus(null);
            await onConfirm(value);
            setStatus({ type: 'success', message: '¡Operación realizada con éxito!' });
            setTimeout(() => onClose(), 1000);
        } catch (error: any) {
            console.error('Prompt error:', error);
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Ocurrió un error inesperado.' 
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 font-bold">{title}</DialogTitle>
                    {message && <DialogDescription className="text-sm text-neutral-600 mt-2">{message}</DialogDescription>}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {status && (
                        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200 ${
                            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            <div className={`size-1.5 rounded-full ${status.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            {status.message}
                        </div>
                    )}
                    <Input 
                        autoFocus
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        disabled={processing || isSubmitting}
                        className="rounded-xl h-11 border-gray-200 focus:ring-emerald-100 font-medium"
                    />
                </form>

                <DialogFooter className="mt-2">
                    <Button type="button" variant="outline" className="rounded-xl font-bold" onClick={onClose} disabled={processing || isSubmitting}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={processing || isSubmitting || !value.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold border-none"
                        onClick={handleSubmit}
                    >
                        {processing || isSubmitting ? 'Guardando...' : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
