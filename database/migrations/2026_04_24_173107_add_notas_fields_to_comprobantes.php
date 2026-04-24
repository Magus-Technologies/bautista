<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Modificar ENUM de tipo_documento
        DB::statement("ALTER TABLE comprobantes MODIFY COLUMN tipo_documento ENUM('boleta', 'factura', 'nota_credito', 'nota_debito')");

        // Agregar campos para notas
        Schema::table('comprobantes', function (Blueprint $table) {
            $table->unsignedBigInteger('comprobante_referencia_id')->nullable()->after('estu_id')
                  ->comment('ID del comprobante original que se está modificando');
            
            $table->char('tipo_nota', 2)->nullable()->after('comprobante_referencia_id')
                  ->comment('Código del catálogo 09 (crédito) o 10 (débito) de SUNAT');
            
            $table->string('motivo_nota', 500)->nullable()->after('tipo_nota')
                  ->comment('Descripción del motivo de la nota');
            
            $table->char('documento_referencia_tipo', 2)->nullable()->after('motivo_nota')
                  ->comment('03=Boleta, 01=Factura');
            
            $table->string('documento_referencia_serie', 10)->nullable()->after('documento_referencia_tipo');
            
            $table->unsignedInteger('documento_referencia_numero')->nullable()->after('documento_referencia_serie');
            
            $table->date('documento_referencia_fecha')->nullable()->after('documento_referencia_numero');

            // Foreign key
            $table->foreign('comprobante_referencia_id')
                  ->references('id')->on('comprobantes')
                  ->onDelete('restrict');
            
            // Índice para búsquedas
            $table->index('comprobante_referencia_id');
        });
    }

    public function down(): void
    {
        Schema::table('comprobantes', function (Blueprint $table) {
            $table->dropForeign(['comprobante_referencia_id']);
            $table->dropIndex(['comprobante_referencia_id']);
            $table->dropColumn([
                'comprobante_referencia_id',
                'tipo_nota',
                'motivo_nota',
                'documento_referencia_tipo',
                'documento_referencia_serie',
                'documento_referencia_numero',
                'documento_referencia_fecha',
            ]);
        });

        DB::statement("ALTER TABLE comprobantes MODIFY COLUMN tipo_documento ENUM('boleta', 'factura')");
    }
};
