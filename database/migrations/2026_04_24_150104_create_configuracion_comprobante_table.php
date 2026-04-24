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
        Schema::create('configuracion_comprobante', function (Blueprint $table) {
            $table->id();
            $table->foreignId('insti_id')->constrained('institucion_educativa', 'insti_id')->cascadeOnDelete();
            
            // Apariencia general
            $table->boolean('mostrar_logo')->default(true);
            $table->string('color_primario', 7)->default('#2563eb');
            $table->string('color_secundario', 7)->default('#1e40af');
            $table->string('color_fondo_header', 7)->default('#f8fafc');
            
            // Textos personalizados
            $table->text('texto_pie_pagina')->nullable();
            $table->text('texto_adicional')->nullable();
            
            // Elementos a mostrar
            $table->boolean('mostrar_qr')->default(true);
            $table->boolean('mostrar_hash')->default(true);
            $table->boolean('mostrar_firma_digital')->default(true);
            $table->boolean('mostrar_telefono')->default(true);
            $table->boolean('mostrar_email')->default(true);
            
            // Formato de números
            $table->string('formato_serie', 20)->default('B001'); // Ejemplo: B001, F001
            $table->integer('digitos_numero')->default(8);
            
            // Tamaño de fuente
            $table->integer('tamano_fuente_base')->default(11);
            $table->integer('tamano_fuente_titulo')->default(18);
            
            $table->timestamps();
            
            $table->unique('insti_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuracion_comprobante');
    }
};
