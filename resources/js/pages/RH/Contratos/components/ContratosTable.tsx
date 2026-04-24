import ResourceTable from '@/components/shared/ResourceTable';
import type { Column, Paginated } from '@/components/shared/ResourceTable';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Ban, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

interface ContratosTableProps {
    rows: Paginated<any> | null;
    isLoading: boolean;
    onEdit: (contrato: any) => void;
    onDelete: (contrato: any) => void;
    onLoadMore: () => void;
    hasMore: boolean;
}

export function ContratosTable({ rows, isLoading, onEdit, onDelete, onLoadMore, hasMore }: ContratosTableProps) {
    const getEstadoBadge = (estado: string) => {
        const config: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline', label: string }> = {
            activo: { variant: 'default', label: 'Activo' },
            suspendido: { variant: 'secondary', label: 'Suspendido' },
            finalizado: { variant: 'destructive', label: 'Finalizado' },
        };
        const { variant, label } = config[estado] || { variant: 'outline' as const, label: estado };
        return <Badge variant={variant}>{label}</Badge>;
    };

    const columns: Column<any>[] = [
        {
            label: 'Personal',
            className: 'text-left',
            render: (row) => (
                <div className="flex flex-col items-start">
                    <span className="font-medium">{row.user?.nombre_completo}</span>
                    <span className="text-xs text-muted-foreground">{row.user?.email}</span>
                </div>
            ),
        },
        {
            label: 'Tipo Contrato',
            render: (row) => row.tipo_contrato_label,
        },
        {
            label: 'Sueldo Base',
            render: (row) => formatCurrency(row.sueldo_base),
        },
        {
            label: 'Horas/Semana',
            render: (row) => `${row.horas_semanales}h`,
        },
        {
            label: 'Horario',
            render: (row) => {
                const horario = row.user?.horario_asistencia;
                return (
                    <div className="flex items-center justify-center gap-1 text-xs">
                        <Clock className="size-3" />
                        {horario?.hora_ingreso && horario?.hora_salida
                            ? `${horario.hora_ingreso.substring(0, 5)} - ${horario.hora_salida.substring(0, 5)}`
                            : '—'}
                    </div>
                );
            },
        },
        {
            label: 'Tolerancia',
            render: (row) => {
                const horario = row.user?.horario_asistencia;
                return horario?.minutos_tolerancia ? `${horario.minutos_tolerancia} min` : '—';
            },
        },
        {
            label: 'Estado',
            render: (row) => getEstadoBadge(row.estado),
        },
    ];

    const extraActions = (row: any) => (
        <>
            {row.estado === 'activo' && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-amber-600 hover:bg-amber-50"
                    title="Suspender"
                    onClick={async () => {
                        if (confirm('¿Deseas suspender este contrato?')) {
                            await axios.post(`/api/rh/contratos/${row.contrato_id}/suspender`);
                            window.location.reload(); // Quick fix or pass refetch
                        }
                    }}
                >
                    <Ban className="size-3.5" />
                </Button>
            )}
            {row.estado === 'suspendido' && (
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-green-600 hover:bg-green-50"
                    title="Reactivar"
                    onClick={async () => {
                        await axios.post(`/api/rh/contratos/${row.contrato_id}/reactivar`);
                        window.location.reload();
                    }}
                >
                    <CheckCircle className="size-3.5" />
                </Button>
            )}
        </>
    );

    if (!rows && isLoading) {
        return <div className="text-center py-8">Cargando...</div>;
    }

    return (
        <ResourceTable
            rows={rows || { data: [], current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 }}
            columns={columns}
            getKey={(row) => row.contrato_id}
            onEdit={onEdit}
            onDelete={onDelete}
            extraActions={extraActions}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            loading={isLoading}
        />
    );
}
