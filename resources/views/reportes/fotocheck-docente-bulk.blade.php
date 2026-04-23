<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <title>Fotochecks Docentes</title>
    <style>
        @page {
            margin: 10mm;
            size: a4 portrait;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica', sans-serif;
            background-color: #ffffff;
        }

        .grid-container {
            width: 100%;
        }

        .fotocheck-wrapper {
            display: inline-block;
            width: 54mm;
            height: 85.6mm;
            margin-right: 5mm;
            margin-bottom: 5mm;
            vertical-align: top;
            position: relative;
            border: 0.6mm solid #000000;
            overflow: hidden;
            background-color: #ffffff;
            box-sizing: border-box;
        }

        .fotocheck-wrapper:nth-child(3n) {
            margin-right: 0;
        }

        .page-break {
            page-break-after: always;
        }

        /* ── Cabecera (18mm) ── */
        .card-header {
            position: absolute;
            top: 0;
            left: 0;
            width: 54mm;
            height: 18mm;
            background-color: #ffffff;
            text-align: center;
            z-index: 10;
        }

        .logo-container {
            width: 30mm;
            height: 11mm;
            margin: 2mm auto 1mm;
            display: block;
        }

        .logo-container img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }

        .school-name {
            font-size: 5pt;
            font-weight: 900;
            color:
                {{ $fotochecks[0]['config']->primary_color ?? '#1e3a8a' }}
            ;
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 0.2pt;
        }

        /* ── Fondo principal (color secundario) ── */
        .main-background {
            position: absolute;
            top: 18mm;
            left: 0;
            width: 54mm;
            height: 63.6mm;
            background-color:
                {{ $fotochecks[0]['config']->secondary_color ?? '#7b8780' }}
            ;
            z-index: 1;
        }

        /* ── Foto (32mm x 32mm centrada) ── */
        .photo-frame {
            position: absolute;
            top: 19mm;
            left: 50%;
            margin-left: -16mm;
            width: 32mm;
            height: 32mm;
            background-color: #ffffff;
            border: 0.6mm solid #C8C8C8;
            z-index: 20;
            overflow: hidden;
            box-sizing: border-box;
        }

        .photo-frame img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .photo-frame-blank {
            width: 100%;
            height: 100%;
            background: #f3f4f6;
        }

        /* ── Recuadro interior: nombre + badge + QR + datos ── */
        .info-container {
            position: absolute;
            top: 53mm;
            left: 2mm;
            width: 50mm;
            height: 27mm;
            background-color: rgba(0, 0, 0, 0.1);
            border: 0.2mm solid {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
            z-index: 30;
            box-sizing: border-box;
        }

        .full-name {
            font-size: 6.2pt;
            font-weight: 900;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
            text-transform: uppercase;
            margin: 1.5mm 0 0 0;
            padding: 0 1mm;
            line-height: 1.2;
            text-align: center;
        }

        .badge {
            display: block;
            background-color: {{ $fotochecks[0]['config']->primary_color ?? '#2c63f2' }};
            color: #ffffff;
            font-size: 4pt;
            font-weight: 900;
            padding: 0.4mm 0;
            width: 24mm;
            height: 2.8mm;
            line-height: 2.8mm;
            text-transform: uppercase;
            margin: 1.2mm auto 0;
            text-align: center;
            letter-spacing: 0.15mm;
        }

        /* QR + metadatos en tabla (DomPDF-safe) */
        .qr-metadata-area {
            width: 100%;
            padding: 0 2mm;
            margin-top: 1.5mm;
            box-sizing: border-box;
        }

        table.qr-table {
            width: 100%;
            border-collapse: collapse;
        }

        table.qr-table td {
            padding: 0;
            vertical-align: top;
        }

        .qr-cell {
            width: 11mm;
        }

        .qr-code {
            width: 10mm;
            height: 10mm;
            background-color: #ffffff;
            padding: 0.4mm;
            box-sizing: border-box;
        }

        .qr-code img {
            width: 100%;
            height: 100%;
            display: block;
        }

        .label {
            font-size: 3.8pt;
            font-weight: 900;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: -0.05pt;
        }

        .value {
            font-size: 3.8pt;
            font-weight: 700;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
        }

        table.metadata-table {
            width: 100%;
            border-collapse: collapse;
        }

        table.metadata-table td {
            padding: 0 0 0.65mm 0;
            margin: 0;
            vertical-align: top;
            line-height: 1;
        }

        table.metadata-table td.label-cell {
            width: 16mm;
        }

        /* ── Footer ── */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 54mm;
            height: 4mm;
            background-color:
                {{ $fotochecks[0]['config']->primary_color ?? '#2c63f2' }}
            ;
            color: #ffffff;
            text-align: center;
            line-height: 4mm;
            z-index: 50;
        }

        .footer-text {
            font-size: 5.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
        }
    </style>
