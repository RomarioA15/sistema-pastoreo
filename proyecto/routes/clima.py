from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required
from datetime import datetime, timedelta
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import Clima
from db import mysql

clima_bp = Blueprint('clima', __name__, url_prefix='/clima')

@clima_bp.route('/')
@login_required
def index():
    """Página principal del módulo de clima"""
    try:
        # Obtener datos climáticos recientes
        registros_recientes = Clima.get_latest(7)
        
        # Obtener resumen del mes actual
        resumen_mensual = Clima.get_monthly_summary()
        
        return render_template('clima/index.html',
                             registros=registros_recientes,
                             resumen=resumen_mensual)
    except Exception as e:
        flash(f'Error al cargar datos climáticos: {str(e)}', 'error')
        return render_template('clima/index.html',
                             registros=[],
                             resumen=None)

@clima_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard de clima con gráficos"""
    try:
        # Obtener datos para gráficos
        datos_grafico = Clima.get_data_for_chart(30)
        
        # Obtener estadísticas recientes
        registros_recientes = Clima.get_latest(7)
        
        return render_template('clima/dashboard.html',
                             datos_grafico=datos_grafico,
                             registros=registros_recientes)
    except Exception as e:
        flash(f'Error al cargar dashboard de clima: {str(e)}', 'error')
        return render_template('clima/dashboard.html',
                             datos_grafico={'fechas': [], 'temperatura_min': [], 'temperatura_max': [], 'lluvia': []},
                             registros=[])

@clima_bp.route('/historico')
@login_required
def historico():
    """Vista histórica del clima"""
    page = request.args.get('page', 1, type=int)
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    
    try:
        # Convertir fechas si existen
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
        
        registros, total = Clima.get_all(page=page, per_page=20, 
                                       fecha_inicio=fecha_inicio, 
                                       fecha_fin=fecha_fin)
        
        # Calcular páginas para paginación
        per_page = 20
        pages = (total + per_page - 1) // per_page
        
        return render_template('clima/historico.html',
                             registros=registros,
                             total=total,
                             page=page,
                             pages=pages,
                             fecha_inicio=request.args.get('fecha_inicio', ''),
                             fecha_fin=request.args.get('fecha_fin', ''))
    except Exception as e:
        flash(f'Error al cargar histórico climático: {str(e)}', 'error')
        return render_template('clima/historico.html',
                             registros=[],
                             total=0,
                             page=1,
                             pages=1,
                             fecha_inicio='',
                             fecha_fin='')

@clima_bp.route('/api/data')
@login_required
def api_data():
    """API para obtener datos climáticos en formato JSON"""
    try:
        days = request.args.get('days', 30, type=int)
        datos = Clima.get_data_for_chart(days)
        
        return jsonify({
            'success': True,
            'data': datos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@clima_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    """Crear nuevo registro climático"""
    if request.method == 'POST':
        try:
            fecha = datetime.strptime(request.form.get('fecha'), '%Y-%m-%d').date()
            temperatura_min = float(request.form.get('temperatura_min'))
            temperatura_max = float(request.form.get('temperatura_max'))
            temperatura_promedio = (temperatura_min + temperatura_max) / 2
            humedad = int(request.form.get('humedad'))
            presion = float(request.form.get('presion', 0))
            lluvia = float(request.form.get('lluvia', 0))
            velocidad_viento = float(request.form.get('velocidad_viento', 0))
            direccion_viento = request.form.get('direccion_viento', '')
            nubosidad = int(request.form.get('nubosidad', 0))
            horas_sol = float(request.form.get('horas_sol', 0))
            descripcion = request.form.get('descripcion', '')
            icono = request.form.get('icono', 'sun')
            
            # Crear o actualizar registro
            clima_id = Clima.update_or_create(
                fecha, temperatura_min, temperatura_max, temperatura_promedio,
                humedad, presion, lluvia, velocidad_viento, direccion_viento,
                nubosidad, horas_sol, descripcion, icono
            )
            
            if clima_id:
                flash('Registro climático guardado exitosamente', 'success')
                return redirect(url_for('clima.index'))
            else:
                flash('Error al guardar el registro climático', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar el registro: {str(e)}', 'error')
    
    return render_template('clima/nuevo.html')