<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    /**
     * Permiso propio para la vinculación del WhatsApp institucional, así se
     * puede delegar sin dar acceso a roles y permisos.
     */
    public function up(): void
    {
        Permission::firstOrCreate(['name' => 'seguridad.whatsapp.ver', 'guard_name' => 'web']);

        $admin = Role::where('name', 'administrador')->first();

        if ($admin) {
            $admin->givePermissionTo('seguridad.whatsapp.ver');
        }
    }

    public function down(): void
    {
        Permission::where('name', 'seguridad.whatsapp.ver')->delete();
    }
};
