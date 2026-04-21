<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarifa_pago', function (Blueprint $table) {
            $table->unsignedBigInteger('nivel_id')->nullable()->after('concepto_id');
            $table->unsignedBigInteger('grado_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tarifa_pago', function (Blueprint $table) {
            $table->dropColumn('nivel_id');
            $table->unsignedBigInteger('grado_id')->nullable(false)->change();
        });
    }
};
