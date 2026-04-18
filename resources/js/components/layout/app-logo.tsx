import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface AppLogoProps {
    variant?: 'sidebar' | 'header';
    className?: string;
}

export default function AppLogo({ variant = 'header', className }: AppLogoProps) {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed' && !isMobile;

    if (variant === 'sidebar') {
        return (
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center px-0" : "px-2", className)}>
                <img 
                    src="/esama.png" 
                    alt="IEP Bautista" 
                    className={cn(
                        "object-contain rounded-lg shadow-md ring-1 ring-white/10 transition-all duration-200",
                        isCollapsed ? "size-7" : "size-10"
                    )}
                />
                {!isCollapsed && (
                    <div className="flex flex-col text-left leading-none min-w-0">
                        <span className="truncate font-black text-white text-[13px] tracking-tight uppercase">
                            IEP Bautista
                        </span>
                        <span className="truncate text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 opacity-80">
                            La Pascana
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
             <img 
                src="/esama.png" 
                alt="IEP Bautista" 
                className="size-8 object-contain rounded-md"
            />
            <div className="flex flex-col text-left leading-none">
                <span className="truncate font-bold text-white text-sm tracking-tight uppercase">
                    IEP Bautista
                </span>
                <span className="truncate text-[9px] font-medium text-sidebar-foreground/60 uppercase tracking-widest mt-0.5">
                    La Pascana
                </span>
            </div>
        </div>
    );
}

