<?php

namespace App\Repositories\Implements;

use App\Models\Estudiante;
use App\Models\Perfil;
use App\Models\User;
use App\Repositories\Interfaces\EstudianteRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EstudianteRepository implements EstudianteRepositoryInterface
{
    public function paginate(int $instiId, string $search = '', int $perPage = 15): LengthAwarePaginator
    {
        return Estudiante::with(['perfil', 'user'])
            ->where('insti_id', $instiId)
            ->when($search, function ($q) use ($search) {
                $q->whereHas('perfil', fn($p) => $p
                    ->where('primer_nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_paterno', 'like', "%{$search}%")
                    ->orWhere('doc_numero', 'like', "%{$search}%")
                )->orWhereHas('user', fn($u) => $u
                    ->where('username', 'like', "%{$search}%")
                );
            })
            ->latest('estu_id')
            ->paginate($perPage);
    }

    public function findById(int $id): Estudiante
    {
        return Estudiante::with(['perfil', 'user'])->findOrFail($id);
    }

    public function create(array $data): Estudiante
    {
        // 1. Crear usuario de acceso
        $rolId = \DB::table('roles')->where('name', 'estudiante')->value('id');
        $user = User::create([
            'insti_id' => $data['insti_id'],
            'rol_id'   => $rolId,
            'username' => $data['username'],
            'name'     => $data['primer_nombre'] . ' ' . $data['apellido_paterno'],
            'email'    => $data['email'] ?? null,
            'password' => Hash::make($data['username']),
            'estado'   => '1',
        ]);
        $user->assignRole('estudiante'); // llama a User::assignRole() → FK directa

        // Manejar foto si existe
        $pathFoto = null;
        if (isset($data['foto']) && $data['foto'] instanceof \Illuminate\Http\UploadedFile) {
            $pathFoto = $data['foto']->store('perfiles', 'public');
        }

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
            'foto_perfil'      => $pathFoto,
            'fecha_registro'   => now()->toDateString(),
        ]);

        // 3. Crear registro de estudiante
        return Estudiante::create([
            'insti_id'           => $data['insti_id'],
            'perfil_id'          => $perfil->perfil_id,
            'user_id'            => $user->id,
            'estado'             => '1',
            'colegio'            => $data['colegio']            ?? null,
            'neurodivergencia'   => $data['neurodivergencia']   ?? null,
            'terapia_ocupacional'=> $data['terapia_ocupacional']?? null,
            'edad'               => $data['edad']               ?? null,
            'talla'              => $data['talla']              ?? null,
            'peso'               => $data['peso']               ?? null,
            'seguro'             => $data['seguro']             ?? null,
            'privado'            => $data['seguro_privado']      ?? null,
            'mensualidad'        => $data['mensualidad'],
            'fecha_ingreso'      => $data['fecha_ingreso'],
            'fecha_promovido'    => $data['fecha_promovido'] ?? null,
        ]);
    }

    public function update(Estudiante $estudiante, array $data): Estudiante
    {
        // Actualizar perfil
        if ($estudiante->perfil) {
            $perfilData = [
                'primer_nombre'    => $data['primer_nombre'],
                'segundo_nombre'   => $data['segundo_nombre']   ?? null,
                'apellido_paterno' => $data['apellido_paterno'],
                'apellido_materno' => $data['apellido_materno'] ?? null,
                'genero'           => $data['genero']           ?? null,
                'doc_numero'       => $data['username'],
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                'direccion'        => $data['direccion']        ?? null,
                'telefono'         => $data['telefono']         ?? null,
            ];

            // Manejar nueva foto
            if (isset($data['foto']) && $data['foto'] instanceof \Illuminate\Http\UploadedFile) {
                // Eliminar anterior si existe
                if ($estudiante->perfil->foto_perfil) {
                    Storage::disk('public')->delete($estudiante->perfil->foto_perfil);
                }
                $perfilData['foto_perfil'] = $data['foto']->store('perfiles', 'public');
            }

            $estudiante->perfil->update($perfilData);
        }

        // Actualizar usuario
        if ($estudiante->user) {
            $estudiante->user->update([
                'username' => $data['username'],
                'name'     => $data['primer_nombre'] . ' ' . $data['apellido_paterno'],
                'email'    => $data['email'] ?? null,
            ]);
        }

        // Actualizar datos del estudiante
        $estudiante->update([
            'estado'              => $data['estado']              ?? $estudiante->estado,
            'colegio'             => $data['colegio']             ?? null,
            'neurodivergencia'    => $data['neurodivergencia']    ?? null,
            'terapia_ocupacional' => $data['terapia_ocupacional'] ?? null,
            'edad'                => $data['edad']                ?? null,
            'talla'               => $data['talla']               ?? null,
            'peso'                => $data['peso']                ?? null,
            'seguro'              => $data['seguro']              ?? null,
            'privado'             => $data['seguro_privado']      ?? null,
            'mensualidad'         => $data['mensualidad']         ?? null,
            'fecha_ingreso'       => $data['fecha_ingreso']       ?? null,
            'fecha_promovido'     => $data['fecha_promovido']     ?? null,
        ]);

        return $estudiante->load(['perfil', 'user']);
    }

    public function delete(Estudiante $estudiante): void
    {
        $estudiante->delete();
    }
}
