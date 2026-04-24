# Documentación: Consumo de API de Facturación Electrónica

## Descripción General

El sistema utiliza la API de **Magus Technologies** para la generación y envío de comprobantes electrónicos a SUNAT (Perú). La API se consume mediante eventos de Laravel que disparan listeners específicos para cada tipo de documento.

## URL Base de la API

```
https://magustechnologies.com/apisunat/api/
```

## Endpoints Utilizados

### 1. Guardar Certificado Digital
**Endpoint:** `POST /guardar/certificado/{ruc}`

**Descripción:** Sube el certificado digital (.pem) de la empresa a la API de SUNAT.

**Listener:** `SubirCertificadoPem.php`

**Parámetros:**
- `{ruc}`: RUC de la empresa (en la URL)
- **Multipart Form Data:**
  - `certificado`: Archivo .pem del certificado digital

**Validaciones:**
- El certificado debe contener `-----BEGIN` y `-----END`
- El archivo debe existir en `storage/certificados/`
- El certificado debe corresponder al RUC de la empresa

**Respuesta Esperada:**
```json
{
  "estado": true,
  "data": { ... }
}
```

---

### 2. Generar Comprobante Electrónico (Boleta/Factura)
**Endpoint:** `POST /generar/comprobante/electronico`

**Descripción:** Genera el XML de una boleta o factura electrónica.

**Listener:** `CrearXmlBoletaFactura.php`

**Evento Disparador:** `VentaValidada`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "documento": "boleta|factura",
  "empresa": {
    "ruc": "20123456789",
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA SAC",
    "direccion": "AV. EJEMPLO 123",
    "ubigeo": "150101",
    "distrito": "LIMA",
    "provincia": "LIMA",
    "departamento": "LIMA"
  },
  "total": 100.00,
  "moneda": "PEN|USD",
  "serie": "B001|F001",
  "numero": "1",
  "fecha_emision": "2024-01-15",
  "fecha_vencimiento": "2024-01-15",
  "forma_pago": "contado",
  "cliente": {
    "num_doc": "12345678",
    "rzn_social": "CLIENTE EJEMPLO",
    "direccion": "DIRECCION CLIENTE"
  },
  "detalles": [
    {
      "cod_producto": "1",
      "cod_sunat": "",
      "unidad": "NIU",
      "descripcion": "PRODUCTO EJEMPLO",
      "cantidad": 1,
      "precio": 100.00
    }
  ]
}
```

**Validaciones Importantes:**
- RUC debe ser numérico de 11 dígitos
- DNI del cliente debe ser de 8 dígitos (personas) o 11 (empresas)
- Total mínimo: 0.10 PEN o 0.03 USD
- Certificado digital debe estar previamente subido
- Facturas solo para clientes tipo empresa
- Boletas para personas con DNI de 8 dígitos

**Respuesta Esperada:**
```json
{
  "estado": true,
  "data": {
    "nombre_archivo": "20123456789-01-B001-1",
    "contenido_xml": "<?xml version='1.0' encoding='utf-8'?>...",
    "hash": "abc123...",
    "qr_info": "20123456789|01|B001|1|..."
  }
}
```

---

### 3. Enviar Documento Electrónico (Boleta/Factura/Nota de Crédito)
**Endpoint:** `POST /enviar/documento/electronico`

**Descripción:** Envía el XML generado a SUNAT para su validación y obtiene el CDR.

**Listeners:** 
- `EmitirBoletaFactura.php`
- `EmitirNotaCredito.php`

**Eventos Disparadores:**
- `VentaRealizada`
- `NotaRealizado`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "ruc": 20123456789,
  "usuario": "MODDATOS",
  "clave": "moddatos",
  "nombre_documento": "20123456789-01-B001-1",
  "contenido_documento": "<?xml version='1.0' encoding='utf-8'?>..."
}
```

**Respuesta Esperada:**
```json
{
  "estado": true,
  "cdr": "base64_encoded_zip_file",
  "nombre": "R-20123456789-01-B001-1.zip"
}
```

