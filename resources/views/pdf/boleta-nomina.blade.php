<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Boleta de Pago - {{ $nomina->periodo }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 20px; }

        .header { text-align: center; border: 2px solid #1a7a4a; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 16px; color: #1a7a4a; text-transform: uppercase; letter-spacing: 1px; }
        .header p { color: #555; font-size: 11px; margin-top: 2px; }

        .institucion { font-size: 13px; font-weight: bold; color: #222; }

        .section { margin-bottom: 14px; }
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 3px; margin-bottom: 6px; letter-spacing: 0.5px; }

        .info-grid { display: table; width: 100%; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; color: #666; width: 45%; padding: 2px 0; }
        .info-value { display: table-cell; font-weight: bold; padding: 2px 0; }

        .asistencia-grid { width: 100%; border-collapse: collapse; }
        .asistencia-grid td { border: 1px solid #ddd; text-align: center; padding: 8px 4px; width: 33%; }
        .asistencia-grid .num { font-size: 20px; font-weight: bold; }
        .asistencia-grid .lbl { font-size: 9px; color: #666; }
        .green { color: #1a7a4a; }
        .red { color: #c0392b; }
        .orange { color: #e67e22; }

        .detalle-table { width: 100%; border-collapse: collapse; }
        .detalle-table tr td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; }
        .detalle-table .td-label { color: #555; }
        .detalle-table .td-value { text-align: right; font-weight: bold; }
        .detalle-table .td-red { text-align: right; font-weight: bold; color: #c0392b; }
        .separator { border-top: 1px solid #ccc; }

        .total-box { background: #1a7a4a; color: white; padding: 10px 12px; border-radius: 4px; display: table; width: 100%; margin-top: 14px; }
        .total-box .total-label { display: table-cell; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .total-box .total-value { display: table-cell; text-align: right; font-size: 18px; font-weight: bold; }

        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; display: table; width: 100%; }
        .firma { display: table-cell; text-align: center; width: 50%; }
        .firma-line { border-top: 1px solid #333; margin: 40px 20px 4px; }
        .firma-label { font-size: 9px; color: #666; }

        .estado-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; }
        .estado-pendiente { background: #fef3c7; color: #92400e; }
        .estado-aprobado  { background: #d1fae5; color: #065f46; }
        .estado-pagado    { background: #059669; color: white; }
    </style>
</head>
<body>

    <div class="header">
        @if($institucion)
            <div class="institucion">{{ $institucion->insti_razon_social }}</div>
        @endif
        <h1>Boleta de Pago</h1>
        <p>Período: {{ $nomina->periodo }}</p>
    </div>

    <div class="section">
        <div class="section-title">Datos del Trabajador</div>
        <div class="info-grid">
            <div class="info-row">
                <div class="info-label">Nombre completo</div>
                <div class="info-value">{{ $nomina->user->nombre_completo }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Período</div>
                <div class="info-value">{{ $nomina->periodo }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Estado</div>
                <div class="info-value">
                    <span class="estado-badge estado-{{ $nomina->estado }}">{{ $nomina->estado_label }}</span>
                </div>
            </div>
            @if($nomina->fecha_pago)
            <div class="info-row">
                <div class="info-label">Fecha de pago</div>
                <div class="info-value">{{ \Carbon\Carbon::parse($nomina->fecha_pago)->format('d/m/Y') }}</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">Resumen de Asistencia</div>
        <table class="asistencia-grid">
            <tr>
                <td>
                    <div class="num green">{{ $nomina->dias_trabajados }}</div>
                    <div class="lbl">Días trabajados</div>
                </td>
                <td>
                    <div class="num red">{{ $nomina->dias_ausentes }}</div>
                    <div class="lbl">Ausencias</div>
                </td>
                <td>
                    <div class="num orange">{{ $nomina->total_tardanzas }}</div>
                    <div class="lbl">Tardanzas</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">Detalle de Haberes y Descuentos</div>
        <table class="detalle-table">
            <tr>
                <td class="td-label">Sueldo Base</td>
                <td class="td-value">S/ {{ number_format($nomina->sueldo_base, 2) }}</td>
            </tr>
            <tr>
                <td class="td-label">Bonificaciones</td>
                <td class="td-value">S/ {{ number_format($nomina->bonificaciones, 2) }}</td>
            </tr>
            <tr class="separator">
                <td class="td-label">Desc. por tardanzas</td>
                <td class="td-red">- S/ {{ number_format($nomina->descuentos_tardanzas, 2) }}</td>
            </tr>
            <tr>
                <td class="td-label"><strong>Total Descuentos</strong></td>
                <td class="td-red"><strong>- S/ {{ number_format($nomina->total_descuentos, 2) }}</strong></td>
            </tr>
        </table>
    </div>

    <div class="total-box">
        <div class="total-label">Sueldo Neto a Pagar</div>
        <div class="total-value">S/ {{ number_format($nomina->sueldo_neto, 2) }}</div>
    </div>

    <div class="footer">
        <div class="firma">
            <div class="firma-line"></div>
            <div class="firma-label">Firma del Trabajador</div>
        </div>
        <div class="firma">
            <div class="firma-line"></div>
            <div class="firma-label">Firma del Empleador</div>
        </div>
    </div>

</body>
</html>
