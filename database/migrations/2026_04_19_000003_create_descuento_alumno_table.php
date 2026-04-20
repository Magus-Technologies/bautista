<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('descuento_alumno', function (Blueprint $table) {
            $table->id('descuento_id');
            $table->unsignedBigInteger('insti_id');
            $table->unsignedBigInteger('estu_id');
            $table->unsignedBigInteger('concepto_id')->nullable();
            $table->enum('motivo', ['hermanos', 'merito', 'beca', 'otro']);
            $table->enum('tipo', ['porcentaje', 'monto_fijo']);
            $table->decimal('valor', 10, 2);
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->text('observacion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
            $table->foreign('estu_id')->references('estu_id')->on('estudiantes')->cascadeOnDelete();
            $table->foreign('concepto_id')->references('concepto_id')->on('concepto_pago')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('descuento_alumno');
    }
};
