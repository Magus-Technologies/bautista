<?php

namespace Database\Seeders;

use App\Models\ConceptoPago;
use App\Models\TarifaPago;
use Illuminate\Database\Seeder;

/**
 * Seeder de datos iniciales para el módulo de cobro de matrícula.
 * Crea conceptos de pago y tarifas base para la institución.
 *
 * Uso: php artisan db:seed --class=CobroMatriculaSeeder
 */
class CobroMatriculaSeeder extends Seeder
{
    public function run(): void
    {
        $instiId  = 8;    // IEP Bautista La Pascana
        $anio     = 2026;

        // ── 1. Conceptos de pago ──────────────────────────────────────────
        $conceptos = [
            ['nombre' => 'Matrícula',         'descripcion' => 'Pago único de matrícula anual',          'periodicidad' => 'anual'],
            ['nombre' => 'Pensión Mensual',    'descripcion' => 'Mensualidad regular del año escolar',    'periodicidad' => 'mensual'],
            ['nombre' => 'Seguro Escolar',     'descripcion' => 'Seguro de accidentes estudiantil',       'periodicidad' => 'anual'],
            ['nombre' => 'Taller de Arte',     'descripcion' => 'Taller extracurricular de arte',         'periodicidad' => 'mensual'],
            ['nombre' => 'Taller de Deporte',  'descripcion' => 'Taller extracurricular de deportes',     'periodicidad' => 'mensual'],
            ['nombre' => 'Uniforme',           'descripcion' => 'Uniforme escolar completo',              'periodicidad' => 'unico'],
            ['nombre' => 'Útiles Escolares',   'descripcion' => 'Kit de útiles escolares del año',        'periodicidad' => 'anual'],
        ];

        $creados = [];
        foreach ($conceptos as $c) {
            $concepto = ConceptoPago::firstOrCreate(
                ['insti_id' => $instiId, 'nombre' => $c['nombre']],
                ['descripcion' => $c['descripcion'], 'periodicidad' => $c['periodicidad'], 'activo' => true]
            );
            $creados[$c['nombre']] = $concepto->concepto_id;
            $this->command->line("  Concepto: {$c['nombre']} (ID: {$concepto->concepto_id})");
        }

        // ── 2. Tarifas por nivel para Pensión Mensual ─────────────────────
        // Grados por nivel (obtenidos de la BD real)
        $tarifasPension = [
            // [grado_id, monto] — null = tarifa general
            [null,  280.00],  // General (fallback)
            [119,   200.00],  // 3 AÑOS - INICIAL
            [120,   200.00],  // 4 AÑOS - INICIAL
            [121,   200.00],  // 5 AÑOS - INICIAL
            [122,   250.00],  // 1ER GRADO - PRIMARIA
            [123,   250.00],  // 2DO GRADO - PRIMARIA
            [124,   250.00],  // 3ER GRADO - PRIMARIA
            [125,   250.00],  // 4TO GRADO - PRIMARIA
            [126,   250.00],  // 5TO GRADO - PRIMARIA
            [127,   250.00],  // 6TO GRADO - PRIMARIA
            [128,   320.00],  // 1RO SECUNDARIA
            [129,   320.00],  // 2DO SECUNDARIA
            [130,   320.00],  // 3RO SECUNDARIA
            [131,   320.00],  // 4TO SECUNDARIA
            [132,   320.00],  // 5TO SECUNDARIA
        ];

        $pensionId = $creados['Pensión Mensual'];
        foreach ($tarifasPension as [$gradoId, $monto]) {
            // Verificar que el grado existe antes de insertar
            if ($gradoId !== null && !\App\Models\Grado::find($gradoId)) {
                continue;
            }

            TarifaPago::firstOrCreate(
                [
                    'insti_id'     => $instiId,
                    'concepto_id'  => $pensionId,
                    'grado_id'     => $gradoId,
                    'anio_escolar' => $anio,
                ],
                ['monto' => $monto, 'activo' => true]
            );

            $label = $gradoId ? "grado_id={$gradoId}" : 'general';
            $this->command->line("  Tarifa Pensión {$label}: S/ {$monto}");
        }

        // ── 3. Tarifas para Matrícula ─────────────────────────────────────
        $matriculaId = $creados['Matrícula'];
        $tarifasMatricula = [
            [null,  150.00],  // General
            [119,   100.00],  // INICIAL
            [120,   100.00],
            [121,   100.00],
            [122,   120.00],  // PRIMARIA
            [123,   120.00],
            [124,   120.00],
            [125,   120.00],
            [126,   120.00],
            [127,   120.00],
            [128,   150.00],  // SECUNDARIA
            [129,   150.00],
            [130,   150.00],
            [131,   150.00],
            [132,   150.00],
        ];

        foreach ($tarifasMatricula as [$gradoId, $monto]) {
            if ($gradoId !== null && !\App\Models\Grado::find($gradoId)) {
                continue;
            }

            TarifaPago::firstOrCreate(
                [
                    'insti_id'     => $instiId,
                    'concepto_id'  => $matriculaId,
                    'grado_id'     => $gradoId,
                    'anio_escolar' => $anio,
                ],
                ['monto' => $monto, 'activo' => true]
            );
        }

        $this->command->info("\n✅ CobroMatriculaSeeder completado:");
        $this->command->info("   Conceptos: " . count($conceptos));
        $this->command->info("   Tarifas Pensión: " . count($tarifasPension));
        $this->command->info("   Tarifas Matrícula: " . count($tarifasMatricula));
    }
}
