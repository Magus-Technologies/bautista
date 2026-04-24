import { GraduationCap, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    activeTab: 'E' | 'T';
    onTabChange: (tab: 'E' | 'T') => void;
    estudiantesTotal?: number;
    trabajadoresTotal?: number;
};

export default function HorarioTabs({ activeTab, onTabChange, estudiantesTotal, trabajadoresTotal }: Props) {
    return (
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 w-full sm:w-auto self-start">
            <button
                onClick={() => onTabChange('E')}
                className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                    activeTab === 'E'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-700',
                )}
            >
                <GraduationCap className="size-3.5" />
                Estudiantes
                {estudiantesTotal !== undefined && (
                    <span className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-black',
                        activeTab === 'E' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500',
                    )}>
                        {estudiantesTotal}
                    </span>
                )}
            </button>
            <button
                onClick={() => onTabChange('T')}
                className={cn(
                    'flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all',
                    activeTab === 'T'
                        ? 'bg-white shadow text-gray-900'
                        : 'text-gray-500 hover:text-gray-700',
                )}
            >
                <UserCheck className="size-3.5" />
                Trabajadores
                {trabajadoresTotal !== undefined && (
                    <span className={cn(
                        'rounded-full px-1.5 py-px text-[10px] font-black',
                        activeTab === 'T' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500',
                    )}>
                        {trabajadoresTotal}
                    </span>
                )}
            </button>
        </div>
    );
}
