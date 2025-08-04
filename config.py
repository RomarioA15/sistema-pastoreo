"""
Configuración del Sistema de Gestión de Pastoreo v2.0
Configuración simplificada y esencial
"""

import os
from datetime import timedelta


class Config:
    """Configuración básica para la aplicación"""
    
    # Configuración esencial
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'pastoreo-dev-key-change-in-production'
    
    # Base de datos
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or '1234'
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'pastoreo'
    MYSQL_CURSORCLASS = 'DictCursor'
    
    # Sesiones
    SESSION_TYPE = 'filesystem'
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Aplicación
    APP_NAME = 'Sistema de Gestión de Pastoreo'
    APP_VERSION = '2.0'


class DevelopmentConfig(Config):
    """Configuración para desarrollo"""
    DEBUG = True
    

class ProductionConfig(Config):
    """Configuración para producción"""
    DEBUG = False


def get_config():
    """Obtener configuración según el entorno"""
    env = os.environ.get('FLASK_ENV', 'development')
    
    if env == 'production':
        return ProductionConfig
    else:
        return DevelopmentConfig 