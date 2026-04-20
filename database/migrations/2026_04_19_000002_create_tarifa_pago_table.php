<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifa_pago', function (Blueprint $table) {
            $table->id('tarifa_id');
            $table->unsignedBigInteger('insti_id');
            $table->unsignedBigInteger('concepto_id');
            $table->unsignedBigInteger('grado_id')->nullable();
            $table->year('anio_escolar');
            $table->decimal('monto', 10, 2);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
            $table->foreign('concepto_id')->references('concepto_id')->on('concepto_pago')->cascadeOnDelete();
            $table->foreign('grado_id')->references('grado_id')->on('grados')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifa_pago');
    }
};
