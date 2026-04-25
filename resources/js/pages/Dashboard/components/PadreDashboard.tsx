import { Link } from '@inertiajs/react';
import { Users, CalendarCheck, CreditCard, GraduationCap, ChevronRight, MessageSquare } from 'lucide-react';
import SectionCard from '@/components/shared/SectionCard';

interface Props {
    data: any;
}

export default function PadreDashboard({ data }: Props) {
    const hijos: any[] = data?.hijos ?? [];
    const pagosRecientes: any[] = data?.pagos_recientes ?? [];

    return (
        <div className="flex flex-col gap-6">
            {/* Accesos rápidos */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Emitir Factura',   href: '/padre/dashboard',  icon: Users,         bgColor: 'bg-blue-500' },
                    { label: 'Comprobantes',     href: '/padre/asistencia', icon: CalendarCheck, bgColor: 'bg-blue-500' },
                    { label: 'Historial Pagos',  href: '/padre/pagos',      icon: CreditCard,    bgColor: 'bg-blue-500' },
                ].map(({ label, href, icon: Icon, bgColor }) => (
                    <Link key={label} href={href}
                        className={`relative flex flex-col items-center justify-center gap-3 ${bgColor} rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all group overflow-hidden min-h-[140px]`}>
                        {/* Recuadro oscuro que cubre todo el botón */}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all rounded-2xl" />
                        
                        {/* Icono */}
                        <div className="relative z-10">
                            <Icon size={48} className="text-white drop-shadow-lg" strokeWidth={1.5} />
                        </div>
                        
                        {/* Label */}
                        <span className="relative z-10 text-sm font-bold text-white text-center drop-shadow-md">{label}</span>
                    </Link>
                ))}
            </div>

            {/* Hijos */}
            {hijos.length > 0 && (
                <SectionCard title="Mis Hijos">
                    <div className="divide-y divide-gray-50">
                        {hijos.map((hijo: any) => (
                            <Link key={hijo.estu_id} href={`/padre/hijo/${hijo.estu_id}`}
                                className="flex items-center gap-4 py-3 hover:bg-gray-50 -mx-5 px-5 rounded-xl transition-colors group">
                                <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm flex-shrink-0">
                                    {hijo.perfil?.primer_nombre?.charAt(0) ?? '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-800 text-sm truncate">
                                        {hijo.perfil?.primer_nombre} {hijo.perfil?.apellido_paterno}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Asistencia: <span className={`font-bold ${hijo.asistencia >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>{hijo.asistencia}%</span>
                                    </p>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </Link>
                        ))}
                    </div>
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

            {/* Mensajería */}
            <div className="flex items-start gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-indigo-900 text-sm">¿Necesitas contactar a un profesor?</p>
                    <p className="text-xs text-indigo-600 mt-0.5">Usa la mensajería para comunicarte directamente.</p>
                </div>
                <Link href="/mensajeria" className="text-xs font-bold text-indigo-600 hover:underline whitespace-nowrap">
                    Ir →
                </Link>
            </div>
        </div>
    );
}
