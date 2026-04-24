<?php

namespace App\Enums;

/**
 * Catálogo 09 - SUNAT
 * Tipos de Nota de Crédito
 */
enum TipoNotaCredito: string
{
    case ANULACION_OPERACION = '01';
    case ANULACION_ERROR_RUC = '02';
    case CORRECCION_DESCRIPCION = '03';
    case DESCUENTO_GLOBAL = '04';
    case DESCUENTO_ITEM = '05';
    case DEVOLUCION_TOTAL = '06';
    case DEVOLUCION_ITEM = '07';
    case BONIFICACION = '08';
    case DISMINUCION_VALOR = '09';
    case OTROS_CONCEPTOS = '10';

    public function label(): string
    {
        return match($this) {
            self::ANULACION_OPERACION => 'Anulación de la operación',
            self::ANULACION_ERROR_RUC => 'Anulación por error en el RUC',
            self::CORRECCION_DESCRIPCION => 'Corrección por error en la descripción',
            self::DESCUENTO_GLOBAL => 'Descuento global',
            self::DESCUENTO_ITEM => 'Descuento por ítem',
            self::DEVOLUCION_TOTAL => 'Devolución total',
            self::DEVOLUCION_ITEM => 'Devolución por ítem',
            self::BONIFICACION => 'Bonificación',
            self::DISMINUCION_VALOR => 'Disminución en el valor',
            self::OTROS_CONCEPTOS => 'Otros conceptos',
        };
    }

    public function descripcion(): string
    {
        return match($this) {
            self::ANULACION_OPERACION => 'Cuando la venta no se realizó o se emitió por error total',
            self::ANULACION_ERROR_RUC => 'Si te equivocaste en el número de identificación del cliente',
            self::CORRECCION_DESCRIPCION => 'Cuando el servicio está bien, pero el texto descriptivo está mal',
            self::DESCUENTO_GLOBAL => 'Un descuento aplicado a todo el comprobante después de emitido',
            self::DESCUENTO_ITEM => 'Rebaja específica para un solo servicio de la lista',
            self::DEVOLUCION_TOTAL => 'El cliente devuelve todos los servicios',
            self::DEVOLUCION_ITEM => 'El cliente devuelve solo una parte de los servicios',
            self::BONIFICACION => 'Entrega de servicios gratuitos posterior a la emisión',
            self::DISMINUCION_VALOR => 'Si se pactó un precio menor al que se facturó originalmente',
            self::OTROS_CONCEPTOS => 'Casos especiales no contemplados en los anteriores',
        };
    }

    /**
     * Tipos más comunes para servicios educativos
     */
    public static function paraServicios(): array
    {
        return [
            self::ANULACION_OPERACION,
            self::ANULACION_ERROR_RUC,
            self::CORRECCION_DESCRIPCION,
            self::DESCUENTO_GLOBAL,
            self::DISMINUCION_VALOR,
            self::OTROS_CONCEPTOS,
        ];
    }

    /**
     * Obtener todas las opciones como array para selects
     */
    public static function toArray(): array
    {
        return array_map(
            fn($case) => ['value' => $case->value, 'label' => $case->label(), 'descripcion' => $case->descripcion()],
            self::cases()
        );
    }
}
