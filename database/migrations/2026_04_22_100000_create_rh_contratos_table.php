<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rh_contratos', function (Blueprint $table) {
            $table->id('contrato_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('insti_id');
            
            // Datos del contrato
            $table->enum('tipo_contrato', ['tiempo_completo', 'medio_tiempo', 'por_horas', 'practicante'])->default('tiempo_completo');
            $table->decimal('sueldo_base', 10, 2);
            $table->decimal('bonificaciones', 10, 2)->default(0);
            $table->integer('horas_semanales')->default(40);
            
            // Horario de trabajo
            $table->time('hora_entrada')->nullable();
            $table->time('hora_salida')->nullable();
            $table->integer('minutos_tolerancia')->default(15); // Tolerancia antes de marcar tardanza
            $table->decimal('descuento_por_tardanza', 10, 2)->default(0); // Monto fijo o porcentaje
            $table->enum('tipo_descuento', ['fijo', 'porcentaje'])->default('fijo');
            
            // Vigencia
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->enum('estado', ['activo', 'suspendido', 'finalizado'])->default('activo');
            
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
            $table->index(['user_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rh_contratos');
    }
};
