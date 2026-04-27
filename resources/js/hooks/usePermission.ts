import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage<any>().props;
    const user = auth.user;

    const hasRole = (role: string | string[]) => {
        if (!user || !user.role_list) return false;
        
        const roles = Array.isArray(role) ? role : [role];
        return roles.some(r => user.role_list.includes(r));
    };

    const can = (permission: string | string[]) => {
        if (!user || !user.can_list) return false;

        const permissions = Array.isArray(permission) ? permission : [permission];
        return permissions.some(p => user.can_list.includes(p));
    };

    const isTrabajador = (): boolean => {
        return !!user?.es_trabajador;
    };

    return { hasRole, can, isTrabajador, user };
}
