import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    title: string;
    children: ReactNode;
    className?: string;
    action?: ReactNode;
};

export default function SectionCard({ title, children, className, action }: Props) {
    return (
        <div className={cn(
            'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800',
            className,
        )}>
            <div className="border-b border-gray-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-gray-700 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>
                {action && <div>{action}</div>}
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}
