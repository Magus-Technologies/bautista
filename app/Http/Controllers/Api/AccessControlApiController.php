<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AccessControlApiController extends Controller
{
    /**
     * Listar todos los roles con sus permisos.
     */
    public function indexRoles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        return response()->json($roles);
    }

    /**
     * Listar solo los roles marcados como trabajadores.
     */
    public function getRolesTrabajadores(): JsonResponse
    {
        $roles = Role::where('es_trabajador', true)
            ->select('id', 'name', 'es_trabajador')
            ->get();
        return response()->json($roles);
    }

    /**
     * Listar todos los permisos disponibles agrupados por categoría (prefijo).
     */
    public function indexPermissions(): JsonResponse
    {
        $permissions = Permission::all();
        return response()->json($permissions);
    }

    /**
     * Crear un nuevo rol y asignarle permisos.
     */
    public function storeRole(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'unique:roles,name'],
            'es_trabajador' => ['nullable', 'boolean'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name']
        ]);

        $role = Role::create([
            'name'          => $data['name'],
            'guard_name'    => 'web',
            'es_trabajador' => $data['es_trabajador'] ?? false
        ]);

        if (!empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    /**
     * Actualizar un rol y sus permisos.
     */
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $role = Role::findOrFail($id);

        $data = $request->validate([
            'name'          => ['required', 'string', 'unique:roles,name,' . $id],
            'es_trabajador' => ['nullable', 'boolean'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name']
        ]);

        $role->update([
            'name'          => $data['name'],
            'es_trabajador' => $data['es_trabajador'] ?? false
        ]);

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    /**
     * Eliminar un rol.
     */
    public function destroyRole(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        
        // Proteccion contra borrado de administrador
        if ($role->name === 'administrador' || $role->name === 'usuario') {
            return response()->json(['message' => 'No se pueden eliminar los roles base del sistema.'], 403);
        }

        $role->delete();

        return response()->json(null, 204);
    }

    /**
     * Restablecer permisos por defecto de un rol del sistema.
     */
    public function resetRolePermissions(int $id): JsonResponse
    {
        $role = Role::findOrFail($id);
        
        // Solo permitir restablecer roles del sistema
        $systemRoles = ['administrador', 'usuario', 'docente', 'estudiante', 'padre_familia'];
        
        if (!in_array($role->name, $systemRoles)) {
            return response()->json([
                'message' => 'Solo se pueden restablecer permisos de roles del sistema.'
            ], 400);
        }

        // Obtener permisos por defecto del seeder
        if ($role->name === 'administrador') {
            $role->syncPermissions(Permission::all());
        } else {
            $defaultPermissions = \Database\Seeders\RolesAndPermissionsSeeder::getDefaultPermissions($role->name);
            $role->syncPermissions($defaultPermissions);
        }

        return response()->json([
            'message' => 'Permisos restablecidos correctamente',
            'role' => $role->load('permissions')
        ]);
    }
}
