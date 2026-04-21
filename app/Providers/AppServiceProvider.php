<?php

namespace App\Providers;

use App\Repositories\Implements\PagoNotificaRepository;
use App\Repositories\Implements\PagoRepository;
use App\Repositories\Implements\GaleriaRepository;
use App\Repositories\Implements\NoticiaRepository;
use App\Repositories\Implements\InstitucionRepository;
use App\Repositories\Implements\AsistenciaRepository;
use App\Repositories\Implements\CursoRepository;
use App\Repositories\Implements\CursoContenidoRepository;
use App\Repositories\Implements\MatriculaRepository;
use App\Repositories\Implements\DocenteRepository;
use App\Repositories\Implements\EstudianteRepository;
use App\Repositories\Implements\GradoRepository;
use App\Repositories\Implements\NivelEducativoRepository;
use App\Repositories\Implements\SeccionRepository;
use App\Repositories\Implements\ActividadRepository;
use App\Repositories\Implements\UsuarioRepository;
use App\Repositories\Implements\FotocheckRepository;
use App\Repositories\Interfaces\PagoNotificaRepositoryInterface;
use App\Repositories\Interfaces\PagoRepositoryInterface;
use App\Repositories\Interfaces\UsuarioRepositoryInterface;
use App\Repositories\Interfaces\GaleriaRepositoryInterface;
use App\Repositories\Interfaces\NoticiaRepositoryInterface;
use App\Repositories\Interfaces\InstitucionRepositoryInterface;
use App\Repositories\Interfaces\AsistenciaRepositoryInterface;
use App\Repositories\Interfaces\CursoRepositoryInterface;
use App\Repositories\Interfaces\CursoContenidoRepositoryInterface;
use App\Repositories\Interfaces\MatriculaRepositoryInterface;
use App\Repositories\Interfaces\DocenteRepositoryInterface;
use App\Repositories\Interfaces\EstudianteRepositoryInterface;
use App\Repositories\Interfaces\GradoRepositoryInterface;
use App\Repositories\Interfaces\NivelEducativoRepositoryInterface;
use App\Repositories\Interfaces\SeccionRepositoryInterface;
use App\Repositories\Interfaces\ActividadRepositoryInterface;
use App\Repositories\Interfaces\FotocheckRepositoryInterface;
use App\Services\ActividadUsuarioService;
use App\Services\Implements\PagoNotificaService;
use App\Services\Implements\PagoService;
use App\Services\Implements\GaleriaService;
use App\Services\Implements\MensajeService;
use App\Services\Implements\MensajeriaGrupoService;
use App\Services\Implements\NoticiaService;
use App\Services\Implements\InstitucionService;
use App\Services\Implements\AsistenciaService;
use App\Services\Implements\AuthService;
use App\Services\Implements\CursoContenidoService;
use App\Services\Implements\MatriculaService;
use App\Services\Implements\CursoService;
use App\Services\Implements\DocenteService;
use App\Services\Implements\DocenteCursoService;
use App\Services\Implements\EstudianteService;
use App\Services\Implements\GradoService;
use App\Services\Implements\NivelEducativoService;
use App\Services\Implements\SeccionService;
use App\Services\Implements\ActividadService;
use App\Services\Implements\UsuarioService;
use App\Services\Implements\FotocheckService;
use App\Services\Interfaces\PagoNotificaServiceInterface;
use App\Services\Interfaces\PagoServiceInterface;
use App\Services\Interfaces\UsuarioServiceInterface;
use App\Services\Interfaces\GaleriaServiceInterface;
use App\Services\Interfaces\MensajeServiceInterface;
use App\Services\Interfaces\MensajeriaGrupoServiceInterface;
use App\Services\Interfaces\NoticiaServiceInterface;
use App\Services\Interfaces\InstitucionServiceInterface;
use App\Services\Interfaces\AsistenciaServiceInterface;
use App\Services\Interfaces\AuthServiceInterface;
use App\Services\Interfaces\CursoContenidoServiceInterface;
use App\Services\Interfaces\MatriculaServiceInterface;
use App\Services\Interfaces\CursoServiceInterface;
use App\Services\Interfaces\DocenteServiceInterface;
use App\Services\Interfaces\DocenteCursoServiceInterface;
use App\Services\Interfaces\EstudianteServiceInterface;
use App\Services\Interfaces\GradoServiceInterface;
use App\Services\Interfaces\NivelEducativoServiceInterface;
use App\Services\Interfaces\SeccionServiceInterface;
use App\Services\Interfaces\ActividadServiceInterface;
use App\Services\Interfaces\FotocheckServiceInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Auth
        $this->app->bind(AuthServiceInterface::class, AuthService::class);

        // Dashboard
        $this->app->bind(\App\Services\Interfaces\DashboardServiceInterface::class, \App\Services\Implements\DashboardService::class);

        // Auditoría de actividad — singleton para reutilizar en múltiples servicios
        $this->app->singleton(ActividadUsuarioService::class);

        // Pagos
        $this->app->bind(PagoRepositoryInterface::class, PagoRepository::class);
        $this->app->bind(PagoServiceInterface::class, PagoService::class);
        $this->app->bind(\App\Repositories\Interfaces\PadreRepositoryInterface::class, \App\Repositories\Implements\PadreRepository::class);

        // Vouchers / Notificaciones de pago
        $this->app->bind(PagoNotificaRepositoryInterface::class, PagoNotificaRepository::class);
        $this->app->bind(PagoNotificaServiceInterface::class, PagoNotificaService::class);

        // Institución
        $this->app->bind(InstitucionRepositoryInterface::class, InstitucionRepository::class);
        $this->app->bind(InstitucionServiceInterface::class, InstitucionService::class);

        // Galería
        $this->app->bind(GaleriaRepositoryInterface::class, GaleriaRepository::class);
        $this->app->bind(GaleriaServiceInterface::class, GaleriaService::class);

        // Noticias
        $this->app->bind(NoticiaRepositoryInterface::class, NoticiaRepository::class);
        $this->app->bind(NoticiaServiceInterface::class, NoticiaService::class);

        // Mensajería
        $this->app->bind(MensajeServiceInterface::class, MensajeService::class);
        $this->app->bind(MensajeriaGrupoServiceInterface::class, MensajeriaGrupoService::class);

        // Estudiante
        $this->app->bind(EstudianteRepositoryInterface::class, EstudianteRepository::class);
        $this->app->bind(EstudianteServiceInterface::class, EstudianteService::class);

        // NivelEducativo
        $this->app->bind(NivelEducativoRepositoryInterface::class, NivelEducativoRepository::class);
        $this->app->bind(NivelEducativoServiceInterface::class, NivelEducativoService::class);

        // Grado
        $this->app->bind(GradoRepositoryInterface::class, GradoRepository::class);
        $this->app->bind(GradoServiceInterface::class, GradoService::class);

        // Seccion
        $this->app->bind(SeccionRepositoryInterface::class, SeccionRepository::class);
        $this->app->bind(SeccionServiceInterface::class, SeccionService::class);

        // Curso
        $this->app->bind(CursoRepositoryInterface::class, CursoRepository::class);
        $this->app->bind(CursoServiceInterface::class, CursoService::class);

        // Docente
        $this->app->bind(DocenteRepositoryInterface::class, DocenteRepository::class);
        $this->app->bind(DocenteServiceInterface::class, DocenteService::class);
        $this->app->bind(DocenteCursoServiceInterface::class, DocenteCursoService::class);
        $this->app->bind(\App\Services\Interfaces\AnuncioServiceInterface::class, \App\Services\Implements\AnuncioService::class);
        $this->app->bind(\App\Services\Interfaces\DocenteAlumnoServiceInterface::class, \App\Services\Implements\DocenteAlumnoService::class);
        $this->app->bind(\App\Services\Interfaces\DocenteAsistenciaServiceInterface::class, \App\Services\Implements\DocenteAsistenciaService::class);
        $this->app->bind(\App\Services\Interfaces\DocenteExcelExportServiceInterface::class, \App\Services\Implements\DocenteExcelExportService::class);

        // Matricula
        $this->app->bind(MatriculaRepositoryInterface::class, MatriculaRepository::class);
        $this->app->bind(MatriculaServiceInterface::class, MatriculaService::class);

        // CursoContenido (Unidades y Clases)
        $this->app->bind(CursoContenidoRepositoryInterface::class, CursoContenidoRepository::class);
        $this->app->bind(CursoContenidoServiceInterface::class, CursoContenidoService::class);

        // Asistencia
        $this->app->bind(AsistenciaRepositoryInterface::class, AsistenciaRepository::class);
        $this->app->bind(AsistenciaServiceInterface::class, AsistenciaService::class);

        // Actividades (Exámenes Virtuales)
        $this->app->bind(ActividadRepositoryInterface::class, ActividadRepository::class);
        $this->app->bind(ActividadServiceInterface::class, ActividadService::class);

        // Usuarios
        $this->app->bind(UsuarioRepositoryInterface::class, UsuarioRepository::class);
        $this->app->bind(UsuarioServiceInterface::class, UsuarioService::class);

        // Fotocheck
        $this->app->bind(FotocheckRepositoryInterface::class, FotocheckRepository::class);
        $this->app->bind(FotocheckServiceInterface::class, FotocheckService::class);

        // Horarios
        $this->app->bind(\App\Services\Interfaces\HorarioServiceInterface::class, \App\Services\Implements\HorarioService::class);

        // Aulas
        $this->app->bind(\App\Repositories\Interfaces\AulaRepositoryInterface::class, \App\Repositories\Implements\AulaRepository::class);
        $this->app->bind(\App\Services\Interfaces\AulaServiceInterface::class, \App\Services\Implements\AulaService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
