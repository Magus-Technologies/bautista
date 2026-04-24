import type { Column } from '@/components/shared/ResourceTable';
import type { Horario } from '../hooks/useHorarios';
import HorarioActions from '../components/HorarioActions';

const turnoLabel = (t: string) => t === 'M' ? 'Mañana' : t === 'T' ? 'Tarde' : 'Noche';

export function getEstudianteColumns(
    currentPage: number,
    perPage: number,
    onEdit: (h: Horario) => void,
    onDelete: (h: Horario) => void
): Column<Horario>[] {
    return [
        { 
            label: '#', 
            render: (_h, i) => (currentPage - 1) * perPage + (i || 0) + 1 
        },
        { 
            label: 'Nivel', 
            render: (h) => h.nivel?.nombre_nivel || <span className="text-gray-400">Sin nivel</span> 
        },
        { 
            label: 'Turno', 
            render: (h) => turnoLabel(h.turno) 
        },
        { 
            label: 'Ingreso', 
            render: (h) => h.hora_ingreso.substring(0, 5) 
        },
        { 
            label: 'Salida', 
            render: (h) => h.hora_salida.substring(0, 5) 
        },
        { 
            label: 'Tolerancia', 
            render: (h) => `${h.minutos_tolerancia || 15} min` 
        },
        { 
            label: 'Acciones', 
            render: (h) => <HorarioActions horario={h} onEdit={onEdit} onDelete={onDelete} /> 
        },
    ];
}

export function getTrabajadorColumns(
    currentPage: number,
    perPage: number,
    onEdit: (h: Horario) => void,
    onDelete: (h: Horario) => void
): Column<Horario>[] {
    return [
        { 
            label: '#', 
            render: (_h, i) => (currentPage - 1) * perPage + (i || 0) + 1 
        },
        { 
            label: 'Rol', 
            render: (h) => h.rol?.name ? (
                <span className="font-medium text-gray-900">
                    {h.rol.name.replace('_', ' ').toUpperCase()}
                </span>
            ) : (
                <span className="text-gray-400">Sin rol asignado</span>
            )
        },
        { 
            label: 'Turno', 
            render: (h) => turnoLabel(h.turno) 
        },
        { 
            label: 'Ingreso', 
            render: (h) => h.hora_ingreso.substring(0, 5) 
        },
        { 
            label: 'Salida', 
            render: (h) => h.hora_salida.substring(0, 5) 
        },
        { 
            label: 'Tolerancia', 
            render: (h) => `${h.minutos_tolerancia || 15} min` 
        },
        { 
            label: 'Acciones', 
            render: (h) => <HorarioActions horario={h} onEdit={onEdit} onDelete={onDelete} /> 
        },
    ];
}
