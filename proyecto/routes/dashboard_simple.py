"""
Dashboard Simple - Ruta principal del sistema
"""

from flask import Blueprint, render_template, session
from flask_login import login_required, current_user
from datetime import datetime
import json

# Crear blueprint
dashboard_simple_bp = Blueprint('dashboard_simple', __name__)

@dashboard_simple_bp.route('/')
@dashboard_simple_bp.route('/dashboard')
@login_required
def index():
    """Página principal del dashboard simplificado"""
    try:
        from db import mysql
        
        # Obtener información básica del usuario
        usuario_info = {
            'nombre': current_user.nombre if current_user.is_authenticated else 'Invitado',
            'email': current_user.email if current_user.is_authenticated else ''
        }
        
        # Obtener estadísticas reales de la base de datos
        cursor = mysql.connection.cursor()
        
        # Contar fincas
        cursor.execute("SELECT COUNT(*) as total FROM fincas WHERE activa = TRUE")
        total_fincas = cursor.fetchone()['total']
        
        # Contar potreros
        cursor.execute("SELECT COUNT(*) as total FROM potreros")
        total_potreros = cursor.fetchone()['total']
        
        # Contar aforos
        cursor.execute("SELECT COUNT(*) as total FROM aforos")
        total_aforos = cursor.fetchone()['total']
        
        # Contar actividades
        cursor.execute("SELECT COUNT(*) as total FROM actividades")
        total_actividades = cursor.fetchone()['total']
        
        cursor.close()
        
        # Estadísticas reales
        stats = {
            'total_fincas': total_fincas,
            'total_potreros': total_potreros,
            'total_aforos': total_aforos,
            'total_actividades': total_actividades
        }
        
        # Información de la finca actual
        finca_actual = {
            'nombre': 'Finca Demo'
        }
        
        # Rol del usuario
        rol_usuario = 'Administrador' if current_user.is_authenticated else 'Usuario'
        
        # Fecha actual
        fecha_actual = datetime.now().strftime('%d/%m/%Y %H:%M')
        
        return render_template(
            'dashboard/index_simple.html',
            stats=stats,
            finca_actual=finca_actual,
            rol_usuario=rol_usuario,
            fecha_actual=fecha_actual,
            usuario_info=usuario_info
        )
        
    except Exception as e:
        # En caso de error, mostrar dashboard básico
        print(f"Error en dashboard simple: {e}")
        return render_template(
            'dashboard/index_simple.html',
            stats={'total_fincas': 0, 'total_potreros': 0, 'total_aforos': 0, 'total_actividades': 0},
            finca_actual={'nombre': 'No disponible'},
            rol_usuario='Usuario',
            fecha_actual=datetime.now().strftime('%d/%m/%Y %H:%M'),
            usuario_info={'nombre': 'Usuario', 'email': ''}
        ) 