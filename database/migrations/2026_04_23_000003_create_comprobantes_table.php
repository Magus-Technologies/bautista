<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('insti_id');

            // Identificación del documento
            $table->enum('tipo_documento', ['boleta', 'factura']);
            $table->string('serie', 10);           // B001, F001
            $table->unsignedInteger('numero');     // correlativo
            $table->date('fecha_emision');
            $table->char('moneda', 3)->default('PEN');
            $table->enum('forma_pago', ['contado', 'credito'])->default('contado');

            // Cliente
            $table->char('cliente_tipo_doc', 2)->default('01'); // 01=DNI 06=RUC
            $table->string('cliente_num_doc', 15);
            $table->string('cliente_nombre', 200);
            $table->string('cliente_direccion', 300)->nullable();

            // Totales
            $table->decimal('op_gravada', 14, 2)->default(0);
            $table->decimal('igv', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);

            // Resultado de la API (generación)
            $table->string('nombre_archivo', 100)->nullable();  // 10706671817-03-B001-5
            $table->string('hash', 100)->nullable();
            $table->text('qr_info')->nullable();
            $table->longText('contenido_xml')->nullable();

            // Resultado del envío a SUNAT
            $table->enum('estado', ['borrador', 'generado', 'enviado', 'aceptado', 'rechazado', 'anulado'])
                  ->default('borrador');
            $table->text('sunat_response')->nullable();         // CDR base64 o mensaje error
            $table->string('endpoint', 20)->default('beta');

            // Relaciones
            $table->unsignedBigInteger('contacto_id')->nullable();
            $table->unsignedBigInteger('estu_id')->nullable();

            $table->timestamps();

            $table->unique(['insti_id', 'serie', 'numero']);
            $table->foreign('insti_id')
                  ->references('insti_id')->on('institucion_educativa')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobantes');
    }
};
