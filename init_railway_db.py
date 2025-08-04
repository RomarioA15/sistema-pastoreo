#!/usr/bin/env python3
"""
Script para inicializar la base de datos MySQL en Railway
Ejecuta automáticamente el SQL de migración
"""

import os
import sys
import mysql.connector
from mysql.connector import Error
import time

def wait_for_database(max_attempts=30, delay=2):
    """Esperar a que la base de datos esté disponible"""
    config = {
        'host': os.environ.get('MYSQL_HOST') or os.environ.get('MYSQLHOST', 'localhost'),
        'port': int(os.environ.get('MYSQL_PORT') or os.environ.get('MYSQLPORT', 3306)),
        'user': os.environ.get('MYSQL_USER') or os.environ.get('MYSQLUSER', 'root'),
        'password': os.environ.get('MYSQL_PASSWORD') or os.environ.get('MYSQLPASSWORD', ''),
        'database': os.environ.get('MYSQL_DB') or os.environ.get('MYSQLDATABASE', 'railway')
    }
    
    for attempt in range(max_attempts):
        try:
            print(f"Intento {attempt + 1}: Conectando a MySQL...")
            connection = mysql.connector.connect(**config)
            if connection.is_connected():
                print("✅ Conexión exitosa a MySQL")
                connection.close()
                return config
        except Error as e:
            print(f"⏳ Esperando base de datos... ({e})")
            time.sleep(delay)
    
    raise Exception("No se pudo conectar a la base de datos después de múltiples intentos")

def init_database():
    """Inicializar la base de datos con el esquema necesario"""
    
    try:
        # Esperar a que la base de datos esté disponible
        config = wait_for_database()
        
        print("Inicializando base de datos...")
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # Verificar si las tablas ya existen
        cursor.execute("SHOW TABLES")
        existing_tables = [table[0] for table in cursor.fetchall()]
        
        if existing_tables:
            print(f"Base de datos ya tiene {len(existing_tables)} tablas. Saltando inicialización.")
            cursor.close()
            connection.close()
            return True
        
        # Leer el archivo de migración
        sql_file = 'database_migration_v2.sql'
        if os.path.exists(sql_file):
            print(f"Ejecutando {sql_file}...")
            
            with open(sql_file, 'r', encoding='utf-8') as file:
                sql_content = file.read()
            
            # Ejecutar las declaraciones SQL
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for i, statement in enumerate(statements):
                if statement and not statement.startswith('--'):
                    try:
                        cursor.execute(statement)
                        connection.commit()
                        print(f"✅ ({i+1}/{len(statements)}) Ejecutado correctamente")
                    except Error as e:
                        if "already exists" not in str(e).lower():
                            print(f"⚠️ Error ejecutando statement {i+1}: {e}")
                            print(f"Statement: {statement[:100]}...")
                        connection.rollback()
            
            print("🎉 Base de datos inicializada correctamente")
        else:
            print(f"⚠️ Archivo {sql_file} no encontrado")
            return False
        
        cursor.close()
        connection.close()
        return True
        
    except Exception as e:
        print(f"❌ Error inicializando base de datos: {e}")
        return False

if __name__ == "__main__":
    print("🚂 Inicializando base de datos para Railway...")
    
    if init_database():
        print("✅ Inicialización completada exitosamente")
        sys.exit(0)
    else:
        print("❌ Error en la inicialización")
        sys.exit(1)