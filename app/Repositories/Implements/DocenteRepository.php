<?php

namespace App\Repositories\Implements;

use App\Models\Docente;
use App\Models\Perfil;
use App\Models\User;
use App\Repositories\Interfaces\DocenteRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class DocenteRepository implements DocenteRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', int $perPage = 15): LengthAwarePaginator
    {
        return Docente::with(['perfil', 'user'])
            ->where('id_insti', $instiId)
            ->when($search, function ($q) use ($search) {
                $q->whereHas('perfil', fn ($p) => $p
                    ->where('primer_nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_paterno', 'like', "%{$search}%")
                    ->orWhere('doc_numero', 'like', "%{$search}%")
                )->orWhereHas('user', fn ($u) => $u
                    ->where('username', 'like', "%{$search}%")
                );
            })
            ->latest('docente_id')
            ->paginate($perPage);
    }

    public function findById(int $id): Docente
    {
        return Docente::with(['perfil', 'user'])->findOrFail($id);
    }

    public function create(array $data): Docente
    {
        // 1. Crear usuario de acceso
        $rolId = \DB::table('roles')->where('name', 'docente')->value('id');
        $user = User::create([
            'insti_id' => $data['insti_id'],
            'rol_id'   => $rolId,
            'username' => $data['username'],
            'name'     => $data['primer_nombre'] . ' ' . $data['apellido_paterno'],
            'email'    => $data['email'] ?? null,
            'password' => Hash::make($data['username']),
            'estado'   => '1',
        ]);
        $user->assignRole('docente'); // llama a User::assignRole() → FK directa

        // 2. Crear perfil personal
        $perfil = Perfil::create([
            'user_id'          => $user->id,
            'primer_nombre'    => $data['primer_nombre'],
            'segundo_nombre'   => $data['segundo_nombre']   ?? null,
            'apellido_paterno' => $data['apellido_paterno'],
            'apellido_materno' => $data['apellido_materno'] ?? null,
            'genero'           => $data['genero']           ?? null,
            'tipo_doc'         => 1,
            'doc_numero'       => $data['username'],
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
            'direccion'        => $data['direccion']        ?? null,
            'telefono'         => $data['telefono']         ?? null,
            'fecha_registro'   => now()->toDateString(),
        ]);

        // 3. Crear registro de docente
        return Docente::create([
            'id_insti'    => $data['insti_id'],
            'id_perfil'   => $perfil->perfil_id,
            'id_usuario'  => $user->id,
            'especialidad'=> $data['especialidad'] ?? null,
            'planilla'    => $data['planilla']     ?? null,
            'turno'       => $data['turno']        ?? null,
            'estado'      => '1',
        ]);
    }

    public function update(Docente $docente, array $data): Docente
    {
        // Actualizar perfil
        if ($docente->perfil) {
            $docente->perfil->update([
                'primer_nombre'    => $data['primer_nombre'],
                'segundo_nombre'   => $data['segundo_nombre']   ?? null,
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'] ?? null,
                'genero'           => $data['genero']           ?? null,
                'doc_numero'       => $data['username'],
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                'direccion'        => $data['direccion']        ?? null,
                'telefono'         => $data['telefono']         ?? null,
            ]);
        }

        // Actualizar usuario
        if ($docente->user) {
            $docente->user->update([
                'username' => $data['username'],
                'name'     => $data['primer_nombre'] . ' ' . $data['apellido_paterno'],
                'email'    => $data['email'] ?? null,
            ]);
        }

        // Actualizar datos del docente
        $docente->update([
            'especialidad' => $data['especialidad'] ?? null,
            'planilla'     => $data['planilla']     ?? null,
            'turno'        => $data['turno']        ?? $docente->turno,
            'estado'       => $data['estado']       ?? $docente->estado,
        ]);

        return $docente->load(['perfil', 'user']);
    }

    public function delete(Docente $docente): void
    {
        $docente->delete();
    }
}
