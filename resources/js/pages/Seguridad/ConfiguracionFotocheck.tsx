import { Head, usePage } from '@inertiajs/react';
import { Settings2, Save, RotateCcw, Image as ImageIcon, Palette, CreditCard, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AlertModal from '@/components/shared/AlertModal';
import FotocheckCardPreview from '../Shared/components/FotocheckCardPreview';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuración', href: '/dashboard' },
    { title: 'Personalización de Carnets', href: '/seguridad/fotocheck' },
];

export default function ConfiguracionFotocheck() {
    const { auth } = usePage().props as any;
    
    const [config, setConfig] = useState({
        primary_color: '#2c63f2',
        secondary_color: '#7b8780',
        text_color: '#ffffff',
        footer_text: `Periodo Académico ${new Date().getFullYear()}`,
        logo_path: ''
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Alert state
    const [alert, setAlert] = useState<{
        open: boolean;
        variant: 'success' | 'error' | 'warning' | 'info';
        title: string;
        message: string;
    }>({
        open: false,
        variant: 'info',
        title: '',
        message: ''
    });

    // Real user data for preview
    const previewUser = {
        id: auth.user.id,
        name: (auth.user.nombre_completo || auth.user.name || 'USUARIO DE EJEMPLO').toUpperCase(),
        rol_name: (auth.user.rol?.name || auth.user.rol || 'ESTUDIANTE').toUpperCase(),
        avatar: auth.user.avatar || '',
        details: {
            student_id: 'EST-00' + auth.user.id,
            dni: auth.user.doc_numero || '77665544',
            grado: '5TO GRADO',
            nivel: 'PRIMARIA',
            seccion: 'A',
            tel: auth.user.telefono || '999 888 777',
        }
    };

    useEffect(() => {
        api.get('/configuracion-fotocheck')
            .then(res => {
                if (res.data) {
                    const data = { ...res.data };
                    // Si el footer sigue el patrón "Periodo Académico XXXX", actualizar al año actual
                    if (/^Periodo Académico \d{4}$/.test(data.footer_text ?? '')) {
                        data.footer_text = `Periodo Académico ${new Date().getFullYear()}`;
                    }
                    setConfig(data);
                }
            })
            .catch(err => console.error("Error fetching config:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleColorChange = (key: string, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        formData.append('primary_color', config.primary_color);
        formData.append('secondary_color', config.secondary_color);
        formData.append('text_color', config.text_color);
        // El año del periodo siempre se genera automáticamente
        formData.append('footer_text', `Periodo Académico ${new Date().getFullYear()}`);
        if (logoFile) {
            formData.append('logo', logoFile);
        }

        try {
            await api.post('/configuracion-fotocheck', formData);
            setAlert({
                open: true,
                variant: 'success',
                title: '¡Diseño Actualizado!',
                message: 'La configuración del carnet se ha guardado correctamente y ya es visible para todos los usuarios.'
            });
        } catch (err) {
            console.error("Error saving config:", err);
            setAlert({
                open: true,
                variant: 'error',
                title: 'Error al Guardar',
                message: 'Ocurrió un problema al intentar guardar los cambios. Por favor, verifique su conexión e intente nuevamente.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} variant="sidebar">
            <Head title="Personalizar Fotochecks" />
            
            <div className="flex flex-col gap-8 p-6 lg:p-12 min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
                <PageHeader
                    icon={Settings2}
                    title="Diseño de Fotochecks"
                    subtitle="Personaliza los colores, logos y textos de las credenciales institucionales."
                    iconColor="bg-blue-600"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Form Controls */}
                    <div className="flex flex-col gap-6">
                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                    <Palette className="size-4 text-blue-600" /> Colores del Diseño
                                </CardTitle>
                                <CardDescription>Elige la paleta que mejor represente a la institución.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color Primario (Pie y Etiquetas)</Label>
                                    <div className="flex gap-3">
                                        <div 
                                            className="size-10 rounded-xl shadow-inner border border-gray-100" 
                                            style={{ backgroundColor: config.primary_color }}
                                        />
                                        <Input 
                                            type="color" 
                                            value={config.primary_color}
                                            onChange={(e) => handleColorChange('primary_color', e.target.value)}
                                            className="cursor-pointer h-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color de Cuerpo (Fondo Central)</Label>
                                    <div className="flex gap-3">
                                        <div 
                                            className="size-10 rounded-xl shadow-inner border border-gray-100" 
                                            style={{ backgroundColor: config.secondary_color }}
                                        />
                                        <Input 
                                            type="color" 
                                            value={config.secondary_color}
                                            onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                                            className="cursor-pointer h-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Color de Texto (Central)</Label>
                                    <div className="flex gap-3">
                                        <div 
                                            className="size-10 rounded-xl shadow-inner border border-gray-100" 
                                            style={{ backgroundColor: config.text_color }}
                                        />
                                        <Input 
                                            type="color" 
                                            value={config.text_color}
                                            onChange={(e) => handleColorChange('text_color', e.target.value)}
                                            className="cursor-pointer h-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
                            <CardHeader className="bg-white border-b border-gray-100">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                                    <ImageIcon className="size-4 text-emerald-600" /> Identidad Visual
                                </CardTitle>
                                <CardDescription>Sube el logo que aparecerá en la cabecera del carnet.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Logo del Carnet</Label>
                                    <div className="flex items-center gap-4">
                                        <div className="size-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                                            {logoPreview || config.logo_path ? (
                                                <img src={logoPreview || `/storage/${config.logo_path}`} className="object-contain size-full" />
                                            ) : (
                                                <ImageIcon className="size-8 text-gray-300" />
                                            )}
                                        </div>
                                        <Input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                            className="flex-1 rounded-xl h-12 pt-2.5"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>


                        <div className="flex gap-4">
                            <Button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 h-14 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all"
                            >
                                {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
                                Guardar Cambios
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-14 px-8 rounded-2xl border-gray-200 text-gray-500 font-black uppercase tracking-widest gap-2 hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                <RotateCcw className="size-4" /> Reset
                            </Button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="sticky top-12 flex flex-col items-center gap-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <CreditCard className="size-3" /> Previsualización en Vivo
                        </div>
                        <div className="scale-90 xl:scale-100 origin-top">
                             <FotocheckCardPreview 
                                user={previewUser} 
                                config={config} 
                                className="scale-[1.7] transform origin-top mb-44"
                             />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center max-w-xs">
                            Los cambios guardados se aplicarán instantáneamente a todos los carnets digitales y PDF generados.
                        </p>
                    </div>
                </div>
            </div>

            <AlertModal
                open={alert.open}
                onClose={() => setAlert(prev => ({ ...prev, open: false }))}
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
            />
        </AppLayout>
    );
}
