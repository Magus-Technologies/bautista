<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comprobante_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('comprobante_id');
            $table->unsignedBigInteger('pag_id')->nullable();   // pago origen de esta línea

            $table->string('cod_producto', 30);
            $table->char('unidad', 3)->default('ZZ');           // ZZ = servicio educativo
            $table->string('descripcion', 300);
            $table->unsignedSmallInteger('cantidad')->default(1);
            $table->decimal('precio_unitario', 14, 2);
            $table->decimal('subtotal', 14, 2);

            $table->timestamps();

            $table->foreign('comprobante_id')
                  ->references('id')->on('comprobantes')
                  ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobante_items');
    }
};
