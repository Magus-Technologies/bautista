import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FileText, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import type { BreadcrumbItem } from '@/types';
import axios from 'axios';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Institución', href: '/institucion' },
    { title: 'Configuración de Comprobantes', href: '#' },
];

interface ConfiguracionComprobante {
    id: number;
    insti_id: number;
    mostrar_logo: boolean;
    color_primario: string;
    color_secundario: string;
    color_fondo_header: string;
    color_texto_comprobante: string;
    color_texto_secundario: string;
    texto_pie_pagina: string | null;
    texto_adicional: string | null;
    mostrar_qr: boolean;
    mostrar_hash: boolean;
    mostrar_firma_digital: boolean;
    mostrar_telefono: boolean;
    mostrar_email: boolean;
    formato_serie: string;
    digitos_numero: number;
    tamano_fuente_base: number;
    tamano_fuente_titulo: number;
}

interface Institucion {
    insti_id: number;
    insti_ruc: string;
    insti_razon_social: string;
    insti_direccion: string;
    insti_telefono1: string | null;
    insti_telefono2: string | null;
    insti_email: string | null;
    insti_logo: string | null;
}

export default function ConfiguracionComprobantePage() {
    const [config, setConfig] = useState<ConfiguracionComprobante | null>(null);
    const [institucion, setInstitucion] = useState<Institucion | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    useEffect(() => {
        loadConfig();
        loadInstitucion();
    }, []);

    const loadConfig = async () => {
        try {
            const { data } = await axios.get('/api/configuracion-comprobante');
            setConfig(data.config);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadInstitucion = async () => {
        try {
            const { data } = await axios.get('/api/instituciones');
            if (data.data && data.data.length > 0) {
                setInstitucion(data.data[0]);
            }
        } catch (error) {
            console.error('Error al cargar institución:', error);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setSuccess(false);

        try {
            await axios.put('/api/configuracion-comprobante', config);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error al guardar:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateConfig = (field: keyof ConfiguracionComprobante, value: any) => {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    };

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Configuración de Comprobantes" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-gray-500">Cargando configuración...</p>
                </div>
            </AppLayout>
        );
    }

    if (!config) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Configuración de Comprobantes" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-red-500">Error al cargar la configuración</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de Comprobantes" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-[1600px] mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <PageHeader
                        icon={FileText}
                        title="Configuración de Comprobantes"
                        subtitle="Personaliza la apariencia de tus boletas y facturas electrónicas"
                        iconColor="bg-blue-600"
                    />
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-9 bg-[#00a65a] hover:bg-[#008d4c] text-white text-xs font-bold gap-2"
                        >
                            <Save className="size-4" />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                        ✓ Configuración guardada correctamente
                    </div>
                )}

                {/* Layout de 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna Izquierda: Configuraciones */}
                    <div className="space-y-6">{/* Colores */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Colores</CardTitle>
                        <CardDescription>Personaliza los colores del comprobante</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Color Primario (Bordes y Totales)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.color_primario}
                                        onChange={(e) => updateConfig('color_primario', e.target.value)}
                                        className="w-16 h-9 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color_primario}
                                        onChange={(e) => updateConfig('color_primario', e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Secundario (Tabla Header)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.color_secundario}
                                        onChange={(e) => updateConfig('color_secundario', e.target.value)}
                                        className="w-16 h-9 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color_secundario}
                                        onChange={(e) => updateConfig('color_secundario', e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Fondo Header</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.color_fondo_header}
                                        onChange={(e) => updateConfig('color_fondo_header', e.target.value)}
                                        className="w-16 h-9 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color_fondo_header}
                                        onChange={(e) => updateConfig('color_fondo_header', e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Texto Comprobante</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.color_texto_comprobante}
                                        onChange={(e) => updateConfig('color_texto_comprobante', e.target.value)}
                                        className="w-16 h-9 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color_texto_comprobante}
                                        onChange={(e) => updateConfig('color_texto_comprobante', e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Texto Secundario</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="color"
                                        value={config.color_texto_secundario}
                                        onChange={(e) => updateConfig('color_texto_secundario', e.target.value)}
                                        className="w-16 h-9 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={config.color_texto_secundario}
                                        onChange={(e) => updateConfig('color_texto_secundario', e.target.value)}
                                        className="flex-1 h-9 text-sm"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Elementos a Mostrar */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Elementos a Mostrar</CardTitle>
                        <CardDescription>Selecciona qué información mostrar en el comprobante</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                                <Label>Mostrar Logo</Label>
                                <Switch
                                    checked={config.mostrar_logo}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_logo', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Mostrar QR</Label>
                                <Switch
                                    checked={config.mostrar_qr}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_qr', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Mostrar Hash</Label>
                                <Switch
                                    checked={config.mostrar_hash}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_hash', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Mostrar Firma Digital</Label>
                                <Switch
                                    checked={config.mostrar_firma_digital}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_firma_digital', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Mostrar Teléfono</Label>
                                <Switch
                                    checked={config.mostrar_telefono}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_telefono', v)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Mostrar Email</Label>
                                <Switch
                                    checked={config.mostrar_email}
                                    onCheckedChange={(v: boolean) => updateConfig('mostrar_email', v)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Textos Personalizados */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Textos Personalizados</CardTitle>
                        <CardDescription>Agrega textos adicionales al comprobante</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Texto Pie de Página</Label>
                            <Textarea
                                value={config.texto_pie_pagina ?? ''}
                                onChange={(e) => updateConfig('texto_pie_pagina', e.target.value)}
                                placeholder="Ej: Gracias por su preferencia"
                                className="text-sm"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Texto Adicional</Label>
                            <Textarea
                                value={config.texto_adicional ?? ''}
                                onChange={(e) => updateConfig('texto_adicional', e.target.value)}
                                placeholder="Ej: Información adicional o términos y condiciones"
                                className="text-sm"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Formato */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Formato de Numeración</CardTitle>
                        <CardDescription>Configura el formato de series y números</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Dígitos del Número</Label>
                                <Input
                                    type="number"
                                    value={config.digitos_numero}
                                    onChange={(e) => updateConfig('digitos_numero', parseInt(e.target.value))}
                                    min={1}
                                    max={12}
                                    className="h-9 text-sm"
                                />
                                <p className="text-xs text-gray-500">Ejemplo: 8 dígitos = 00000001</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tamaños de Fuente */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Tamaños de Fuente</CardTitle>
                        <CardDescription>Ajusta el tamaño de las fuentes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tamaño Base (8-16px)</Label>
                                <Input
                                    type="number"
                                    value={config.tamano_fuente_base}
                                    onChange={(e) => updateConfig('tamano_fuente_base', parseInt(e.target.value))}
                                    min={8}
                                    max={16}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tamaño Título (12-24px)</Label>
                                <Input
                                    type="number"
                                    value={config.tamano_fuente_titulo}
                                    onChange={(e) => updateConfig('tamano_fuente_titulo', parseInt(e.target.value))}
                                    min={12}
                                    max={24}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                    </div>

                    {/* Columna Derecha: Vista Previa */}
                    <div className="lg:sticky lg:top-6 h-fit">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Eye className="size-4" />
                                    Vista Previa del Comprobante
                                </CardTitle>
                                <CardDescription>Así se verá tu comprobante con la configuración actual</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Preview del comprobante */}
                                <div 
                                    className="border-2 rounded-lg p-6 bg-white shadow-inner overflow-auto"
                                    style={{ 
                                        maxHeight: '800px',
                                        fontSize: `${config.tamano_fuente_base}px`
                                    }}
                                >
                                    {/* Header */}
                                    <div 
                                        className="text-center pb-4 mb-4"
                                        style={{ borderBottom: `3px solid ${config.color_primario}` }}
                                    >
                                        {config.mostrar_logo && institucion?.insti_logo && (
                                            <div className="mb-2">
                                                <img 
                                                    src={`/storage/${institucion.insti_logo}`} 
                                                    alt="Logo" 
                                                    className="w-20 h-20 mx-auto object-contain"
                                                />
                                            </div>
                                        )}
                                        <div className="font-bold text-sm mb-1">
                                            {institucion?.insti_razon_social || 'INSTITUCIÓN EDUCATIVA'}
                                        </div>
                                        <div className="text-[9px] text-gray-600">
                                            RUC: {institucion?.insti_ruc || '20123456789'}<br />
                                            {institucion?.insti_direccion || 'Av. Ejemplo 123, Lima'}<br />
                                            {config.mostrar_telefono && institucion?.insti_telefono1 && `Tel: ${institucion.insti_telefono1}`}
                                            {config.mostrar_telefono && institucion?.insti_telefono2 && ` / ${institucion.insti_telefono2}`}
                                            {config.mostrar_telefono && institucion?.insti_telefono1 && <br />}
                                            {config.mostrar_email && institucion?.insti_email && `Email: ${institucion.insti_email}`}
                                        </div>
                                    </div>

                                    {/* Comprobante Box */}
                                    <div 
                                        className="rounded-lg p-3 text-center mb-4"
                                        style={{ 
                                            background: config.color_fondo_header,
                                            border: `2px solid ${config.color_primario}`
                                        }}
                                    >
                                        <div 
                                            className="font-bold text-sm mb-1"
                                            style={{ color: config.color_texto_comprobante }}
                                        >
                                            BOLETA DE VENTA ELECTRÓNICA
                                        </div>
                                        <div 
                                            className="font-bold mb-1"
                                            style={{ 
                                                fontSize: `${config.tamano_fuente_titulo}px`,
                                                color: config.color_texto_comprobante
                                            }}
                                        >
                                            B001-{'0'.repeat(config.digitos_numero - 1)}1
                                        </div>
                                        <div className="text-[10px]" style={{ color: config.color_texto_secundario }}>
                                            Fecha de Emisión: <strong>24/04/2026</strong>
                                        </div>
                                    </div>

                                    {/* Cliente */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                        <div 
                                            className="text-[10px] font-bold mb-2 pb-1 border-b"
                                            style={{ color: config.color_primario }}
                                        >
                                            DATOS DEL CLIENTE
                                        </div>
                                        <div className="text-[10px] space-y-1">
                                            <div><span className="font-bold">DNI:</span> 12345678</div>
                                            <div><span className="font-bold">Cliente:</span> Juan Pérez García</div>
                                            <div><span className="font-bold">Forma de Pago:</span> CONTADO</div>
                                        </div>
                                    </div>

                                    {/* Tabla */}
                                    <table className="w-full text-[10px] mb-4 border-collapse">
                                        <thead style={{ background: config.color_secundario, color: 'white' }}>
                                            <tr>
                                                <th className="p-2 text-left border border-gray-300" style={{ width: '10%' }}>Código</th>
                                                <th className="p-2 text-left border border-gray-300" style={{ width: '40%' }}>Descripción</th>
                                                <th className="p-2 text-center border border-gray-300" style={{ width: '10%' }}>Und.</th>
                                                <th className="p-2 text-right border border-gray-300" style={{ width: '10%' }}>Cant.</th>
                                                <th className="p-2 text-right border border-gray-300" style={{ width: '15%' }}>P. Unit.</th>
                                                <th className="p-2 text-right border border-gray-300" style={{ width: '15%' }}>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b border-gray-300">
                                                <td className="p-2 border border-gray-300">MENS-MAR</td>
                                                <td className="p-2 border border-gray-300">SERVICIO EDUCATIVO - MENSUALIDAD MARZO 2026</td>
                                                <td className="p-2 text-center border border-gray-300">ZZ</td>
                                                <td className="p-2 text-right border border-gray-300">1</td>
                                                <td className="p-2 text-right border border-gray-300">S/ 350.00</td>
                                                <td className="p-2 text-right border border-gray-300">S/ 350.00</td>
                                            </tr>
                                            <tr className="bg-gray-50 border-b border-gray-300">
                                                <td className="p-2 border border-gray-300">MATR-2026</td>
                                                <td className="p-2 border border-gray-300">SERVICIO EDUCATIVO - MATRÍCULA 2026</td>
                                                <td className="p-2 text-center border border-gray-300">ZZ</td>
                                                <td className="p-2 text-right border border-gray-300">1</td>
                                                <td className="p-2 text-right border border-gray-300">S/ 200.00</td>
                                                <td className="p-2 text-right border border-gray-300">S/ 200.00</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* Totales */}
                                    <div className="flex justify-end mb-4">
                                        <div className="w-64 text-[11px]">
                                            <div className="flex justify-between py-1">
                                                <span className="font-bold">Op. Gravada:</span>
                                                <span>S/ 550.00</span>
                                            </div>
                                            <div className="flex justify-between py-1">
                                                <span className="font-bold">IGV (18%):</span>
                                                <span>S/ 0.00</span>
                                            </div>
                                            <div 
                                                className="flex justify-between py-2 font-bold text-sm"
                                                style={{ 
                                                    borderTop: `2px solid ${config.color_primario}`,
                                                    color: config.color_primario,
                                                    background: '#f0f9ff'
                                                }}
                                            >
                                                <span>TOTAL:</span>
                                                <span>S/ 550.00</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    {config.mostrar_firma_digital && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                                            <div 
                                                className="text-[9px] font-bold mb-2"
                                                style={{ color: config.color_primario }}
                                            >
                                                INFORMACIÓN DE FIRMA DIGITAL
                                            </div>
                                            <div className="flex gap-3">
                                                <div className="flex-1 text-[8px] space-y-1" style={{ color: config.color_texto_secundario }}>
                                                    <div><strong>Archivo:</strong> 20123456789-01-B001-1</div>
                                                    {config.mostrar_hash && (
                                                        <div><strong>Hash:</strong> abc123def456789abc123def456789abc123def456789</div>
                                                    )}
                                                    <div className="mt-2 text-[7px] italic">
                                                        Representación impresa del comprobante electrónico
                                                    </div>
                                                </div>
                                                {config.mostrar_qr && (
                                                    <div className="flex-shrink-0">
                                                        <div className="text-[7px] text-center mb-1 font-bold" style={{ color: config.color_primario }}>
                                                            CÓDIGO QR
                                                        </div>
                                                        <div className="w-20 h-20 bg-white border-2 border-gray-300 flex items-center justify-center">
                                                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                                                <rect width="100" height="100" fill="white"/>
                                                                {/* Esquinas */}
                                                                <rect x="5" y="5" width="25" height="25" fill="none" stroke="black" strokeWidth="3"/>
                                                                <rect x="10" y="10" width="15" height="15" fill="black"/>
                                                                <rect x="70" y="5" width="25" height="25" fill="none" stroke="black" strokeWidth="3"/>
                                                                <rect x="75" y="10" width="15" height="15" fill="black"/>
                                                                <rect x="5" y="70" width="25" height="25" fill="none" stroke="black" strokeWidth="3"/>
                                                                <rect x="10" y="75" width="15" height="15" fill="black"/>
                                                                {/* Patrón central */}
                                                                <rect x="35" y="35" width="8" height="8" fill="black"/>
                                                                <rect x="50" y="35" width="8" height="8" fill="black"/>
                                                                <rect x="65" y="35" width="8" height="8" fill="black"/>
                                                                <rect x="35" y="50" width="8" height="8" fill="black"/>
                                                                <rect x="50" y="50" width="8" height="8" fill="black"/>
                                                                <rect x="65" y="50" width="8" height="8" fill="black"/>
                                                                <rect x="35" y="65" width="8" height="8" fill="black"/>
                                                                <rect x="50" y="65" width="8" height="8" fill="black"/>
                                                                <rect x="65" y="65" width="8" height="8" fill="black"/>
                                                                <rect x="70" y="70" width="8" height="8" fill="black"/>
                                                                <rect x="80" y="80" width="8" height="8" fill="black"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-[10px] font-bold">
                                            ESTADO: ACEPTADO
                                        </span>
                                    </div>

                                    {config.texto_adicional && (
                                        <div className="text-[8px] text-gray-500 text-center mt-3 italic">
                                            {config.texto_adicional}
                                        </div>
                                    )}

                                    {config.texto_pie_pagina ? (
                                        <div className="text-[8px] text-gray-600 text-center mt-2 font-bold">
                                            {config.texto_pie_pagina}
                                        </div>
                                    ) : (
                                        <div className="text-[8px] text-gray-400 text-center mt-2 italic">
                                            Representación impresa del comprobante electrónico.<br />
                                            Consulte su comprobante en: www.sunat.gob.pe
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