</head>

<body>

    <div class="grid-container">
        @foreach($fotochecks as $index => $item)
            <div class="fotocheck-wrapper">

                {{-- Cabecera --}}
                <div class="card-header">
                    <div class="logo-container">
                        @if($item['logoSrc'])
                            <img src="{{ $item['logoSrc'] }}" alt="Logo">
                        @else
                            <img src="{{ public_path('images/logo.png') }}" alt="Logo">
                        @endif
                    </div>
                    <p class="school-name" style="color: {{ $item['config']->primary_color }}">
                        IEP BAUTISTA LA PASCANA
                    </p>
                </div>

                {{-- Fondo secundario --}}
                <div class="main-background" style="background-color: {{ $item['config']->secondary_color }}"></div>

                {{-- Foto --}}
                <div class="photo-frame">
                    @if($item['fotoSrc'])
                        <img src="{{ $item['fotoSrc'] }}" alt="Foto">
                    @else
                        <div class="photo-frame-blank"></div>
                    @endif
                </div>

                {{-- Recuadro interior: nombre + badge + QR + datos --}}
                <div class="info-container" style="border-color: {{ $item['config']->text_color }}">

                    <h1 class="full-name" style="color: {{ $item['config']->text_color }}">
                        {{ mb_strtoupper($item['nombre']) }}
                    </h1>

                    <div class="badge" style="background-color: {{ $item['config']->primary_color }}">
                        {{ $item['tipo'] }}
                    </div>

                    <div class="qr-metadata-area">
                        <table class="qr-table">
                            <tr>
                                <td class="qr-cell">
                                    <div class="qr-code">
                                        <img src="{{ $item['qrSrc'] }}" alt="QR">
                                    </div>
                                </td>
                                <td>
                                    <table class="metadata-table">
                                        <tr>
                                            <td class="label-cell"><span class="label" style="color: {{ $item['config']->text_color }}">ID:</span></td>
                                            <td><span class="value" style="color: {{ $item['config']->text_color }}">{{ $item['idDisplay'] }}</span></td>
                                        </tr>
                                        <tr>
                                            <td class="label-cell"><span class="label" style="color: {{ $item['config']->text_color }}">DNI:</span></td>
                                            <td><span class="value" style="color: {{ $item['config']->text_color }}">{{ $item['dni'] ?? '---' }}</span></td>
                                        </tr>
                                        @if(!empty($item['especialidad']))
                                        <tr>
                                            <td class="label-cell"><span class="label" style="color: {{ $item['config']->text_color }}">ESPEC.:</span></td>
                                            <td><span class="value" style="color: {{ $item['config']->text_color }}">{{ $item['especialidad'] }}</span></td>
                                        </tr>
                                        @endif
                                        <tr>
                                            <td class="label-cell"><span class="label" style="color: {{ $item['config']->text_color }}">TEL:</span></td>
                                            <td><span class="value" style="color: {{ $item['config']->text_color }}">{{ $item['telefono'] ?? '---' }}</span></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>

                </div>

                {{-- Footer --}}
                <div class="footer" style="background-color: {{ $item['config']->primary_color }}">
                    <span class="footer-text">{{ $item['config']->footer_text ?? 'Periodo Académico ' . date('Y') }}</span>
                </div>

            </div>

            @if(($index + 1) % 9 == 0 && ($index + 1) < count($fotochecks))
                <div class="page-break"></div>
            @endif
        @endforeach
    </div>

</body>

</html>