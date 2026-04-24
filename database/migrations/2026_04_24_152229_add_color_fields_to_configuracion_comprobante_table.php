<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuracion_comprobante', function (Blueprint $table) {
            $table->string('color_texto_comprobante', 7)->default('#1e40af')->after('color_fondo_header');
            $table->string('color_texto_secundario', 7)->default('#6b7280')->after('color_texto_comprobante');
        });
    }

    public function down(): void
    {
        Schema::table('configuracion_comprobante', function (Blueprint $table) {
            $table->dropColumn(['color_texto_comprobante', 'color_texto_secundario']);
        });
    }
};
