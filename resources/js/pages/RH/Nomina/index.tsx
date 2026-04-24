import { Head } from '@inertiajs/react';
import { DollarSign } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'RH', href: '#' },
    { title: 'Nómina', href: '/rh/nomina' },
];

export default function NominaPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Nómina - RH" />

            <div className="flex flex-col gap-6 p-6">
                <PageHeader
                    icon={DollarSign}
                    title="Gestión de Nómina"
                    subtitle="Cálculo y gestión de pagos al personal"
                    iconColor="bg-green-600"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Módulo en Desarrollo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">
                            El módulo de nómina está en desarrollo. Próximamente podrás gestionar:
                        </p>
                        <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                            <li>Cálculo automático de sueldos</li>
                            <li>Descuentos por tardanzas y ausencias</li>
                            <li>Bonificaciones y horas extras</li>
                            <li>Generación de boletas de pago</li>
                            <li>Reportes de nómina mensual</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
