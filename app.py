"""
Sistema de Gestión de Pastoreo - Aplicación Principal v2.0
Aplicación web Flask simplificada y optimizada
"""

from flask import Flask, render_template, url_for, redirect, flash, session, request, jsonify
from flask_session import Session
from flask_login import LoginManager, login_required, current_user
from dotenv import load_dotenv
import os
import db
from datetime import datetime
import logging

# Cargar variables de entorno
load_dotenv()

# Crear directorios necesarios
os.makedirs('logs', exist_ok=True)

# Configurar logging estructurado
import logging.config

LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
        'detailed': {
            'format': '%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s'
        },
        'json': {
            'format': '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s", "module": "%(module)s", "line": %(lineno)d}'
        }
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'standard',
            'stream': 'ext://sys.stdout'
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'detailed',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'formatter': 'json',
            'filename': 'logs/errors.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 3
        }
    },
    'loggers': {
        '': {  # root logger
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False
        }
    }
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

def create_app():
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__, 
                template_folder='proyecto/templates',
                static_folder='proyecto/static')
    
    # Configuración básica
    configure_app(app)
    
    # Inicializar extensiones
    initialize_extensions(app)
    
    # Registrar blueprints
    register_blueprints(app)
    
    # Configurar context processors
    configure_context_processors(app)
    
    # Configurar rutas principales
    configure_main_routes(app)
    
    # Configurar manejo de errores
    configure_error_handlers(app)
    
    logger.info("Aplicación Flask inicializada correctamente")
    return app

def configure_app(app):
    """Configurar la aplicación Flask"""
    # Configuración de seguridad
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Configuración de base de datos
    app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
    app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
    app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '1234')
    app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'pastoreo')
    app.config['MYSQL_CURSORCLASS'] = 'DictCursor'
    app.config['MYSQL_CHARSET'] = 'utf8mb4'
    
    # Configuración de sesiones
    if os.getenv('FLASK_ENV') == 'production':
        app.config['SESSION_TYPE'] = 'redis'
        app.config['SESSION_REDIS'] = f"redis://{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}"
    else:
        app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    
    # Crear directorios necesarios
    os.makedirs('logs', exist_ok=True)

def initialize_extensions(app):
    """Inicializar extensiones Flask"""
    # Configurar Session
    Session(app)
    
    # Configurar Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor inicia sesión para acceder a esta página.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        from proyecto.models.models import User
        try:
            return User.get_by_id(user_id)
        except Exception as e:
            logger.error(f"Error cargando usuario {user_id}: {str(e)}")
            return None
    
    @login_manager.unauthorized_handler
    def unauthorized():
        if request.is_json:
            return jsonify({'error': 'Autenticación requerida'}), 401
        flash('Debes iniciar sesión para acceder a esta página.', 'warning')
        return redirect(url_for('auth.login', next=request.url))
    
    # Inicializar base de datos
    db.init_app(app)

def register_blueprints(app):
    """Registrar blueprints principales"""
    try:
        # Importar solo blueprints esenciales
        from proyecto.routes.auth import auth_bp
        from proyecto.routes.dashboard_simple import dashboard_simple_bp
        from proyecto.routes.potreros import potreros_bp
        from proyecto.routes.aforos import aforos_bp
        from proyecto.routes.actividades import actividades_bp
        
        # Importar nuevos blueprints
        from proyecto.routes.clima import clima_bp
        from proyecto.routes.ph import ph_bp
        from proyecto.routes.recorridos import recorridos_bp
        from proyecto.routes.admin import admin_bp
        from proyecto.routes.ganado import ganado_bp
        
        # Registrar blueprints esenciales
        app.register_blueprint(auth_bp, url_prefix='/auth')
        app.register_blueprint(dashboard_simple_bp)
        app.register_blueprint(potreros_bp, url_prefix='/potreros')
        app.register_blueprint(aforos_bp, url_prefix='/aforos')
        app.register_blueprint(actividades_bp, url_prefix='/actividades')
        
        # Registrar nuevos blueprints
        app.register_blueprint(clima_bp, url_prefix='/clima')
        app.register_blueprint(ph_bp, url_prefix='/ph')
        app.register_blueprint(recorridos_bp, url_prefix='/recorridos')
        app.register_blueprint(admin_bp, url_prefix='/admin')
        app.register_blueprint(ganado_bp, url_prefix='/ganado')
        
        logger.info("Todos los blueprints registrados exitosamente")
        
    except Exception as e:
        logger.error(f"Error registrando blueprints: {str(e)}")
        raise

def configure_context_processors(app):
    """Configurar procesadores de contexto básicos"""
    @app.context_processor
    def inject_date():
        """Inyectar fecha actual"""
        return {'now': datetime.now()}
    
    @app.context_processor
    def inject_user_utils():
        """Utilidades básicas de usuario"""
        def usuario_puede(modulo, accion='read'):
            """Verificación básica de permisos"""
            if not current_user.is_authenticated:
                return False
            # Implementación básica - todos los usuarios autenticados pueden todo
            return True
        
        return {'usuario_puede': usuario_puede}

def configure_main_routes(app):
    """Configurar rutas principales"""
    @app.route('/')
    def index():
        """Ruta principal"""
        if current_user.is_authenticated:
            return redirect(url_for('dashboard_simple.index'))
        return redirect(url_for('auth.login'))
    
    @app.route('/health')
    def health_check():
        """Health check para monitoreo"""
        return jsonify({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0'
        })

def configure_error_handlers(app):
    """Configurar manejo de errores básico"""
    @app.errorhandler(404)
    def not_found_error(error):
        """Página no encontrada"""
        return render_template('errors/404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        """Error interno del servidor"""
        logger.error(f"Error interno: {str(error)}")
        return render_template('errors/500.html'), 500

# Crear instancia de la aplicación
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 