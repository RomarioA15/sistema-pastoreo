#!/usr/bin/env python3
"""
Script de inicio para el Sistema de Gestión de Pastoreo
Ejecuta la aplicación Flask con configuración de desarrollo
"""

import os
import sys
from pathlib import Path

# Agregar el directorio del proyecto al path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Configurar variables de entorno por defecto
os.environ.setdefault('FLASK_ENV', 'development')
os.environ.setdefault('FLASK_DEBUG', '1')
os.environ.setdefault('SECRET_KEY', 'dev-secret-key-change-in-production')
os.environ.setdefault('MYSQL_HOST', 'localhost')
os.environ.setdefault('MYSQL_USER', 'root')
os.environ.setdefault('MYSQL_PASSWORD', '1234')
os.environ.setdefault('MYSQL_DB', 'pastoreo')

# Crear directorios necesarios
directories = ['logs', 'flask_session', 'proyecto/static/uploads']
for directory in directories:
    os.makedirs(directory, exist_ok=True)

print("Iniciando Sistema de Gestion de Pastoreo...")
print("=" * 50)

# Verificar que las dependencias estén instaladas
try:
    import flask
    import flask_mysqldb
    import flask_login
    import flask_session
    print("Dependencias verificadas")
except ImportError as e:
    print(f"Error: Falta instalar dependencias: {e}")
    print("Ejecuta: pip install -r requirements.txt")
    sys.exit(1)

# Verificar conexión a MySQL (opcional)
try:
    import mysql.connector
    from mysql.connector import Error
    
    connection = mysql.connector.connect(
        host=os.environ.get('MYSQL_HOST', 'localhost'),
        user=os.environ.get('MYSQL_USER', 'root'),
        password=os.environ.get('MYSQL_PASSWORD', '1234')
    )
    
    if connection.is_connected():
        print("Conexion a MySQL exitosa")
        
        # Verificar si la base de datos existe
        cursor = connection.cursor()
        cursor.execute(f"SHOW DATABASES LIKE '{os.environ.get('MYSQL_DB', 'pastoreo')}'")
        if cursor.fetchone():
            print("Base de datos encontrada")
        else:
            print("Base de datos no encontrada")
            print("Ejecuta init_database.sql para crear la base de datos")
        
        cursor.close()
        connection.close()
        
except Error as e:
    print(f"Advertencia: No se pudo conectar a MySQL - {e}")
    print("Asegurate de que MySQL este ejecutandose")

print("=" * 50)

# Importar y ejecutar la aplicación
if __name__ == '__main__':
    try:
        from app import app
        
        # Configuración de desarrollo
        app.config['DEBUG'] = True
        app.config['TESTING'] = False
        
        print("Iniciando servidor de desarrollo...")
        print("Accede a: http://localhost:5000")
        print("Usuario demo: admin@pastoreo.com / admin123")
        print("Presiona Ctrl+C para detener el servidor")
        print("=" * 50)
        
        app.run(
            host='0.0.0.0',
            port=5000,
            debug=True,
            threaded=True,
            use_reloader=True
        )
        
    except Exception as e:
        print(f"Error al iniciar la aplicacion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 