from flask import Blueprint, render_template, request, redirect, url_for, flash, current_app, jsonify
from flask_login import login_required
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import Potrero, mysql
from datetime import datetime, timedelta

potreros_bp = Blueprint('potreros', __name__, url_prefix='/potreros')

@potreros_bp.route('/')
@login_required
def index():
    page = request.args.get('page', 1, type=int)
    potreros, total = Potrero.get_all(page=page)
    
    # Calcular páginas para paginación
    per_page = 10
    pages = (total + per_page - 1) // per_page
    
    # Convertir a formato JSON serializable
    potreros_json = []
    if potreros:
        for potrero in potreros:
            potrero_dict = {
                'id': potrero.get('id'),
                'nombre': potrero.get('nombre'),
                'hectareas': float(potrero.get('hectareas', 0)) if potrero.get('hectareas') else 0,
                'tipo_pasto': potrero.get('tipo_pasto', ''),
                'etapa_ganado': potrero.get('etapa_ganado', ''),
                'descripcion': potrero.get('descripcion', ''),
                'ultima_fecha': potrero.get('ultima_fecha').strftime('%Y-%m-%d') if potrero.get('ultima_fecha') else None,
                'dias_rotacion': potrero.get('dias_rotacion', 0) or 0,
                'promedio_rotacion': float(potrero.get('promedio_rotacion', 0)) if potrero.get('promedio_rotacion') else 0
            }
            potreros_json.append(potrero_dict)
    
    current_app.logger.info(f"Potreros cargados: {len(potreros_json)} de {total} total")
    
    return render_template('potreros/index_simple.html', 
                          potreros=potreros_json,
                          page=page,
                          pages=pages,
                          total=total)

@potreros_bp.route('/visualizador')
@login_required
def visualizador():
    # Obtener información de último aforo y días en rotación
    potreros_info = Potrero.get_ultimo_aforo_info()
    
    # Calcular estado de cada potrero
    for potrero in potreros_info:
        # Asegurar que días de rotación sea un número
        if potrero['dias_rotacion'] is None:
            potrero['dias_rotacion'] = 0
        
        dias_desde_ultimo = potrero.get('dias_desde_ultimo_aforo', None)
        
        if potrero['ultima_fecha'] is None or dias_desde_ultimo is None or dias_desde_ultimo > 30:
            # Sin aforo o más de 30 días desde el último aforo
            potrero['estado'] = 'sin_aforo'
            potrero['color'] = '#FF0000'  # Rojo
        else:
            dias = dias_desde_ultimo
            
            if dias == 0:
                # Día 0 (recién aforado): Verde intenso
                potrero['estado'] = 'recien_aforado'
                potrero['color'] = '#00FF00'  # Verde puro
            elif dias >= 23 and dias <= 30:
                # Días 23-30: Verde
                potrero['estado'] = 'listo_para_aforo'
                potrero['color'] = '#00FF00'  # Verde puro
            else:
                # Días 1-22: Degradado de café a verde
                # Día 1: café, Día 22: verde
                intensidad = max(0, min(1.0, (dias - 1) / 21.0))  # 0 = día 1 (café), 1 = día 22 (verde)
                r = int(139 * (1 - intensidad))  # RGB para café: 139, 69, 19
                g = int(69 + 186 * intensidad)   # RGB para verde: 0, 255, 0
                b = int(19 * (1 - intensidad))
                potrero['estado'] = 'en_rotacion'
                potrero['color'] = f'#{r:02x}{g:02x}{b:02x}'
    
    return jsonify(potreros_info)

@potreros_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    if request.method == 'POST':
        # Obtener datos del formulario
        nombre = request.form.get('nombre')
        hectareas = request.form.get('hectareas')
        tipo_pastura = request.form.get('tipo_pastura')  # Corregido: era tipo_pasto
        estado = request.form.get('estado', 'bueno')     # Corregido: era etapa_ganado
        observaciones = request.form.get('observaciones', '')  # Corregido: era descripcion
        
        # Validar campos obligatorios
        if not nombre or not hectareas:
            flash('Los campos Nombre y Hectáreas son obligatorios', 'danger')
            return render_template('potreros/new.html')
        
        # Crear potrero en la base de datos  
        # Mapear campos del formulario a los esperados por el modelo
        tipo_pasto = tipo_pastura if tipo_pastura else 'otro'
        etapa_ganado = 'cria'  # Valor por defecto, ya que el formulario no lo solicita
        descripcion = f"Estado: {estado}. {observaciones}".strip()
        
        potrero_id = Potrero.create(nombre, hectareas, tipo_pasto, etapa_ganado, descripcion)
        if potrero_id:
            flash('Potrero creado exitosamente', 'success')
            # Redirigir con parámetro para indicar nuevo potrero
            return redirect(url_for('potreros.index', nuevo_potrero=potrero_id))
        else:
            flash('Error al crear el potrero', 'danger')
    
    return render_template('potreros/new.html')

