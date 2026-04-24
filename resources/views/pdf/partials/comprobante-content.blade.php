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
        <span class="label">Forma de Pago:</span>
        <span class="value">{{ strtoupper($comprobante->forma_pago) }}</span>
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

<!-- Footer con Hash -->
<div class="footer">
    @if($config->mostrar_firma_digital && $comprobante->nombre_archivo)
    <div class="hash-section">
        <div class="titulo">Información de Firma Digital</div>
        <table style="width: 100%; border: none; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: top; border: none; padding: 0; padding-right: 8px; width: 70%;">
                    <div class="contenido">
                        <strong>Archivo:</strong> {{ $comprobante->nombre_archivo }}<br>
                        @if($config->mostrar_hash && $comprobante->hash)
                            <strong>Hash:</strong> {{ substr($comprobante->hash, 0, 40) }}...
                        @endif
                    </div>
                </td>
                @if($config->mostrar_qr && $qrCodeDataUri)
                <td style="width: 30%; text-align: right; vertical-align: top; border: none; padding: 0;">
                    <div style="display: inline-block; text-align: center;">
                        <div style="font-size: 6px; font-weight: bold; color: {{ $config->color_primario }}; margin-bottom: 2px;">
                            CÓDIGO QR
                        </div>
                        <img src="{{ $qrCodeDataUri }}" alt="QR" style="width: 50px; height: 50px; border: 1px solid #d1d5db; display: block;">
                    </div>
                </td>
                @endif
            </tr>
        </table>
    </div>
    @endif
</div>