**Procesamiento:**
- El CDR se decodifica de base64
- Se convierte de UTF-8 a ISO-8859-1
- Se guarda en `storage/public/cdr/`

---

### 4. Generar Nota de Crédito
**Endpoint:** `POST /generar/nota/electronica`

**Descripción:** Genera el XML de una nota de crédito electrónica.

**Listener:** `CrearXmlNotaCredito.php`

**Evento Disparador:** `NotaValidado`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "documento": "credito",
  "serie": "BC01|FC01",
  "numero": "1",
  "fecha_emision": "2024-01-15",
  "doc_afectado": "boleta|factura",
  "serie_numero_afectado": "B001-1",
  "cod_motivo": "07",
  "des_motivo": "DEVOLUCION POR ITEM",
  "moneda": "PEN|USD",
  "total": 100.00,
  "empresa": { ... },
  "cliente": { ... },
  "detalles": [ ... ]
}
```

**Códigos de Motivo:**
- `07`: Devolución por ítem

---

### 5. Generar Guía de Remisión
**Endpoint:** `POST /generar/guia/remision`

**Descripción:** Genera el XML de una guía de remisión electrónica.

**Listener:** `CrearXmlGuiaRemision.php`

**Evento Disparador:** `GuiaValidado`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "documento": "remitente",
  "serie": "TG01",
  "numero": "1",
  "fecha_emision": "2024-01-15",
  "serie_numero_relacionado": "B001-1",
  "empresa": { ... },
  "cliente": { ... },
  "datos_envio": {
    "unidad_medida": "KGM",
    "peso_total": 10.5,
    "cod_traslado": "01",
    "mod_traslado": "01|02",
    "fecha_traslado": "2024-01-15",
    "ubigeo_llegada": "150101",
    "ubigeo_salida": "150101",
    "direccion_llegada": "AV. DESTINO 123",
    "direccion_salida": "AV. ORIGEN 456"
  },
  "transportista": {
    "num_doc": 12345678,
    "rzn_social": "TRANSPORTISTA SAC",
    "nro_mtc": "MTC123456"
  },
  "detalles": [ ... ]
}
```

**Modalidades de Traslado:**
- `01`: Transporte público
- `02`: Transporte privado

---

### 6. Enviar Guía de Remisión
**Endpoint:** `POST /enviar/guia/remision`

**Descripción:** Envía la guía de remisión a SUNAT y obtiene un ticket para consulta posterior.

**Listener:** `EmitirGuiaRemision.php`

**Evento Disparador:** `GuiaRealizado`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "ruc": 20123456789,
  "usuario": "MODDATOS",
  "clave": "moddatos",
  "client_id": "client_id_oauth",
  "secret_client": "secret_oauth",
  "nombre_documento": "20123456789-09-TG01-1",
  "contenido_documento": "<?xml version='1.0' encoding='utf-8'?>..."
}
```

**Respuesta Esperada:**
```json
{
  "estado": true,
  "ticker": "1234567890"
}
```

---

### 7. Consultar Documento por Ticket
**Endpoint:** `POST /consulta/documento/ticker/{ticket}`

**Descripción:** Consulta el estado de una guía de remisión usando el ticket obtenido.

**Listener:** `VerificarGuiaRemision.php`

**Evento Disparador:** `GuiaEmitida`

**Payload:**
```json
{
  "endpoint": "beta|production",
  "ruc": 20123456789,
  "usuario": "MODDATOS",
  "clave": "moddatos",
  "client_id": "client_id_oauth",
  "secret_client": "secret_oauth",
  "ticket": "1234567890"
}
```

**Respuesta Esperada:**
```json
{
  "estado": true,
  "cdr": "base64_encoded_zip_file"
}
```

---

## Flujo de Eventos

### Flujo de Boleta/Factura
```
1. Usuario crea venta
2. Se dispara evento: VentaValidada
3. Listener: CrearXmlBoletaFactura
   - Valida datos
   - Verifica certificado (si no está enviado, lo sube)
   - Genera XML
4. Se dispara evento: VentaRealizada
5. Listener: EmitirBoletaFactura
   - Envía XML a SUNAT
   - Obtiene CDR
   - Guarda CDR en storage
