<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('concepto_pago', function (Blueprint $table) {
            $table->id('concepto_id');
            $table->unsignedBigInteger('insti_id');
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->enum('periodicidad', ['mensual', 'anual', 'unico'])->default('mensual');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->foreign('insti_id')->references('insti_id')->on('institucion_educativa')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('concepto_pago');
    }
};
