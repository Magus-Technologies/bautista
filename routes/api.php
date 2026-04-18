<?php

use App\Http\Controllers\Api\PagoApiController;
use App\Http\Controllers\Api\GaleriaApiController;
use App\Http\Controllers\Api\MensajeApiController;
use App\Http\Controllers\Api\MensajeriaGrupoApiController;
use App\Http\Controllers\Api\NoticiaApiController;
use App\Http\Controllers\Api\UsuarioBusquedaApiController;
use App\Http\Controllers\Api\InstitucionApiController;
use App\Http\Controllers\Api\AuthApiController;
use App\Http\Controllers\Api\CursoContenidoApiController;
use App\Http\Controllers\Api\MatriculaApiController;
use App\Http\Controllers\Api\AulaApiController;
use App\Http\Controllers\Api\CursoApiController;
use App\Http\Controllers\Api\DashboardApiController;
use App\Http\Controllers\Api\DocenteApiController;
use App\Http\Controllers\Api\EstudianteApiController;
use App\Http\Controllers\Api\GradoApiController;
use App\Http\Controllers\Api\NivelEducativoApiController;
use App\Http\Controllers\Api\SeccionApiController;
use App\Http\Controllers\Api\ActividadApiController;
use App\Http\Controllers\Api\DocenteCursoApiController;
use App\Http\Controllers\Api\UsuarioApiController;
use App\Http\Controllers\Api\BlogApiController;
use App\Http\Controllers\Api\AsistenciaGeneralApiController;
use App\Http\Controllers\Api\MediosApiController;
use App\Http\Controllers\Api\MensajeriaApiController;
use App\Http\Controllers\Api\PadreApiController;
use App\Http\Controllers\Api\CalificacionApiController;
use App\Http\Controllers\Api\ExamenResolucionApiController;
use App\Http\Controllers\Api\AlumnoApiController;
use App\Http\Controllers\Api\MatriculaPadresController;
use App\Http\Controllers\Api\ReniecApiController;
use App\Http\Controllers\Api\AccessControlApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Bautista La Pascana
|--------------------------------------------------------------------------
| Consumidas por el panel web (React SPA) y la app móvil.
| Header requerido: Authorization: Bearer {token}
*/

// ── Autenticación (público) ───────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthApiController::class, 'login']);
    Route::post('logout', [AuthApiController::class, 'logout']);
});

