<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('institucion_educativa', function (Blueprint $table) {
            $table->string('insti_sunat_usuario', 50)->nullable()->after('insti_ruc');
            $table->string('insti_sunat_clave', 100)->nullable()->after('insti_sunat_usuario');
            $table->string('insti_sunat_endpoint', 20)->default('beta')->after('insti_sunat_clave');
            $table->string('insti_certificado_path', 255)->nullable()->after('insti_sunat_endpoint');
            $table->boolean('insti_certificado_enviado')->default(false)->after('insti_certificado_path');
        });
    }

    public function down(): void
    {
        Schema::table('institucion_educativa', function (Blueprint $table) {
            $table->dropColumn([
                'insti_sunat_usuario',
                'insti_sunat_clave',
                'insti_sunat_endpoint',
                'insti_certificado_path',
                'insti_certificado_enviado',
            ]);
        });
    }
};