```

### Flujo de Nota de Crédito
```
1. Usuario crea nota de crédito
2. Se dispara evento: NotaValidado
3. Listener: CrearXmlNotaCredito
   - Genera XML de nota de crédito
4. Se dispara evento: NotaRealizado
5. Listener: EmitirNotaCredito
   - Envía XML a SUNAT
   - Obtiene CDR
```

### Flujo de Guía de Remisión
```
1. Usuario crea guía de remisión
2. Se dispara evento: GuiaValidado
3. Listener: CrearXmlGuiaRemision
   - Genera XML de guía
4. Se dispara evento: GuiaRealizado
5. Listener: EmitirGuiaRemision
   - Envía XML a SUNAT
   - Obtiene ticket
6. Se dispara evento: GuiaEmitida
7. Listener: VerificarGuiaRemision
   - Consulta con ticket
   - Obtiene CDR
```

---

## Configuración de Entorno

### Variables de Entorno
```env
APP_ENV=production|local
# Determina si se usa endpoint 'production' o 'beta'
```

### Datos de Empresa (Base de Datos)
Cada empresa debe tener configurado:
- `ruc`: RUC de 11 dígitos
- `usuario`: Usuario SOL SUNAT
- `clave`: Clave SOL SUNAT
- `certificado`: Ruta al archivo .pem
- `certificado_enviado`: Boolean (indica si ya se subió)
- `client_id`: Client ID OAuth (para guías)
- `secret_client`: Secret OAuth (para guías)
- Series y numeración para cada tipo de documento

---

## Credenciales y Firma Digital

### 1. Credenciales SUNAT (Usuario SOL)

Las credenciales SOL son proporcionadas por SUNAT y se usan para autenticar cada petición:

**Componentes:**
- **RUC:** Registro Único de Contribuyentes (11 dígitos)
- **Usuario SOL:** Usuario del sistema SOL SUNAT (ej: "MODDATOS")
- **Clave SOL:** Contraseña del sistema SOL

**Uso en la API:**
Estas credenciales se envían en **cada petición** dentro del objeto `empresa`:

```json
{
  "empresa": {
    "ruc": 20123456789,
    "usuario": "MODDATOS",
    "clave": "moddatos"
  }
}
```

**Validación en el Sistema:**
```php
// Validar credenciales SUNAT
if (!$company->ruc || !$company->usuario || !$company->clave) {
    throw new \Exception('Credenciales SUNAT incompletas: RUC, usuario y clave son requeridos');
}

if (!is_numeric($company->ruc) || strlen($company->ruc) != 11) {
    throw new \Exception('RUC inválido: debe ser numérico de 11 dígitos');
}
```

**¿Cómo las usa la API de Magus?**
La API de Magus Technologies actúa como intermediario:
1. Recibe las credenciales en el payload
2. Las usa para autenticarse contra los servicios web de SUNAT
3. Firma digitalmente el documento usando el certificado
4. Envía el documento firmado a SUNAT
5. Retorna la respuesta de SUNAT al cliente

---

### 2. Certificado Digital (.pem)

El certificado digital es **obligatorio** para firmar electrónicamente los comprobantes.

**¿Qué es el certificado .pem?**
- Es un archivo que contiene la clave privada y el certificado público
- Debe ser emitido por una entidad certificadora autorizada por SUNAT
- Debe corresponder al RUC de la empresa
- Tiene fecha de expiración (generalmente 1-2 años)

**Formato del archivo .pem:**
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...
-----END PRIVATE KEY-----
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKZ5Z5Z5Z5Z5MA0GCSqGSIb3DQEBBQUA...
-----END CERTIFICATE-----
```

**Proceso de Subida del Certificado:**

1. **Primera vez:** El certificado se sube automáticamente antes de emitir el primer comprobante
2. **Almacenamiento:** Se guarda en `storage/certificados/`
3. **Envío a API:** Se envía como multipart/form-data

