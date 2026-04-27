# Lógica de Integración: Asistencia y Recursos Humanos (RH)

## 0. El Problema y Requerimiento

### El Problema (Fragmentación de Sistemas)
Actualmente, existe una falta de coordinación entre los tres pilares fundamentales del control de personal:

1.  **Sistema de Asistencia (Entrada/Salida):** Funciona de forma aislada, registrando marcas sin una validación inteligente de turnos reales, lo que ensucia la data de reportes.
2.  **Sistema de Recursos Humanos (RH):** No recibe información precisa sobre el tiempo "no laborado" (tardanzas o salidas tempranas), lo que impide un cálculo de nómina justo y automatizado.
3.  **Sistema de Horarios:** Al ser estático y no estar vinculado por Nivel Educativo (Inicial, Primaria, Secundaria), obliga al sistema a usar reglas genéricas que no se adaptan a la realidad de cada trabajador o estudiante.

Esta fragmentación causa errores en el cálculo de tardanzas, injusticias en los descuentos salariales y una carga administrativa manual para corregir las asistencias diariamente.

### Análisis del Fallo Técnico Actual (Causa Raíz)
El error lógico reside en cómo el sistema busca el horario del personal en el archivo `app/Models/User.php`:

```php
// Código actual con error
public function horarioAsistencia(): HasOne
{
    return $this->hasOne(HorarioAsistencia::class, 'rol_id', 'rol_id')
        ->where('tipo_usuario', 'T');
}
```

**Problemas detectados:**
1.  **Generalización por Rol:** Todos los usuarios con el mismo `rol_id` (ej: "Docente") comparten el mismo registro de horario, ignorando que un docente de Inicial entra a una hora y uno de Primaria a otra.
2.  **Omisión del Turno:** No se considera el campo `turno` (Mañana, Tarde, Noche), por lo que si hay docentes en diferentes turnos, el sistema solo reconoce el primero que encuentre por rol.
3.  **Marcado "Duro" (Hardcoded):** En `AsistenciaService`, el turno se decide con `now()->hour < 13 ? 'M' : 'T'`, lo cual es una regla arbitraria que no respeta la realidad de los niveles educativos.

### El Requerimiento (Refactorización)
Implementar un sistema de asistencia inteligente que:
1.  Identifique automáticamente el horario del usuario según su nivel o turno asignado.
2.  Sincronice en tiempo real con el módulo de RH.
3.  Calcule descuentos monetarios precisos basados en el sueldo y las horas faltantes (tanto en entrada como en salida).

Este documento detalla la lógica de negocio para la sincronización entre el marcado de asistencia (QR/DNI) y la gestión de nóminas y descuentos en el módulo de RH.

## 1. Gestión de Horarios Dinámicos

El sistema debe abandonar las validaciones estáticas y basarse en la configuración de `horarios_asistencia`.

### Identificación de Horario
Cuando un usuario marca su asistencia, el sistema resuelve su horario siguiendo esta jerarquía:

*   **Estudiantes:** `Matrícula -> Sección -> Grado -> Nivel Educativo`. Se busca el horario que coincida con su `nivel_id` y `tipo_usuario = 'E'`.
*   **Docentes/Personal:** Se busca por `rol_id` y el `turno` (M, T, N) asignado en su ficha de trabajador.
*   **Criterio de Proximidad:** Si existen múltiples turnos, el sistema selecciona aquel cuya `hora_ingreso` esté más cerca de la hora actual (+/- 2 horas), permitiendo flexibilidad en entradas tempranas o tardías.

---

## 2. Lógica de Descuentos en RH

El sistema de RH procesará las marcas generadas en la Asistencia General para calcular impactos financieros en la nómina.

### Tipos de Descuento (Configurables en Contrato)
1.  **Monto Fijo:** Se resta un monto exacto por cada evento de tardanza.
2.  **Porcentaje:** Se resta un % del sueldo diario.
3.  **Proporcional (Tiempo No Trabajado):**
    *   **Costo por Minuto:** `Sueldo Base / (Horas Semanales * 4 * 60)`.
    *   **Cálculo de Deuda:** `(Minutos Tardanza Entrada + Minutos Salida Temprana) * Costo por Minuto`.

### Ejemplo de Cálculo Proporcional
| Concepto | Valor |
| :--- | :--- |
| Sueldo Base | S/ 1,200.00 |
| Horas Semanales | 48 horas |
| Minutos/Mes | 11,520 min |
| **Valor por Minuto** | **S/ 0.1041** |
| Tardanza Entrada | 15 min |
| Salida Anticipada | 45 min |
| **Total Descuento** | **60 min * 0.1041 = S/ 6.25** |

---

## 3. Flujo de Sincronización

### Marcado de Entrada
1.  Se registra en `asistencias` (General).
2.  Si `es_trabajador = true`:
    *   Validar contra `horarios_asistencia`.
    *   Calcular minutos de tardanza (considerando `minutos_tolerancia`).
    *   Crear registro en `rh_asistencia_personal` con el `descuento_aplicado` inicial.

### Marcado de Salida
1.  Actualizar `asistencias` (General).
2.  Si `es_trabajador = true`:
    *   Actualizar `rh_asistencia_personal`.
    *   **NUEVO:** Comparar hora de salida real vs `hora_salida` del horario.
    *   Si salió antes, sumar minutos faltantes al descuento del día.

---

## 4. Requerimientos Técnicos

1.  **Modelos:** 
    *   `RhContrato`: Añadir `proporcional` como opción en `tipo_descuento`.
    *   `User`: Refactorizar relación `horarioAsistencia` para ser dinámica.
2.  **Servicios:**
    *   `AsistenciaService`: Implementar detector de horarios por nivel/turno.
    *   `RhAsistenciaPersonalService`: Implementar cálculo de costo por minuto y validación de salida temprana.
