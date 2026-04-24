<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobantes Dual</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            margin: 0;
            size: A4 portrait;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 8px;
            color: #333;
            line-height: 1.2;
            margin: 0;
            padding: 0;
        }

        .page-container {
            width: 210mm;
            height: 297mm;
            position: relative;
        }

        .comprobante-half {
            width: 100%;
            height: 148.5mm;
            position: relative;
            overflow: hidden;
        }

        .comprobante-half:first-child {
            border-bottom: 1px dashed #999;
        }

        .container {
            padding: 8mm;
            height: 100%;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 3mm;
            padding-bottom: 2mm;
            border-bottom: 2px solid {{ $config->color_primario }};
        }

        .header .logo {
            max-width: 60px;
            max-height: 40px;
            margin-bottom: 2mm;
        }

        .header h1 {
            font-size: 11px;
            color: {{ $config->color_primario }};
            margin-bottom: 1mm;
            text-transform: uppercase;
            font-weight: bold;
        }

        .header .empresa-nombre {
            font-size: 9px;
            font-weight: bold;
            color: #333;
            margin-bottom: 1mm;
        }

        .header .empresa-info {
            font-size: 7px;
            color: #666;
            line-height: 1.2;
        }

        /* Comprobante Info */
        .comprobante-box {
            background: {{ $config->color_fondo_header }};
            border: 2px solid {{ $config->color_primario }};
            border-radius: 4px;
            padding: 2mm;
            text-align: center;
            margin-bottom: 3mm;
        }

        .comprobante-box .tipo {
            font-size: 10px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            text-transform: uppercase;
            margin-bottom: 1mm;
        }

        .comprobante-box .numero {
            font-size: 12px;
            font-weight: bold;
            color: #333;
            margin-bottom: 1mm;
        }

        .comprobante-box .fecha {
            font-size: 7px;
            color: #666;
        }

        /* Cliente Info */
        .cliente-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            padding: 2mm;
            margin-bottom: 3mm;
            font-size: 7px;
        }

        .cliente-section .titulo {
            font-size: 8px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            text-transform: uppercase;
            margin-bottom: 1mm;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 1mm;
        }

        .cliente-section .row {
            margin-bottom: 0.5mm;
        }

        .cliente-section .label {
            font-weight: bold;
            color: #4b5563;
            display: inline-block;
            min-width: 50px;
        }

        /* Tabla de Items */
        table.items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3mm;
            font-size: 7px;
        }

        table.items-table thead {
            background: {{ $config->color_secundario }};
            color: white;
        }

        table.items-table th {
            padding: 1.5mm 1mm;
            text-align: left;
            font-size: 7px;
            font-weight: bold;
        }

        table.items-table th.center {
            text-align: center;
        }

        table.items-table th.right {
            text-align: right;
        }

        table.items-table tbody tr {
            border-bottom: 1px solid #e5e7eb;
        }

        table.items-table td {
            padding: 1mm;
            font-size: 7px;
        }

        table.items-table td.center {
            text-align: center;
        }

        table.items-table td.right {
            text-align: right;
        }

        /* Totales */
        .totales {
            float: right;
            width: 50mm;
            margin-bottom: 3mm;
        }

        .totales table {
            width: 100%;
            border-collapse: collapse;
        }

        .totales td {
            border: none;
            padding: 1mm 2mm;
            font-size: 7px;
        }

        .totales .label-col {
            text-align: right;
            font-weight: bold;
            color: #4b5563;
        }

        .totales .value-col {
            text-align: right;
        }

        .totales .total-row {
            border-top: 2px solid {{ $config->color_primario }};
            background: #f0f9ff;
        }

        .totales .total-row td {
            font-size: 8px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            padding: 1.5mm 2mm;
        }

        /* Footer */
        .footer {
            clear: both;
            margin-top: 2mm;
            padding-top: 2mm;
            border-top: 1px solid #e5e7eb;
        }

        .footer .hash-section {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 3px;
            padding: 2mm;
            font-size: 6px;
        }

        .footer .hash-section .titulo {
            font-size: 7px;
            font-weight: bold;
            color: {{ $config->color_primario }};
            margin-bottom: 1mm;
        }

        .footer .hash-section table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer .hash-section td {
            border: none;
            padding: 0;
            vertical-align: top;
        }

        .footer .qr-image {
            width: 35px;
            height: 35px;
            border: 1px solid #d1d5db;
        }

        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <div class="page-container">
        <!-- PRIMER COMPROBANTE (Mitad superior) -->
        <div class="comprobante-half">
            <div class="container">
                @include('pdf.partials.comprobante-content-compact', [
                    'comprobante' => $comprobante1,
                    'tipoLabel' => $tipoLabel1,
                    'qrCodeDataUri' => $qrCodeDataUri1
                ])
            </div>
        </div>

        <!-- SEGUNDO COMPROBANTE (Mitad inferior) -->
        <div class="comprobante-half">
            <div class="container">
                @include('pdf.partials.comprobante-content-compact', [
                    'comprobante' => $comprobante2,
                    'tipoLabel' => $tipoLabel2,
                    'qrCodeDataUri' => $qrCodeDataUri2
                ])
            </div>
        </div>
    </div>
</body>
</html>
