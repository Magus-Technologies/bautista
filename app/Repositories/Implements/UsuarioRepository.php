<?php

namespace App\Repositories\Implements;

use App\Models\Perfil;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Repositories\Interfaces\UsuarioRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UsuarioRepository implements UsuarioRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', bool $esTrabajador = false, int $perPage = 20): LengthAwarePaginator
    {
        return User::with(['perfil', 'rol'])
            ->where('insti_id', $instiId)
            ->when($esTrabajador, fn($q) => $q->where('es_trabajador', true))
            ->when($search, function ($q) use ($search) {
                $q->where('username', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('perfil', fn ($p) => $p
                        ->where('primer_nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('doc_numero', 'like', "%{$search}%")
                    );
            })
            ->latest('id')
            ->paginate($perPage);
    }

    public function findById(int $id): User
    {
        return User::with(['perfil', 'rol'])->findOrFail($id);
    }

    public function create(array $data): User
    {
        $rolId = isset($data['rol'])
            ? Role::where('name', $data['rol'])->value('id')
            : null;

        $user = User::create([
            'insti_id' => $data['insti_id'],
            'rol_id'   => $rolId, // Mantenemos por compatibilidad legacy
            'username' => $data['username'],
            'name'     => $data['primer_nombre'] . ' ' . $data['apellido_paterno'],
            'email'    => $data['email'] ?? null,
            'password' => Hash::make($data['username']),
            'estado'   => '1',
            'es_trabajador' => $data['es_trabajador'] ?? false,
        ]);

        if (isset($data['rol'])) {
            $user->assignRole($data['rol']);
        }

        Perfil::create([
            'user_id'          => $user->id,
            'primer_nombre'    => $data['primer_nombre'],
            'segundo_nombre'   => $data['segundo_nombre']   ?? null,
            'apellido_paterno' => $data['apellido_paterno'],
            'apellido_materno' => $data['apellido_materno'] ?? null,
            'genero'           => $data['genero']           ?? null,
            'tipo_doc'         => $data['tipo_doc']         ?? 1,
            'doc_numero'       => $data['doc_numero']       ?? $data['username'],
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
            'direccion'        => $data['direccion']        ?? null,
            'telefono'         => $data['telefono']         ?? null,
            'fecha_registro'   => now()->toDateString(),
        ]);

        return $user->load(['perfil', 'rol']);
    }

    public function update(User $user, array $data): User
    {
        $user->update([
            'username' => $data['username'],
            'name'     => ($data['primer_nombre'] ?? '') . ' ' . ($data['apellido_paterno'] ?? ''),
            'email'    => $data['email'] ?? null,
            'estado'   => $data['estado'] ?? $user->estado,
            'es_trabajador' => $data['es_trabajador'] ?? $user->es_trabajador,
        ]);

        if ($user->perfil) {
            $user->perfil->update([
                'primer_nombre'    => $data['primer_nombre']    ?? $user->perfil->primer_nombre,
                'segundo_nombre'   => $data['segundo_nombre']   ?? null,
                'apellido_paterno' => $data['apellido_paterno'] ?? $user->perfil->apellido_paterno,
                'apellido_materno' => $data['apellido_materno'] ?? null,
                'genero'           => $data['genero']           ?? $user->perfil->genero,
                'tipo_doc'         => $data['tipo_doc']         ?? $user->perfil->tipo_doc,
                'doc_numero'       => $data['doc_numero']       ?? $data['username'],
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? $user->perfil->fecha_nacimiento,
                'direccion'        => $data['direccion']        ?? $user->perfil->direccion,
                'telefono'         => $data['telefono']         ?? $user->perfil->telefono,
            ]);
        }

        if ($data['rol'] ?? null) {
            $role = Role::where('name', $data['rol'])->first();
            if ($role) {
                $user->update(['rol_id' => $role->id]);
                $user->syncRoles($role->name);
            }
        }

        return $user->load(['perfil', 'rol']);
    }
}
