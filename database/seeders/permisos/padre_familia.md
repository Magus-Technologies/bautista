# Permisos — Roles: padre_familia / madre_familia / apoderado
Total: 12 permisos (los 3 roles comparten exactamente los mismos)

## Dashboard
- dashboard.ver
- dashboard.padre.resumen

## Perfil
- perfil.ver
- perfil.editar

## Recursos
- recursos.mensajeria.ver
- recursos.mensajeria.enviar

## Portal Padre/Familia
- portal.padre.ver
- portal.padre.hijos
- portal.padre.pagos
- portal.padre.cursos
- portal.padre.profesores
- portal.padre.horario   ← ver horario semanal de los hijos (/padre/horario)

## Vistas disponibles
| Ruta | Permiso requerido |
|---|---|
| /padre/dashboard | portal.padre.hijos |
| /padre/asistencia | portal.padre.hijos |
| /padre/pagos | portal.padre.pagos |
| /padre/cursos | portal.padre.cursos |
| /padre/profesores | portal.padre.profesores |
| /padre/horario | portal.padre.ver |

## Seeder
```bash
php artisan db:seed --class=PadrePermissionsSeeder
```
