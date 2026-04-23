import { Link } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { UserInfo } from '@/components/layout/user-info';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import api from '@/lib/api';
import { clearAuthToken } from '@/plugins/inertia-token-plugin';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
};

export function UserMenuContent({ user }: Props) {
    const cleanup = useMobileNavigation();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthToken();
            // Limpiar cookie de autenticación
            document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
            cleanup();
            // Full reload para limpiar completamente el estado de Inertia/React
            window.location.href = '/login';
        }
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={cleanup}
                    >
                        <Settings className="mr-2" />
                        Mi Perfil
                    </Link>
                </DropdownMenuItem>
                {(user?.rol as any)?.name === 'administrador' && (
                    <DropdownMenuItem asChild>
                        <Link
                            className="block w-full cursor-pointer"
                            href="/settings/appearance"
                            prefetch
                            onClick={cleanup}
                        >
                            <Settings className="mr-2" />
                            Ajustes del Sistema
                        </Link>
                    </DropdownMenuItem>
                )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <button
                    className="block w-full cursor-pointer text-left"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2 inline" />
                    Cerrar sesión
                </button>
            </DropdownMenuItem>
        </>
    );
}
