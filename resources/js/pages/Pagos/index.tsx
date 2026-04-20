import { Head } from '@inertiajs/react';
import { Wallet, BarChart2, Users, FileBarChart2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import PageHeader from '@/components/shared/PageHeader';
import PageTabs from '@/components/shared/PageTabs';
import type { BreadcrumbItem } from '@/types';
import DashboardView from './views/DashboardView';
import PagadoresView from './views/PagadoresView';
import ReporteView from './views/ReporteView';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Pagos', href: '/pagos' },
];

export default function PagosPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pagos" />

            <div className="flex flex-col gap-4 p-4 sm:p-6">
                <PageHeader
                    icon={Wallet}
                    title="Gestión de Pagos"
                    subtitle="Dashboard de cobros y mensualidades"
                    iconColor="bg-green-600"
                />

                <PageTabs
                    defaultValue="dashboard"
                    tabs={[
                        { value: 'dashboard', label: 'Dashboard', icon: BarChart2,    content: <DashboardView /> },
                        { value: 'pagadores', label: 'Pagadores', icon: Users,        content: <PagadoresView /> },
                        { value: 'reporte',   label: 'Reporte',   icon: FileBarChart2, content: <ReporteView /> },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
