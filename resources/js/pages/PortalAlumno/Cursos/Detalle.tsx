import { Head } from '@inertiajs/react';
import { BookOpen, Bell, BarChart2, MessageSquare, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import PageHeader from '@/components/shared/PageHeader';

// Tab Components
import ContenidoTab from './Tabs/ContenidoTab';
import AnunciosTab from './Tabs/AnunciosTab';
import NotasTab from './Tabs/NotasTab';
import AsistenciaTab from './Tabs/AsistenciaTab';
import MensajeriaTab from './Tabs/MensajeriaTab';

const TABS = [
    { id: "contenido", label: "Contenido", icon: BookOpen },
    { id: "anuncios", label: "Anuncios", icon: Bell },
    { id: "calificaciones", label: "Mis Notas", icon: BarChart2 },
    { id: "asistencia", label: "Asistencia", icon: Calendar },
    { id: "mensajes", label: "Mensajería", icon: MessageSquare },
];

export default function CursoDetalleAlumno({ cursoId }: { cursoId: number }) {
    const [activeTab, setActiveTab] = useState('contenido');
    const [courseData, setCourseData] = useState<any>(null);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [cursoId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const coursesRes = await api.get('/alumno/cursos');
            const currentCourse = coursesRes.data.find((c: any) => c.docen_curso_id === cursoId);
            setCourseData(currentCourse);

            const contentRes = await api.get(`/alumno/curso/${cursoId}`);
            setUnidades(contentRes.data.unidades || []);
            
            if (!courseData && contentRes.data.curso) {
                setCourseData({ curso: contentRes.data.curso });
            }
        } catch (error) {
            console.error("Error cargando detalle del curso", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="font-black text-xs uppercase tracking-widest text-gray-400 animate-pulse">Cargando Curso...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Mis Cursos', href: '/alumno/cursos' },
        { title: courseData?.curso?.nombre || 'Curso', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${courseData?.curso?.nombre || 'Curso'}`} />
            
            <div className="min-h-screen bg-[#F8FAFC]">
                <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-0">
                    <PageHeader 
                        icon={BookOpen}
                        title={courseData?.curso?.nombre || 'Curso'}
                        subtitle={`Código: COD-${courseData?.curso_id} • ${courseData?.docente?.perfil?.primer_nombre || ''} ${courseData?.docente?.perfil?.apellido_paterno || ''}`}
                        iconColor="bg-blue-600"
                    />
                </div>

                {/* Navigation Tabs */}
                <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm mt-4">
                    <div className="max-w-7xl mx-auto px-2 sm:px-6 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl my-2 w-fit">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg transition-all font-bold text-xs whitespace-nowrap
                                            ${isActive
                                                ? 'bg-white shadow text-gray-900'
                                                : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Icon size={14} />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                {/* Tab Content */}
                <main className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-8 pb-20">
                    {activeTab === 'contenido' && <ContenidoTab unidades={unidades} />}
                    {activeTab === 'anuncios' && <AnunciosTab cursoId={cursoId} />}
                    {activeTab === 'calificaciones' && <NotasTab cursoId={cursoId} />}
                    {activeTab === 'asistencia' && <AsistenciaTab cursoId={cursoId} />}
                    {activeTab === 'mensajes' && <MensajeriaTab teacher={courseData?.docente} cursoId={cursoId} />}
                </main>
            </div>
        </AppLayout>
    );
}
