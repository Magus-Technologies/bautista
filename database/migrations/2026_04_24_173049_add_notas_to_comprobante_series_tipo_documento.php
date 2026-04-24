<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE comprobante_series MODIFY COLUMN tipo_documento ENUM('boleta', 'factura', 'nota_credito', 'nota_debito')");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE comprobante_series MODIFY COLUMN tipo_documento ENUM('boleta', 'factura')");
    }
};
