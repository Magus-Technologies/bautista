import { Send } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import TitleForm from '@/components/TitleForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';

const RichTextEditor = lazy(() => import('@/components/shared/RichTextEditor'));


type Usuario = { id: number; nombre: string; username: string; rol?: string };
type Grupo   = { id: number; nombre: string };

type Props = {
    open:    boolean;
    onClose: () => void;
    onSent:  () => void;
    grupos:  Grupo[];
};

export default function EnviarMensajeModal({ open, onClose, onSent, grupos }: Props) {
    const [grupoId, setGrupoId]               = useState('');
    const [query, setQuery]                   = useState('');
    const [results, setResults]               = useState<Usuario[]>([]);
    const [destinatario, setDestinatario]     = useState<Usuario | null>(null);
    const [asunto, setAsunto]                 = useState('');
    const [cuerpo, setCuerpo]                 = useState('');
    const [searching, setSearching]           = useState(false);
    const [sending, setSending]               = useState(false);
    const [error, setError]                   = useState('');
    const debounceRef                         = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            setGrupoId(''); setQuery(''); setResults([]);
            setDestinatario(null); setAsunto(''); setCuerpo(''); setError('');
        }
    }, [open]);

    const buscarUsuario = (q: string) => {
        setQuery(q);
        setDestinatario(null);

        if (debounceRef.current) {
clearTimeout(debounceRef.current);
}

        if (q.length < 2) {
 setResults([]);

 return; 
}

        debounceRef.current = setTimeout(async () => {
            setSearching(true);

            try {
                const { data } = await api.get('/usuarios/buscar', { params: { q } });
                setResults(data);
            } finally {
                setSearching(false);
            }
        }, 300);
    };

    const seleccionar = (u: Usuario) => {
        setDestinatario(u);
        setQuery(u.nombre);
        setResults([]);
        setGrupoId('');
    };

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault();

        if (!grupoId && !destinatario) {
 setError('Busque y seleccione un usuario, o elija un grupo.');

 return; 
}

        if (!asunto.trim())            {
 setError('El asunto es requerido.');

                            return; 
}

        if (!cuerpo.trim())            {
 setError('El mensaje no puede estar vacío.');

                   return; 
}

        setSending(true); setError('');

        try {
            await api.post('/mensajes', {
                destinatario_id: destinatario?.id ?? null,
                grupo_id:        grupoId ? Number(grupoId) : null,
                asunto,
                cuerpo,
            });
            onSent();
            onClose();
        } catch {
            setError('Error al enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-neutral-800">
                        <Send className="h-5 w-5 text-emerald-600" />
                        Nueva Notificación
                    </DialogTitle>
                    <DialogDescription className="sr-only">Redacta y envía una notificación a un usuario o grupo.</DialogDescription>
                </DialogHeader>

                <TitleForm>Destinatario</TitleForm>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Grupo */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-neutral-600">Grupo:</label>
                        <select
                            value={grupoId}
                            onChange={(e) => {
 setGrupoId(e.target.value); setDestinatario(null); setQuery(''); 
}}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a65a]"
                        >
                            <option value="">Seleccionar grupo</option>
                            {grupos.map((g) => (
                                <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Para (autocomplete) */}
                    <div className="relative flex flex-col gap-1">
                        <label className="text-sm font-medium text-neutral-600">Para:</label>

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => buscarUsuario(e.target.value)}
                            placeholder={searching ? 'Buscando...' : ''}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a65a]"
                            autoComplete="off"
                        />
                        {results.length > 0 && (
                            <ul className="absolute z-50 top-full mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                {results.map((u) => (
                                    <li
                                        key={u.id}
                                        className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                                        onClick={() => seleccionar(u)}
                                    >
                                        <span className="font-medium">{u.nombre}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">@{u.username}</span>
                                            {u.rol && (
                                                <span className="text-[9px] bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded font-black uppercase">
                                                    {u.rol}
                                                </span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <TitleForm className="pt-1">Contenido</TitleForm>

                    {/* Asunto */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-neutral-600">Asunto:</label>

                        <input
                            type="text"
                            value={asunto}
                            onChange={(e) => setAsunto(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00a65a]"
                        />
                    </div>

                    {/* Mensaje */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-neutral-600">Mensaje:</label>

                        <Suspense fallback={<div className="h-[180px] rounded-lg border border-neutral-200 bg-neutral-50 animate-pulse" />}>
                            <RichTextEditor
                                value={cuerpo}
                                onChange={setCuerpo}
                                placeholder="Escribe tu mensaje..."
                                minHeight={180}
                            />
                        </Suspense>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button type="submit" disabled={sending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {sending ? 'Enviando...' : 'Enviar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

