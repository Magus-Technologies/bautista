<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $perms = [
            'rh.trabajador.ver',
            'rh.trabajador.asistencia',
            'rh.trabajador.boletas',
        ];

        foreach ($perms as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Todos los roles de personal (excluye estudiantes y padres de familia)
        $workerRoles = ['administrador', 'docente', 'psicologo', 'rh', 'usuario', 'vi'];
        foreach ($workerRoles as $roleName) {
            $role = Role::where('name', $roleName)->first();
            if ($role) {
                $role->givePermissionTo($perms);
            }
        }
    }

    public function down(): void
    {
        Permission::whereIn('name', [
            'rh.trabajador.ver',
            'rh.trabajador.asistencia',
            'rh.trabajador.boletas',
        ])->delete();
    }
};
