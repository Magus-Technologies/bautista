<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE rh_contratos MODIFY COLUMN tipo_descuento ENUM('fijo','porcentaje','proporcional') NOT NULL DEFAULT 'fijo'");
    }

    public function down(): void
    {
        DB::statement("UPDATE rh_contratos SET tipo_descuento = 'fijo' WHERE tipo_descuento = 'proporcional'");
        DB::statement("ALTER TABLE rh_contratos MODIFY COLUMN tipo_descuento ENUM('fijo','porcentaje') NOT NULL DEFAULT 'fijo'");
    }
};
