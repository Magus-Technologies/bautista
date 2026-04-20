<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1a1a1a; }

        .header { text-align: center; border-bottom: 2px solid #166534; padding-bottom: 10px; margin-bottom: 16px; }
        .header h1 { font-size: 15px; font-weight: bold; color: #166534; text-transform: uppercase; }
        .header h2 { font-size: 12px; color: #333; margin-top: 3px; }
        .header p  { font-size: 9px; color: #666; margin-top: 2px; }

        .nivel-header {
            background: #1f2937;
            color: #fff;
            padding: 6px 10px;
            margin-top: 14px;
            margin-bottom: 0;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .nivel-totales { float: right; font-weight: normal; font-size: 9px; }
        .nivel-totales span { margin-left: 12px; }
        .emerald { color: #6ee7b7; }
        .amber   { color: #fcd34d; }

        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f3f4f6; }
        th { padding: 5px 8px; text-align: left; font-size: 9px; text-transform: uppercase; color: #6b7280; font-weight: bold; border-bottom: 1px solid #e5e7eb; }
        th.right { text-align: right; }
        td { padding: 5px 8px; font-size: 10px; border-bottom: 1px solid #f3f4f6; }
        td.right { text-align: right; }
        tbody tr:hover { background: #f9fafb; }

        .pct-ok   { color: #059669; font-weight: bold; }
        .pct-mid  { color: #d97706; font-weight: bold; }
        .pct-low  { color: #dc2626; font-weight: bold; }

        .totales-globales { margin-bottom: 16px; }
        .totales-globales table td { background: #f0fdf4; font-weight: bold; }

        .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 6px; }
    </style>
</head>
<body>

    {{-- Encabezado --}}
    <div class="header">
        <h1>{{ $institucion }}</h1>
        <h2>Reporte Consolidado de Cobros — {{ $mes }} {{ $anio }}</h2>
        <p>Generado el {{ $fecha }}</p>
    </div>

    {{-- Totales globales --}}
    @php
        $totRec  = collect($filas)->sum('monto_recaudado');
        $totPend = collect($filas)->sum('monto_pendiente');
        $totPag  = collect($filas)->sum('pagos_realizados');
        $totAll  = collect($filas)->sum('total_pagos');
        $pctG    = $totAll > 0 ? round($totPag / $totAll * 100, 1) : 0;
    @endphp
    <table class="totales-globales">
        <thead>
            <tr>
                <th>Total recaudado</th>
                <th>Total pendiente</th>
                <th>Pagos realizados</th>
                <th class="right">% Cobranza global</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>S/ {{ number_format($totRec, 2) }}</td>
                <td>S/ {{ number_format($totPend, 2) }}</td>
                <td>{{ $totPag }} / {{ $totAll }}</td>
                <td class="right
                    @if($pctG >= 80) pct-ok @elseif($pctG >= 50) pct-mid @else pct-low @endif">
                    {{ $pctG }}%
                </td>
            </tr>
        </tbody>
    </table>

    {{-- Por nivel --}}
    @foreach ($byNivel as $nivelNombre => $filasnivel)
        @php
            $nRec  = collect($filasnivel)->sum('monto_recaudado');
            $nPend = collect($filasnivel)->sum('monto_pendiente');
        @endphp
        <div class="nivel-header">
            {{ $nivelNombre }}
            <span class="nivel-totales">
                <span class="emerald">S/ {{ number_format($nRec, 2) }} rec.</span>
                <span class="amber">S/ {{ number_format($nPend, 2) }} pend.</span>
            </span>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Grado</th>
                    <th class="right">Pagos</th>
                    <th class="right">Pagados</th>
                    <th class="right">Pendientes</th>
                    <th class="right">Recaudado</th>
                    <th class="right">Pendiente</th>
                    <th class="right">%</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($filasnivel as $f)
                <tr>
                    <td>{{ $f['nombre_grado'] }}</td>
                    <td class="right">{{ $f['total_pagos'] }}</td>
                    <td class="right">{{ $f['pagos_realizados'] }}</td>
                    <td class="right">{{ $f['pagos_pendientes'] }}</td>
                    <td class="right">S/ {{ number_format($f['monto_recaudado'], 2) }}</td>
                    <td class="right">S/ {{ number_format($f['monto_pendiente'], 2) }}</td>
                    <td class="right
                        @if($f['porcentaje_cobranza'] >= 80) pct-ok
                        @elseif($f['porcentaje_cobranza'] >= 50) pct-mid
                        @else pct-low @endif">
                        {{ $f['porcentaje_cobranza'] }}%
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    @endforeach

    <div class="footer">
        Sistema ERP Bautista La Pascana — Documento generado automáticamente
    </div>

</body>
</html>