```php
// Verificar si el certificado ya fue enviado
if (!$company->certificado_enviado) {
    if (!$company->certificado) {
        throw new \Exception('Certificado digital no configurado');
    }
    
    // Disparar evento para subir certificado
    CertificadoPemSubido::dispatch($company);
}
```

**Validaciones del Certificado:**
```php
// 1. Verificar que existe
if (!Storage::exists($certificadoPath)) {
    throw new \Exception('Archivo de certificado no encontrado');
}

// 2. Verificar contenido
$certificadoContent = Storage::get($certificadoPath);
if (empty($certificadoContent)) {
    throw new \Exception('Certificado vacío o ilegible');
}

// 3. Validar formato PEM
if (!str_contains($certificadoContent, '-----BEGIN') || 
    !str_contains($certificadoContent, '-----END')) {
    throw new \Exception('El archivo no es un certificado PEM válido');
}
```

**Endpoint de Subida:**
```http
POST https://magustechnologies.com/apisunat/api/guardar/certificado/{ruc}
Content-Type: multipart/form-data

certificado: [archivo .pem]
```

**¿Cómo la API usa el certificado?**
1. La API de Magus **almacena** el certificado asociado al RUC
2. Cuando se genera un comprobante, la API:
   - Genera el XML del documento
   - **Firma digitalmente** el XML usando el certificado .pem
   - Calcula el **hash** del documento firmado
   - Genera el **código QR** con los datos del comprobante
3. El XML firmado se envía a SUNAT para validación

**Respuesta de SUNAT incluye:**
```json
{
  "hash": "abc123def456...",  // Hash del documento firmado
  "qr_info": "20123456789|01|B001|1|100.00|...",  // Info para QR
  "contenido_xml": "<?xml version='1.0'?>..."  // XML firmado
}
```

---

### 3. Credenciales OAuth (Solo para Guías de Remisión)

Las guías de remisión requieren credenciales OAuth adicionales:

**Componentes:**
- **client_id:** ID de cliente OAuth proporcionado por SUNAT
- **secret_client:** Secret OAuth proporcionado por SUNAT

**Uso:**
```json
{
  "ruc": 20123456789,
  "usuario": "MODDATOS",
  "clave": "moddatos",
  "client_id": "client_id_oauth",
  "secret_client": "secret_oauth"
}
```

**¿Por qué solo para guías?**
Las guías de remisión usan un sistema de envío asíncrono:
1. Se envía el documento y se obtiene un **ticket**
2. Se consulta posteriormente con el ticket para obtener el CDR
3. Este proceso requiere autenticación OAuth con SUNAT

---

### 4. Flujo Completo de Firma Digital

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SISTEMA 7POWER                                           │
│    - Valida datos del comprobante                           │
│    - Verifica que certificado esté subido                   │
│    - Prepara payload con credenciales                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. API MAGUS TECHNOLOGIES                                   │
│    - Recibe credenciales SOL (ruc, usuario, clave)          │
│    - Recupera certificado .pem asociado al RUC              │
│    - Genera XML UBL 2.1 según estándar SUNAT               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. PROCESO DE FIRMA DIGITAL (en API Magus)                 │
│    - Lee clave privada del certificado .pem                 │
│    - Calcula hash SHA-256 del documento                     │
│    - Firma el hash con la clave privada (RSA)              │
│    - Inserta firma digital en el XML (tag <Signature>)      │
│    - Genera código QR con datos del comprobante             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ENVÍO A SUNAT (desde API Magus)                         │
│    - Autentica con credenciales SOL                         │
│    - Envía XML firmado a web service SUNAT                  │
│    - SUNAT valida:                                          │
│      * Credenciales SOL                                     │
│      * Firma digital con certificado                        │
│      * Estructura del XML                                   │
│      * Datos del comprobante                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. RESPUESTA DE SUNAT                                       │
│    - CDR (Constancia de Recepción) si es aceptado          │
│    - Código de respuesta                                    │
│    - Observaciones o errores                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. RETORNO A 7POWER                                         │
│    - XML firmado con hash                                   │
│    - CDR de SUNAT                                           │
│    - Información del QR                                     │
│    - Sistema guarda archivos en storage                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 5. Seguridad y Buenas Prácticas