@potreros_bp.route('/<int:potrero_id>/editar', methods=['GET', 'POST'])
@login_required
def editar(potrero_id):
    potrero = Potrero.get_by_id(potrero_id)
    if not potrero:
        flash('Potrero no encontrado', 'danger')
        return redirect(url_for('potreros.index'))
    
    if request.method == 'POST':
        # Obtener datos del formulario
        nombre = request.form.get('nombre')
        hectareas = request.form.get('hectareas')
        tipo_pasto = request.form.get('tipo_pasto')
        etapa_ganado = request.form.get('etapa_ganado')
        descripcion = request.form.get('descripcion', '')
        
        # Validar campos obligatorios
        if not nombre or not hectareas or not tipo_pasto or not etapa_ganado:
            flash('Los campos Nombre, Hectáreas, Tipo de Pasto y Etapa de Ganado son obligatorios', 'danger')
            return render_template('potreros/edit.html', potrero=potrero)
        
        # Actualizar potrero en la base de datos
        success = Potrero.update(potrero_id, nombre, hectareas, tipo_pasto, etapa_ganado, descripcion)
        if success:
            flash('Potrero actualizado exitosamente', 'success')
            return redirect(url_for('potreros.index'))
        else:
            flash('Error al actualizar el potrero', 'danger')
    
    return render_template('potreros/edit.html', potrero=potrero)

@potreros_bp.route('/<int:potrero_id>/delete', methods=['POST'])
@login_required
def delete(potrero_id):
    """Eliminar potrero"""
    success = Potrero.delete(potrero_id)
    if success:
        flash('Potrero eliminado exitosamente', 'success')
    else:
        flash('Error al eliminar el potrero', 'danger')
    return redirect(url_for('potreros.index'))

@potreros_bp.route('/api/data')
@login_required
def api_data():
    """API para obtener datos de potreros"""
    try:
        # Obtener todos los potreros sin paginación para el visualizador
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT 
                p.id, 
                p.nombre, 
                p.hectareas,
                p.tipo_pasto,
                p.etapa_ganado,
                p.descripcion,
                a.fecha as ultima_fecha,
                COALESCE(a.dias_rotacion, 0) as dias_rotacion,
                COALESCE(a.materia_verde, 0) as materia_verde
            FROM potreros p
            LEFT JOIN (
                SELECT potrero_id, fecha, dias_rotacion, materia_verde
                FROM aforos
                WHERE (potrero_id, fecha) IN (
                    SELECT potrero_id, MAX(fecha) as max_fecha
                    FROM aforos
                    GROUP BY potrero_id
                )
            ) a ON p.id = a.potrero_id
            ORDER BY p.nombre
        """)
        potreros = cursor.fetchall()
        cursor.close()
        
        # Convertir a formato JSON
        potreros_data = []
        for potrero in potreros:
            potreros_data.append({
                'id': potrero['id'],
                'nombre': potrero['nombre'],
                'hectareas': float(potrero['hectareas']) if potrero['hectareas'] else 0,
                'tipo_pasto': potrero['tipo_pasto'] or '',
                'etapa_ganado': potrero['etapa_ganado'] or '',
                'descripcion': potrero['descripcion'] or '',
                'ultima_fecha': potrero['ultima_fecha'].strftime('%Y-%m-%d') if potrero['ultima_fecha'] else None,
                'dias_rotacion': potrero['dias_rotacion'] or 0,
                'materia_verde': float(potrero['materia_verde']) if potrero['materia_verde'] else 0
            })
        
        return jsonify({
            'success': True,
            'data': potreros_data,
            'total': len(potreros_data)
        })
        
    except Exception as e:
        current_app.logger.error(f"Error en API de potreros: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'data': []
        }), 500 