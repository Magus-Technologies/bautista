<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: vincular pagos al sistema de conceptos de cobro.
 *
 * Agrega concepto_id a la tabla pagos para que cada registro
 * esté asociado a un concepto configurable (mensual, único, anual).
 *
 * Las columnas legacy pag_nombre1/2 y pag_otro1/2 se mantienen
 * para compatibilidad con datos existentes pero quedan deprecadas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            // Vínculo al concepto de cobro configurado
            $table->unsignedBigInteger('concepto_id')
                  ->nullable()
                  ->after('contacto_id')
                  ->comment('FK a concepto_pago — null en registros legacy');

            // pag_mes pasa a ser nullable (conceptos único/anual no tienen mes)
            $table->string('pag_mes', 20)->nullable()->change();

            $table->index('concepto_id', 'idx_pagos_concepto');
            $table->index(['estu_id', 'pag_anual', 'concepto_id'], 'idx_pagos_estu_anio_concepto');
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropIndex('idx_pagos_concepto');
            $table->dropIndex('idx_pagos_estu_anio_concepto');
            $table->dropColumn('concepto_id');
            $table->string('pag_mes', 20)->nullable(false)->change();
        });
    }
};
