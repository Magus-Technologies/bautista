import { useState, useEffect } from 'react';
import { CheckCircle2, TrendingUp, XCircle } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import api from '@/lib/api';

interface AsistenciaTabProps {
    cursoId: number;
}

export default function AsistenciaTab({ cursoId }: AsistenciaTabProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/alumno/curso/${cursoId}/asistencia`).then(res => {
            setHistory(res.data);
            setLoading(false);
        });
    }, [cursoId]);

    const stats = {
        P: history.filter(h => h.estado === 'P').length,
        F: history.filter(h => h.estado === 'F').length,
        total: history.length
    };

    const percent = stats.total > 0 ? Math.round((stats.P / stats.total) * 100) : 100;

    if (loading) {
        return <div className="p-20 text-center animate-pulse font-black text-indigo-400 uppercase text-xs tracking-widest">Cargando récord de asistencia...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Porcentaje"
                    value={`${percent}%`}
                    icon={TrendingUp}
                    color="text-indigo-600"
                    iconBg="bg-indigo-500"
                />
                <StatCard
                    title="Asistencias"
                    value={stats.P}
                    icon={CheckCircle2}
                    color="text-emerald-600"
                    iconBg="bg-emerald-500"
                />
                <StatCard
                    title="Inasistencias"
                    value={stats.F}
                    icon={XCircle}
                    color="text-rose-600"
                    iconBg="bg-rose-500"
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black text-gray-900 px-4">Historial de Sesiones</h3>
                <div className="grid gap-3">
                    {history.map((h, i) => (
                        <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm flex items-center justify-between group hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-2xl flex items-center justify-center font-black ${
                                    h.estado === 'P' ? 'bg-emerald-50 text-emerald-600' : 
                                    h.estado === 'F' ? 'bg-rose-50 text-rose-600' : 
                                    'bg-gray-100 text-gray-400'
                                }`}>
                                    {h.estado || '?'}
                                </div>
                                <div>
                                    <p className="font-black text-gray-900">{h.clase_titulo}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                                        {new Date(h.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    h.estado === 'P' ? 'bg-emerald-500 text-white' : 
                                    h.estado === 'F' ? 'bg-rose-500 text-white' : 
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                    {h.estado === 'P' ? 'Presente' : h.estado === 'F' ? 'Falta' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
