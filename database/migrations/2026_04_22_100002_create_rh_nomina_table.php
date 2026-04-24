<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rh_nomina', function (Blueprint $table) {
            $table->id('nomina_id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('contrato_id')->constrained('rh_contratos', 'contrato_id')->cascadeOnDelete();
            $table->unsignedBigInteger('insti_id');
            
            // Período
            $table->integer('mes');
            $table->integer('anio');
            
            // Cálculos
            $table->decimal('sueldo_base', 10, 2);
            $table->decimal('bonificaciones', 10, 2)->default(0);
            $table->decimal('total_descuentos', 10, 2)->default(0);
            $table->decimal('descuentos_tardanzas', 10, 2)->default(0);
            $table->integer('dias_trabajados')->default(0);
            $table->integer('dias_ausentes')->default(0);
            $table->integer('total_tardanzas')->default(0);
            $table->decimal('sueldo_neto', 10, 2);
            
            // Estado
            $table->enum('estado', ['pendiente', 'aprobado', 'pagado'])->default('pendiente');
            $table->date('fecha_pago')->nullable();
            
            $table->text('observaciones')->nullable();
            $table->timestamps();
            
            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
            $table->unique(['user_id', 'mes', 'anio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rh_nomina');
    }
};
