<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('descuento_alumno', function (Blueprint $table) {
            $table->unsignedBigInteger('estu_id')->nullable()->change();
            $table->unsignedBigInteger('nivel_id')->nullable()->after('estu_id');
            $table->unsignedBigInteger('grado_id')->nullable()->after('nivel_id');
            $table->unsignedBigInteger('seccion_id')->nullable()->after('grado_id');

            $table->foreign('nivel_id')->references('nivel_id')->on('niveles_educativos')->onDelete('cascade');
            $table->foreign('grado_id')->references('grado_id')->on('grados')->onDelete('cascade');
            $table->foreign('seccion_id')->references('seccion_id')->on('secciones')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('descuento_alumno', function (Blueprint $table) {
            $table->dropForeign(['nivel_id']);
            $table->dropForeign(['grado_id']);
            $table->dropForeign(['seccion_id']);
            $table->dropColumn(['nivel_id', 'grado_id', 'seccion_id']);
            $table->unsignedBigInteger('estu_id')->nullable(false)->change();
        });
    }
};
