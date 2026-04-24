<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionComprobante;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfiguracionComprobanteApiController extends Controller
{
    /** GET /api/configuracion-comprobante — obtener configuración de la institución */
    public function show(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;
        
        $config = ConfiguracionComprobante::firstOrCreate(
            ['insti_id' => $instiId],
            [
                'mostrar_logo' => true,
                'color_primario' => '#2563eb',
                'color_secundario' => '#1e40af',
                'color_fondo_header' => '#f8fafc',
                'color_texto_comprobante' => '#1e40af',
                'color_texto_secundario' => '#6b7280',
                'mostrar_qr' => true,
                'mostrar_hash' => true,
                'mostrar_firma_digital' => true,
                'mostrar_telefono' => true,
                'mostrar_email' => true,
                'formato_serie' => 'B001',
                'digitos_numero' => 8,
                'tamano_fuente_base' => 11,
                'tamano_fuente_titulo' => 18,
            ]
        );

        return response()->json(['config' => $config]);
    }

    /** PUT /api/configuracion-comprobante — actualizar configuración */
    public function update(Request $request): JsonResponse
    {
        $instiId = $request->user()->insti_id;

        $validated = $request->validate([
            'mostrar_logo' => 'boolean',
            'color_primario' => 'string|max:7',
            'color_secundario' => 'string|max:7',
            'color_fondo_header' => 'string|max:7',
            'color_texto_comprobante' => 'string|max:7',
            'color_texto_secundario' => 'string|max:7',
            'texto_pie_pagina' => 'nullable|string',
            'texto_adicional' => 'nullable|string',
            'mostrar_qr' => 'boolean',
            'mostrar_hash' => 'boolean',
            'mostrar_firma_digital' => 'boolean',
            'mostrar_telefono' => 'boolean',
            'mostrar_email' => 'boolean',
            'formato_serie' => 'nullable|string|max:20',
            'digitos_numero' => 'integer|min:1|max:12',
            'tamano_fuente_base' => 'integer|min:8|max:16',
            'tamano_fuente_titulo' => 'integer|min:12|max:24',
        ]);

        $config = ConfiguracionComprobante::updateOrCreate(
            ['insti_id' => $instiId],
            $validated
        );

        return response()->json([
            'message' => 'Configuración actualizada correctamente.',
            'config' => $config,
        ]);
    }
}
