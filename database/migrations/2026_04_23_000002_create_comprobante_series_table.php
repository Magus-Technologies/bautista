<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comprobante_series', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('insti_id');
            $table->enum('tipo_documento', ['boleta', 'factura']);
            $table->string('serie', 10);           // B001, F001
            $table->unsignedInteger('ultimo_numero')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['insti_id', 'serie']);
            $table->foreign('insti_id')
                  ->references('insti_id')->on('institucion_educativa')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobante_series');
    }
};
