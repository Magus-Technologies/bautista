<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->unsignedBigInteger('comprobante_id')->nullable()->after('concepto_id');
            $table->foreign('comprobante_id')
                  ->references('id')->on('comprobantes')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pagos', function (Blueprint $table) {
            $table->dropForeign(['comprobante_id']);
            $table->dropColumn('comprobante_id');
        });
    }
};
