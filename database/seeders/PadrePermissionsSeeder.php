<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Seeder de permisos para los roles de familia:
 *   - padre_familia  (11 permisos)
 *   - madre_familia  (11 permisos)
 *   - apoderado      (11 permisos)
 *
 * Los tres roles comparten exactamente los mismos permisos.
 *
 * Uso: php artisan db:seed --class=PadrePermissionsSeeder
 */
class PadrePermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Dashboard
            'dashboard.ver',
            'dashboard.padre.resumen',

            // Perfil
            'perfil.ver',
            'perfil.editar',

            // Recursos
            'recursos.mensajeria.ver',
            'recursos.mensajeria.enviar',

            // Portal Padre/Familia
            'portal.padre.ver',
            'portal.padre.hijos',
            'portal.padre.pagos',
            'portal.padre.cursos',
            'portal.padre.profesores',
            'portal.padre.horario',
        ];

        foreach ($permissions as $perm) {
            Permission::findOrCreate($perm, 'web');
        }

        foreach (['padre_familia', 'madre_familia', 'apoderado'] as $roleName) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($permissions);
            $this->command->info("{$roleName}: " . count($permissions) . ' permisos aplicados.');
        }
    }
}
