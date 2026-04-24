<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $tipoLabel }} {{ $comprobante->serie }}-{{ $comprobante->numero }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: {{ $config->tamano_fuente_base }}px;
            color: #333;
            line-height: 1.4;
        }

        .container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 3px solid {{ $config->color_primario }};
        }

        .header .logo {
            max-width: 120px;
            max-height: 80px;
            margin-bottom: 10px;
        }

        .header h1 {
            font-size: {{ $config->tamano_fuente_titulo }}px;
            color: {{ $config->color_primario }};
            margin-bottom: 5px;
            text-transform: uppercase;
            font-weight: bold;
        }

        .header .empresa-nombre {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 3px;
        }

        .header .empresa-info {
            font-size: 9px;
            color: #666;
            line-height: 1.3;
        }

        /* Comprobante Info */
        .comprobante-box {
            background: {{ $config->color_fondo_header }};
            border: 2px solid {{ $config->color_primario }};
            border-radius: 8px;
            padding: 12px;
            text-align: center;
            margin-bottom: 20px;
        }

        .comprobante-box .tipo {
            font-size: 16px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .comprobante-box .numero {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .comprobante-box .fecha {
            font-size: 10px;
            color: #666;
        }

        /* Cliente Info */
        .cliente-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
        }

        .cliente-section .titulo {
            font-size: 11px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 4px;
        }

        .cliente-section .row {
            margin-bottom: 4px;
        }

        .cliente-section .label {
            font-weight: bold;
            color: #4b5563;
            display: inline-block;
            min-width: 80px;
        }

        .cliente-section .value {
            color: #333;
        }

        /* Tabla de Items */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        table thead {
            background: {{ $config->color_secundario }};
            color: white;
        }

        table th {
            padding: 8px 6px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        table th.center {
            text-align: center;
        }

        table th.right {
            text-align: right;
        }

        table tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }

        table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        table td {
            padding: 8px 6px;
            font-size: 10px;
            color: #333;
        }

        table td.center {
            text-align: center;
        }

        table td.right {
            text-align: right;
        }

        /* Totales */
        .totales {
            float: right;
            width: 280px;
            margin-bottom: 20px;
        }

        .totales table {
            margin: 0;
        }

        .totales td {
            border: none;
            padding: 5px 10px;
            font-size: 11px;
        }

        .totales .label-col {
            text-align: right;
            font-weight: bold;
            color: #4b5563;
        }

        .totales .value-col {
            text-align: right;
            color: #333;
        }

        .totales .total-row {
            border-top: 2px solid {{ $config->color_primario }};
            background: #f0f9ff;
        }

        .totales .total-row td {
            font-size: 13px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            padding: 8px 10px;
        }

        /* Footer */
        .footer {
            clear: both;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #e5e7eb;
        }

        .footer .hash-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 10px;
        }

        .footer .hash-section .titulo {
            font-size: 9px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .footer .hash-section .contenido {
            font-size: 8px;
            color: #666;
            word-break: break-all;
            line-height: 1.3;
        }

        .footer .estado-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .footer .estado-aceptado {
            background: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
        }

        .footer .estado-generado {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
        }

        .footer .estado-rechazado {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }

        .footer .nota {
            font-size: 8px;
            color: #9ca3af;
            text-align: center;
            margin-top: 15px;
            font-style: italic;
        }

        /* QR Code */
        .qr-section {
            text-align: center;
            margin-top: 15px;
        }

        .qr-section img {
            max-width: 120px;
            max-height: 120px;
        }

        /* Clearfix */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header con Logo y Datos de Empresa -->
        <div class="header">
            @if($config->mostrar_logo && $institucion->insti_logo)
                <img src="{{ public_path('storage/' . $institucion->insti_logo) }}" alt="Logo" class="logo">
            @endif
            <div class="empresa-nombre">{{ $institucion->insti_razon_social }}</div>
            <div class="empresa-info">
                RUC: {{ $institucion->insti_ruc }}<br>
                {{ $institucion->insti_direccion }}<br>
                @if($config->mostrar_telefono && $institucion->insti_telefono1)
                    Tel: {{ $institucion->insti_telefono1 }}
                    @if($institucion->insti_telefono2) / {{ $institucion->insti_telefono2 }} @endif
                    <br>
                @endif
                @if($config->mostrar_email && $institucion->insti_email)
                    Email: {{ $institucion->insti_email }}
                @endif
            </div>
        </div>

        <!-- Información del Comprobante -->
        <div class="comprobante-box">
            <div class="tipo">{{ $tipoLabel }} ELECTRÓNICA</div>
            <div class="numero">{{ $comprobante->serie }}-{{ str_pad($comprobante->numero, $config->digitos_numero, '0', STR_PAD_LEFT) }}</div>
            <div class="fecha">
                Fecha de Emisión: <strong>{{ $comprobante->fecha_emision ? $comprobante->fecha_emision->format('d/m/Y') : '—' }}</strong>
            </div>
        </div>

        <!-- Información del Documento Referencia (solo para notas) -->
        @if(in_array($comprobante->tipo_documento, ['nota_credito', 'nota_debito']))
        <div class="cliente-section" style="background: #fef3c7; border-color: #fbbf24;">
            <div class="titulo" style="color: #92400e;">Documento que Modifica</div>
            <div class="row">
                <span class="label">Tipo:</span>
                <span class="value">{{ $comprobante->documento_referencia_tipo === '03' ? 'BOLETA' : 'FACTURA' }}</span>
            </div>
            <div class="row">
                <span class="label">Número:</span>
                <span class="value">{{ $comprobante->documento_referencia_serie }}-{{ str_pad($comprobante->documento_referencia_numero, $config->digitos_numero, '0', STR_PAD_LEFT) }}</span>
            </div>
            <div class="row">
                <span class="label">Fecha:</span>
                <span class="value">{{ $comprobante->documento_referencia_fecha ? $comprobante->documento_referencia_fecha->format('d/m/Y') : '—' }}</span>
            </div>
            <div class="row">
                <span class="label">Motivo:</span>
                <span class="value">{{ $comprobante->motivo_nota }}</span>
            </div>
        </div>
        @endif

        <!-- Datos del Cliente -->
        <div class="cliente-section">
            <div class="titulo">Datos del Cliente</div>
            <div class="row">
                <span class="label">{{ $comprobante->cliente_tipo_doc === '06' ? 'RUC' : 'DNI' }}:</span>
                <span class="value">{{ $comprobante->cliente_num_doc }}</span>
            </div>
            <div class="row">
                <span class="label">Cliente:</span>
                <span class="value">{{ $comprobante->cliente_nombre }}</span>
            </div>
            @if($comprobante->cliente_direccion)
            <div class="row">
                <span class="label">Dirección:</span>
                <span class="value">{{ $comprobante->cliente_direccion }}</span>
            </div>
            @endif
            <div class="row">
                <span class="label">Forma de Pago:</span>
                <span class="value">{{ strtoupper($comprobante->forma_pago) }}</span>
            </div>
            <div class="row">
                <span class="label">Moneda:</span>
                <span class="value">{{ $comprobante->moneda === 'PEN' ? 'SOLES' : 'DÓLARES' }}</span>
            </div>
        </div>

        <!-- Tabla de Items -->
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">Código</th>
                    <th style="width: 40%;">Descripción</th>
                    <th class="center" style="width: 10%;">Und.</th>
                    <th class="right" style="width: 10%;">Cant.</th>
                    <th class="right" style="width: 15%;">P. Unit.</th>
                    <th class="right" style="width: 15%;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($comprobante->items as $item)
                <tr>
                    <td>{{ $item->cod_producto }}</td>
                    <td>{{ $item->descripcion }}</td>
                    <td class="center">{{ $item->unidad }}</td>
                    <td class="right">{{ $item->cantidad }}</td>
                    <td class="right">S/ {{ number_format($item->precio_unitario, 2) }}</td>
                    <td class="right">S/ {{ number_format($item->subtotal, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totales -->
        <div class="totales">
            <table>
                <tr>
                    <td class="label-col">Op. Gravada:</td>
                    <td class="value-col">S/ {{ number_format($comprobante->op_gravada, 2) }}</td>
                </tr>
                <tr>
                    <td class="label-col">IGV (18%):</td>
                    <td class="value-col">S/ {{ number_format($comprobante->igv, 2) }}</td>
                </tr>
                <tr class="total-row">
                    <td class="label-col">TOTAL:</td>
                    <td class="value-col">S/ {{ number_format($comprobante->total, 2) }}</td>
                </tr>
            </table>
        </div>

        <div class="clearfix"></div>

        <!-- Footer con Hash y Estado -->
        <div class="footer">
            @if($config->mostrar_firma_digital && $comprobante->nombre_archivo)
            <div class="hash-section">
                <div class="titulo">Información de Firma Digital</div>
                <table style="width: 100%; border: none; border-collapse: collapse;">
                    <tr>
                        <td style="vertical-align: top; border: none; padding: 0; padding-right: 10px; width: 70%;">
                            <div class="contenido">
                                <strong>Archivo:</strong> {{ $comprobante->nombre_archivo }}<br>
                                @if($config->mostrar_hash && $comprobante->hash)
                                    <strong>Hash:</strong> {{ $comprobante->hash }}<br>
                                @endif
                                <div style="margin-top: 8px; font-size: 7px; font-style: italic; color: #9ca3af;">
                                    Representación impresa del comprobante electrónico
                                </div>
                            </div>
                        </td>
                        @if($config->mostrar_qr && $qrCodeDataUri)
                        <td style="width: 30%; text-align: right; vertical-align: top; border: none; padding: 0;">
                            <div style="display: inline-block; text-align: center;">
                                <div style="font-size: 7px; font-weight: bold; color: {{ $config->color_primario }}; margin-bottom: 3px;">
                                    CÓDIGO QR
                                </div>
                                <img src="{{ $qrCodeDataUri }}" alt="QR Code" style="width: 80px; height: 80px; border: 2px solid #d1d5db; display: block;">
                            </div>
                        </td>
                        @endif
                    </tr>
                </table>
            </div>
            @endif

            <div style="text-align: center; margin: 15px 0;">
                <span class="estado-badge estado-{{ $comprobante->estado }}">
                    Estado: {{ strtoupper($comprobante->estado) }}
                </span>
            </div>

            @if($comprobante->estado === 'aceptado')
            <div class="nota">
                ✓ Este comprobante ha sido aceptado por SUNAT y tiene validez tributaria.
            </div>
            @elseif($comprobante->estado === 'generado')
            <div class="nota">
                Este comprobante ha sido generado y firmado digitalmente. Pendiente de envío a SUNAT.
            </div>
            @endif

            @if($config->texto_adicional)
            <div class="nota" style="margin-top: 10px;">
                {{ $config->texto_adicional }}
            </div>
            @endif

            @if($config->texto_pie_pagina)
            <div class="nota" style="margin-top: 10px; font-weight: bold;">
                {{ $config->texto_pie_pagina }}
            </div>
            @else
            <div class="nota" style="margin-top: 10px;">
                Representación impresa del comprobante electrónico.<br>
                Consulte su comprobante en: www.sunat.gob.pe
            </div>
            @endif
        </div>
    </div>
</body>
</html>
