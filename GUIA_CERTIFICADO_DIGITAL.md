# Guía: Certificado Digital para Facturación Electrónica SUNAT

## ¿Qué es un Certificado Digital .PEM?

Un certificado digital es un archivo que permite **firmar electrónicamente** los comprobantes de pago (facturas, boletas, notas de crédito) antes de enviarlos a SUNAT.

### Componentes del Certificado .PEM

Dentro de un archivo `.pem` hay **DOS partes importantes**:

```
-----BEGIN PRIVATE KEY-----
[Clave privada RSA]
-----END PRIVATE KEY-----

-----BEGIN CERTIFICATE-----
[Certificado público]
-----END CERTIFICATE-----
```

**🔑 PRIVATE KEY (Clave Privada)**
- Es la que **firma digitalmente** tus comprobantes
- Debe mantenerse **secreta y segura**
- Nunca compartir con terceros

**🔐 CERTIFICATE (Certificado Público)**
- Identifica a tu empresa (RUC) ante SUNAT
- Contiene información de la empresa
- Puede ser compartido públicamente

### ¿Están Juntos o Separados?

**Respuesta:** Ambos componentes están **JUNTOS en el MISMO archivo .pem**

La API de facturación busca ambas partes en un solo archivo, no en archivos separados.

---

## Scripts Disponibles

### 1. Generar Certificado de Prueba

**Archivo:** `generar_certificado_prueba.py`

**Uso:**
```bash
python generar_certificado_prueba.py
```

**Qué hace:**
- Genera un certificado autofirmado de prueba
- Crea un archivo `certificado_20000000001.pem`
- Incluye PRIVATE KEY y CERTIFICATE en el mismo archivo
- Válido por 365 días

**Requisitos:**
```bash
pip install cryptography
```

**Configuración:**
Puedes editar el archivo para cambiar:
- `RUC`: Número de RUC (línea 15)
- `RAZON_SOCIAL`: Nombre de la empresa (línea 16)

**Ejemplo de salida:**
```
============================================================
  GENERADOR DE CERTIFICADO .PEM DE PRUEBA
============================================================

Generando clave privada RSA de 2048 bits...
✓ Clave privada generada

Generando certificado autofirmado...
✓ Certificado generado

============================================================
✓ CERTIFICADO GENERADO EXITOSAMENTE
============================================================

Archivo: certificado_20000000001.pem
RUC: 20000000001
Razón Social: EMPRESA DE PRUEBA SAC
```

---

### 2. Verificar Certificado

**Archivo:** `verificar_certificado.py`

**Uso:**
```bash
python verificar_certificado.py certificado_20000000001.pem
```

**Qué hace:**
- Verifica que el archivo contenga PRIVATE KEY y CERTIFICATE
- Valida que la clave privada sea correcta
- Verifica que el certificado sea válido
- Muestra información del certificado (RUC, fechas de validez, etc.)
- Confirma compatibilidad con API SUNAT

**Ejemplo de salida:**
```
============================================================
  VERIFICADOR DE CERTIFICADO .PEM
============================================================

Archivo: certificado_20000000001.pem
Tamaño: 2956 bytes

1. ESTRUCTURA DEL ARCHIVO:
   ✓ Contiene PRIVATE KEY
   ✓ Contiene CERTIFICATE

2. VALIDACIÓN DE CLAVE PRIVADA:
   ✓ Clave privada válida
   Tipo: RSA
   Bits: 2048

3. VALIDACIÓN DE CERTIFICADO:
   ✓ Certificado válido

   INFORMACIÓN DEL CERTIFICADO:
   --------------------------------------------------
   Subject:
     - countryName: PE
     - stateOrProvinceName: LIMA
     - localityName: LIMA
     - organizationName: EMPRESA DE PRUEBA SAC
     - organizationalUnitName: TI
     - commonName: 20000000001

   Validez:
     - Válido desde: 2026-04-24 05:19:54+00:00
     - Válido hasta: 2027-04-24 05:19:54+00:00
     ✓ El certificado está VIGENTE (364 días restantes)

   Serial Number: 260127355406592470159477986118161709276995521258

============================================================
4. COMPATIBILIDAD CON API SUNAT:
============================================================
✓ El certificado es compatible con la API de facturación
✓ Puede ser usado para firmar comprobantes electrónicos

RUC detectado: 20000000001
```

---

## Uso con la API de Facturación

### Subir Certificado a la API

El certificado se sube **una sola vez** a la API de Magus Technologies:

**Endpoint:**
```
POST https://magustechnologies.com/apisunat/api/guardar/certificado/{ruc}
```

**Parámetros:**
- `{ruc}`: RUC de la empresa (en la URL)
- `certificado`: Archivo .pem (multipart/form-data)

