<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rh_contratos', function (Blueprint $table) {
            $table->dropColumn(['hora_entrada', 'hora_salida', 'minutos_tolerancia']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rh_contratos', function (Blueprint $table) {
            $table->time('hora_entrada')->nullable()->after('horas_semanales');
            $table->time('hora_salida')->nullable()->after('hora_entrada');
            $table->integer('minutos_tolerancia')->default(15)->after('hora_salida');
        });
    }
};
