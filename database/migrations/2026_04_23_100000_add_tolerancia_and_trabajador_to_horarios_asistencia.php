<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('horarios_asistencia', function (Blueprint $table) {
            // Agregar campo de tolerancia
            $table->integer('minutos_tolerancia')->default(15)->after('hora_salida');
        });

        // Modificar el enum para agregar tipo 'T' (Trabajador)
        DB::statement("ALTER TABLE horarios_asistencia MODIFY COLUMN tipo_usuario CHAR(1) COMMENT 'E=estudiante, T=trabajador'");
    }

    public function down(): void
    {
        Schema::table('horarios_asistencia', function (Blueprint $table) {
            $table->dropColumn('minutos_tolerancia');
        });

        // Revertir el enum
        DB::statement("ALTER TABLE horarios_asistencia MODIFY COLUMN tipo_usuario CHAR(1) COMMENT 'E=estudiante'");
    }
};
