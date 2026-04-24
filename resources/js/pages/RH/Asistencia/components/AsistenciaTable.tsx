import ResourceTable from '@/components/shared/ResourceTable';
import type { Column, Paginated } from '@/components/shared/ResourceTable';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface AsistenciaTableProps {
    rows: Paginated<any> | null;
    isLoading: boolean;
    onLoadMore: () => void;
    hasMore: boolean;
    onRefetch: () => void;
}

export function AsistenciaTable({ rows, isLoading, onLoadMore, hasMore }: AsistenciaTableProps) {
    const getEstadoBadge = (row: any) => {
        const config: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline' | 'success' | 'warning', label: string }> = {
            presente: { variant: 'success' as any, label: 'Presente' },
            tardanza: { variant: 'warning' as any, label: 'Tardanza' },
            ausente: { variant: 'destructive', label: 'Ausente' },
            permiso: { variant: 'secondary', label: 'Permiso' },
            vacaciones: { variant: 'outline', label: 'Vacaciones' },
        };
        
        // Handle custom success/warning if your badge component supports it, 
        // otherwise fallback to default variants.
        const variant = row.estado_badge_color === 'success' ? 'default' : 
                       row.estado_badge_color === 'destructive' ? 'destructive' :
                       row.estado_badge_color === 'warning' ? 'secondary' : 'outline';

        return <Badge variant={variant as any}>{row.estado_label}</Badge>;
    };

    const columns: Column<any>[] = [
        {
            label: 'Fecha',
            render: (row) => (
                <div className="font-medium">
                    {new Date(row.fecha + 'T00:00:00').toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })}
                </div>
            ),
        },
        {
            label: 'Personal',
            className: 'text-left',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <User className="size-4 text-gray-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium leading-none">{row.user?.nombre_completo}</span>
                        <span className="text-xs text-muted-foreground">{row.user?.email}</span>
                    </div>
                </div>
            ),
        },
        {
            label: 'Entrada',
            render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Clock className="size-3 text-green-600" />
                    {row.hora_entrada ? row.hora_entrada.substring(0, 5) : '—'}
                </div>
            ),
        },
        {
            label: 'Salida',
            render: (row) => (
                <div className="flex items-center justify-center gap-1">
                    <Clock className="size-3 text-blue-600" />
                    {row.hora_salida ? row.hora_salida.substring(0, 5) : '—'}
                </div>
            ),
        },
        {
            label: 'Estado',
            render: (row) => getEstadoBadge(row),
        },
        {
            label: 'Tardanza',
            render: (row) => (
                <span className={row.minutos_tardanza > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
                    {row.minutos_tardanza > 0 ? `${row.minutos_tardanza} min` : '—'}
                </span>
            ),
        },
        {
            label: 'Descuento',
            render: (row) => (
                <span className={row.descuento_aplicado > 0 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                    {row.descuento_aplicado > 0 ? formatCurrency(row.descuento_aplicado) : '—'}
                </span>
            ),
        },
    ];

    if (!rows && isLoading) {
        return <div className="text-center py-8">Cargando...</div>;
    }

    return (
        <ResourceTable
            rows={rows || { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 }}
            columns={columns}
            getKey={(row) => row.asistencia_personal_id}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            loading={isLoading}
        />
    );
}