**Ejemplo en PHP:**
```php
$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 
    "https://magustechnologies.com/apisunat/api/guardar/certificado/{$ruc}", 
    [
        'multipart' => [
            [
                'name' => 'certificado',
                'contents' => fopen($certificadoPath, 'r'),
                'filename' => 'certificado.pem'
            ]
        ]
    ]
);
```

### Proceso de Firma Digital

```
1. Sistema genera XML del comprobante
   ↓
2. Envía XML + credenciales a API Magus
   ↓
3. API Magus recupera el certificado .pem del RUC
   ↓
4. API usa PRIVATE KEY para firmar el XML
   ↓
5. API genera hash SHA-256 del documento
   ↓
6. API envía XML firmado a SUNAT
   ↓
7. SUNAT valida la firma con el CERTIFICATE
   ↓
8. SUNAT retorna CDR (Constancia de Recepción)
```

---

## Ambientes de Prueba vs Producción

### Ambiente BETA (Pruebas)

**Características:**
- Usa servidores de prueba de SUNAT
- No tiene validez legal
- Permite probar sin afectar producción
- Puedes usar certificados autofirmados (como el generado por el script)

**Configuración:**
```json
{
  "endpoint": "beta"
}
```

### Ambiente PRODUCTION

**Características:**
- Usa servidores productivos de SUNAT
- Genera comprobantes con validez legal
- **Requiere certificado real** de entidad certificadora autorizada

**Configuración:**
```json
{
  "endpoint": "production"
}
```

**Entidades Certificadoras Autorizadas en Perú:**
- eCert Perú
- Certicámara
- PSE (Perú Soluciones Electrónicas)
- Otros autorizados por SUNAT

---

## Almacenamiento del Certificado

### En el Sistema

**Ubicación recomendada:**
```
storage/certificados/certificado_{ruc}.pem
```

**Permisos:**
- Solo lectura para la aplicación
- No accesible desde web público
- Fuera del directorio `public/`

### En la Base de Datos

**Campos necesarios en tabla `institucion_educativa`:**

```sql
ALTER TABLE institucion_educativa ADD COLUMN insti_certificado_path VARCHAR(255) NULL;
ALTER TABLE institucion_educativa ADD COLUMN insti_certificado_enviado BOOLEAN DEFAULT FALSE;
```

**Ejemplo de registro:**
```php
$institucion->insti_ruc = '20000000001';
$institucion->insti_certificado_path = 'certificados/certificado_20000000001.pem';
$institucion->insti_certificado_enviado = false; // true después de subirlo a la API
```

---

## Seguridad

### ⚠️ Importante

1. **Nunca** subir el certificado .pem a repositorios públicos (Git, GitHub, etc.)
2. **Nunca** compartir la clave privada
3. **Siempre** almacenar fuera del directorio público
4. **Encriptar** la ruta en base de datos si es posible
5. **Renovar** el certificado antes de que expire

### Agregar al .gitignore

```
# Certificados digitales
storage/certificados/*.pem
certificado_*.pem
```

---

## Solución de Problemas

### Error: "Hash vacío en respuesta"

**Causa:** Certificado inválido, expirado o no corresponde al RUC

**Solución:**
1. Verificar el certificado con `verificar_certificado.py`
2. Confirmar que el RUC en el certificado coincida con el de la empresa
3. Verificar fecha de expiración
4. Regenerar y reenviar el certificado

### Error: "Certificado no encontrado"

**Causa:** El archivo no existe en la ruta especificada

**Solución:**
1. Verificar que el archivo existe en `storage/certificados/`
2. Verificar permisos de lectura
3. Confirmar que la ruta en base de datos es correcta

### Error: "El archivo no es un certificado PEM válido"

**Causa:** El archivo no contiene las secciones BEGIN/END correctas

**Solución:**
1. Verificar con `verificar_certificado.py`
2. Asegurar que el archivo contiene ambas partes (PRIVATE KEY y CERTIFICATE)
3. Verificar que no esté corrupto o truncado

---

## Resumen

✅ El certificado .pem contiene **PRIVATE KEY y CERTIFICATE juntos**  
✅ Se sube **una sola vez** a la API de Magus Technologies  
✅ La API lo usa para **firmar todos los comprobantes** del RUC  
✅ Para pruebas: usar certificado autofirmado (script incluido)  
✅ Para producción: obtener certificado de entidad certificadora autorizada  
✅ Almacenar de forma **segura** fuera del directorio público  

---

## Archivos Incluidos

| Archivo | Descripción |
|---------|-------------|
| `generar_certificado_prueba.py` | Genera certificado de prueba |
| `verificar_certificado.py` | Verifica certificados existentes |
| `certificado_20000000001.pem` | Certificado de ejemplo generado |
| `GUIA_CERTIFICADO_DIGITAL.md` | Esta guía |

---

**Última actualización:** 2026-04-24
