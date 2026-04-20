<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('concepto_pago', function (Blueprint $table) {
            $table->boolean('opcional')->default(false)->after('periodicidad')
                ->comment('Si es true, el admin puede desmarcar este concepto al matricular');
        });
    }

    public function down(): void
    {
        Schema::table('concepto_pago', function (Blueprint $table) {
            $table->dropColumn('opcional');
        });
    }
};
