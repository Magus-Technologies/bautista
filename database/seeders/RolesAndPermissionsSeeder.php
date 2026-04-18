<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Obtener permisos por defecto para un rol específico
     */
    public static function getDefaultPermissions(string $roleName): array
    {
        // Permisos compartidos para la familia
        $familiaPermissions = [
            'dashboard.ver',
            'dashboard.padre.resumen',
            'perfil.ver',
            'perfil.editar',
            'recursos.mensajeria.ver',
            'recursos.mensajeria.enviar',
            'portal.padre.ver',
            'portal.padre.hijos',
            'portal.padre.pagos',
            'portal.padre.cursos',
            'portal.padre.profesores',
            'portal.padre.horario',
        ];

        $defaults = [
            // Admin: gestión total del sistema, SIN portales de otros roles
            'administrador' => [
                'dashboard.ver',
                'dashboard.stats.instituciones', 'dashboard.stats.docentes',
                'dashboard.stats.estudiantes', 'dashboard.stats.cursos',
                'dashboard.mensajes.pendientes', 'dashboard.notificaciones',
                'perfil.ver', 'perfil.editar', 'perfil.foto',
                'institucion.ver', 'institucion.datos.ver', 'institucion.datos.crear', 'institucion.datos.editar', 'institucion.datos.eliminar',
                'institucion.galeria.ver', 'institucion.galeria.crear', 'institucion.galeria.editar', 'institucion.galeria.eliminar',
                'institucion.noticias.ver', 'institucion.noticias.crear', 'institucion.noticias.editar', 'institucion.noticias.eliminar', 'institucion.noticias.comentar',
                'academico.ver', 'academico.niveles.ver', 'academico.niveles.crear', 'academico.niveles.editar', 'academico.niveles.eliminar',
                'academico.cursos.ver', 'academico.cursos.crear', 'academico.cursos.editar', 'academico.cursos.eliminar',
                'academico.secciones.ver', 'academico.secciones.crear', 'academico.secciones.editar', 'academico.secciones.eliminar',
                'academico.horarios.ver', 'academico.horarios.editar',
                'academico.aulas.ver', 'academico.aulas.crear', 'academico.aulas.editar', 'academico.aulas.eliminar',
                'horarios.ver', 'horarios.bloques.ver', 'horarios.bloques.crear', 'horarios.bloques.editar', 'horarios.bloques.eliminar',
                'horarios.clases.ver', 'horarios.clases.crear', 'horarios.clases.editar', 'horarios.clases.eliminar', 'horarios.clases.clonar',
                'horarios.conflictos.ver',
                'horarios.asistencia.ver', 'horarios.asistencia.crear', 'horarios.asistencia.editar', 'horarios.asistencia.eliminar',
                'personal.ver', 'personal.docentes.ver', 'personal.docentes.crear', 'personal.docentes.editar', 'personal.docentes.eliminar', 'personal.docentes.cursos',
                'personal.estudiantes.ver', 'personal.estudiantes.crear', 'personal.estudiantes.editar', 'personal.estudiantes.eliminar', 'personal.estudiantes.contactos', 'personal.estudiantes.fotocheck',
                'matriculas.ver', 'matriculas.aperturas.ver', 'matriculas.aperturas.crear', 'matriculas.aperturas.editar', 'matriculas.aperturas.eliminar',
                'matriculas.gestion.ver', 'matriculas.gestion.crear', 'matriculas.gestion.editar', 'matriculas.gestion.eliminar',
                'asistencia.ver', 'asistencia.reportes.ver', 'asistencia.reportes.exportar', 'asistencia.scanner.ver', 'asistencia.marcar.manual',
                'admin.ver', 'admin.pagos.ver', 'admin.pagos.crear', 'admin.pagos.editar', 'admin.pagos.eliminar', 'admin.pagos.vouchers', 'admin.pagos.reportes',
                'admin.comunicados.ver', 'admin.comunicados.crear', 'admin.comunicados.editar', 'admin.comunicados.eliminar',
                'recursos.ver', 'recursos.biblioteca.ver', 'recursos.biblioteca.carpetas', 'recursos.biblioteca.archivos',
                'recursos.mensajeria.ver', 'recursos.mensajeria.enviar', 'recursos.mensajeria.grupos',
                'seguridad.ver', 'seguridad.usuarios.ver', 'seguridad.usuarios.crear', 'seguridad.usuarios.editar', 'seguridad.usuarios.eliminar',
                'seguridad.roles.ver', 'seguridad.roles.crear', 'seguridad.roles.editar', 'seguridad.roles.eliminar',
                'seguridad.fotochecks.diseno',
                // NO tiene: portal.docente.*, portal.estudiante.*, portal.padre.*
            ],

            // Docente: su portal + recursos compartidos, SIN admin ni portales de otros
            'docente' => [
                'dashboard.ver', 'dashboard.notificaciones',
                'dashboard.docente.resumen', 'dashboard.docente.cursos',
                'perfil.ver', 'perfil.editar', 'credencial.ver',
                'horarios.ver', 'horarios.clases.ver',
                'admin.comunicados.ver',
                'recursos.biblioteca.ver', 'recursos.mensajeria.ver', 'recursos.mensajeria.enviar',
                'portal.docente.ver', 'portal.docente.cursos', 'portal.docente.alumnos', 'portal.docente.calificar', 'portal.docente.asistencia',
                // NO tiene: institucion.*, portal.estudiante.*, portal.padre.*, admin.*, asistencia.scanner.ver
            ],

            // Estudiante: su portal + recursos compartidos, SIN admin ni portales de otros
            'estudiante' => [
                'dashboard.ver', 'dashboard.estudiante.resumen', 'dashboard.estudiante.stats',
                'perfil.ver', 'perfil.editar', 'credencial.ver',
                'institucion.noticias.portada', // Único acceso permitido a institución
                'horarios.ver', 'horarios.clases.ver',
                'admin.comunicados.ver',
                'recursos.biblioteca.ver', 'recursos.mensajeria.ver', 'recursos.mensajeria.enviar',
                'portal.estudiante.ver', 'portal.estudiante.cursos', 'portal.estudiante.notas',
                'portal.estudiante.asistencia', 'portal.estudiante.puzzles',
                // NO tiene: institucion.(datos|galeria|noticias.ver), portal.docente.*, portal.padre.*, admin.*
            ],

            // Padre/Madre/Apoderado: Unificados
            'padre_familia' => $familiaPermissions,
            'madre_familia' => $familiaPermissions,
            'apoderado'     => $familiaPermissions,

            // Usuario base: solo perfil y dashboard
            'usuario' => [
                'dashboard.ver',
                'perfil.ver', 'perfil.editar',
            ],
        ];

        return $defaults[$roleName] ?? [];
    }

    public function run(): void
    {
        // Limpiar caché de permisos
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Limpieza TOTAL para evitar basura de versiones anteriores
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('role_has_permissions')->truncate();
        DB::table('model_has_permissions')->truncate();
        DB::table('model_has_roles')->truncate();
        DB::table('permissions')->delete();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ═══════════════════════════════════════════════════════════════
        // PERMISOS JERÁRQUICOS Y GRANULARES
        // ═══════════════════════════════════════════════════════════════
        
        $permissions = [
            // ─────────────────────────────────────────────────────────
            // 1. DASHBOARD
            // ─────────────────────────────────────────────────────────
            'dashboard.ver',
            'dashboard.stats.instituciones',
            'dashboard.stats.docentes',
            'dashboard.stats.estudiantes',
            'dashboard.stats.cursos',
            'dashboard.mensajes.pendientes',
            'dashboard.notificaciones',
            'dashboard.docente.resumen',
            'dashboard.docente.cursos',
            'dashboard.estudiante.resumen',
            'dashboard.estudiante.stats',
            'dashboard.padre.resumen',
            
            // ─────────────────────────────────────────────────────────
            // 2. PERFIL
            // ─────────────────────────────────────────────────────────
            'perfil.ver',
            'perfil.editar',
            'perfil.foto',
            'credencial.ver',
            'credencial.qr',
            
            // ─────────────────────────────────────────────────────────
            // 3. INSTITUCIÓN
            // ─────────────────────────────────────────────────────────
            'institucion.ver',
            'institucion.datos.ver',
            'institucion.datos.crear',
            'institucion.datos.editar',
            'institucion.datos.eliminar',
            'institucion.galeria.ver',
            'institucion.galeria.crear',
            'institucion.galeria.editar',
            'institucion.galeria.eliminar',
            'institucion.noticias.ver',
            'institucion.noticias.crear',
            'institucion.noticias.editar',
            'institucion.noticias.eliminar',
            'institucion.noticias.comentar',
            'institucion.noticias.portada',
            
            // ─────────────────────────────────────────────────────────
            // 4. ACADÉMICO (Niveles, Grados, Secciones, Cursos)
            // ─────────────────────────────────────────────────────────
            'academico.ver',
            'academico.niveles.ver',
            'academico.niveles.crear',
            'academico.niveles.editar',
            'academico.niveles.eliminar',
            'academico.cursos.ver',
            'academico.cursos.crear',
            'academico.cursos.editar',
            'academico.cursos.eliminar',
            'academico.secciones.ver',
            'academico.secciones.crear',
            'academico.secciones.editar',
            'academico.secciones.eliminar',
            'academico.horarios.ver',
            'academico.horarios.editar',
            
            // Horarios de Clases (nuevo módulo)
            'horarios.ver',
            'horarios.bloques.ver',
            'horarios.bloques.crear',
            'horarios.bloques.editar',
            'horarios.bloques.eliminar',
            'horarios.clases.ver',
            'horarios.clases.crear',
            'horarios.clases.editar',
            'horarios.clases.eliminar',
            'horarios.clases.clonar',
            'horarios.conflictos.ver',
            
            // Horarios de Asistencia (configuración administrativa)
            'horarios.asistencia.ver',
            'horarios.asistencia.crear',
            'horarios.asistencia.editar',
            'horarios.asistencia.eliminar',

            // Aulas
            'academico.aulas.ver',
            'academico.aulas.crear',
            'academico.aulas.editar',
            'academico.aulas.eliminar',

            // ─────────────────────────────────────────────────────────
            // 5. PERSONAL (Docentes y Estudiantes)
            // ─────────────────────────────────────────────────────────
            'personal.ver',
            'personal.docentes.ver',
            'personal.docentes.crear',
            'personal.docentes.editar',
            'personal.docentes.eliminar',
            'personal.docentes.cursos',
            'personal.estudiantes.ver',
            'personal.estudiantes.crear',
            'personal.estudiantes.editar',
            'personal.estudiantes.eliminar',
            'personal.estudiantes.contactos',
            'personal.estudiantes.fotocheck',
            
            // ─────────────────────────────────────────────────────────
            // 6. MATRÍCULAS
            // ─────────────────────────────────────────────────────────
            'matriculas.ver',
            'matriculas.aperturas.ver',
            'matriculas.aperturas.crear',
            'matriculas.aperturas.editar',
            'matriculas.aperturas.eliminar',
            'matriculas.gestion.ver',
            'matriculas.gestion.crear',
            'matriculas.gestion.editar',
            'matriculas.gestion.eliminar',
            
            // ─────────────────────────────────────────────────────────
            // 7. ASISTENCIA
            // ─────────────────────────────────────────────────────────
            'asistencia.ver',
            'asistencia.reportes.ver',
            'asistencia.reportes.exportar',
            'asistencia.scanner.ver',
            'asistencia.marcar.manual',
            
            // ─────────────────────────────────────────────────────────
            // 8. ADMINISTRATIVO (Pagos, Comunicados)
            // ─────────────────────────────────────────────────────────
            'admin.ver',
            'admin.pagos.ver',
            'admin.pagos.crear',
            'admin.pagos.editar',
            'admin.pagos.eliminar',
            'admin.pagos.vouchers',
            'admin.pagos.reportes',
            'admin.comunicados.ver',
            'admin.comunicados.crear',
            'admin.comunicados.editar',
            'admin.comunicados.eliminar',
            
            // ─────────────────────────────────────────────────────────
            // 9. RECURSOS (Biblioteca, Mensajería)
            // ─────────────────────────────────────────────────────────
            'recursos.ver',
            'recursos.biblioteca.ver',
            'recursos.biblioteca.carpetas',
            'recursos.biblioteca.archivos',
            'recursos.mensajeria.ver',
            'recursos.mensajeria.enviar',
            'recursos.mensajeria.grupos',
            
            // ─────────────────────────────────────────────────────────
            // 10. SEGURIDAD Y CONFIGURACIÓN
            // ─────────────────────────────────────────────────────────
            'seguridad.ver',
            'seguridad.usuarios.ver',
            'seguridad.usuarios.crear',
            'seguridad.usuarios.editar',
            'seguridad.usuarios.eliminar',
            'seguridad.roles.ver',
            'seguridad.roles.crear',
            'seguridad.roles.editar',
            'seguridad.roles.eliminar',
            'seguridad.fotochecks.diseno',

            // ─────────────────────────────────────────────────────────
            // 11. PORTALES (Específicos para Roles)
            // ─────────────────────────────────────────────────────────
            'portal.docente.ver',
            'portal.docente.cursos',
            'portal.docente.alumnos',
            'portal.docente.calificar',
            'portal.docente.asistencia',
            'portal.estudiante.ver',
            'portal.estudiante.cursos',
            'portal.estudiante.notas',
            'portal.estudiante.asistencia',
            'portal.estudiante.profesores',
            'portal.estudiante.puzzles',
            'portal.padre.ver',
            'portal.padre.hijos',
            'portal.padre.pagos',
            'portal.padre.cursos',
            'portal.padre.profesores',
            'portal.padre.horario',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // ─────────────────────────────────────────────────────────────
        // ASIGNACIÓN DE ROLES
        // ─────────────────────────────────────────────────────────────
        
        // ADMINISTRADOR — permisos explícitos (sin portales de otros roles)
        $admin = Role::findOrCreate('administrador', 'web');
        $admin->syncPermissions(self::getDefaultPermissions('administrador'));

        // USUARIO BASE
        $usuario = Role::findOrCreate('usuario', 'web');
        $usuario->syncPermissions(self::getDefaultPermissions('usuario'));

        // DOCENTE
        $docente = Role::findOrCreate('docente', 'web');
        $docente->syncPermissions(self::getDefaultPermissions('docente'));

        // ESTUDIANTE
        $estudiante = Role::findOrCreate('estudiante', 'web');
        $estudiante->syncPermissions(self::getDefaultPermissions('estudiante'));

        // PADRE / MADRE / APODERADO
        $padre = Role::findOrCreate('padre_familia', 'web');
        $padre->syncPermissions(self::getDefaultPermissions('padre_familia'));

        $madre = Role::findOrCreate('madre_familia', 'web');
        $madre->syncPermissions(self::getDefaultPermissions('madre_familia'));

        $apoderado = Role::findOrCreate('apoderado', 'web');
        $apoderado->syncPermissions(self::getDefaultPermissions('apoderado'));

        // Sincronizar Usuarios Existentes
        $this->command->info('Sincronizando roles...');
        $users = User::whereNotNull('rol_id')->get();
        foreach ($users as $user) {
            $rolName = DB::table('roles')->where('id', $user->rol_id)->value('name');
            if ($rolName) $user->assignRole($rolName);
        }

        $this->command->info('¡Sistema jerárquico global sincronizado!');
    }
}
