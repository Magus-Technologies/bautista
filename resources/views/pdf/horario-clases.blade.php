<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 9px; color: #1a1a1a; }

        .header { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 12px; }
        .header h1 { font-size: 13px; font-weight: bold; color: #1d4ed8; text-transform: uppercase; }
        .header h2 { font-size: 10px; color: #374151; margin-top: 2px; }
        .header p  { font-size: 8px; color: #6b7280; margin-top: 2px; }

        table { width: 100%; border-collapse: collapse; }
        th {
            background: #1d4ed8;
            color: #fff;
            padding: 5px 4px;
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #1e40af;
        }
        td {
            border: 1px solid #e5e7eb;
            padding: 3px 4px;
            vertical-align: top;
            min-height: 40px;
        }
        td.hora {
            background: #f3f4f6;
            font-weight: bold;
            font-size: 8px;
            text-align: center;
            color: #374151;
            white-space: nowrap;
            width: 60px;
        }
        .clase-cell {
            background: #eff6ff;
            border-radius: 3px;
            padding: 3px 4px;
            border-left: 3px solid #3b82f6;
        }
        .clase-curso { font-weight: bold; font-size: 8px; color: #1e3a8a; }
        .clase-info  { font-size: 7px; color: #3b82f6; margin-top: 1px; }

        .footer { margin-top: 12px; text-align: center; font-size: 7px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 5px; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Horario de Clases</h1>
        <h2>{{ $titulo }}</h2>
        <p>Año Escolar {{ $anio }} &nbsp;·&nbsp; Generado: {{ $fecha }}</p>
    </div>

    @php
        $dias = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado'];

        // Recopilar todas las franjas horarias únicas
        $franjas = [];
        foreach ($horario as $diaData) {
            foreach ($diaData['clases'] as $clase) {
                $key = $clase['hora_inicio'] . '-' . $clase['hora_fin'];
                $franjas[$key] = $key;
            }
        }
        sort($franjas);

        // Índice rápido: dia -> hora -> clase
        $idx = [];
        foreach ($horario as $diaNum => $diaData) {
            foreach ($diaData['clases'] as $clase) {
                $key = $clase['hora_inicio'] . '-' . $clase['hora_fin'];
                $idx[$diaNum][$key] = $clase;
            }
        }

        // Días que tienen al menos una clase
        $diasActivos = array_keys($horario);
    @endphp

    <table>
        <thead>
            <tr>
                <th>Hora</th>
                @foreach ($dias as $num => $nombre)
                    @if (in_array($num, $diasActivos))
                        <th>{{ $nombre }}</th>
                    @endif
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($franjas as $franja)
                @php [$ini, $fin] = explode('-', $franja, 2); @endphp
                <tr>
                    <td class="hora">{{ $ini }}<br>{{ $fin }}</td>
                    @foreach ($dias as $num => $nombre)
                        @if (in_array($num, $diasActivos))
                            <td>
                                @if (isset($idx[$num][$franja]))
                                    @php $c = $idx[$num][$franja]; @endphp
                                    <div class="clase-cell">
                                        <div class="clase-curso">{{ $c['curso'] }}</div>
                                        @if (!empty($c['docente']) && $mostrarDocente)
                                            <div class="clase-info">{{ $c['docente'] }}</div>
                                        @endif
                                        @if (!empty($c['seccion']) && $mostrarSeccion)
                                            <div class="clase-info">{{ $c['seccion'] }}{{ !empty($c['grado']) ? ' · '.$c['grado'] : '' }}</div>
                                        @endif
                                        @if (!empty($c['aula']))
                                            <div class="clase-info">{{ $c['aula'] }}</div>
                                        @endif
                                    </div>
                                @endif
                            </td>
                        @endif
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Sistema de Gestión Educativa &nbsp;·&nbsp; {{ $fecha }}
    </div>

</body>
</html>
