<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarifa_pago', function (Blueprint $table) {
            $table->tinyInteger('dia_vencimiento')->nullable()->after('monto')
                ->comment('Día del mes en que vence el pago (1-28). Solo aplica a conceptos mensuales.');
        });
    }

    public function down(): void
    {
        Schema::table('tarifa_pago', function (Blueprint $table) {
            $table->dropColumn('dia_vencimiento');
        });
    }
};
