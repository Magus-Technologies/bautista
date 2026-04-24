import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Horario } from '../hooks/useHorarios';

type Props = {
    horario: Horario;
    onEdit: (h: Horario) => void;
    onDelete: (h: Horario) => void;
};

export default function HorarioActions({ horario, onEdit, onDelete }: Props) {
    return (
        <div className="flex gap-1">
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(horario)} 
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
                <Pencil className="h-4 w-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(horario)} 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
