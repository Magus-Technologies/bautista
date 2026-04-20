<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('estudiante_contacto', function (Blueprint $table) {
            $table->tinyInteger('dia_pago')->nullable()->after('mensualidad')
                ->comment('Día del mes en que vence la pensión (1-31)');
        });
    }

    public function down(): void
    {
        Schema::table('estudiante_contacto', function (Blueprint $table) {
            $table->dropColumn('dia_pago');
        });
    }
};
