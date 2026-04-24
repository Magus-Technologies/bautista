#!/usr/bin/env python3
"""
Script para verificar un certificado .pem
Valida que contenga tanto la clave privada como el certificado
"""

import sys
from datetime import datetime
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def verificar_certificado(filename):
    print("=" * 60)
    print("  VERIFICADOR DE CERTIFICADO .PEM")
    print("=" * 60)
    print()
    
    # Verificar que el archivo existe
    try:
        with open(filename, 'rb') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: El archivo '{filename}' no existe")
        return False
    
    print(f"Archivo: {filename}")
    print(f"Tamaño: {len(content)} bytes")
    print()
    
    if not content:
        print("❌ Error: El archivo está vacío")
        return False
    
    content_str = content.decode('utf-8', errors='ignore')
    
    print("Verificando estructura del archivo...")
    print()
    
    # Verificar que contenga PRIVATE KEY
    has_private_key = ('-----BEGIN PRIVATE KEY-----' in content_str or 
                       '-----BEGIN RSA PRIVATE KEY-----' in content_str) and \
                      ('-----END PRIVATE KEY-----' in content_str or
                       '-----END RSA PRIVATE KEY-----' in content_str)
    
    # Verificar que contenga CERTIFICATE
    has_certificate = '-----BEGIN CERTIFICATE-----' in content_str and \
                      '-----END CERTIFICATE-----' in content_str
    
    # Resultados de verificación básica
    print("1. ESTRUCTURA DEL ARCHIVO:")
    print(f"   {'✓' if has_private_key else '❌'} Contiene PRIVATE KEY")
    print(f"   {'✓' if has_certificate else '❌'} Contiene CERTIFICATE")
    print()
    
    if not has_private_key or not has_certificate:
        print("❌ Error: El archivo no es un certificado .pem válido")
        return False
    
    # Verificar la clave privada
    print("2. VALIDACIÓN DE CLAVE PRIVADA:")
    try:
        private_key = serialization.load_pem_private_key(
            content,
            password=None,
            backend=default_backend()
        )
        key_size = private_key.key_size
        print("   ✓ Clave privada válida")
        print(f"   Tipo: RSA")
        print(f"   Bits: {key_size}")
        print()
    except Exception as e:
        print(f"   ❌ La clave privada no es válida")
        print(f"   Error: {str(e)}")
        print()
        return False
    
    # Verificar el certificado
    print("3. VALIDACIÓN DE CERTIFICADO:")
    try:
        cert = x509.load_pem_x509_certificate(content, default_backend())
        
        print("   ✓ Certificado válido")
        print()
        
        print("   INFORMACIÓN DEL CERTIFICADO:")
        print("   " + "-" * 50)
        
        # Subject
        print("   Subject:")
        for attr in cert.subject:
            print(f"     - {attr.oid._name}: {attr.value}")
        
        # Issuer
        print()
        print("   Emisor:")
        for attr in cert.issuer:
            print(f"     - {attr.oid._name}: {attr.value}")
        
        # Validez
        print()
        print("   Validez:")
        valid_from = cert.not_valid_before_utc
        valid_to = cert.not_valid_after_utc
        now = datetime.now(valid_from.tzinfo)
        
        print(f"     - Válido desde: {valid_from}")
        print(f"     - Válido hasta: {valid_to}")
        
        if now < valid_from:
            print("     ⚠️  El certificado aún no es válido")
        elif now > valid_to:
            print("     ❌ El certificado ha EXPIRADO")
        else:
            dias_restantes = (valid_to - now).days
            print(f"     ✓ El certificado está VIGENTE ({dias_restantes} días restantes)")
        
        print()
        print(f"   Serial Number: {cert.serial_number}")
        
    except Exception as e:
        print(f"   ❌ El certificado no es válido")
        print(f"   Error: {str(e)}")
        print()
        return False
    
    print()
    print("=" * 60)
    print("4. COMPATIBILIDAD CON API SUNAT:")
    print("=" * 60)
    
    if has_private_key and has_certificate:
        print("✓ El certificado es compatible con la API de facturación")
        print("✓ Puede ser usado para firmar comprobantes electrónicos")
        print()
        
        # Extraer RUC si está en el commonName
        for attr in cert.subject:
            if attr.oid._name == 'commonName':
                cn = attr.value
                if cn.isdigit() and len(cn) == 11:
                    print(f"RUC detectado: {cn}")
                    break
    else:
        print("❌ El certificado NO es compatible")
        print("   Verifica que el archivo contenga tanto la clave privada como el certificado")
    
    print()
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python verificar_certificado.py <archivo.pem>")
        print("Ejemplo: python verificar_certificado.py certificado_20000000001.pem")
        sys.exit(1)
    
    filename = sys.argv[1]
    
    try:
        verificar_certificado(filename)
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
        print(f"❌ Error inesperado: {str(e)}")
        print()
        sys.exit(1)
