<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar todos los registros con tipo_usuario='D' (Docente) a 'T' (Trabajador)
        // porque los docentes son trabajadores
        DB::table('horarios_asistencia')
            ->where('tipo_usuario', 'D')
            ->update(['tipo_usuario' => 'T']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir los cambios (opcional, ya que no podemos saber cuáles eran 'D' originalmente)
        // No hacemos nada en el down porque no queremos perder datos
    }
};
