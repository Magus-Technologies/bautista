import { Head, Link } from '@inertiajs/react';
import { Users, Search, ArrowLeft, Phone, MapPin, IdCard, ChevronRight, Award, Calendar, TrendingUp } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import PageHeader from '@/components/shared/PageHeader';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Panel Docente', href: '/docente/dashboard' },
    { title: 'Mis Alumnos', href: '/docente/mis-alumnos' },
];

type Alumno = {
    estu_id: number;
    doc_numero: string | null;
    primer_nombre: string | null;
    segundo_nombre: string | null;
    apellido_paterno: string | null;
    apellido_materno: string | null;
    fecha_nacimiento: string | null;
    telefono: string | null;
    direccion: string | null;
    grado: string | null;
    seccion: string | null;
    nivel: string | null;
    foto?: string;
};

type Props = {
    alumnos: Alumno[];
};

export default function MisAlumnosPage({ alumnos }: Props) {
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Alumno | null>(null);

    const filtrados = useMemo(() => {
        return alumnos.filter(a => {
            const q = search.toLowerCase();
            const nombreCompleto = `${a.primer_nombre} ${a.segundo_nombre} ${a.apellido_paterno} ${a.apellido_materno}`.toLowerCase();
            const dni = (a.doc_numero ?? '').toLowerCase();
            return nombreCompleto.includes(q) || dni.includes(q);
        });
    }, [alumnos, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Directorio de Alumnos" />

            <div className="min-h-screen bg-[#F8FAFC] p-8 space-y-8 animate-in fade-in duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader 
                        icon={Users} 
                        title="Directorio de Alumnos" 
                        subtitle="Consulta la información detallada y de contacto de tus estudiantes."
                        iconColor="bg-emerald-600"
                    />
                    <Link href="/docente/dashboard">
                        <Button variant="ghost" className="rounded-2xl font-bold bg-white shadow-sm border-none hover:bg-gray-50 uppercase text-[10px] tracking-widest h-11 px-6">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Panel Principal
                        </Button>
                    </Link>
                </div>

                {/* Search & Stats Section */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                    <Card className="lg:col-span-3 p-4 rounded-[2rem] border-none shadow-sm bg-white">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                            <Input
                                placeholder="Buscar por nombres, apellidos o DOI..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-14 h-14 rounded-2xl border-none bg-gray-50/50 font-black text-sm focus:ring-4 focus:ring-emerald-100 transition-all placeholder:text-gray-400 text-gray-700"
                            />
                        </div>
                    </Card>
                    <Card className="bg-emerald-600 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-xl shadow-emerald-100/50 border-none relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Users size={80} />
                        </div>
                        <div className="relative">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Estudiantes</p>
                            <p className="text-4xl font-black tabular-nums tracking-tighter">{alumnos.length}</p>
                        </div>
                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center relative">
                            <TrendingUp size={24} />
                        </div>
                    </Card>
                </div>

                {/* Grid Section */}
                {filtrados.length === 0 ? (
                    <Card className="rounded-[3rem] border-none shadow-sm bg-white p-20 text-center space-y-4">
                        <div className="size-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 mx-auto">
                            <Users size={40} />
                        </div>
                        <div className="max-w-xs mx-auto space-y-2">
                            <p className="font-black uppercase tracking-widest text-sm text-gray-900">Sin Resultados</p>
                            <p className="text-xs font-bold text-gray-400 leading-relaxed">No se encontraron estudiantes que coincidan con tu búsqueda.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtrados.map((a) => (
                            <Card 
                                key={a.estu_id} 
                                className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 bg-white cursor-pointer group flex flex-col justify-between min-h-[320px]"
                                onClick={() => setSelectedStudent(a)}
                            >
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between">
                                        <div className="size-16 rounded-[1.8rem] bg-emerald-50 flex items-center justify-center font-black text-emerald-600 text-xl uppercase shadow-inner group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                                            {a.foto ? (
                                                <img src={a.foto} className="size-full rounded-[1.8rem] object-cover" />
                                            ) : (
                                                `${a.primer_nombre?.[0]}${a.apellido_paterno?.[0]}`
                                            )}
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-xl text-gray-300 group-hover:text-emerald-600 transition-colors">
                                            <ChevronRight size={20} />
                                        </Button>
                                    </div>

                                    <div>
                                        <h3 className="font-black text-gray-900 text-sm leading-tight uppercase group-hover:text-emerald-600 transition-colors line-clamp-2">
                                            {a.primer_nombre} {a.segundo_nombre} <br/> 
                                            <span className="text-gray-400 group-hover:text-emerald-400">{a.apellido_paterno} {a.apellido_materno}</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                            <Badge className="rounded-lg bg-emerald-600 text-white border-none font-black uppercase text-[9px] tracking-tight px-3 py-1 shadow-none">
                                                {a.nivel || 'N/A'}
                                            </Badge>
                                            <Badge className="rounded-lg bg-emerald-50 text-emerald-700 border-none font-black uppercase text-[9px] tracking-tight px-3 py-1 shadow-none">
                                                {[a.grado, a.seccion].filter(Boolean).join(' — ')}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2 border-t border-gray-50">
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-500">
                                                <IdCard size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold font-mono tracking-tight">{a.doc_numero ?? '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-gray-500">
                                            <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-emerald-500">
                                                <Phone size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold">{a.telefono ?? 'No registrado'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Student Detail Modal */}
            {selectedStudent && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setSelectedStudent(null)}
                >
                    <Card 
                        className="w-full max-w-xl rounded-[3rem] border-none shadow-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95 duration-300 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-6">
                            <div className="size-24 rounded-[2.5rem] bg-emerald-50 flex items-center justify-center font-black text-emerald-600 text-3xl uppercase shadow-inner">
                                {selectedStudent.foto ? (
                                    <img src={selectedStudent.foto} className="size-full rounded-[2.5rem] object-cover" />
                                ) : (
                                    `${selectedStudent.primer_nombre?.[0]}${selectedStudent.apellido_paterno?.[0]}`
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-gray-900 leading-tight uppercase">
                                    {selectedStudent.primer_nombre} {selectedStudent.segundo_nombre} <br/>
                                    {selectedStudent.apellido_paterno} {selectedStudent.apellido_materno}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge className="rounded-lg bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest border-none">
                                        {selectedStudent.nivel || 'S/N'}
                                    </Badge>
                                    <Badge className="rounded-lg bg-emerald-100 text-emerald-700 font-black uppercase text-[10px] tracking-widest border-none">
                                        ID {selectedStudent.estu_id}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-lg border-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-widest">
                                        Alumno Regular
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="p-5 rounded-[2rem] bg-gray-50/50 border border-gray-100 space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Phone size={12} className="text-emerald-500" /> WhatsApp / Movil
                                </p>
                                <p className="font-bold text-gray-900 text-sm">{selectedStudent.telefono ?? 'No registrado'}</p>
                            </div>
                            <div className="p-5 rounded-[2rem] bg-gray-50/50 border border-gray-100 space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <IdCard size={12} className="text-emerald-500" /> Documento (DOI)
                                </p>
                                <p className="font-bold font-mono text-gray-900 text-sm">{selectedStudent.doc_numero ?? '—'}</p>
                            </div>
                            <div className="p-5 rounded-[2rem] bg-gray-50/50 border border-gray-100 space-y-1 sm:col-span-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} className="text-emerald-500" /> Domicilio Registrado
                                </p>
                                <p className="font-bold text-gray-900 text-sm">{selectedStudent.direccion ?? 'Dirección no disponible'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-4 rounded-[2rem] bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Nivel</p>
                                <p className="font-black text-emerald-700 text-sm truncate">{selectedStudent.nivel || '—'}</p>
                            </div>
                            <div className="p-4 rounded-[2rem] bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Grado</p>
                                <p className="font-black text-emerald-700 text-sm truncate">{selectedStudent.grado || '—'}</p>
                            </div>
                            <div className="p-4 rounded-[2rem] bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Sección</p>
                                <p className="font-black text-emerald-700 text-sm truncate">{selectedStudent.seccion || '—'}</p>
                            </div>
                        </div>

                        <Button 
                            onClick={() => setSelectedStudent(null)}
                            className="w-full h-14 rounded-2xl bg-gray-900 text-white hover:bg-black font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Cerrar Expediente
                        </Button>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
}
