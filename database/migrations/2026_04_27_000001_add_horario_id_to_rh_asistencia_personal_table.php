<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rh_asistencia_personal', function (Blueprint $table) {
            $table->unsignedBigInteger('horario_id')->nullable()->after('contrato_id');
            $table->integer('minutos_salida_anticipada')->default(0)->after('minutos_tardanza');

            $table->foreign('horario_id')
                ->references('horario_id')
                ->on('horarios_asistencia')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('rh_asistencia_personal', function (Blueprint $table) {
            $table->dropForeign(['horario_id']);
            $table->dropColumn(['horario_id', 'minutos_salida_anticipada']);
        });
    }
};
