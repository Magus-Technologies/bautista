<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1a1a1a; padding: 20px; }

        .header { text-align: center; border-bottom: 2px solid #1a7a4a; padding-bottom: 10px; margin-bottom: 16px; }
        .header .institucion { font-size: 13px; font-weight: bold; color: #1a7a4a; text-transform: uppercase; }
        .header h1 { font-size: 14px; font-weight: bold; color: #1a1a1a; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { font-size: 9px; color: #666; margin-top: 2px; }

        .worker-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; margin-bottom: 14px; display: table; width: 100%; }
        .worker-info .col { display: table-cell; width: 50%; }
        .worker-info .label { color: #64748b; font-size: 9px; }
        .worker-info .value { font-weight: bold; font-size: 11px; }

        .stats { display: table; width: 100%; margin-bottom: 14px; border-collapse: separate; border-spacing: 4px; }
        .stat-cell { display: table-cell; text-align: center; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 4px; }
        .stat-num  { font-size: 18px; font-weight: bold; }
        .stat-lbl  { font-size: 8px; color: #64748b; margin-top: 2px; }
        .green  { color: #059669; }
        .amber  { color: #d97706; }
        .orange { color: #ea580c; }
        .red    { color: #dc2626; }

        .section-title { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }

        table.detail { width: 100%; border-collapse: collapse; }
        table.detail thead tr { background: #1a7a4a; color: #fff; }
        table.detail th { padding: 5px 6px; text-align: left; font-size: 9px; text-transform: uppercase; font-weight: bold; }
        table.detail th.center { text-align: center; }
        table.detail th.right  { text-align: right; }
        table.detail td { padding: 4px 6px; font-size: 9px; border-bottom: 1px solid #f1f5f9; }
        table.detail td.center { text-align: center; }
        table.detail td.right  { text-align: right; }
        table.detail tbody tr:nth-child(even) { background: #f8fafc; }

        .badge { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 8px; font-weight: bold; }
        .badge-presente  { background: #d1fae5; color: #065f46; }
        .badge-ausente   { background: #fee2e2; color: #991b1b; }
        .badge-tardanza  { background: #fef3c7; color: #92400e; }
        .badge-licencia  { background: #dbeafe; color: #1e40af; }
        .badge-default   { background: #f1f5f9; color: #475569; }

        .footer { margin-top: 20px; font-size: 8px; color: #94a3b8; text-align: right; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    </style>
</head>
<body>

    <div class="header">
        @if($institucion)
            <div class="institucion">{{ $institucion->insti_razon_social }}</div>
        @endif
        <h1>Reporte de Asistencia Personal</h1>
        <p>Período: {{ $periodoLabel }} &nbsp;|&nbsp; Generado: {{ now()->format('d/m/Y H:i') }}</p>
    </div>

    <div class="worker-info">
        <div class="col">
            <div class="label">Trabajador</div>
            <div class="value">{{ $trabajador }}</div>
        </div>
        <div class="col">
            <div class="label">Período</div>
            <div class="value">{{ $periodoLabel }}</div>
        </div>
    </div>

    <div class="stats">
        <div class="stat-cell">
            <div class="stat-num green">{{ $estadisticas['dias_presentes'] }}</div>
            <div class="stat-lbl">Días Presentes</div>
        </div>
        <div class="stat-cell">
            <div class="stat-num red">{{ $estadisticas['dias_ausentes'] }}</div>
            <div class="stat-lbl">Ausencias</div>
        </div>
        <div class="stat-cell">
            <div class="stat-num amber">{{ $estadisticas['total_tardanzas'] }}</div>
            <div class="stat-lbl">Tardanzas</div>
        </div>
        <div class="stat-cell">
            <div class="stat-num orange">{{ $estadisticas['minutos_tardanza_total'] ?? 0 }} min</div>
            <div class="stat-lbl">Min. Tardanza</div>
        </div>
        <div class="stat-cell">
            <div class="stat-num red">S/ {{ number_format($estadisticas['total_descuentos'], 2) }}</div>
            <div class="stat-lbl">Total Descuentos</div>
        </div>
    </div>

    <div class="section-title">Detalle de Asistencias</div>

    <table class="detail">
        <thead>
            <tr>
                <th>#</th>
                <th>Fecha</th>
                <th class="center">Entrada</th>
                <th class="center">Salida</th>
                <th class="center">Estado</th>
                <th class="center">Tard.</th>
                <th class="center">Sal. Antic.</th>
                <th class="right">Descuento</th>
            </tr>
        </thead>
        <tbody>
            @forelse($asistencias as $i => $a)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($a->fecha)->format('d/m/Y') }}</td>
                <td class="center">{{ $a->hora_entrada ? substr($a->hora_entrada, 0, 5) : '—' }}</td>
                <td class="center">{{ $a->hora_salida  ? substr($a->hora_salida,  0, 5) : '—' }}</td>
                <td class="center">
                    @php $badgeClass = match($a->estado) { 'presente'=>'badge-presente','ausente'=>'badge-ausente','tardanza'=>'badge-tardanza','licencia'=>'badge-licencia', default=>'badge-default' }; @endphp
                    <span class="badge {{ $badgeClass }}">{{ $a->estado_label }}</span>
                </td>
                <td class="center {{ $a->minutos_tardanza > 0 ? 'amber' : '' }}">
                    {{ $a->minutos_tardanza > 0 ? $a->minutos_tardanza.' min' : '—' }}
                </td>
                <td class="center {{ $a->minutos_salida_anticipada > 0 ? 'orange' : '' }}">
                    {{ $a->minutos_salida_anticipada > 0 ? $a->minutos_salida_anticipada.' min' : '—' }}
                </td>
                <td class="right {{ $a->descuento_aplicado > 0 ? 'red' : '' }}">
                    {{ $a->descuento_aplicado > 0 ? 'S/ '.number_format($a->descuento_aplicado, 2) : '—' }}
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" style="text-align:center; padding:20px; color:#94a3b8;">No hay registros para este período</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Total de registros: {{ count($asistencias) }} &nbsp;|&nbsp; Total descuentos: S/ {{ number_format($estadisticas['total_descuentos'], 2) }}
    </div>

</body>
</html>
