<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de avisos de morosidad enviados por WhatsApp.
     *
     * La tarea corre a diario, así que sin esta bitácora un apoderado
     * recibiría el mismo recordatorio cada mañana hasta que pague.
     */
    public function up(): void
    {
        Schema::create('pago_avisos_whatsapp', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('pag_id');
            $table->string('telefono', 20);
            $table->unsignedSmallInteger('dias_vencido');
            $table->timestamp('enviado_en');

            $table->index(['pag_id', 'enviado_en']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pago_avisos_whatsapp');
    }
};
