<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rh_asistencia_personal', function (Blueprint $table) {
            $table->id('asistencia_personal_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contrato_id')->nullable()->constrained('rh_contratos', 'contrato_id')->nullOnDelete();
            $table->unsignedBigInteger('insti_id');
            
            $table->date('fecha');
            $table->time('hora_entrada')->nullable();
            $table->time('hora_salida')->nullable();
            
            // Estado de asistencia
            $table->enum('estado', ['presente', 'ausente', 'tardanza', 'permiso', 'vacaciones', 'licencia'])->default('presente');
            $table->integer('minutos_tardanza')->default(0);
            
            // Descuentos aplicados
            $table->decimal('descuento_aplicado', 10, 2)->default(0);
            $table->text('observaciones')->nullable();
            
            // Registro automático o manual
            $table->enum('tipo_registro', ['automatico', 'manual'])->default('automatico');
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
            
            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
            $table->unique(['user_id', 'fecha']);
            $table->index(['fecha', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rh_asistencia_personal');
    }
};
