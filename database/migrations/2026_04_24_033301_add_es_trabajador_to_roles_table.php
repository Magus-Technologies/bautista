<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->boolean('es_trabajador')->default(false)->after('guard_name');
        });

        // Marcar roles de trabajador existentes
        DB::table('roles')->whereIn('name', ['docente', 'rh'])->update(['es_trabajador' => true]);
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('es_trabajador');
        });
    }
};
