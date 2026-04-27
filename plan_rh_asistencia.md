# Plan Backend: Integración Asistencia + RH

## Estado actual
- `registrarEntrada()` usa `$contrato->hora_entrada` → **ELIMINADA** en migración 2026_04_24_041831 → crash en producción
- Turno hardcodeado: `now()->hour < 13 ? 'M' : 'T'` → sin lógica real
- `registrarSalida()` no calcula descuento por salida anticipada
- `tipo_descuento` solo tiene `fijo` / `porcentaje` → falta `proporcional`
- No se guarda qué `horario_id` se usó en cada marcado
- `unique(user_id, fecha)` impide doble turno en el mismo día (pendiente evaluar)

---

## Pasos

### FASE 1 — Migraciones
- [x] **Paso 1** — `add_horario_id_to_rh_asistencia_personal`
  - Agregar FK `horario_id` nullable a `horarios_asistencia.horario_id`
- [x] **Paso 2** — `add_proporcional_to_tipo_descuento_rh_contratos`
  - Modificar enum: `ENUM('fijo','porcentaje','proporcional')`
- [x] **Paso 3** — `add_minutos_salida_anticipada_to_rh_asistencia_personal`
  - Agregar `minutos_salida_anticipada` INT default 0

### FASE 2 — Modelos
- [x] **Paso 4** — `RhAsistenciaPersonal.php`
  - Agregar `horario_id` y `minutos_salida_anticipada` a `$fillable`
  - Agregar relación `horario(): BelongsTo`
- [x] **Paso 5** — `User.php`
  - Remover / deprecar `horarioAsistencia()` (reemplazada por HorarioResolverService)

### FASE 3 — Nuevo servicio HorarioResolver
- [x] **Paso 6** — `app/Exceptions/HorarioNoDisponibleException.php` *(nuevo)*
  - HTTP 422, mensaje descriptivo con hora actual
- [x] **Paso 7** — `app/Services/Implements/HorarioResolverService.php` *(nuevo)*
  - Método `resolverParaTrabajador(int $userId, int $instiId): HorarioAsistencia`
  - Busca en `horarios_asistencia` por `rol_id` + `insti_id` + `tipo_usuario = 'T'`
  - Filtra los que estén a **±2h** de `now()`
  - Prioriza horarios con `rol_id` específico sobre los genéricos (`rol_id IS NULL`)
  - Elige el más cercano en tiempo
  - Lanza `HorarioNoDisponibleException` si la colección queda vacía
  - Manejar edge case turno noche (cruce de medianoche)

### FASE 4 — Repositorios
- [x] **Paso 8** — `RhAsistenciaPersonalRepository.php`
  - `findByUserAndDate()` → eager load `['horario', 'contrato']`
- [x] **Paso 9** — `RhContratoRepository.php`
  - Remover `user.horarioAsistencia` de todos los `with()`

### FASE 5 — Reescritura de RhAsistenciaPersonalService
- [x] **Paso 10** — Constructor
  - Inyectar `HorarioResolverService`
- [x] **Paso 11** — Helper privado `calcularDescuento(RhContrato $contrato, int $minutos): float`
  ```
  fijo        → descuento_por_tardanza (monto fijo, independiente de minutos)
  porcentaje  → (sueldo_base / 30) * (descuento_por_tardanza / 100)
  proporcional → (sueldo_base / (horas_semanales * 4 * 60)) * $minutos
  ```
- [x] **Paso 12** — `registrarEntrada()`
  1. Verificar duplicado del día
  2. Obtener contrato activo
  3. Resolver horario via `HorarioResolverService`
  4. Calcular `minutosTardanza` respetando `$horario->minutos_tolerancia`
  5. `calcularDescuento($contrato, $minutosTardanza)`
  6. Guardar con `horario_id` del horario resuelto
  7. Sincronizar con asistencia general usando `$horario->turno` (no el hack)
- [x] **Paso 13** — `registrarSalida()`
  1. Buscar registro del día (con horario y contrato cargados)
  2. Verificar que no hay salida ya registrada
  3. Si `$asistencia->horario` existe y `hora_salida_real < hora_salida_esperada`:
     - Calcular `minutosSalidaAnticipada`
     - `calcularDescuento($contrato, $minutosSalidaAnticipada)` y sumar a `descuento_aplicado`
  4. Guardar `hora_salida` + `minutos_salida_anticipada` + `descuento_aplicado` actualizado
  5. Sincronizar con asistencia general

### FASE 6 — Validaciones y Recursos
- [x] **Paso 14** — `StoreRhContratoRequest.php`
  - `'tipo_descuento' => 'required|in:fijo,porcentaje,proporcional'`
- [x] **Paso 15** — `UpdateRhContratoRequest.php`
  - Mismo cambio que Paso 14
- [x] **Paso 16** — `StoreRhAsistenciaPersonalRequest.php`
  - Agregar `'horario_id' => 'nullable|exists:horarios_asistencia,horario_id'`
- [x] **Paso 17** — `RhAsistenciaPersonalResource.php`
  - Exponer `horario_id` + relación `horario` con `whenLoaded()`

### FASE 7 — Nómina
- [x] **Paso 18** — `RhNominaService.php`
  - Sin cambio de fórmula
  - `sum('descuento_aplicado')` ya es correcto una vez que los pasos anteriores funcionen
  - Verificar que `descuentos_tardanzas` en nómina recibe el total (tardanza + salida anticipada)

---

## Advertencia: doble turno
El constraint `UNIQUE(user_id, fecha)` en `rh_asistencia_personal` impide que un docente registre mañana **y** tarde el mismo día. Si se necesita en el futuro, cambiarlo a `UNIQUE(user_id, fecha, horario_id)`.

---

## Archivos clave
| Archivo | Estado |
|---------|--------|
| `app/Services/Implements/RhAsistenciaPersonalService.php` | Reescribir (Pasos 10-13) |
| `app/Services/Implements/HorarioResolverService.php` | Crear (Paso 7) |
| `app/Exceptions/HorarioNoDisponibleException.php` | Crear (Paso 6) |
| `app/Models/RhAsistenciaPersonal.php` | Actualizar (Paso 4) |
| `app/Repositories/Implements/RhAsistenciaPersonalRepository.php` | Actualizar (Paso 8) |
| `app/Repositories/Implements/RhContratoRepository.php` | Limpiar (Paso 9) |
| `app/Http/Requests/StoreRhContratoRequest.php` | Actualizar (Paso 14) |
| `app/Http/Requests/UpdateRhContratoRequest.php` | Actualizar (Paso 15) |
| `app/Http/Resources/RhAsistenciaPersonalResource.php` | Actualizar (Paso 17) |
| `app/Services/Implements/RhNominaService.php` | Verificar (Paso 18) |
