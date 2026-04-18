<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── matriculas ────────────────────────────────────────────────
        // Consulta más frecuente: buscar matrícula activa de un estudiante
        $this->addIndexIfNotExists('matriculas', 'idx_mat_estu_estado', ['estu_id', 'estado']);
        // Consulta de sección + apertura (usada en permisos y dashboards)
        $this->addIndexIfNotExists('matriculas', 'idx_mat_seccion_apertura', ['seccion_id', 'apertura_id']);

        // ── docente_cursos ────────────────────────────────────────────
        // Buscar cursos de un docente
        $this->addIndexIfNotExists('docente_cursos', 'idx_dc_docente', ['docente_id']);
        // Verificar acceso por sección + apertura (middleware + dashboards)
        $this->addIndexIfNotExists('docente_cursos', 'idx_dc_seccion_apertura', ['seccion_id', 'apertura_id']);

        // ── nota_actividades ──────────────────────────────────────────
        // Notas de un estudiante
        $this->addIndexIfNotExists('nota_actividades', 'idx_nota_estu', ['estu_id']);
        // Notas de una actividad
        $this->addIndexIfNotExists('nota_actividades', 'idx_nota_actividad', ['actividad_id']);

        // ── actividad_curso ───────────────────────────────────────────
        // Actividades de un curso
        $this->addIndexIfNotExists('actividad_curso', 'idx_act_curso', ['id_curso']);
        // Actividades por fecha de cierre (notificaciones, pendientes)
        $this->addIndexIfNotExists('actividad_curso', 'idx_act_cierre', ['fecha_cierre']);

        // ── asistencia_alumnos ────────────────────────────────────────
        $this->addIndexIfNotExists('asistencia_alumnos', 'idx_asist_estudiante', ['id_estudiante']);

        // ── personal_access_tokens (Sanctum) ─────────────────────────
        // Token lookup — ya tiene índice por defecto pero verificamos
        $this->addIndexIfNotExists('personal_access_tokens', 'idx_pat_tokenable', ['tokenable_id', 'tokenable_type']);
    }

    public function down(): void
    {
        $indexes = [
            'matriculas'             => ['idx_mat_estu_estado', 'idx_mat_seccion_apertura'],
            'docente_cursos'         => ['idx_dc_docente', 'idx_dc_seccion_apertura'],
            'nota_actividades'       => ['idx_nota_estu', 'idx_nota_actividad'],
            'actividad_curso'        => ['idx_act_curso', 'idx_act_cierre'],
            'asistencia_alumnos'     => ['idx_asist_estudiante'],
            'personal_access_tokens' => ['idx_pat_tokenable'],
        ];

        foreach ($indexes as $table => $idxList) {
            foreach ($idxList as $idx) {
                $this->dropIndexIfExists($table, $idx);
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function addIndexIfNotExists(string $table, string $name, array $columns): void
    {
        if (!Schema::hasTable($table)) return;

        $exists = collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($name);

        if (!$exists) {
            Schema::table($table, function (Blueprint $t) use ($name, $columns) {
                $t->index($columns, $name);
            });
        }
    }

    private function dropIndexIfExists(string $table, string $name): void
    {
        if (!Schema::hasTable($table)) return;

        $exists = collect(DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($name);

        if ($exists) {
            Schema::table($table, function (Blueprint $t) use ($name) {
                $t->dropIndex($name);
            });
        }
    }
};
