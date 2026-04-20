import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LucideIcon } from 'lucide-react';

export interface PageTab {
    value: string;
    label: string;
    icon?: LucideIcon;
    content: React.ReactNode;
}

interface Props {
    tabs: PageTab[];
    defaultValue?: string;
    className?: string;
}

/**
 * PageTabs — componente reutilizable de tabs con el estilo global del sistema.
 *
 * Uso:
 * ```tsx
 * <PageTabs
 *   defaultValue="dashboard"
 *   tabs={[
 *     { value: 'dashboard', label: 'Dashboard', icon: BarChart2, content: <DashboardView /> },
 *     { value: 'lista',     label: 'Lista',     icon: Users,     content: <ListView /> },
 *   ]}
 * />
 * ```
 */
export default function PageTabs({ tabs, defaultValue, className }: Props) {
    const first = defaultValue ?? tabs[0]?.value;

    return (
        <Tabs defaultValue={first} className={className}>
            <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap gap-1">
                {tabs.map((tab) => (
                    <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow"
                    >
                        {tab.icon && <tab.icon className="size-3.5" />}
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>

            {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                    {tab.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
