import { Link } from '@inertiajs/react';
import { Users, CreditCard, BookOpen, ChevronRight, MessageSquare, TrendingUp } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import SectionCard from '@/components/shared/SectionCard';

interface Props {
    data: any;
}

export default function PadreDashboard({ data }: Props) {
    const hijos: any[] = data?.hijos ?? [];
    const pagosRecientes: any[] = data?.pagos_recientes ?? [];

    const asistenciaPromedio = hijos.length > 0
        ? Math.round(hijos.reduce((sum: number, h: any) => sum + (h.asistencia ?? 0), 0) / hijos.length)
        : 0;

    return (
        <div className="flex flex-col gap-8">
            {/* Tarjetas de resumen */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <StatCard
                    title="Hijos Registrados"
                    value={hijos.length}
                    icon={Users}
                    color="text-rose-600"
                    iconBg="bg-rose-500"
                    href="/padre/mis-hijos"
                />
                <StatCard
                    title="Asistencia Promedio"
                    value={`${asistenciaPromedio}%`}
                    icon={TrendingUp}
                    color="text-emerald-600"
                    iconBg="bg-emerald-500"
                    href="/padre/asistencia"
                />
                <StatCard
                    title="Último Pago"
                    value={pagosRecientes[0] ? `S/ ${parseFloat(pagosRecientes[0].total ?? pagosRecientes[0].pag_monto ?? 0).toFixed(2)}` : '—'}
                    icon={CreditCard}
                    color="text-indigo-600"
                    iconBg="bg-indigo-500"
                    href="/padre/pagos"
                />
                <StatCard
                    title="Mis Cursos"
                    value="Ver"
                    icon={BookOpen}
                    color="text-amber-600"
                    iconBg="bg-amber-500"
                    href="/padre/cursos"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lista de hijos */}
                {hijos.length > 0 && (
                    <SectionCard title="Mis Hijos">
                        <div className="divide-y divide-gray-50">
                            {hijos.map((hijo: any) => (
                                <Link key={hijo.estu_id} href={`/padre/hijo/${hijo.estu_id}`}
                                    className="flex items-center gap-4 py-3 hover:bg-gray-50 -mx-5 px-5 rounded-xl transition-colors group">
                                    <div className="size-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-black text-sm flex-shrink-0">
                                        {hijo.perfil?.primer_nombre?.charAt(0) ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">
                                            {hijo.perfil?.primer_nombre} {hijo.perfil?.apellido_paterno}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            Asistencia: <span className={`font-bold ${(hijo.asistencia ?? 0) >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{hijo.asistencia ?? 0}%</span>
                                        </p>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-400 transition-colors" />
                                </Link>
                            ))}
                        </div>
                        <Link href="/padre/mis-hijos" className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline mt-3">
                            Ver detalle completo <ChevronRight size={12} />
                        </Link>
                    </SectionCard>
                )}

                {/* Pagos recientes */}
                {pagosRecientes.length > 0 && (
                    <SectionCard title="Últimos Pagos">
                        <div className="divide-y divide-gray-50">
                            {pagosRecientes.map((p: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">{p.pag_nombre1 || 'Mensualidad'}</p>
                                        <p className="text-xs text-gray-400">{p.pag_fecha}</p>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">S/ {parseFloat(p.total ?? p.pag_monto ?? 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <Link href="/padre/pagos" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline mt-3">
                            Ver todos los pagos <ChevronRight size={12} />
                        </Link>
                    </SectionCard>
                )}
            </div>

            {/* Mensajería */}
            <div className="flex items-start gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-indigo-900 text-sm">¿Necesitas contactar a un profesor?</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Usa la mensajería para comunicarte directamente.</p>
                </div>
                <Link href="/mensajeria" className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap self-center">
                    Ir →
                </Link>
            </div>
        </div>
    );
}
