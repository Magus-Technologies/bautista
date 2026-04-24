<!-- Header con Logo y Datos de Empresa -->
<div class="header">
    @if($config->mostrar_logo && $institucion->insti_logo)
        <img src="{{ public_path('storage/' . $institucion->insti_logo) }}" alt="Logo" class="logo">
    @endif
    <div class="empresa-nombre">{{ $institucion->insti_razon_social }}</div>
    <div class="empresa-info">
        RUC: {{ $institucion->insti_ruc }} | {{ $institucion->insti_direccion }}
        @if($config->mostrar_telefono && $institucion->insti_telefono1)
            | Tel: {{ $institucion->insti_telefono1 }}
        @endif
    </div>
</div>

<!-- Información del Comprobante -->
<div class="comprobante-box">
    <div class="tipo">{{ $tipoLabel }} ELECTRÓNICA</div>
    <div class="numero">{{ $comprobante->serie }}-{{ str_pad($comprobante->numero, $config->digitos_numero, '0', STR_PAD_LEFT) }}</div>
    <div class="fecha">
        Fecha: <strong>{{ $comprobante->fecha_emision ? $comprobante->fecha_emision->format('d/m/Y') : '—' }}</strong>
    </div>
</div>

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
    <div class="row">
        <span class="label">Pago:</span>
        <span class="value">{{ strtoupper($comprobante->forma_pago) }}</span>
    </div>
</div>

<!-- Tabla de Items -->
<table class="items-table">
    <thead>
        <tr>
            <th style="width: 12%;">Código</th>
            <th style="width: 38%;">Descripción</th>
            <th class="center" style="width: 8%;">Und.</th>
            <th class="right" style="width: 10%;">Cant.</th>
            <th class="right" style="width: 16%;">P. Unit.</th>
            <th class="right" style="width: 16%;">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @foreach($comprobante->items as $item)
        <tr>
            <td>{{ $item->cod_producto }}</td>
            <td>{{ Str::limit($item->descripcion, 40) }}</td>
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

<!-- Footer con Hash -->
<div class="footer">
    @if($config->mostrar_firma_digital && $comprobante->nombre_archivo)
    <div class="hash-section">
        <div class="titulo">Información de Firma Digital</div>
        <table>
            <tr>
                <td style="width: 70%; padding-right: 2mm;">
                    <div>
                        <strong>Archivo:</strong> {{ $comprobante->nombre_archivo }}<br>
                        @if($config->mostrar_hash && $comprobante->hash)
                            <strong>Hash:</strong> {{ substr($comprobante->hash, 0, 35) }}...
                        @endif
                    </div>
                </td>
                @if($config->mostrar_qr && $qrCodeDataUri)
                <td style="width: 30%; text-align: right;">
                    <div style="text-align: center;">
                        <div style="font-size: 6px; font-weight: bold; color: {{ $config->color_primario }}; margin-bottom: 1mm;">
                            QR
                        </div>
                        <img src="{{ $qrCodeDataUri }}" alt="QR" class="qr-image">
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
    @endif
</div>
