#!/usr/bin/env python3
"""
Script para generar un certificado .pem de prueba
Similar al que proporciona SUNAT para ambiente BETA

NOTA: Este certificado es SOLO para pruebas en ambiente BETA
Para producción debes obtener un certificado real de una entidad certificadora autorizada
"""

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta
import sys

# Configuración del certificado
RUC = "20000000001"  # Cambia por tu RUC de prueba
RAZON_SOCIAL = "EMPRESA DE PRUEBA SAC"

print("=" * 60)
print("  GENERADOR DE CERTIFICADO .PEM DE PRUEBA")
print("=" * 60)
print()

try:
    print("Generando clave privada RSA de 2048 bits...")
    
    # Generar clave privada
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    
    print("✓ Clave privada generada")
    print()
    
    print("Generando certificado autofirmado...")
    
    # Crear el subject del certificado
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "PE"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "LIMA"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "LIMA"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, RAZON_SOCIAL),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, "TI"),
        x509.NameAttribute(NameOID.COMMON_NAME, RUC),
    ])
    
    # Crear el certificado
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.utcnow()
    ).not_valid_after(
        datetime.utcnow() + timedelta(days=365)
    ).add_extension(
        x509.SubjectAlternativeName([
            x509.DNSName("localhost"),
        ]),
        critical=False,
    ).sign(private_key, hashes.SHA256())
    
    print("✓ Certificado generado")
    print()
    
    # Serializar la clave privada
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Serializar el certificado
    cert_pem = cert.public_bytes(serialization.Encoding.PEM)
    
    # Combinar en un solo archivo .pem
    pem_content = private_key_pem + cert_pem
    
    # Nombre del archivo
    filename = f"certificado_{RUC}.pem"
    
    # Guardar archivo
    with open(filename, 'wb') as f:
        f.write(pem_content)
    
    print("=" * 60)
    print("✓ CERTIFICADO GENERADO EXITOSAMENTE")
    print("=" * 60)
    print()
    print(f"Archivo: {filename}")
    print(f"RUC: {RUC}")
    print(f"Razón Social: {RAZON_SOCIAL}")
    print()
    
    print("Contenido del archivo:")
    print("-" * 60)
    print(pem_content.decode('utf-8'))
    print("-" * 60)
    print()
    
    print("IMPORTANTE:")
    print("- Este certificado es SOLO para pruebas en ambiente BETA")
    print("- NO usar en producción")
    print("- Para producción, obtén un certificado de una entidad")
    print("  certificadora autorizada por SUNAT")
    print()
    
    print("Verificando certificado...")
    print(f"✓ Válido desde: {cert.not_valid_before_utc}")
    print(f"✓ Válido hasta: {cert.not_valid_after_utc}")
    print(f"✓ Serial Number: {cert.serial_number}")
    print()
    
    print("Proceso completado.")
    print("Puedes usar este archivo para pruebas con la API de Magus")
    print("Technologies en ambiente BETA.")
    
except ImportError:
    print()
    print("❌ Error: La librería 'cryptography' no está instalada")
    print()
    print("Para instalarla, ejecuta:")
    print("  pip install cryptography")
    print()
    sys.exit(1)
    
except Exception as e:
    print()
    print(f"❌ Error: {str(e)}")
    print()
    sys.exit(1)
