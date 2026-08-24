# Servicio de WhatsApp (Baileys)

Microservicio Node que envía los avisos de asistencia a los apoderados.
Laravel nunca habla con WhatsApp directamente: le pasa el mensaje a este
servicio por HTTP en `127.0.0.1`.

## Cómo funciona

```
Alumno marca (QR o DNI)
  → AsistenciaService guarda la asistencia y responde al instante
  → encola NotificarAsistenciaPadres
  → el worker busca los teléfonos de los apoderados
  → POST a este servicio
  → cola interna: 1 mensaje cada 4 segundos
```

El delay entre mensajes es deliberado. Baileys usa la API no oficial de
WhatsApp, y enviar en ráfaga es lo que dispara los bloqueos de número.

## Instalación en el servidor

```bash
cd /var/www/bautista/whatsapp-service
npm install --omit=dev
cp .env.example .env      # define WHATSAPP_TOKEN
```

Instala el daemon para que arranque solo y se reinicie si se cae:

```bash
cp bautista-whatsapp.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bautista-whatsapp
```

Verifica:

```bash
systemctl status bautista-whatsapp
curl -s http://127.0.0.1:3333/estado
```

## Vincular el teléfono

El cliente **no necesita entrar al servidor**. Todo se hace desde el panel:

**Configuración → WhatsApp** (`/seguridad/whatsapp`)

Ahí aparece el QR, que se escanea desde el celular del colegio en
*WhatsApp → Dispositivos vinculados*. La sesión queda guardada en
`auth_info/` y sobrevive a los reinicios; solo hay que repetirlo si alguien
cierra la sesión desde el teléfono.

El botón **Desvincular** de esa misma pantalla permite cambiar de número
sin tocar la consola.

## El worker de Laravel

Sin worker los avisos se encolan y nunca salen. Y como el marcado de
asistencia responde igual, el fallo pasa desapercibido: hay que instalarlo
como daemon, no dejarlo a mano.

```bash
cp bautista-queue.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bautista-queue
```

## Cuidado con el PHP del servidor

En este servidor `php` es 8.2 pero el proyecto exige 8.3. Usa siempre
`php83` para artisan, y para compilar el frontend hay que forzar el PATH,
porque Vite invoca `php artisan wayfinder:generate` por dentro:

```bash
mkdir -p /tmp/phpbin && ln -sf /usr/bin/php83 /tmp/phpbin/php
PATH=/tmp/phpbin:$PATH npm run build
```

## Después de cada despliegue

Los dos daemons guardan el código viejo en memoria. Reinícialos siempre:

```bash
php artisan migrate --force
npm run build
php artisan optimize:clear
systemctl restart bautista-whatsapp bautista-queue
```

## Endpoints

| Método | Ruta | Uso |
|---|---|---|
| GET | `/estado` | Estado de conexión, QR y tamaño de la cola. Sin token |
| POST | `/enviar` | `{telefono, mensaje}`. Requiere `X-Token` |
| POST | `/desvincular` | Cierra sesión y fuerza un QR nuevo. Requiere `X-Token` |

## Variables

| Variable | Descripción |
|---|---|
| `WHATSAPP_PORT` | Puerto local (3333) |
| `WHATSAPP_TOKEN` | Debe coincidir con el `WHATSAPP_TOKEN` de Laravel |
| `WHATSAPP_DELAY_MS` | Pausa entre mensajes (4000). No lo bajes |

## Si deja de enviar

1. `systemctl status bautista-whatsapp` — ¿está corriendo?
2. `/seguridad/whatsapp` — ¿dice "Conectado"?
3. `tail -f /var/log/bautista-whatsapp.log` — `[ok]` o `[error]` por mensaje
4. `php artisan queue:failed` — jobs que fallaron

Si el estado quedó en "Desconectado" y no vuelve solo, lo más probable es
que hayan cerrado la sesión desde el teléfono: hay que escanear otra vez
desde el panel.
