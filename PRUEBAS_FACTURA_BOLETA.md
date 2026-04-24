# Guía de Pruebas - Factura y Boleta Electrónica

## Configuración Inicial

### 1. Subir Certificado Digital
```http
POST /api/v1/guardar/certificado/10706671817
Content-Type: multipart/form-data

certificado: [archivo .pem]
```

---

## Pruebas de Factura

### Factura por Venta de Productos
```json
POST /api/v1/generar/comprobante

{
  "endpoint": "beta",
  "documento": "factura",
  "empresa": {
    "ruc": 10706671817,
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA DEMO SAC",
    "direccion": "AV. LOS HEROES 123",
    "ubigeo": "150101",
    "distrito": "LIMA",
    "provincia": "LIMA",
    "departamento": "LIMA"
  },
  "cliente": {
    "num_doc": 20123456789,
    "rzn_social": "CLIENTE EMPRESA SAC",
    "direccion": "AV. PRINCIPAL 456"
  },
  "serie": "F001",
  "numero": "1",
  "fecha_emision": "2024-04-24",
  "moneda": "PEN",
  "forma_pago": "contado",
  "detalles": [
    {
      "cod_producto": "PROD001",
      "unidad": "NIU",
      "descripcion": "LAPTOP HP CORE I5",
      "cantidad": 2,
      "precio": 1500.00
    },
    {
      "cod_producto": "PROD002",
      "unidad": "NIU",
      "descripcion": "MOUSE INALAMBRICO",
      "cantidad": 5,
      "precio": 50.00
    }
  ]
}
```

### Factura por Servicios
```json
POST /api/v1/generar/comprobante

{
  "endpoint": "beta",
  "documento": "factura",
  "empresa": {
    "ruc": 10706671817,
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA DEMO SAC"
  },
  "cliente": {
    "num_doc": 20987654321,
    "rzn_social": "CLIENTE SERVICIOS SAC"
  },
  "serie": "F001",
  "numero": "2",
  "fecha_emision": "2024-04-24",
  "moneda": "PEN",
  "forma_pago": "contado",
  "detalles": [
    {
      "cod_producto": "SERV001",
      "unidad": "ZZ",
      "descripcion": "SERVICIO DE CONSULTORIA EMPRESARIAL",
      "cantidad": 1,
      "precio": 5000.00
    },
    {
      "cod_producto": "SERV002",
      "unidad": "ZZ",
      "descripcion": "SOPORTE TECNICO MENSUAL",
      "cantidad": 1,
      "precio": 800.00
    }
  ]
}
```

### Factura al Crédito
```json
POST /api/v1/generar/comprobante

{
  "endpoint": "beta",
  "documento": "factura",
  "empresa": {
    "ruc": 10706671817,
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA DEMO SAC"
  },
  "cliente": {
    "num_doc": 20555666777,
    "rzn_social": "CLIENTE CREDITO SAC"
  },
  "serie": "F001",
  "numero": "3",
  "fecha_emision": "2024-04-24",
  "fecha_vencimiento": "2024-06-24",
  "moneda": "PEN",
  "forma_pago": "credito",
  "cuotas_credito": [
    {
      "fecha": "2024-05-24",
      "monto": 1500.00
    },
    {
      "fecha": "2024-06-24",
      "monto": 1500.00
    }
  ],
  "detalles": [
    {
      "cod_producto": "PROD003",
      "unidad": "NIU",
      "descripcion": "IMPRESORA MULTIFUNCIONAL",
      "cantidad": 1,
      "precio": 3000.00
    }
  ]
}
```

---

## Pruebas de Boleta

### Boleta por Venta de Productos
```json
POST /api/v1/generar/comprobante

{
  "endpoint": "beta",
  "documento": "boleta",
  "empresa": {
    "ruc": 10706671817,
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA DEMO SAC"
  },
  "cliente": {
    "num_doc": 12345678,
    "rzn_social": "JUAN PEREZ GOMEZ"
  },
  "serie": "B001",
  "numero": "1",
  "fecha_emision": "2024-04-24",
  "moneda": "PEN",
  "forma_pago": "contado",
  "detalles": [
    {
      "cod_producto": "PROD004",
      "unidad": "NIU",
      "descripcion": "TECLADO MECANICO RGB",
      "cantidad": 1,
      "precio": 250.00
    },
    {
      "cod_producto": "PROD005",
      "unidad": "NIU",
      "descripcion": "AURICULARES GAMER",
      "cantidad": 1,
      "precio": 180.00
    }
  ]
}
```

### Boleta por Servicios
```json
POST /api/v1/generar/comprobante

{
  "endpoint": "beta",
  "documento": "boleta",
  "empresa": {
    "ruc": 10706671817,
    "usuario": "MODDATOS",
    "clave": "moddatos",
    "razon_social": "EMPRESA DEMO SAC"
  },
  "cliente": {
    "num_doc": 87654321,
    "rzn_social": "MARIA LOPEZ TORRES"
  },
  "serie": "B001",
  "numero": "2",
  "fecha_emision": "2024-04-24",
  "moneda": "PEN",
  "forma_pago": "contado",
  "detalles": [
    {
      "cod_producto": "SERV003",
      "unidad": "ZZ",
      "descripcion": "REPARACION DE COMPUTADORA",
      "cantidad": 1,
      "precio": 150.00
    },
    {
      "cod_producto": "SERV004",
      "unidad": "ZZ",
      "descripcion": "INSTALACION DE SOFTWARE",
      "cantidad": 1,
      "precio": 80.00
    }
  ]
}
```

---

## Enviar a SUNAT

Después de generar el comprobante, envíalo a SUNAT:

```json
POST /api/v1/enviar/documento/electronico

{
  "endpoint": "beta",
  "ruc": 10706671817,
  "usuario": "MODDATOS",
  "clave": "moddatos",
  "nombre_documento": "10706671817-01-F001-1",
  "contenido_documento": "[XML generado en el paso anterior]"
}
```

---

## Respuestas Esperadas

### Generación Exitosa
```json
{
  "estado": true,
  "mensaje": "",
  "data": {
    "nombre_archivo": "10706671817-01-F001-1",
    "hash": "JKiSYWMpkaYQndqREIqbRwBhHZQ=",
    "qr_info": "10706671817|01|F001-1|270.00|1770.00|2024-04-24|6|20123456789",
    "contenido_xml": "[XML firmado]"
  }
}
```

### Envío Exitoso a SUNAT
```json
{
  "estado": true,
  "mensaje": "",
  "nombre": "R-10706671817-01-F001-1.zip",
  "cdr": "[CDR en base64]"
}
```

---

## Notas Importantes

- **Serie Factura:** Debe empezar con `F` (ej: F001, F002)
- **Serie Boleta:** Debe empezar con `B` (ej: B001, B002)
- **Unidades de Medida:**
  - `NIU`: Unidad (productos)
  - `ZZ`: Servicio
  - `KGM`: Kilogramo
  - `MTR`: Metro
- **Tipo de Cliente:**
  - DNI: 8 dígitos (personas)
  - RUC: 11 dígitos (empresas)
- **Moneda:**
  - `PEN`: Soles
  - `USD`: Dólares

---

## Credenciales de Prueba SUNAT

```
RUC: 10706671817
Usuario SOL: MODDATOS
Clave SOL: moddatos
Endpoint: beta
```
