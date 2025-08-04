from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required
from datetime import datetime
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import PH, Potrero
from db import mysql

ph_bp = Blueprint('ph', __name__, url_prefix='/ph')

@ph_bp.route('/')
@login_required
def index():
    """Página principal del módulo de pH"""
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
        
        # Obtener registros de pH
        ph_records, total = PH.get_all(page=page, per_page=15,
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
        
        # Obtener datos para gráfico
        chart_data = PH.get_data_for_chart(potrero_id, 6)
        
        return render_template('ph/index.html',
                             ph_records=ph_records,
                             potreros=potreros,
                             total=total,
                             page=page,
                             pages=pages,
                             fecha_inicio=request.args.get('fecha_inicio', ''),
                             fecha_fin=request.args.get('fecha_fin', ''),
                             potrero_id=request.args.get('potrero_id', ''),
                             chart_data=chart_data)
                             
    except Exception as e:
        flash(f'Error al cargar registros de pH: {str(e)}', 'error')
        return render_template('ph/index.html',
                             ph_records=[],
                             potreros=[],
                             total=0,
                             page=1,
                             pages=1,
                             fecha_inicio='',
                             fecha_fin='',
                             potrero_id='',
                             chart_data=[])

@ph_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    """Crear nueva medición de pH"""
    if request.method == 'POST':
        try:
            potrero_id = int(request.form.get('potrero_id'))
            fecha = datetime.strptime(request.form.get('fecha'), '%Y-%m-%d').date()
            valor = float(request.form.get('valor'))
            observaciones = request.form.get('observaciones', '').strip()
            
            # Validar rango de pH
            if not 0 <= valor <= 14:
                flash('El valor de pH debe estar entre 0 y 14', 'error')
                raise ValueError('pH fuera de rango')
            
            # Crear registro
            ph_id = PH.create(potrero_id, fecha, valor, observaciones)
            
            if ph_id:
                flash('Medición de pH registrada exitosamente', 'success')
                return redirect(url_for('ph.index'))
            else:
                flash('Error al registrar la medición de pH', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar la medición: {str(e)}', 'error')
    
    # Obtener lista de potreros
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        return render_template('ph/new.html', potreros=potreros)
        
    except Exception as e:
        flash(f'Error al cargar formulario: {str(e)}', 'error')
        return render_template('ph/new.html', potreros=[])

@ph_bp.route('/api/data')
@login_required
def api_data():
    """API para obtener datos de pH en formato JSON"""
    try:
        potrero_id = request.args.get('potrero_id')
        meses = request.args.get('meses', 6, type=int)
        
        datos = PH.get_data_for_chart(potrero_id, meses)
        
        return jsonify({
            'success': True,
            'data': datos
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ph_bp.route('/<int:ph_id>/delete', methods=['POST'])
@login_required
def delete(ph_id):
    """Eliminar registro de pH"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM ph WHERE id = %s", (ph_id,))
        mysql.connection.commit()
        
        if cursor.rowcount > 0:
            flash('Registro de pH eliminado exitosamente', 'success')
        else:
            flash('No se encontró el registro a eliminar', 'error')
            
        cursor.close()
        
    except Exception as e:
        flash(f'Error al eliminar registro: {str(e)}', 'error')
    
    return redirect(url_for('ph.index'))