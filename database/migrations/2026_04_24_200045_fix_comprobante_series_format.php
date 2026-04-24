<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Actualizar series existentes al formato correcto de 4 caracteres
        DB::table('comprobante_series')->where('serie', 'B01')->update(['serie' => 'B001']);
        DB::table('comprobante_series')->where('serie', 'F01')->update(['serie' => 'F001']);
        DB::table('comprobante_series')->where('serie', 'BC01')->update(['serie' => 'BC01']); // Ya tiene 4
        DB::table('comprobante_series')->where('serie', 'BD01')->update(['serie' => 'BD01']); // Ya tiene 4
        DB::table('comprobante_series')->where('serie', 'FC01')->update(['serie' => 'FC01']); // Ya tiene 4
        DB::table('comprobante_series')->where('serie', 'FD01')->update(['serie' => 'FD01']); // Ya tiene 4
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir al formato anterior
        DB::table('comprobante_series')->where('serie', 'B001')->update(['serie' => 'B01']);
        DB::table('comprobante_series')->where('serie', 'F001')->update(['serie' => 'F01']);
    }
};
