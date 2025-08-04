from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import Recorrido, Potrero, PuntoMedicion
from db import mysql

recorridos_bp = Blueprint('recorridos', __name__, url_prefix='/recorridos')

@recorridos_bp.route('/')
@login_required
def index():
    """Página principal del módulo de recorridos"""
    page = request.args.get('page', 1, type=int)
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    potrero_id = request.args.get('potrero_id')
    
    try:
        # Convertir fechas si existen
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
        
        # Obtener recorridos
        recorridos, total = Recorrido.get_all(page=page, per_page=15,
                                            fecha_inicio=fecha_inicio,
                                            fecha_fin=fecha_fin,
                                            potrero_id=potrero_id)
        
        # Obtener lista de potreros para el filtro
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        # Calcular páginas para paginación
        per_page = 15
        pages = (total + per_page - 1) // per_page
        
        # Calcular recorridos de esta semana
        week_ago = (datetime.now() - timedelta(days=7)).date()
        recorridos_semana = []
        if recorridos:
            for recorrido in recorridos:
                if hasattr(recorrido, 'fecha') and recorrido.fecha >= week_ago:
                    recorridos_semana.append(recorrido)
        
        return render_template('recorridos/index.html',
                             recorridos=recorridos,
                             potreros=potreros,
                             total=total,
                             page=page,
                             pages=pages,
                             fecha_inicio=request.args.get('fecha_inicio', ''),
                             fecha_fin=request.args.get('fecha_fin', ''),
                             potrero_id=request.args.get('potrero_id', ''),
                             recorridos_semana=recorridos_semana,
                             datetime=datetime,
                             timedelta=timedelta)
                             
    except Exception as e:
        flash(f'Error al cargar recorridos: {str(e)}', 'error')
        return render_template('recorridos/index.html',
                             recorridos=[],
                             potreros=[],
                             total=0,
                             page=1,
                             pages=1,
                             fecha_inicio='',
                             fecha_fin='',
                             potrero_id='',
                             recorridos_semana=[],
                             datetime=datetime,
                             timedelta=timedelta)