// ── Rutas protegidas (requiere token Sanctum) ─────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {

    Route::prefix('auth')->group(function () {
        Route::get('me',     [AuthApiController::class, 'me']);
    });

    // Dashboard
    Route::get('dashboard/stats', [DashboardApiController::class, 'stats']);

    // Instituciones
    Route::apiResource('instituciones', InstitucionApiController::class)->names('api.instituciones');

    // Galería de la institución
    Route::apiResource('galeria', GaleriaApiController::class)->except(['show'])->names('api.galeria');

    // Noticias de la institución
    Route::apiResource('noticias', NoticiaApiController::class)->except(['show'])->names('api.noticias');

    // Mensajería
    Route::get('mensajes',                        [MensajeApiController::class, 'index']);
    Route::post('mensajes',                       [MensajeApiController::class, 'store']);
    Route::get('mensajes/no-leidos',              [MensajeApiController::class, 'noLeidos']);
    Route::get('mensajes/{id}',                   [MensajeApiController::class, 'show']);
    Route::post('mensajes/{id}/responder',        [MensajeApiController::class, 'reply']);
    Route::get('mensajeria/grupos',               [MensajeriaGrupoApiController::class, 'index']);
    Route::post('mensajeria/grupos',              [MensajeriaGrupoApiController::class, 'store']);
    Route::get('mensajeria/cursos',               [MensajeriaGrupoApiController::class, 'cursos']);
    Route::get('mensajeria/cursos/{id}/alumnos',  [MensajeriaGrupoApiController::class, 'alumnosPorCurso']);
    Route::get('mensajeria/grados',               [MensajeriaGrupoApiController::class, 'grados']);
    Route::get('mensajeria/grados/{id}/alumnos',  [MensajeriaGrupoApiController::class, 'alumnosPorGrado']);
    Route::get('mensajeria/aulas',                [MensajeriaGrupoApiController::class, 'aulas']);
    Route::get('mensajeria/aulas/{id}/alumnos',   [MensajeriaGrupoApiController::class, 'alumnosPorAula']);
    Route::get('mensajeria/roles-personal',       [MensajeriaGrupoApiController::class, 'rolesPersonal']);
    Route::get('mensajeria/roles-personal/{id}/usuarios', [MensajeriaGrupoApiController::class, 'trabajadoresPorRol']);
    Route::get('usuarios/buscar',                 UsuarioBusquedaApiController::class);

    // Estudiantes
    Route::apiResource('estudiantes', EstudianteApiController::class)->names('api.estudiantes');
    Route::get('estudiantes/{id}/contactos',  [EstudianteApiController::class, 'contactos']);
    Route::post('estudiantes/{id}/contactos', [EstudianteApiController::class, 'guardarContacto']);

    // Docentes
    Route::apiResource('docentes', DocenteApiController::class)->names('api.docentes');
    Route::get('docentes/{docenteId}/cursos',             [DocenteCursoApiController::class, 'index']);
    Route::post('docentes/{docenteId}/cursos',            [DocenteCursoApiController::class, 'store']);
    Route::delete('docentes/{docenteId}/cursos/{id}',     [DocenteCursoApiController::class, 'destroy']);
    Route::get('docentes/{docenteId}/horario',            [DocenteCursoApiController::class, 'horario']);
    Route::get('docentes/{docenteId}/horarios',           [\App\Http\Controllers\Api\DocenteHorarioApiController::class, 'index']);
    Route::post('docentes/{docenteId}/horarios',          [\App\Http\Controllers\Api\DocenteHorarioApiController::class, 'store']);
    Route::delete('docentes/horarios/{id}',               [\App\Http\Controllers\Api\DocenteHorarioApiController::class, 'destroy']);

    // Niveles Educativos
    Route::apiResource('niveles', NivelEducativoApiController::class)->names('api.niveles');

    // Grados
    Route::apiResource('grados', GradoApiController::class)->names('api.grados');

    // Secciones
    Route::apiResource('secciones', SeccionApiController::class)->names('api.secciones');
    Route::get('secciones/{seccionId}/horarios',          [\App\Http\Controllers\Api\SeccionHorarioApiController::class, 'index']);
    Route::post('secciones/{seccionId}/horarios',         [\App\Http\Controllers\Api\SeccionHorarioApiController::class, 'store']);
    Route::delete('secciones/horarios/{id}',              [\App\Http\Controllers\Api\SeccionHorarioApiController::class, 'destroy']);

    // Aulas
    Route::apiResource('aulas', AulaApiController::class)->names('api.aulas');
    Route::get('aulas-all', [AulaApiController::class, 'all']);

    // Cursos
    Route::apiResource('cursos', CursoApiController::class)->names('api.cursos');
    Route::get('cursos/{cursoId}/docentes', [CursoApiController::class, 'docentes']);

    // Grados - Cursos (asignación)
    Route::get('grados/{gradoId}/cursos', [\App\Http\Controllers\Api\GradoCursoApiController::class, 'index']);
    Route::get('grados/{gradoId}/cursos-disponibles', [\App\Http\Controllers\Api\GradoCursoApiController::class, 'cursosDisponibles']);
    Route::post('grados/{gradoId}/cursos', [\App\Http\Controllers\Api\GradoCursoApiController::class, 'store']);
    Route::delete('grados/{gradoId}/cursos/{gracId}', [\App\Http\Controllers\Api\GradoCursoApiController::class, 'destroy']);

    // Contenido de Curso (Unidades y Clases)
    Route::prefix('contenido')->group(function () {
        Route::get('cursos/{cursoId}',                           [CursoContenidoApiController::class, 'show']);
        Route::post('unidades',                                   [CursoContenidoApiController::class, 'storeUnidad']);
        Route::put('unidades/{id}',                              [CursoContenidoApiController::class, 'updateUnidad']);
        Route::delete('unidades/{id}',                           [CursoContenidoApiController::class, 'destroyUnidad']);
        Route::post('cursos/{cursoId}/reordenar-unidades',       [CursoContenidoApiController::class, 'reordenarUnidades']);
        Route::post('clases',                                    [CursoContenidoApiController::class, 'storeClase']);
        Route::put('clases/{id}',                                [CursoContenidoApiController::class, 'updateClase']);
        Route::delete('clases/{id}',                             [CursoContenidoApiController::class, 'destroyClase']);
        Route::post('unidades/{unidadId}/reordenar-clases',      [CursoContenidoApiController::class, 'reordenarClases']);
        Route::post('clases/{claseId}/archivos',                 [CursoContenidoApiController::class, 'subirArchivo']);
        Route::delete('archivos/{archivoId}',                    [CursoContenidoApiController::class, 'eliminarArchivo']);
    });

    // Pagos
    Route::prefix('pagos')->group(function () {
        Route::get('pagadores',                            [PagoApiController::class, 'indexPagadores']);
        Route::get('contactos/{contactoId}',               [PagoApiController::class, 'porContacto']);
        Route::get('reporte-pdf',                          [PagoApiController::class, 'reportePdf']);
        Route::post('/',                                   [PagoApiController::class, 'store']);
        Route::put('/{id}',                                [PagoApiController::class, 'update']);
        Route::delete('/{id}',                             [PagoApiController::class, 'destroy']);
        // Vouchers / comprobantes
        Route::get('/{pagId}/vouchers',                    [PagoApiController::class, 'vouchers']);
        Route::post('/{pagId}/vouchers',                   [PagoApiController::class, 'subirVoucher']);
        Route::patch('/vouchers/{notificaId}/estado',      [PagoApiController::class, 'validarVoucher']);
    });

    // Actividades (Exámenes Virtuales)
    Route::get('actividades/tipos',     [ActividadApiController::class, 'tipos']);
    Route::get('actividades/{id}/entregas', [ActividadApiController::class, 'entregas']);
    Route::apiResource('actividades',   ActividadApiController::class)->names('api.actividades');
    Route::get('actividades/{id}/cuestionario', [\App\Http\Controllers\Api\CuestionarioApiController::class, 'show']);
    Route::put('actividades/{id}/cuestionario', [\App\Http\Controllers\Api\CuestionarioApiController::class, 'sync']);
    Route::post('actividades/{id}/cuestionario/upload-image', [\App\Http\Controllers\Api\CuestionarioApiController::class, 'uploadImage']);
    Route::post('actividades/cuestionario/upload-image-temp', [\App\Http\Controllers\Api\CuestionarioApiController::class, 'uploadImage']);
    Route::get('actividades/{id}/notas', [CalificacionApiController::class, 'indexByActivity']);
    Route::post('actividades/{id}/calificar', [CalificacionApiController::class, 'calificar']);
    Route::post('examenes/comenzar', [ExamenResolucionApiController::class, 'comenzar']);
    Route::post('examenes/{id}/responder', [ExamenResolucionApiController::class, 'responder']);
    Route::post('examenes/{id}/finalizar', [ExamenResolucionApiController::class, 'finalizar']);

    // Portal Alumno — solo rol estudiante
    Route::middleware(['check.role:estudiante', 'verify.estudiante.curso'])->group(function () {
        Route::get('alumno/dashboard', [AlumnoApiController::class, 'dashboard'])->withoutMiddleware('verify.estudiante.curso');
        Route::get('alumno/cursos', [AlumnoApiController::class, 'cursos'])->withoutMiddleware('verify.estudiante.curso');
        Route::get('alumno/notas', [AlumnoApiController::class, 'notas'])->withoutMiddleware('verify.estudiante.curso');
        Route::get('alumno/curso/{id}', [AlumnoApiController::class, 'cursoDetalle']);
        Route::get('alumno/curso/{id}/asistencia', [AlumnoApiController::class, 'cursoAsistencia']);
        Route::get('alumno/asistencia', [AlumnoApiController::class, 'asistencia'])->withoutMiddleware('verify.estudiante.curso');
        Route::get('alumno/horario', [AlumnoApiController::class, 'horario'])->withoutMiddleware('verify.estudiante.curso');
        Route::get('alumno/clase/{id}', [AlumnoApiController::class, 'claseDetalle']);
        Route::get('alumno/profesores', [AlumnoApiController::class, 'profesores'])->withoutMiddleware('verify.estudiante.curso');
        Route::post('alumno/actividad/{id}/entregar', [AlumnoApiController::class, 'entregarActividad']);
        Route::post('alumno/dibujo/guardar', [ActividadApiController::class, 'guardarDibujo']);
    });

    // Portal Padre — roles padre_familia, madre_familia, apoderado
    Route::middleware('check.role:padre_familia|madre_familia|apoderado')->group(function () {
        Route::get('padre/matricula/status', [MatriculaPadresController::class, 'status']);
        Route::post('padre/matricula/step', [MatriculaPadresController::class, 'updateStep']);
        Route::post('padre/matricula/save-padres', [MatriculaPadresController::class, 'savePadres']);
        Route::post('padre/matricula/save-hijos', [MatriculaPadresController::class, 'saveHijos']);
    });

    // Portal Docente — docente + admin/director pueden consultar
    Route::middleware(['check.role:docente|administrador|director', 'verify.docente.curso'])->group(function () {
        Route::get('docente/dashboard', [DocenteApiController::class, 'dashboard'])->withoutMiddleware('verify.docente.curso');
        Route::get('docente/mis-cursos', [DocenteApiController::class, 'misCursos'])->withoutMiddleware('verify.docente.curso');
        Route::get('docente/curso/{id}/contenido', [DocenteApiController::class, 'cursoContenido']);
        Route::put('docente/curso/{id}/settings', [DocenteApiController::class, 'updateSettings']);
        Route::post('docente/curso/{id}/upload-banner', [DocenteApiController::class, 'uploadBanner']);
        Route::get('docente/mis-alumnos', [DocenteApiController::class, 'misAlumnos'])->withoutMiddleware('verify.docente.curso');
        
        // Tab Anuncios
        Route::get('docente/curso/{id}/anuncios', [DocenteApiController::class, 'getAnuncios']);
        Route::post('docente/anuncios', [DocenteApiController::class, 'storeAnuncio']);
        Route::put('docente/anuncios/{id}', [DocenteApiController::class, 'updateAnuncio']);
        Route::delete('docente/anuncios/{id}', [DocenteApiController::class, 'destroyAnuncio']);

        // Asistencia
        Route::post('docente/asistencia/iniciar', [DocenteApiController::class, 'iniciarAsistencia']);
        Route::post('docente/asistencia/{id}/marcar', [DocenteApiController::class, 'marcarAsistencia']);
        Route::get('docente/curso/{id}/asistencia-matrix', [DocenteApiController::class, 'asistenciaMatrix']);
        Route::get('docente/curso/{id}/asistencia-editable', [DocenteApiController::class, 'asistenciaEditable']);
        Route::post('docente/curso/{id}/asistencia-fecha', [DocenteApiController::class, 'guardarAsistenciaFecha']);
        Route::get('docente/curso/{id}/exportar-asistencia', [DocenteApiController::class, 'exportarAsistencia']);
        
        // Métricas y Calificaciones
        Route::get('docente/curso/{id}/alumnos', [DocenteApiController::class, 'alumnosDetallados']);
        Route::get('docente/curso/{id}/exportar-alumnos', [DocenteApiController::class, 'exportarAlumnos']);
        Route::get('docente/curso/{id}/calificaciones', [\App\Http\Controllers\Api\CalificacionApiController::class, 'indexByCourse']);
        Route::get('docente/curso/{id}/exportar-excel', [\App\Http\Controllers\Api\CalificacionApiController::class, 'exportExcel']);

        // Rutas adicionales para gestión de actividades desde el portal docente
        Route::get('docente/actividades/{id}', [ActividadApiController::class, 'show']);
        Route::get('docente/actividades/{id}/entregas', [ActividadApiController::class, 'entregas']);
        Route::get('docente/actividades/{id}/examenes', [ActividadApiController::class, 'entregas']); // Alias para CalificarExamen.tsx
        Route::post('docente/actividades/{id}/calificar', [CalificacionApiController::class, 'calificar']);
        Route::post('docente/actividades/{id}/calificar-examen', [CalificacionApiController::class, 'calificar']); // Alias para CalificarExamen.tsx
        Route::get('docente/actividades/{id}/archivos', [CursoContenidoApiController::class, 'listarArchivosActividad']);
        Route::post('docente/actividades/{id}/archivos', [CursoContenidoApiController::class, 'subirArchivoActividad']);

        // Gestión de Contenido Académico
        Route::prefix('contenido')->group(function () {
            Route::post('unidades', [CursoContenidoApiController::class, 'storeUnidad']);
            Route::put('unidades/{id}', [CursoContenidoApiController::class, 'updateUnidad']);
            Route::delete('unidades/{id}', [CursoContenidoApiController::class, 'destroyUnidad']);
            
            Route::post('clases', [CursoContenidoApiController::class, 'storeClase']);
            Route::put('clases/{id}', [CursoContenidoApiController::class, 'updateClase']);
            Route::delete('clases/{id}', [CursoContenidoApiController::class, 'destroyClase']);
            
            Route::post('clases/{clase}/archivos', [CursoContenidoApiController::class, 'subirArchivo']);
            Route::delete('archivos/{id}', [CursoContenidoApiController::class, 'eliminarArchivo']);
        });
    });

    // Mensajería
    Route::get('mensajes-legacy/recibidos', [MensajeriaApiController::class, 'recibidos']);
    Route::get('mensajes-legacy/enviados', [MensajeriaApiController::class, 'enviados']);
    Route::get('mensajes-legacy/grupos', [MensajeriaApiController::class, 'listarGrupos']);
    Route::post('mensajes-legacy/grupos', [MensajeriaApiController::class, 'crearGrupo']);
    Route::get('mensajes-legacy/contactos', [MensajeriaApiController::class, 'buscarContactos']);
    Route::post('mensajes-legacy/enviar', [MensajeriaApiController::class, 'enviar']);
    Route::get('mensajes-legacy/{id}', [MensajeriaApiController::class, 'ver']);
    Route::post('mensajes-legacy/{id}/responder', [MensajeriaApiController::class, 'responder']);

    // Blog y Noticias
    Route::get('blog', [BlogApiController::class, 'index']);
    Route::get('blog/{id}', [BlogApiController::class, 'show']);

    // Biblioteca de Medios
    Route::get('medios', [MediosApiController::class, 'index']);
    Route::get('medios/{id}/breadcrumb', [MediosApiController::class, 'breadcrumb']);
    Route::post('medios/carpeta', [MediosApiController::class, 'createFolder']);
    Route::put('medios/carpeta/{id}', [MediosApiController::class, 'updateFolder']);
    Route::post('medios/upload', [MediosApiController::class, 'store']);
    Route::delete('medios/{id}', [MediosApiController::class, 'destroy']);

    // Asistencia General (QR) - Protegido por permisos específicos
    Route::middleware(['permission:asistencia.ver'])->group(function () {
        Route::get('asistencia/usuarios', [AsistenciaGeneralApiController::class, 'index']);
        Route::get('asistencia/usuario/{id}', [AsistenciaGeneralApiController::class, 'show']);
        Route::get('asistencia/usuario/{id}/info', [AsistenciaGeneralApiController::class, 'showUserInfo']);
        Route::get('asistencia/usuario/{id}/export', [AsistenciaGeneralApiController::class, 'export']);
        Route::get('asistencia/export-all', [AsistenciaGeneralApiController::class, 'exportAll']);
        Route::get('asistencia/historial', [AsistenciaGeneralApiController::class, 'historial']);
    });
    Route::post('asistencia/marcar-qr', [AsistenciaGeneralApiController::class, 'marcarQR'])->middleware('permission:asistencia.scanner.ver');

    // Reniec
    Route::get('reniec/dni/{dni}', [ReniecApiController::class, 'searchDni']);

    // Ubigeo
    Route::get('ubigeo/departamentos', [\App\Http\Controllers\Api\UbigeoApiController::class, 'departamentos']);
    Route::get('ubigeo/provincias/{dep}', [\App\Http\Controllers\Api\UbigeoApiController::class, 'provincias']);
    Route::get('ubigeo/distritos/{dep}/{pro}', [\App\Http\Controllers\Api\UbigeoApiController::class, 'distritos']);

    // Portal Padre — detalle de hijos
    Route::middleware('check.role:padre_familia|madre_familia|apoderado')->group(function () {
        Route::get('padre/hijos', [PadreApiController::class, 'hijos']);
        Route::get('padre/hijo/{id}/resumen', [PadreApiController::class, 'hijoDetalle']);
        Route::get('padre/hijo/{id}/profesores', [PadreApiController::class, 'profesoresHijo']);
        Route::get('padre/hijo/{id}/asistencia', [PadreApiController::class, 'asistenciaHijo']);
    });

    // Usuarios
    Route::apiResource('usuarios', UsuarioApiController::class)->only(['index', 'show', 'store', 'update'])->names('api.usuarios');
    Route::patch('usuarios/{id}/estado',       [UsuarioApiController::class, 'toggleEstado']);
    Route::get('usuarios/{id}/historial',      [UsuarioApiController::class, 'historial']);
    Route::get('usuarios/{id}/actividad',      [UsuarioApiController::class, 'actividad']);
    Route::patch('usuarios/{id}/credenciales', [UsuarioApiController::class, 'resetCredenciales']);

    // Roles y Permisos (Control de Acceso) - Privado Admin
    Route::prefix('seguridad')->group(function () {
        Route::get('roles',              [AccessControlApiController::class, 'indexRoles'])->middleware('permission:seguridad.roles.ver');
        Route::post('roles',             [AccessControlApiController::class, 'storeRole'])->middleware('permission:seguridad.roles.crear');
        Route::put('roles/{id}',         [AccessControlApiController::class, 'updateRole'])->middleware('permission:seguridad.roles.editar');
        Route::delete('roles/{id}',      [AccessControlApiController::class, 'destroyRole'])->middleware('permission:seguridad.roles.eliminar');
        Route::post('roles/{id}/restablecer-permisos', [AccessControlApiController::class, 'resetRolePermissions'])->middleware('permission:seguridad.roles.editar');
        Route::get('permisos',           [AccessControlApiController::class, 'indexPermissions'])->middleware('permission:seguridad.roles.ver');
    });

    // Configuración de Fotochecks
    Route::get('configuracion-fotocheck',      [\App\Http\Controllers\Api\ConfiguracionFotocheckApiController::class, 'index']);
    Route::post('configuracion-fotocheck',     [\App\Http\Controllers\Api\ConfiguracionFotocheckApiController::class, 'update']);

    // Matrícula — Aperturas - Protegido por permisos
    Route::prefix('matriculas')->middleware('permission:matriculas.ver')->group(function () {
        Route::get('aperturas',                              [MatriculaApiController::class, 'indexAperturas']);
        Route::post('aperturas',                             [MatriculaApiController::class, 'storeApertura']);
        Route::get('aperturas/{id}',                         [MatriculaApiController::class, 'showApertura']);
        Route::put('aperturas/{id}',                         [MatriculaApiController::class, 'updateApertura']);
        Route::delete('aperturas/{id}',                      [MatriculaApiController::class, 'destroyApertura']);

        // Matrículas dentro de una apertura
        Route::get('aperturas/{aperturaId}/estudiantes',     [MatriculaApiController::class, 'indexMatriculas']);
        Route::get('aperturas/{aperturaId}/por-nivel',       [MatriculaApiController::class, 'indexPorNivel']);
        Route::get('aperturas/{aperturaId}/disponibles',     [MatriculaApiController::class, 'estudiantesDisponibles']);
        Route::get('/',                                      [MatriculaApiController::class, 'indexAperturas']);
        Route::post('/',                                     [MatriculaApiController::class, 'storeMatricula']);
        Route::delete('/{id}',                              [MatriculaApiController::class, 'destroyMatricula']);
    });

    // Horarios de Asistencia
    Route::apiResource('horarios-asistencia', \App\Http\Controllers\Api\HorarioAsistenciaApiController::class)->names('api.horarios-asistencia');

    // Horarios de Clases (Sistema estructurado)
    Route::prefix('horario-clases')->group(function () {
        Route::post('/',                                    [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'store']);
        Route::put('/{id}',                                 [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'update']);
        Route::delete('/{id}',                              [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'destroy']);
        Route::post('/validar-conflictos',                 [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'validarConflictos']);
    });
    
    Route::get('secciones/{seccionId}/horario',             [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'porSeccion']);
    Route::post('secciones/{seccionId}/clonar-horario',     [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'clonarHorario']);
    Route::get('docentes/{docenteId}/horario-clases',       [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'porDocente']);
    Route::get('docentes/{docenteId}/carga-horaria',        [\App\Http\Controllers\Api\HorarioClaseApiController::class, 'cargaHoraria']);

    // Bloques Horarios (Configuración)
    Route::apiResource('horario-bloques', \App\Http\Controllers\Api\HorarioBloqueApiController::class)->except(['show'])->names('api.horario-bloques');

    // Perfil del usuario autenticado
    Route::patch('me/perfil',   [\App\Http\Controllers\Api\PerfilApiController::class, 'updateDatos']);
    Route::post('me/foto',      [\App\Http\Controllers\Api\PerfilApiController::class, 'updateFoto']);
    Route::put('me/password',   [\App\Http\Controllers\Api\PerfilApiController::class, 'updatePassword']);
});
