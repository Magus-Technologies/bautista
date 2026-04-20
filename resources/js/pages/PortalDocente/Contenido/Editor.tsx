import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    BookOpen, 
    MessageSquare, 
    BarChart3, 
    Users, 
    Settings, 
    Calendar,
    Mail,
    Sparkles
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import PageHeader from '@/components/shared/PageHeader';
import type { BreadcrumbItem } from '@/types';

// Tab Components
import ContenidoTab from './Tabs/ContenidoTab';
import AnunciosTab from './Tabs/AnunciosTab';
import MensajeriaTab from './MensajeriaTab';
import CalificacionesTab from './Tabs/CalificacionesTab';
import AsistenciaTab from './Tabs/AsistenciaTab';
import AlumnosTab from './Tabs/AlumnosTab';
import ConfiguracionTab from './Tabs/ConfiguracionTab';
import ActividadesTab from './Tabs/ActividadesTab';

const TABS = [
    { id: "contenido", label: "Contenido", icon: BookOpen },
    { id: "actividades", label: "Actividades", icon: Sparkles },
    { id: "anuncios", label: "Anuncios", icon: MessageSquare },
    { id: "mensajeria", label: "Mensajería", icon: Mail },
    { id: "calificaciones", label: "Calificaciones", icon: BarChart3 },
    { id: "asistencia", label: "Asistencia", icon: Calendar },
    { id: "alumnos", label: "Alumnos", icon: Users },
    { id: "configuracion", label: "Configuración", icon: Settings },
];

export default function ContenidoEditor({ docenteCursoId }: { docenteCursoId: number }) {
    const [activeTab, setActiveTab] = useState("contenido");
    const [courseData, setCourseData] = useState<any>(null);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadBasicData();
    }, [docenteCursoId]);

    const loadBasicData = async () => {
        try {
            setLoading(true);

            const contentRes = await api.get(`/docente/curso/${docenteCursoId}/contenido`);
            const unidadesData = contentRes.data as any[];
            setUnidades(unidadesData);
            if (unidadesData.length > 0) {
                setExpanded({ [unidadesData[0].unidad_id]: true });
            }

            // Load course metadata (best-effort — may fail for non-docente roles)
            try {
                const courseRes = await api.get('/docente/mis-cursos');
                const current = courseRes.data.find((c: any) => c.docen_curso_id === docenteCursoId);
                if (current) {
                    setCourseData(current);
                } else if (unidadesData.length > 0) {
                    // Fallback: build minimal courseData from the content response
                    setCourseData({
                        docen_curso_id: docenteCursoId,
                        curso_id: unidadesData[0].curso_id,
                        curso: { nombre: unidadesData[0].curso?.nombre ?? 'Curso' },
                    });
                }
            } catch {
                // Admin or non-docente user: build minimal courseData from content
                if (unidadesData.length > 0) {
                    setCourseData({
                        docen_curso_id: docenteCursoId,
                        curso_id: unidadesData[0].curso_id,
                        curso: { nombre: unidadesData[0].curso?.nombre ?? 'Curso' },
                    });
                }
            }
        } catch (error) {
            console.error("Error loading course data", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex h-[80vh] items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                        <p className="font-black text-xs uppercase tracking-widest text-gray-400 animate-pulse">Preparando Entorno...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Mis Cursos', href: '/docente/mis-cursos' },
        { title: courseData?.curso?.nombre || 'Curso', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editor - ${courseData?.curso?.nombre}`} />
            
            <div className="min-h-screen bg-[#F8FAFC]">
                <div className="px-4 sm:px-8 pt-4 sm:pt-8 pb-0">
                    <PageHeader 
                        icon={BookOpen}
                        title={courseData?.curso?.nombre || 'Curso'}
                        subtitle={`COD-${courseData?.curso?.id || courseData?.curso_id} · Portal Docente`}
                        iconColor="bg-emerald-600"
                    />
                </div>

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

                <main className="max-w-7xl mx-auto px-3 sm:px-8 py-4 sm:py-8 pb-20">
                    {activeTab === "contenido" && (
                        <ContenidoTab 
                            unidades={unidades} 
                            expanded={expanded} 
                            setExpanded={setExpanded} 
                            docenteCursoId={docenteCursoId} 
                            courseData={courseData}
                            onRefresh={loadBasicData}
                        />
                    )}
                    {activeTab === "actividades" && (
                        <ActividadesTab 
                            courseData={courseData}
                            docenteCursoId={docenteCursoId}
                            onRefresh={loadBasicData}
                        />
                    )}
                    {activeTab === "anuncios" && <AnunciosTab docenteCursoId={docenteCursoId} />}
                    {activeTab === "mensajeria" && <MensajeriaTab docenteCursoId={docenteCursoId} />}
                    {activeTab === "calificaciones" && <CalificacionesTab docenteCursoId={docenteCursoId} />}
                    {activeTab === "asistencia" && <AsistenciaTab docenteCursoId={docenteCursoId} />}
                    {activeTab === "alumnos" && <AlumnosTab docenteCursoId={docenteCursoId} />}
                    {activeTab === "configuracion" && (
                        <ConfiguracionTab 
                            docenteCursoId={docenteCursoId} 
                            courseData={courseData}
                            onRefresh={loadBasicData}
                        />
                    )}
                </main>
            </div>
        </AppLayout>
    );
}