@recorridos_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    """Crear nuevo recorrido"""
    if request.method == 'POST':
        try:
            potrero_id = int(request.form.get('potrero_id'))
            fecha = datetime.strptime(request.form.get('fecha'), '%Y-%m-%d').date()
            altura_promedio = float(request.form.get('altura_promedio'))
            altura_minima = float(request.form.get('altura_minima'))
            altura_maxima = float(request.form.get('altura_maxima'))
            cobertura_vegetal = float(request.form.get('cobertura_vegetal'))
            estado_general = request.form.get('estado_general')
            puntos_medicion = int(request.form.get('puntos_medicion', 5))
            humedad_suelo = request.form.get('humedad_suelo')
            presencia_plagas = request.form.get('presencia_plagas') == '1'
            necesita_riego = request.form.get('necesita_riego') == '1'
            necesita_fertilizacion = request.form.get('necesita_fertilizacion') == '1'
            observaciones = request.form.get('observaciones', '').strip()
            responsable = current_user.nombre if current_user.is_authenticated else 'Usuario'
            
            # Crear recorrido
            recorrido_id = Recorrido.create(
                potrero_id, fecha, altura_promedio, altura_minima, altura_maxima,
                cobertura_vegetal, estado_general, puntos_medicion,
                humedad_suelo, presencia_plagas, necesita_riego,
                necesita_fertilizacion, observaciones, responsable
            )
            
            if recorrido_id:
                flash('Recorrido registrado exitosamente', 'success')
                return redirect(url_for('recorridos.ver', recorrido_id=recorrido_id))
            else:
                flash('Error al registrar el recorrido', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar el recorrido: {str(e)}', 'error')
    
    # Obtener lista de potreros
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        return render_template('recorridos/nuevo.html', potreros=potreros)
        
    except Exception as e:
        flash(f'Error al cargar formulario: {str(e)}', 'error')
        return render_template('recorridos/nuevo.html', potreros=[])

@recorridos_bp.route('/<int:recorrido_id>/ver')
@login_required
def ver(recorrido_id):
    """Ver detalles de un recorrido"""
    try:
        recorrido = Recorrido.get_by_id(recorrido_id)
        if not recorrido:
            flash('Recorrido no encontrado', 'error')
            return redirect(url_for('recorridos.index'))
        
        # Obtener puntos de medición
        puntos = PuntoMedicion.get_by_recorrido(recorrido_id)
        
        return render_template('recorridos/ver.html',
                             recorrido=recorrido,
                             puntos=puntos)
                             
    except Exception as e:
        flash(f'Error al cargar recorrido: {str(e)}', 'error')
        return redirect(url_for('recorridos.index'))

@recorridos_bp.route('/<int:recorrido_id>/editar', methods=['GET', 'POST'])
@login_required
def editar(recorrido_id):
    """Editar recorrido"""
    if request.method == 'POST':
        try:
            potrero_id = int(request.form.get('potrero_id'))
            fecha = datetime.strptime(request.form.get('fecha'), '%Y-%m-%d').date()
            altura_promedio = float(request.form.get('altura_promedio'))
            altura_minima = float(request.form.get('altura_minima'))
            altura_maxima = float(request.form.get('altura_maxima'))
            cobertura_vegetal = float(request.form.get('cobertura_vegetal'))
            estado_general = request.form.get('estado_general')
            puntos_medicion = int(request.form.get('puntos_medicion', 5))
            humedad_suelo = request.form.get('humedad_suelo')
            presencia_plagas = request.form.get('presencia_plagas') == '1'
            necesita_riego = request.form.get('necesita_riego') == '1'
            necesita_fertilizacion = request.form.get('necesita_fertilizacion') == '1'
            observaciones = request.form.get('observaciones', '').strip()
            responsable = current_user.nombre if current_user.is_authenticated else 'Usuario'
            
            # Actualizar recorrido
            success = Recorrido.update(
                recorrido_id, potrero_id, fecha, altura_promedio, altura_minima, altura_maxima,
                cobertura_vegetal, estado_general, puntos_medicion,
                humedad_suelo, presencia_plagas, necesita_riego,
                necesita_fertilizacion, observaciones, responsable
            )
            
            if success:
                flash('Recorrido actualizado exitosamente', 'success')
                return redirect(url_for('recorridos.ver', recorrido_id=recorrido_id))
            else:
                flash('Error al actualizar el recorrido', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar el recorrido: {str(e)}', 'error')
    
    try:
        # Obtener recorrido actual
        recorrido = Recorrido.get_by_id(recorrido_id)
        if not recorrido:
            flash('Recorrido no encontrado', 'error')
            return redirect(url_for('recorridos.index'))
        
        # Obtener lista de potreros
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        return render_template('recorridos/editar.html',
                             recorrido=recorrido,
                             potreros=potreros)
                             
    except Exception as e:
        flash(f'Error al cargar recorrido: {str(e)}', 'error')
        return redirect(url_for('recorridos.index'))

@recorridos_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard de recorridos con métricas de crecimiento"""
    try:
        # Obtener datos de crecimiento
        datos_crecimiento = Recorrido.get_growth_data_for_chart()
        
        # Obtener último recorrido por potrero
        ultimos_recorridos = Recorrido.get_latest_by_potrero()
        
        # Obtener alertas de crecimiento
        alertas = Recorrido.get_growth_alerts()
        
        # Obtener resumen semanal
        resumen_semanal = Recorrido.get_weekly_summary()
        
        return render_template('recorridos/dashboard.html',
                             datos_crecimiento=datos_crecimiento,
                             ultimos_recorridos=ultimos_recorridos,
                             alertas=alertas,
                             resumen_semanal=resumen_semanal)
                             
    except Exception as e:
        flash(f'Error al cargar dashboard: {str(e)}', 'error')
        return render_template('recorridos/dashboard.html',
                             datos_crecimiento={'fechas': [], 'alturas': []},
                             ultimos_recorridos=[],
                             alertas=[],
                             resumen_semanal=[])

@recorridos_bp.route('/analisis')
@login_required
def analisis():
    """Análisis avanzado de recorridos"""
    try:
        potrero_id = request.args.get('potrero_id')
        weeks = request.args.get('weeks', 12, type=int)
        
        # Obtener datos para análisis
        datos_crecimiento = Recorrido.get_growth_data_for_chart(potrero_id, weeks)
        
        # Obtener lista de potreros
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        return render_template('recorridos/analisis.html',
                             datos_crecimiento=datos_crecimiento,
                             potreros=potreros,
                             potrero_id=potrero_id,
                             weeks=weeks)
                             
    except Exception as e:
        flash(f'Error al cargar análisis: {str(e)}', 'error')
        return render_template('recorridos/analisis.html',
                             datos_crecimiento={'fechas': [], 'alturas': []},
                             potreros=[],
                             potrero_id='',
                             weeks=12)

@recorridos_bp.route('/<int:recorrido_id>/delete', methods=['POST'])
@login_required
def delete(recorrido_id):
    """Eliminar recorrido"""
    try:
        success = Recorrido.delete(recorrido_id)
        
        if success:
            flash('Recorrido eliminado exitosamente', 'success')
        else:
            flash('No se encontró el recorrido a eliminar', 'error')
            
    except Exception as e:
        flash(f'Error al eliminar recorrido: {str(e)}', 'error')
    
    return redirect(url_for('recorridos.index'))

@recorridos_bp.route('/api/growth-data')
@login_required
def api_growth_data():
    """API para obtener datos de crecimiento"""
    try:
        potrero_id = request.args.get('potrero_id')
        weeks = request.args.get('weeks', 12, type=int)
        
        datos = Recorrido.get_growth_data_for_chart(potrero_id, weeks)
        
        return jsonify({
            'success': True,
            'data': datos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500