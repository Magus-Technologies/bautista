import { useState } from 'react';
import { PlusCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionCard from '@/components/shared/SectionCard';
import ResourceTable from '@/components/shared/ResourceTable';
import type { Column } from '@/components/shared/ResourceTable';
import { useResource } from '@/hooks/useResource';
import PagosDrawer from '../components/PagosDrawer';
import HistorialAlumnoModal from '../components/HistorialAlumnoModal';
import type { Pagador } from '../hooks/usePago';

export default function PagadoresView() {
    const res = useResource<Pagador>('/pagos/pagadores');

    const [drawerOpen, setDrawerOpen]       = useState(false);
    const [selected, setSelected]           = useState<Pagador | null>(null);
    const [historialEstu, setHistorialEstu] = useState<number | null>(null);

    const openDrawer = (p: Pagador) => { setSelected(p); setDrawerOpen(true); };

    const columns: Column<Pagador>[] = [
        { label: '#',         render: (p) => p.id_usuario },
        { label: 'DNI',       render: (p) => p.numero_doc ?? '—' },
        { label: 'Nombres',   render: (p) => p.nombres },
        { label: 'Apellidos', render: (p) => p.apellidos },
        { label: 'Teléfono',  render: (p) => p.telefono_1 ?? '—' },
        {
            label: 'Mensualidad',
            render: (p) => p.mensualidad
                ? <span className="font-semibold text-green-700">S/ {Number(p.mensualidad).toFixed(2)}</span>
                : '—',
        },
        {
            label: 'Acciones',
            render: (p) => (
                <div className="flex gap-1">
                    <Button size="sm"
                        className="bg-[#00a65a] hover:bg-[#008d4c] text-white h-7 px-3"
                        onClick={(e) => { e.stopPropagation(); openDrawer(p); }}>
                        <PlusCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline"
                        className="h-7 px-3 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                        onClick={(e) => { e.stopPropagation(); setHistorialEstu(p.estu_id); }}
                        title="Ver historial">
                        <History className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            <SectionCard
                title="Listado de Pagadores"
                action={
                    <span className="text-xs text-gray-400">
                        {res.rows ? `${res.rows.total} registros` : '…'}
                    </span>
                }
            >
                <div className="mb-4">
                    <input
                        value={res.search}
                        onChange={(e) => res.setSearch(e.target.value)}
                        placeholder="Buscar pagador..."
                        className="w-full sm:w-64 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>

                {res.rows && (
                    <ResourceTable
                        rows={res.rows}
                        columns={columns}
                        getKey={(p) => p.estu_id}
                        onPageChange={res.setPage}
                    />
                )}
                {res.loading && (
                    <p className="py-6 text-center text-sm text-gray-400">Cargando...</p>
                )}
            </SectionCard>

            <PagosDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                pagador={selected}
            />

            <HistorialAlumnoModal
                open={historialEstu !== null}
                onClose={() => setHistorialEstu(null)}
                estuId={historialEstu}
            />
        </>
    );
}