**Almacenamiento de Credenciales:**
- Las credenciales se guardan **encriptadas** en la base de datos
- El certificado .pem se almacena en `storage/certificados/` (fuera de public)
- Nunca se exponen en logs o respuestas de API

**Validación de Certificado:**
```php
// El sistema valida que el certificado corresponda al RUC
if ($certificadoRUC !== $company->ruc) {
    throw new \Exception('Certificado no corresponde al RUC');
}
```

**Manejo de Errores de Firma:**
```php
// Si el hash viene vacío, indica problema con el certificado
if (!isset($resData['hash']) || empty($resData['hash'])) {
    // Resetear flag para forzar reenvío del certificado
    $company->certificado_enviado = false;
    $company->save();
    
    throw new \Exception('Hash vacío - Certificado inválido o expirado');
}
```

**Renovación de Certificado:**
1. Cuando el certificado expira, se debe subir uno nuevo
2. El sistema detecta automáticamente si necesita reenviar el certificado
3. Se actualiza el flag `certificado_enviado` a `false` en caso de error

---

### 6. Diferencias entre Ambientes

**Ambiente BETA (Pruebas):**
```json
{
  "endpoint": "beta"
}
```
- Usa servidores de prueba de SUNAT
- No tiene validez legal
- Permite probar sin afectar producción
- Requiere credenciales SOL de prueba

**Ambiente PRODUCTION:**
```json
{
  "endpoint": "production"
}
```
- Usa servidores productivos de SUNAT
- Genera comprobantes con validez legal
- Requiere credenciales SOL reales
- Certificado debe ser válido y vigente

**Determinación del Ambiente:**
```php
"endpoint" => env('APP_ENV', 'local') === 'production' ? 'production' : 'beta'
```

---

## Manejo de Errores

### Errores Comunes

**1. Hash vacío en respuesta**
- **Causa:** Certificado inválido, expirado o no corresponde al RUC
- **Solución:** Verificar certificado digital en configuración

**2. XML incompleto**
- **Causa:** Total muy bajo, credenciales incorrectas, datos incompletos
- **Solución:** Validar montos mínimos y credenciales SUNAT

**3. Error al parsear JSON**
- **Causa:** Respuesta con caracteres extra (BOM, debug output)
- **Solución:** El sistema limpia automáticamente caracteres basura

### Reintentos
- El sistema implementa hasta 2 reintentos automáticos
- Timeout de 60 segundos para generación de XML
- Timeout de 30 segundos para envío de documentos

---

## Función Helper

### `limpiarTextoSunat($texto)`
Limpia y normaliza texto para envío a SUNAT:
- Elimina caracteres especiales
- Normaliza espacios
- Convierte a mayúsculas
- Remueve acentos

**Ubicación:** `app/Helpers/Helpers.php`

---

## Almacenamiento de Archivos

### Estructura de Directorios
```
storage/
├── certificados/          # Certificados .pem
└── public/
    ├── xml/              # XMLs generados
    └── cdr/              # CDRs recibidos de SUNAT
```

---

## Notas Importantes

1. **Certificado Digital:** Debe subirse antes de emitir el primer comprobante
2. **Ambiente:** Se determina por `APP_ENV` (production/local)
3. **Validaciones:** El sistema valida extensivamente antes de enviar a SUNAT
4. **Logs:** Todos los procesos generan logs detallados en `storage/logs/`
5. **Encoding:** Los CDRs se convierten de UTF-8 a ISO-8859-1
6. **Timeout:** Configurado para manejar respuestas lentas de SUNAT
7. **Limpieza de Respuestas:** Se eliminan caracteres BOM y basura del JSON

---

## Cliente HTTP

**Librería:** GuzzleHttp Client

**Configuración:**
```php
$fetch = new \GuzzleHttp\Client();
$response = $fetch->request('POST', $url, [
    'json' => $data,
    'verify' => false,  // Desactiva verificación SSL
    'timeout' => 60,    // Timeout en segundos
    'connect_timeout' => 30
]);
```
