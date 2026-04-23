<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Fotocheck Docente</title>
    <style>
        @page {
            margin: 0;
            padding: 0;
            size: 54mm 85.6mm;
        }
        
        body {
            margin: 0;
            padding: 0;
            width: 54mm;
            height: 85.6mm;
            font-family: 'Helvetica', sans-serif;
            background-color: #ffffff;
            position: relative;
            overflow: hidden;
        }

        .header {
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
        }

        .school-name {
            font-size: 5pt;
            font-weight: 900;
            color: {{ $config->primary_color ?? '#1e3a8a' }};
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
            background-color: {{ $config->secondary_color ?? '#7b8780' }};
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
            background-color: {{ $config->primary_color ?? '#2c63f2' }};
            color: #ffffff;
            font-size: 6pt;
            font-weight: 900;
            padding: 1mm 4mm;
            border-radius: 2mm;
            text-transform: uppercase;
            margin-bottom: 1mm;
        }

        .name {
            font-size: 6pt;
            font-weight: 900;
            color: {{ $config->text_color ?? '#ffffff' }};
            text-transform: uppercase;
            margin: 0;
            padding: 0 2mm;
            line-height: 1.3;
        }

        .specialty {
            font-size: 4.5pt;
            font-weight: 700;
            color: {{ $config->text_color ?? '#ffffff' }};
            opacity: 0.9;
            text-transform: uppercase;
            margin: 1mm 0 0 0;
        }

        .dni {
            font-size: 5.5pt;
            font-weight: 900;
            color: {{ $config->text_color ?? '#ffffff' }};
        }

        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 54mm;
            height: 4mm;
            background-color: {{ $config->primary_color ?? '#2c63f2' }};
            color: #ffffff;
            text-align: center;
            line-height: 4mm;
            font-size: 3.5pt;
            font-weight: 700;
            z-index: 40;
        }

        .border {
            position: absolute;
            top: 0;
            left: 0;
            width: 54mm;
            height: 85.6mm;
            border: 0.6mm solid #000000;
            box-sizing: border-box;
            z-index: 50;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        @if($logoSrc)
            <div class="logo-container">
                <img src="{{ $logoSrc }}" alt="Logo">
            </div>
        @endif
        <p class="school-name">{{ $institucion->insti_razon_social ?? 'INSTITUCIÓN EDUCATIVA' }}</p>
    </div>

    <!-- Background -->
    <div class="main-background"></div>

    <!-- Photo -->
    <div class="photo-frame">
        @if($fotoSrc)
            <img src="{{ $fotoSrc }}" alt="Foto">
        @else
            <div style="width: 100%; height: 100%; background: #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 10pt; color: #9ca3af;">
                Sin foto
            </div>
        @endif
    </div>

    <!-- Identity -->
    <div class="identity-container">
        <div class="badge">DOCENTE</div>
        <p class="name">
            {{ strtoupper(trim(($docente->perfil->primer_nombre ?? '') . ' ' . ($docente->perfil->segundo_nombre ?? ''))) }}
        </p>
        <p class="name">
            {{ strtoupper(trim(($docente->perfil->apellido_paterno ?? '') . ' ' . ($docente->perfil->apellido_materno ?? ''))) }}
        </p>
        @if($docente->especialidad)
            <p class="specialty">{{ strtoupper($docente->especialidad) }}</p>
        @endif
        <p class="dni">DNI: {{ $docente->perfil->doc_numero ?? 'N/A' }}</p>
    </div>

    <!-- Footer -->
    <div class="footer">
        PERIODO ACADÉMICO {{ date('Y') }}
    </div>

    <!-- Border -->
    <div class="border"></div>
</body>
</html>
