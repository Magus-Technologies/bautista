import { Head } from '@inertiajs/react';
import { MessageCircle, RefreshCw, Smartphone, Unlink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/layouts/app-layout';
import api from '@/lib/api';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ConfirmModal from '@/components/shared/ConfirmModal';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Configuración', href: '/dashboard' },
    { title: 'WhatsApp', href: '/seguridad/whatsapp' },
];

type Estado = {
    estado: 'conectado' | 'esperando-qr' | 'desconectado' | 'sin-servicio' | string;
    en_cola: number;
    qr: string | null;
    habilitado: boolean;
};

const ETIQUETAS: Record<string, { texto: string; clase: string }> = {
    conectado: { texto: 'Conectado', clase: 'bg-emerald-600 hover:bg-emerald-600' },
    'esperando-qr': { texto: 'Esperando escaneo', clase: 'bg-amber-500 hover:bg-amber-500' },
    desconectado: { texto: 'Desconectado', clase: 'bg-red-600 hover:bg-red-600' },
    'sin-servicio': { texto: 'Servicio apagado', clase: 'bg-slate-500 hover:bg-slate-500' },
};

export default function ConfiguracionWhatsApp() {
    const [estado, setEstado] = useState<Estado | null>(null);
    const [cargando, setCargando] = useState(true);
    const [confirmando, setConfirmando] = useState(false);

    const consultar = useCallback(async () => {
        try {
            const { data } = await api.get('/whatsapp/estado');
            setEstado(data.data);
        } catch {
            setEstado({ estado: 'sin-servicio', en_cola: 0, qr: null, habilitado: false });
        } finally {
            setCargando(false);
        }
    }, []);

    // El QR de WhatsApp caduca cada ~20s, así que refrescamos seguido.
    useEffect(() => {
        consultar();
        const id = setInterval(consultar, 3000);

        return () => clearInterval(id);
    }, [consultar]);

    const desvincular = async () => {
        setConfirmando(false);
        await api.post('/whatsapp/desvincular');
        setCargando(true);
        consultar();
    };

    const etiqueta = ETIQUETAS[estado?.estado ?? ''] ?? {
        texto: estado?.estado ?? 'Desconocido',
        clase: 'bg-slate-500 hover:bg-slate-500',
    };

    const conectado = estado?.estado === 'conectado';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="WhatsApp" />

            <div className="space-y-6 p-4">
                <PageHeader
                    title="WhatsApp institucional"
                    subtitle="Vincula el teléfono desde el que se avisará a los apoderados."
                    icon={MessageCircle}
                    iconColor="bg-emerald-600"
                />

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Estado de la conexión</span>
                                <Badge className={etiqueta.clase}>{etiqueta.texto}</Badge>
                            </CardTitle>
                            <CardDescription>
                                {conectado
                                    ? 'Los avisos de asistencia se están enviando con normalidad.'
                                    : 'Mientras no esté conectado, no se enviará ningún aviso.'}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Mensajes en espera</span>
                                <span className="font-medium">{estado?.en_cola ?? 0}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Envío automático</span>
                                <span className="font-medium">
                                    {estado?.habilitado ? 'Activado' : 'Desactivado'}
                                </span>
                            </div>

                            {estado?.estado === 'sin-servicio' && (
                                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                    El servicio de WhatsApp no responde. Avisa al área de sistemas
                                    para que lo reinicie en el servidor.
                                </p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" size="sm" onClick={consultar}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Actualizar
                                </Button>

                                {conectado && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setConfirmando(true)}
                                    >
                                        <Unlink className="mr-2 h-4 w-4" />
                                        Desvincular
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vincular teléfono</CardTitle>
                            <CardDescription>
                                Abre WhatsApp en el celular del colegio, entra a{' '}
                                <strong>Dispositivos vinculados</strong> y escanea este código.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed p-6">
                                {cargando && (
                                    <p className="text-sm text-muted-foreground">Consultando...</p>
                                )}

                                {!cargando && estado?.qr && (
                                    <div className="rounded-lg bg-white p-4">
                                        <QRCodeSVG value={estado.qr} size={220} />
                                    </div>
                                )}

                                {!cargando && !estado?.qr && conectado && (
                                    <div className="text-center">
                                        <Smartphone className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
                                        <p className="text-sm font-medium">Teléfono vinculado</p>
                                        <p className="text-sm text-muted-foreground">
                                            No necesitas escanear nada.
                                        </p>
                                    </div>
                                )}

                                {!cargando && !estado?.qr && !conectado && (
                                    <p className="max-w-xs text-center text-sm text-muted-foreground">
                                        No hay código disponible. Si el servicio acaba de iniciar,
                                        espera unos segundos.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmModal
                open={confirmando}
                onClose={() => setConfirmando(false)}
                onConfirm={desvincular}
                title="Desvincular WhatsApp"
                message="Se cerrará la sesión actual y dejarán de enviarse los avisos hasta que escanees un código nuevo. ¿Continuar?"
                confirmText="Sí, desvincular"
                variant="danger"
            />
        </AppLayout>
    );
}
