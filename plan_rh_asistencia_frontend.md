# Plan Frontend: Integración Asistencia + RH

## Contexto

El backend ya fue corregido (ver `plan_rh_asistencia.md`). El frontend tiene varios
desajustes con el nuevo modelo de datos: campos eliminados que siguen en los formularios,
campos nuevos que no se muestran, y lógica de descuento incompleta en los selectores.

---

## Problemas detectados

| Módulo | Problema |
|--------|----------|
| Contratos — formulario | Tiene `hora_entrada`, `hora_salida`, `minutos_tolerancia` que el backend eliminó |
| Contratos — tabla | Columna "Horario" muestra `hora_entrada - hora_salida` (campo ya no existe) |
| Contratos — formulario | `tipo_descuento` solo tiene `fijo \| porcentaje`, falta `proporcional` |
| RH Asistencia — tipos TS | No tiene `horario_id`, `minutos_salida_anticipada`, ni relación `horario` |
| RH Asistencia — tabla | No muestra `minutos_salida_anticipada` |
| RH Asistencia — modal manual | No incluye selector de `horario_id` |
| Reportes RH | Stats y tabla no muestran `minutos_salida_anticipada` |
| Horarios — formulario | Verificar si tiene campo `rol_id` (agregado en migración 2026_04_24_040410) |

---

## Pasos

### FASE 1 — Tipos TypeScript
- [x] **Paso 1** — Actualizar tipo `Contrato`
  - Quitar: `hora_entrada`, `hora_salida`, `minutos_tolerancia`
  - Actualizar: `tipo_descuento: 'fijo' | 'porcentaje' | 'proporcional'`
  - Archivo: `pages/RH/Contratos/index.tsx` (o types compartido)

- [x] **Paso 2** — Actualizar tipo `AsistenciaPersonal`
  - Agregar: `horario_id: number | null`
  - Agregar: `minutos_salida_anticipada: number`
  - Agregar: `horario: { horario_id, turno, hora_ingreso, hora_salida, minutos_tolerancia } | null`
  - Archivo: `pages/RH/Asistencia/index.tsx`

### FASE 2 — Módulo Contratos
- [x] **Paso 3** — `ContratoFormModal.tsx` — quitar campos de horario
  - Eliminar inputs: `hora_entrada`, `hora_salida`, `minutos_tolerancia`
  - Agregar nota informativa: *"El horario se configura en el módulo Horarios de Trabajo"*

- [x] **Paso 4** — `ContratoFormModal.tsx` — agregar `proporcional` en tipo_descuento
  - Agregar opción `proporcional` al select de tipo_descuento
  - Mostrar descripción dinámica según el tipo seleccionado:
    - `fijo` → "Se resta S/ X fijo por cada tardanza"
    - `porcentaje` → "Se resta X% del sueldo diario por tardanza"
    - `proporcional` → "Se descuenta por cada minuto no trabajado: Sueldo ÷ (horas × 4 × 60)"

- [x] **Paso 5** — `Contratos/index.tsx` — tabla
  - Quitar columna "Horario" (`hora_entrada - hora_salida`)
  - Actualizar columna "Tolerancia" → quitar (ya no viene del contrato)
  - Agregar columna "Tipo Descuento" con badge (`fijo` | `porcentaje` | `proporcional`)

### FASE 3 — Módulo RH Asistencia Personal
- [x] **Paso 6** — `RH/Asistencia/index.tsx` — tabla
  - Agregar columna "Salida Antic." (minutos_salida_anticipada, en naranja si > 0)
  - Agregar columna "Turno" mostrando `horario.turno` (M / T / N) si existe

- [x] **Paso 7** — `AsistenciaManualModal.tsx` — formulario
  - Agregar campo `horario_id` (select opcional con horarios disponibles de la institución)
  - Cargar horarios desde `GET /api/horarios-asistencia?tipo_usuario=T`
  - Mostrar como: "Turno M — 07:30 a 13:00" para ayudar al admin a elegir

### FASE 4 — Módulo Reportes RH
- [x] **Paso 8** — `RH/Reportes/index.tsx` — tarjetas de estadísticas
  - Agregar tarjeta "Min. Salida Anticipada" (naranja) con `minutos_salida_anticipada` total

- [x] **Paso 9** — `RH/Reportes/index.tsx` — tabla de detalle
  - Agregar columna "Salida Antic." (minutos)
  - Actualizar tipo del reporte para incluir `minutos_salida_anticipada`

### FASE 5 — Módulo Horarios de Trabajo
- [x] **Paso 10** — `Horarios/` — verificar campo `rol_id`
  - Revisar si el formulario de horarios tiene selector de `rol_id`
  - Si no existe: agregar select de rol (cargar desde `/api/seguridad/roles?tipo=trabajador`)
  - El `rol_id` define qué rol usa ese horario (docente, administrativo, etc.)
  - Si `rol_id` es null → horario genérico de institución (fallback)

---

## Archivos a tocar
| Archivo | Fase |
|---------|------|
| `pages/RH/Contratos/index.tsx` | 1, 2 |
| `pages/RH/Contratos/components/ContratoFormModal.tsx` | 2 |
| `pages/RH/Asistencia/index.tsx` | 1, 3 |
| `pages/RH/Asistencia/components/AsistenciaManualModal.tsx` | 3 |
| `pages/RH/Reportes/index.tsx` | 4 |
| `pages/Horarios/` (index + modal) | 5 |

---

## Notas
- El Scanner QR no necesita cambios — la coordinación con RH la hace el backend
- El módulo Nómina no necesita cambios de UI — el cálculo ya es correcto tras el fix del backend
- No crear nuevas páginas, solo ajustar las existentes
