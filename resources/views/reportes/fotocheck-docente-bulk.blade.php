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
            border: 0.5pt solid #000000;
            overflow: hidden;
            background-color: #ffffff;
        }

        .fotocheck-wrapper:nth-child(3n) {
            margin-right: 0;
        }

        .page-break {
            page-break-after: always;
        }

        .card-header {
            width: 54mm;
            height: 18mm;
            background-color: #ffffff;
            text-align: center;
            position: relative;
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
        }

        .school-name {
            font-size: 5pt;
            font-weight: 900;
            color: {{ $fotochecks[0]['config']->primary_color ?? '#1e3a8a' }};
            text-transform: uppercase;
            margin: 0;
            letter-spacing: 0.2pt;
        }

        .main-background {
            position: absolute;
            top: 18mm;
            left: 0;
            width: 54mm;
            height: 63.6mm;
            background-color: {{ $fotochecks[0]['config']->secondary_color ?? '#7b8780' }};
            z-index: 1;
        }

        .photo-frame {
            position: absolute;
            top: 19mm;
            left: 50%;
            margin-left: -12mm;
            width: 24mm;
            height: 24mm;
            background-color: #ffffff;
            border: 0.5mm solid #ffffff;
            border-radius: 1mm;
            z-index: 20;
            overflow: hidden;
        }

        .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .identity-container {
            position: absolute;
            top: 45mm;
            left: 0;
            width: 54mm;
            text-align: center;
            z-index: 30;
        }

        .badge {
            display: inline-block;
            background-color: {{ $fotochecks[0]['config']->primary_color ?? '#2c63f2' }};
            color: #ffffff;
            font-size: 6pt;
            font-weight: 900;
            padding: 1.5pt 10pt;
            text-transform: uppercase;
            margin-bottom: 2mm;
        }

        .full-name {
            font-size: 6pt;
            font-weight: 900;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
            text-transform: uppercase;
            margin: 0;
            padding: 0 2mm;
            line-height: 1.1;
        }

        .bottom-area {
            position: absolute;
            top: 60mm;
            left: 4mm;
            width: 46mm;
            height: 14mm;
            z-index: 40;
        }

        .qr-code {
            position: absolute;
            left: 0;
            top: 0;
            width: 14mm;
            height: 14mm;
            background-color: #ffffff;
            padding: 1mm;
        }

        .qr-code img {
            width: 100%;
            height: 100%;
        }

        .metadata {
            position: absolute;
            left: 17mm;
            top: 0;
            width: 29mm;
            text-align: left;
        }

        .label {
            font-size: 3.5pt;
            font-weight: 800;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
            opacity: 0.9;
            text-transform: uppercase;
        }

        .value {
            font-size: 5.5pt;
            font-weight: 900;
            color: {{ $fotochecks[0]['config']->text_color ?? '#ffffff' }};
        }

        table.metadata-table {
            width: 100%;
            border-collapse: collapse;
        }

        table.metadata-table td {
            padding: 0;
            margin: 0;
            vertical-align: top;
            line-height: 1.1;
        }

        table.metadata-table td.label-cell {
            width: 14mm;
        }

        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 54mm;
            height: 4mm;
            background-color: {{ $fotochecks[0]['config']->primary_color ?? '#2c63f2' }};
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
                <div class="card-header">
                    <div class="logo-container">
                        @if($item['logoSrc'])
                            <img src="{{ $item['logoSrc'] }}" alt="Logo">
                        @else
                            <img src="{{ public_path('images/logo.png') }}" alt="Logo">
                        @endif
                    </div>
                    <p class="school-name" style="color: {{ $item['config']->primary_color }}">IEP BAUTISTA LA PASCANA</p>
                </div>

                <div class="main-background" style="background-color: {{ $item['config']->secondary_color }}"></div>

                <div class="photo-frame">
                    @if($item['fotoSrc'])
                        <img src="{{ $item['fotoSrc'] }}" alt="Foto">
                    @else
                        <div style="width: 100%; height: 100%; background: #eee;"></div>
                    @endif
                </div>

                <div class="identity-container">
                    <div class="badge" style="background-color: {{ $item['config']->primary_color }}">{{ $item['tipo'] }}</div>
                    <h1 class="full-name" style="color: {{ $item['config']->text_color }}">{{ mb_strtoupper($item['nombre']) }}</h1>
                </div>

                <div class="bottom-area">
                    <div class="qr-code">
                        <img src="{{ $item['qrSrc'] }}" alt="QR">
                    </div>
                    <div class="metadata">
                        <table class="metadata-table">
                            <tr>
                                <td class="label-cell"><span class="label">ID:</span></td>
                                <td><span class="value">{{ $item['idDisplay'] }}</span></td>
                            </tr>
                            <tr>
                                <td class="label-cell"><span class="label">DNI:</span></td>
                                <td><span class="value">{{ $item['dni'] ?? '---' }}</span></td>
                            </tr>
                            @if($item['especialidad'])
                            <tr>
                                <td class="label-cell"><span class="label">ESPECIALIDAD:</span></td>
                                <td><span class="value">{{ $item['especialidad'] }}</span></td>
                            </tr>
                            @endif
                            <tr>
                                <td class="label-cell"><span class="label">TEL:</span></td>
                                <td><span class="value">{{ $item['telefono'] ?? '---' }}</span></td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="footer" style="background-color: {{ $item['config']->primary_color }}">
                    <span class="footer-text">{{ $item['config']->footer_text ?? 'Periodo Académico '.date('Y') }}</span>
                </div>
            </div>

            @if(($index + 1) % 9 == 0 && ($index + 1) < count($fotochecks))
                <div class="page-break"></div>
            @endif
        @endforeach
    </div>

</body>
</html>
