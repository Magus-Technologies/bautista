<?php

namespace App\Enums;

/**
 * Catálogo 10 - SUNAT
 * Tipos de Nota de Débito
 */
enum TipoNotaDebito: string
{
    case INTERESES_MORA = '01';
    case AUMENTO_VALOR = '02';
    case PENALIDADES = '03';

    public function label(): string
    {
        return match($this) {
            self::INTERESES_MORA => 'Intereses por mora',
            self::AUMENTO_VALOR => 'Aumento en el valor',
            self::PENALIDADES => 'Penalidades / Otros conceptos',
        };
    }

    public function descripcion(): string
    {
        return match($this) {
            self::INTERESES_MORA => 'Cuando el cliente se atrasa en el pago y aplicas penalidades',
            self::AUMENTO_VALOR => 'Si el precio real del servicio era mayor al facturado',
            self::PENALIDADES => 'Cobros adicionales por incumplimiento de contrato u otros gastos',
        };
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
