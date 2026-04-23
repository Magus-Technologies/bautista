import { Head } from '@inertiajs/react';
import { ScanLine, ShieldCheck, Download, User as UserIcon, Building, CreditCard, Layout } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FotocheckCardPreview from './components/FotocheckCardPreview';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mi Panel', href: '/dashboard' },
    { title: 'Credencial Digital', href: '/credencial' },
];

export default function CredencialDigital() {
    const [user, setUser] = useState<any>(null);
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/auth/me'),
            api.get('/configuracion-fotocheck')
        ]).then(([userRes, configRes]) => {
            setUser(userRes.data.data || userRes.data);
            setConfig(configRes.data);
        })
        .catch(err => console.error("Error fetching data:", err))
        .finally(() => setLoading(false));
    }, []);

    const handleDownloadPDF = () => {
        window.open('/mi-fotocheck', '_blank');
    };

    // Preparar datos para el componente FotocheckCardPreview
    const getFotocheckUser = () => {
        if (!user) return null;
        
        // Detectar si es docente
        const isDocente = user.docente || user.rol === 'DOCENTE' || user.rol_name === 'DOCENTE';
        
        if (isDocente) {
            // Datos para docente
            return {
                id: user.docente?.docente_id || user.id,
                name: user.name,
                rol_name: 'DOCENTE',
                isDocente: true,
                avatar: user.avatar,
                details: {
                    student_id: user.docente?.docente_id ? `DOC-${user.docente.docente_id.toString().padStart(6, '0')}` : `DOC-${user.id.toString().padStart(6, '0')}`,
                    dni: user.perfil?.doc_numero,
                    especialidad: user.docente?.especialidad,
                    tel: user.perfil?.telefono,
                }
            };
        }
        
        // Datos para estudiante
        const matricula = user.estudiante?.matriculas?.[0];
        const seccion = matricula?.seccion;

        return {
            id: user.id,
            name: user.name,
            rol_name: user.rol,
            avatar: user.avatar,
            details: {
                student_id: user.estudiante?.estu_id ? `EST-${user.estudiante.estu_id.toString().padStart(6, '0')}` : undefined,
                dni: user.perfil?.doc_numero,
                grado: seccion?.grado?.nombre_grado,
                nivel: seccion?.grado?.nivel?.nombre_nivel,
                seccion: seccion?.nombre,
                tel: user.perfil?.telefono,
            }
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} variant="sidebar">
            <Head title="Mi Credencial Digital" />
            
            <div className="flex flex-col gap-8 p-6 lg:p-12 items-center min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
                <PageHeader
                    icon={ScanLine}
                    title="Mi Credencial Digital"
                    subtitle="Identificación institucional oficial para acceso y registro de asistencia."
                    iconColor="bg-blue-600"
                />

                <Tabs defaultValue="qr" className="w-full max-w-4xl flex flex-col items-center">
                    <TabsList className="bg-white/50 p-1.5 rounded-2xl border border-gray-100 mb-8 shadow-sm">
                        <TabsTrigger value="qr" className="rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                            <Layout className="size-3.5" />
                            QR de Asistencia
                        </TabsTrigger>
                        <TabsTrigger value="card" className="rounded-xl px-8 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all gap-2">
                            <CreditCard className="size-3.5" />
                            Mi Carnet Digital
                        </TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="p-20 text-blue-600 font-black animate-pulse uppercase tracking-widest text-xs">Cargando credencial...</div>
                    ) : (
                        <>
                            {/* TAB 1: QR Rápido */}
                            <TabsContent value="qr" className="w-full flex justify-center mt-0 focus-visible:outline-none">
                                <div className="group relative w-full max-w-sm aspect-[3/4.6] flex flex-col items-center justify-between overflow-hidden rounded-[3rem] bg-white p-10 pb-12 shadow-2xl ring-1 ring-gray-100 transition-all hover:shadow-blue-200/40">
                                    <div className="absolute top-0 h-40 w-full bg-blue-600 opacity-[0.03]" />
                                    
                                    <div className="z-10 flex flex-col items-center text-center w-full">
                                        <div className="mb-4 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 ring-1 ring-blue-100">
                                            <ShieldCheck className="size-3" />
                                            Acceso Autorizado
                                        </div>
                                        <div className="relative mb-4">
                                            <div className="size-20 rounded-[2rem] bg-blue-50 flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} className="size-full object-cover" />
                                                ) : (
                                                    <UserIcon className="size-10 text-blue-200" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 size-7 bg-white rounded-xl shadow-md flex items-center justify-center">
                                                <Building className="size-4 text-blue-600" />
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-black text-gray-900 leading-tight mb-1 uppercase tracking-tight">
                                            {user?.name || 'Personal'}
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">
                                            {user?.rol_name || user?.rol || 'Miembro'}
                                        </p>
                                    </div>

                                    <div className="relative p-5 rounded-[2.5rem] bg-white shadow-inner ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-500 my-4">
                                        <div className="absolute inset-0 p-1">
                                            <div className="h-full w-full rounded-[2.2rem] border-2 border-dashed border-blue-100" />
                                        </div>
                                        {user && (
                                            <QRCodeSVG value={user.id.toString()} size={160} level="H" className="relative z-10" />
                                        )}
                                    </div>

                                    <Button 
                                        onClick={handleDownloadPDF}
                                        className="w-full h-12 rounded-2xl bg-gray-900 text-white hover:bg-black font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl active:scale-95 transition-all"
                                    >
                                        <Download className="size-4" /> Bajar Carnet PDF
                                    </Button>
                                </div>
                            </TabsContent>

                            {/* TAB 2: Carnet Visual */}
                            <TabsContent value="card" className="w-full flex flex-col items-center gap-8 mt-0 focus-visible:outline-none">
                                {user && config && (
                                    <>
                                        <FotocheckCardPreview 
                                            user={getFotocheckUser()!} 
                                            config={config} 
                                            className="scale-[1.5] sm:scale-[1.7] transform origin-top mb-64"
                                        />
                                        <Button 
                                            onClick={handleDownloadPDF}
                                            variant="outline"
                                            className="rounded-2xl h-12 px-12 border-blue-200 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 gap-2 shadow-sm"
                                        >
                                            <Download className="size-4" /> Descargar Fotocheck Oficial
                                        </Button>
                                    </>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>

                <p className="text-sm text-gray-400 flex items-center gap-2 font-medium mt-16">
                    <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Identificación Institucional - Bautista La Pascana
                </p>
            </div>
        </AppLayout>
    );
}
