<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

Route::get('/', fn () => redirect()->route('login'))->name('home');

// ── Rutas públicas ──────────────────────────────────────────────────────
Route::get('/login', fn () => Inertia::render('auth/login'))->name('login');

// ── Rutas protegidas ────────────────────────────────────────────────────
Route::middleware(['auth.token'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard/index');
    })->middleware('permission:dashboard.ver')->name('dashboard');

    Route::get('/institucion',         fn () => Inertia::render('Institucion/index'))->middleware('permission:institucion.datos.ver')->name('institucion.index');
    Route::get('/institucion/galeria',   fn () => Inertia::render('Institucion/Galeria/index'))->middleware('permission:institucion.galeria.ver')->name('institucion.galeria');
    Route::get('/institucion/noticias',  fn () => Inertia::render('Institucion/Noticias/index'))->middleware('permission:institucion.noticias.ver')->name('institucion.noticias');
    Route::get('/institucion/noticias/portada', [\App\Http\Controllers\Admin\NoticiaController::class, 'portada'])->middleware('permission:institucion.noticias.ver|institucion.noticias.portada')->name('institucion.noticias.portada');
    Route::get('/institucion/noticias/diario/{id}', [\App\Http\Controllers\Admin\NoticiaController::class, 'showDiario'])->middleware('permission:institucion.noticias.ver|institucion.noticias.portada')->name('institucion.noticias.diario');
    Route::post('/institucion/noticias/{id}/comentarios', [\App\Http\Controllers\Admin\NoticiaController::class, 'storeComentario'])->middleware('permission:institucion.noticias.comentar')->name('institucion.noticias.comentarios.store');
    
    Route::get('/mensajes',              fn () => Inertia::render('Comunicados/index'))->middleware('permission:admin.comunicados.ver')->name('mensajes.index');
    
    Route::get('/credencial',            fn () => Inertia::render('Shared/CredencialDigital'))->middleware('permission:credencial.ver')->name('credencial');
    Route::get('/mi-fotocheck',          [\App\Http\Controllers\Admin\FotocheckController::class, 'generatePropio'])->middleware('permission:credencial.ver')->name('mi-fotocheck');

    Route::get('/estudiantes',  fn () => Inertia::render('GestionAlumnos/index'))->middleware('permission:personal.estudiantes.ver')->name('estudiantes.index');
    Route::get('/estudiantes/{id}/fotocheck', [\App\Http\Controllers\Admin\FotocheckController::class, 'generate'])->middleware('permission:personal.estudiantes.ver')->name('estudiantes.fotocheck');
    Route::get('/matriculas/aperturas/{aperturaId}/niveles/{nivelId}/fotochecks', [\App\Http\Controllers\Admin\FotocheckController::class, 'generateBulk'])->middleware('permission:personal.estudiantes.ver')->name('matriculas.fotochecks.bulk');
    
    Route::get('/docentes',     fn () => Inertia::render('GestionDocentes/index'))->middleware('permission:personal.docentes.ver')->name('docentes.index');
    
    Route::get('/niveles',      fn () => Inertia::render('Niveles/index'))->middleware('permission:academico.niveles.ver')->name('niveles.index');
    Route::get('/grados',       fn () => Inertia::render('Grados/index'))->middleware('permission:academico.cursos.ver')->name('grados.index');
    Route::get('/secciones',    fn () => Inertia::render('Secciones/index'))->middleware('permission:academico.secciones.ver')->name('secciones.index');
    Route::get('/secciones/{seccionId}/horarios', function (int $seccionId) {
        $seccion = \App\Models\Seccion::with('grado')->findOrFail($seccionId);
        return Inertia::render('Secciones/HorariosPage', [
            'seccionId'    => $seccionId,
            'gradoId'      => $seccion->id_grado,
            'seccionNombre' => $seccion->nombre,
            'gradoNombre'   => $seccion->grado?->nombre_grado,
        ]);
    })->middleware('permission:academico.horarios.ver')->name('secciones.horarios');
    Route::get('/cursos',       fn () => Inertia::render('Cursos/index'))->middleware('permission:academico.cursos.ver|portal.estudiante.cursos|portal.docente.cursos')->name('cursos.index');
    
    Route::get('/pagos',            fn () => Inertia::render('Pagos/index'))->middleware('permission:admin.pagos.ver')->name('pagos.index');
    Route::get('/conceptos-pago',   fn () => Inertia::render('ConceptoPago/index'))->middleware('permission:admin.pagos.ver')->name('conceptos-pago.index');
    Route::get('/tarifas-pago',     fn () => Inertia::render('TarifaPago/index'))->middleware('permission:admin.pagos.ver')->name('tarifas-pago.index');
    Route::get('/descuentos',       fn () => Inertia::render('DescuentoAlumno/index'))->middleware('permission:admin.pagos.ver')->name('descuentos.index');
    
    Route::get('/matriculas',                                        fn () => Inertia::render('Matricula/index'))->middleware('permission:matriculas.aperturas.ver')->name('matriculas.index');
    Route::get('/matriculas/gestion',                               fn () => Inertia::render('Matricula/Gestion'))->middleware('permission:matriculas.gestion.ver')->name('matriculas.gestion');
    Route::get('/matriculas/gestion/{aperturaId}/nivel/{nivelId}',  fn (int $aperturaId, int $nivelId) => Inertia::render('Matricula/NivelEstudiantes', [
        'aperturaId' => $aperturaId,
        'nivelId'    => $nivelId,
    ]))->middleware('permission:matriculas.gestion.ver')->name('matriculas.nivel');

    Route::get('/cursos/{id}/contenido',  fn (int $id) => Inertia::render('CursoContenido/index', ['cursoId' => $id]))->middleware('permission:academico.cursos.ver|portal.estudiante.cursos|portal.docente.cursos')->name('cursos.contenido');

    Route::prefix('alumno')->name('alumno.')->middleware('permission:portal.estudiante.ver')->group(function () {
        Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');
        Route::get('/cursos',    fn () => Inertia::render('Cursos/index'))->name('cursos.index');
        Route::get('/cursos/{id}', fn (int $id) => Inertia::render('PortalAlumno/Cursos/Detalle', ['cursoId' => $id]))->name('cursos.detalle');
        Route::get('/clase/{id}', fn (int $id) => Inertia::render('PortalAlumno/Clases/Ver', ['claseId' => $id]))->name('clase.ver');
        Route::get('/notas',     fn () => Inertia::render('PortalAlumno/Notas/index'))->name('notas.index');
        
        // Activity Resolution Routes
        Route::get('/examen/{id}/resolver', function (int $id) {
            $user = auth()->user();
            $estudiante = \App\Models\Estudiante::where('user_id', $user->id)->firstOrFail();
            $actividad = \App\Models\ActividadCurso::findOrFail($id);
            return Inertia::render('Examenes/Resolver', [
                'actividadId' => $id,
                'estudianteId' => $estudiante->estu_id,
                'actividadNombre' => $actividad->nombre_actividad
            ]);
        })->name('examen.resolver');

        Route::get('/dibujo/{id}', function (int $id) {
            $actividad = \App\Models\ActividadCurso::findOrFail($id);
            return Inertia::render('Actividades/Dibujo', [
                'actividad' => $actividad
            ]);
        })->name('dibujo.resolver');

        Route::get('/puzzles/{id}', function (int $id) {
            $actividad = \App\Models\ActividadCurso::findOrFail($id);
            return Inertia::render('Actividades/Puzzles/Ver', [
                'actividad' => $actividad
            ]);
        })->name('puzzles.ver');

        Route::get('/puzzles', function () {
            $estuId = auth()->user()->id;
            $puzzles = DB::table('actividad_curso as ac')
                ->join('imagen_rompecabeza as ir', 'ac.actividad_id', '=', 'ir.actividad_id')
                ->leftJoin('alumno_rompecabeza as ar', function($join) use ($estuId) {
                    $join->on('ac.actividad_id', '=', 'ar.actividad_id')
                         ->where('ar.estu_id', '=', $estuId);
                })
                ->where('ac.id_tipo_actividad', 6)
                ->select('ac.*', 'ir.imagen', 'ar.tiempo', 'ar.intentos', 'ar.ayuda')
                ->get();

            return Inertia::render('Actividades/Puzzles/index', [
                'puzzles' => $puzzles
            ]);
        })->middleware('permission:portal.estudiante.puzzles')->name('puzzles.index');

        Route::get('/profesores', fn () => Inertia::render('PortalAlumno/Profesores'))->name('profesores');
        Route::get('/asistencia', fn () => Inertia::render('PortalAlumno/Asistencia'))->middleware('permission:portal.estudiante.asistencia')->name('asistencia');
    });

    Route::prefix('docente')->name('docente.')->middleware('permission:portal.docente.ver')->group(function () {
        Route::get('/dashboard', fn () => redirect()->route('dashboard'))->name('dashboard');
        Route::get('/mis-cursos', fn () => Inertia::render('PortalDocente/MisCursos'))->name('mis-cursos.index');
        Route::get('/mis-alumnos', [\App\Http\Controllers\DocenteController::class, 'misAlumnos'])->middleware('permission:portal.docente.alumnos')->name('mis-alumnos.index');
        Route::get('/cursos/{id}/contenido', fn (int $id) => Inertia::render('PortalDocente/Contenido/Editor', ['docenteCursoId' => $id]))->name('cursos.contenido');
        Route::get('/cursos/{id}/asistencia', fn (int $id) => Inertia::render('PortalDocente/Asistencia/PasarLista', ['docenteCursoId' => $id]))->name('cursos.asistencia');
        Route::get('/asistencia', fn () => Inertia::render('PortalDocente/Asistencia/MiAsistencia'))->name('asistencia');
        
        // Actividades y Calificaciones
        Route::get('/actividades/{id}', fn (int $id) => Inertia::render('PortalDocente/DetalleActividad', ['actividadId' => $id]))->name('actividades.detalle');
        Route::get('/actividades/{id}/entregas', fn (int $id) => Inertia::render('PortalDocente/CalificarActividad', ['actividadId' => $id]))->name('actividades.entregas');
        Route::get('/actividades/{id}/calificar', fn (int $id) => Inertia::render('PortalDocente/CalificarActividad', ['actividadId' => $id]))->name('actividades.calificar');
        Route::get('/actividades/{id}/calificar-examen', fn (int $id) => Inertia::render('PortalDocente/CalificarExamen', ['actividadId' => $id]))->name('actividades.calificar_examen');
        Route::get('/actividades/{id}/cuestionario', fn (int $id) => Inertia::render('PortalDocente/Contenido/QuizBuilder', ['actividadId' => $id]))->name('actividades.cuestionario');
    });

    Route::prefix('padre')->name('padre.')->middleware('permission:portal.padre.ver')->group(function () {
        Route::get('/dashboard', fn () => Inertia::render('Matricula/Padre/MisHijos'))->name('dashboard');
        Route::get('/mis-hijos', fn () => Inertia::render('Matricula/Padre/MisHijos'))->name('mis-hijos');
        Route::get('/pagos', fn () => Inertia::render('Matricula/Padre/MisPagos'))->name('pagos');
        Route::get('/asistencia', fn () => Inertia::render('Matricula/Padre/AsistenciaHijos'))->name('asistencia');
        Route::get('/cursos', fn () => Inertia::render('Matricula/Padre/MisCursos'))->name('cursos');
        Route::get('/profesores', fn () => Inertia::render('Matricula/Padre/Profesores'))->name('profesores');
        Route::get('/horario',    fn () => Inertia::render('Matricula/Padre/HorarioHijos'))->name('horario');
        Route::get('/matricula', fn () => inertia('Matricula/Padre/MatriculaWizard'))->name('matricula.wizard');
        Route::get('/hijo/{id}', fn (int $id) => Inertia::render('Matricula/Padre/HijoDetalle', ['hijoId' => $id]))->name('hijo.detalle');
    });

    Route::prefix('mensajeria')->name('mensajeria.')->middleware('permission:recursos.mensajeria.ver')->group(function () {
        Route::get('/', fn () => Inertia::render('MensajesPrivados/index'))->name('index');
        Route::get('/ver/{id}', fn (int $id) => Inertia::render('MensajesPrivados/Ver', ['mensajeId' => $id]))->name('ver');
    });

    Route::get('/biblioteca', fn () => Inertia::render('Medios/index'))->middleware('permission:recursos.biblioteca.ver')->name('medios.index');
    Route::get('/asistencia', fn () => Inertia::render('Asistencia/index'))->middleware('permission:asistencia.reportes.ver')->name('asistencia.index');
    Route::get('/asistencia/scanner', fn () => Inertia::render('Asistencia/Scanner'))->middleware('permission:asistencia.scanner.ver')->name('asistencia.scanner');

    Route::get('/aulas',                  fn () => Inertia::render('Aulas/index'))->middleware('permission:academico.aulas.ver')->name('aulas.index');
    Route::get('/horarios',               fn () => Inertia::render('Horarios/index'))->middleware('permission:horarios.asistencia.ver')->name('horarios.index');
    Route::get('/horario-clases',         fn () => Inertia::render('HorarioClases/index'))->name('horario-clases.index');
    Route::get('/usuarios',               fn () => Inertia::render('Usuarios/index'))->middleware('permission:seguridad.usuarios.ver')->name('usuarios.index');
    Route::get('/roles-permisos',         fn () => Inertia::render('Seguridad/index'))->middleware('permission:seguridad.roles.ver')->name('seguridad.roles');
    Route::get('/seguridad/fotocheck',   fn () => Inertia::render('Seguridad/ConfiguracionFotocheck'))->middleware('permission:seguridad.fotochecks.diseno')->name('seguridad.fotocheck');
});

require __DIR__.'/settings.php';
