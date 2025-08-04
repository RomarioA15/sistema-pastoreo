from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required
from datetime import datetime
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import Actividad, Potrero
from db import mysql

actividades_bp = Blueprint('actividades', __name__, url_prefix='/actividades')

@actividades_bp.route('/')
@login_required
def index():
    page = request.args.get('page', 1, type=int)
    
    # Filtros
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    potrero_id = request.args.get('potrero_id')
    tipo_actividad = request.args.get('tipo_actividad')
    estado = request.args.get('estado')
    
    # Convertir fecha_inicio y fecha_fin a objetos datetime si existen
    if fecha_inicio:
        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        except ValueError:
            fecha_inicio = None
    
    if fecha_fin:
        try:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
        except ValueError:
            fecha_fin = None
    
    # Convertir potrero_id a entero si existe
    if potrero_id:
        try:
            potrero_id = int(potrero_id)
        except ValueError:
            potrero_id = None
    
    # Obtener actividades filtradas
    actividades, total = Actividad.get_all(
        page=page, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        potrero_id=potrero_id,
        tipo_actividad=tipo_actividad,
        estado=estado
    )
    
    # Calcular páginas para paginación
    per_page = 10
    pages = (total + per_page - 1) // per_page
    
    # Obtener todos los potreros para el selector de filtros
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    # Tipos de actividades - IMPORTANTE: Deben coincidir exactamente con los valores del ENUM en la base de datos
    tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
    
    # Estados
    estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
    
    # Calcular estadísticas con consultas simples y manejo seguro
    cursor = mysql.connection.cursor()
    
    # Función auxiliar para obtener count de forma segura
    def get_safe_count(query):
        cursor.execute(query)
        result = cursor.fetchone()
        if result:
            # El cursor está configurado como DictCursor, así que result es un dict
            count_value = result.get('COUNT(*)', 0)
            return int(count_value) if count_value is not None else 0
        return 0
    
    # Contar pendientes
    pendientes = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'Pendiente'")
    
    # Contar en progreso
    en_progreso = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'En Progreso'")
    
    # Contar completadas
    completadas = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'Completada'")
    
    # Contar total
    total_count = get_safe_count("SELECT COUNT(*) FROM actividades")
    
    cursor.close()
    
    stats = {
        'pendientes': pendientes,
        'en_progreso': en_progreso,
        'completadas': completadas,
        'total': total_count
    }

    return render_template('actividades/index.html', 
                          actividades=actividades, 
                          potreros=potreros,
                          tipos_actividad=tipos_actividad,
                          estados=estados,
                          page=page,
                          pages=pages,
                          total=total,
                          stats=stats,
                          fecha_inicio=fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else '',
                          fecha_fin=fecha_fin.strftime('%Y-%m-%d') if fecha_fin else '',
                          potrero_id=potrero_id,
                          tipo_actividad=tipo_actividad,
                          estado=estado)

@actividades_bp.route('/educativo')
@login_required
def index_educational():
    """Ruta para el modo educativo de actividades"""
    page = request.args.get('page', 1, type=int)
    
    # Filtros
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    potrero_id = request.args.get('potrero_id')
    tipo_actividad = request.args.get('tipo_actividad')
    estado = request.args.get('estado')
    
    # Convertir fecha_inicio y fecha_fin a objetos datetime si existen
    if fecha_inicio:
        try:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d')
        except ValueError:
            fecha_inicio = None
    
    if fecha_fin:
        try:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d')
        except ValueError:
            fecha_fin = None
    
    # Convertir potrero_id a entero si existe
    if potrero_id:
        try:
            potrero_id = int(potrero_id)
        except ValueError:
            potrero_id = None
    
    # Obtener actividades filtradas
    actividades, total = Actividad.get_all(
        page=page, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        potrero_id=potrero_id,
        tipo_actividad=tipo_actividad,
        estado=estado
    )
    
    # Calcular páginas para paginación
    per_page = 10
    pages = (total + per_page - 1) // per_page
    
    # Obtener todos los potreros para el selector de filtros
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    # Tipos de actividades
    tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
    
    # Estados
    estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
    
    # Calcular estadísticas
    cursor = mysql.connection.cursor()
    
    def get_safe_count(query):
        cursor.execute(query)
        result = cursor.fetchone()
        if result:
            count_value = result.get('COUNT(*)', 0)
            return int(count_value) if count_value is not None else 0
        return 0
    
    pendientes = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'Pendiente'")
    en_progreso = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'En Progreso'")
    completadas = get_safe_count("SELECT COUNT(*) FROM actividades WHERE estado = 'Completada'")
    total_count = get_safe_count("SELECT COUNT(*) FROM actividades")
    
    cursor.close()
    
    stats = {
        'pendientes': pendientes,
        'en_progreso': en_progreso,
        'completadas': completadas,
        'total': total_count
    }

    return render_template('actividades/index_educational.html', 
                          actividades=actividades, 
                          potreros=potreros,
                          tipos_actividad=tipos_actividad,
                          estados=estados,
                          page=page,
                          pages=pages,
                          total=total,
                          stats=stats,
                          fecha_inicio=fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else '',
                          fecha_fin=fecha_fin.strftime('%Y-%m-%d') if fecha_fin else '',
                          potrero_id=potrero_id,
                          tipo_actividad=tipo_actividad,
                          estado=estado)

@actividades_bp.route('/nueva_educativo', methods=['GET', 'POST'])
@login_required
def nueva_educational():
    """Ruta para crear actividad en modo educativo"""
    if request.method == 'POST':
        # Same POST logic as nueva() but can be customized for educational mode
        potrero_id = request.form.get('potrero_id')
        fecha = request.form.get('fecha')
        tipo_actividad = request.form.get('tipo_actividad')
        descripcion = request.form.get('descripcion')
        responsable = request.form.get('responsable', '')
        costo = request.form.get('costo', '')
        estado = request.form.get('estado', 'Pendiente')
        
        # Validar campos obligatorios
        if not potrero_id or not fecha or not tipo_actividad or not descripcion:
            flash('Los campos Potrero, Fecha, Tipo de Actividad y Descripción son obligatorios', 'danger')
            
            # Get data for template
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre, hectareas, tipo_pasto FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new_educational.html', 
                                   potreros=potreros, 
                                   tipos_actividad=tipos_actividad, 
                                   estados=estados)
        
        # Validar tipo de actividad
        tipos_actividad_permitidos = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
        if tipo_actividad not in tipos_actividad_permitidos:
            flash(f'Tipo de actividad no válido: "{tipo_actividad}"', 'danger')
            
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre, hectareas, tipo_pasto FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            tipos_actividad = tipos_actividad_permitidos
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new_educational.html', 
                                  potreros=potreros, 
                                  tipos_actividad=tipos_actividad, 
                                  estados=estados)
        
        # Convertir tipos
        try:
            potrero_id = int(potrero_id)
            fecha = datetime.strptime(fecha, '%Y-%m-%d')
            
            if costo:
                costo = float(costo)
            else:
                costo = None
                
        except (ValueError, TypeError):
            flash('Valores inválidos para los campos', 'danger')
            
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre, hectareas, tipo_pasto FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new_educational.html', 
                                  potreros=potreros, 
                                  tipos_actividad=tipos_actividad, 
                                  estados=estados)
        
        # Crear actividad
        actividad_id = Actividad.create(
            potrero_id, fecha, tipo_actividad, descripcion, 
            responsable if responsable else None, 
            costo, 
            estado
        )
        
        if actividad_id:
            flash('Actividad creada exitosamente con IA', 'success')
            return redirect(url_for('actividades.index_educational'))
        else:
            flash('Error al crear la actividad', 'danger')
    
    # GET request - show form
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre, hectareas, tipo_pasto FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
    estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
    
    return render_template('actividades/new_educational.html', 
                          potreros=potreros, 
                          tipos_actividad=tipos_actividad, 
                          estados=estados)

@actividades_bp.route('/nueva', methods=['GET', 'POST'])
@login_required
def nueva():
    if request.method == 'POST':
        # Obtener datos del formulario
        potrero_id = request.form.get('potrero_id')
        fecha = request.form.get('fecha')
        tipo_actividad = request.form.get('tipo_actividad')
        descripcion = request.form.get('descripcion')
        responsable = request.form.get('responsable', '')
        costo = request.form.get('costo', '')
        estado = request.form.get('estado', 'Pendiente')
        
        # Validar campos obligatorios
        if not potrero_id or not fecha or not tipo_actividad or not descripcion:
            flash('Los campos Potrero, Fecha, Tipo de Actividad y Descripción son obligatorios', 'danger')
            
            # Obtener todos los potreros para el selector
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            # Tipos de actividades
            tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
            
            # Estados
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new.html', 
                                   potreros=potreros, 
                                   tipos_actividad=tipos_actividad, 
                                   estados=estados)
        
        # Validar que tipo_actividad sea uno de los valores permitidos
        tipos_actividad_permitidos = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
        if tipo_actividad not in tipos_actividad_permitidos:
            flash(f'Tipo de actividad no válido: "{tipo_actividad}". Valores permitidos: {", ".join(tipos_actividad_permitidos)}', 'danger')
            
            # Obtener todos los potreros para el selector
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            # Tipos de actividades
            tipos_actividad = tipos_actividad_permitidos
            
            # Estados
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new.html', 
                                  potreros=potreros, 
                                  tipos_actividad=tipos_actividad, 
                                  estados=estados)
        
        # Convertir tipos
        try:
            potrero_id = int(potrero_id)
            fecha = datetime.strptime(fecha, '%Y-%m-%d')
            
            # Convertir costo a float si existe
            if costo:
                costo = float(costo)
            else:
                costo = None
            
        except (ValueError, TypeError):
            flash('Valores inválidos para los campos', 'danger')
            
            # Obtener todos los potreros para el selector
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            # Tipos de actividades
            tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
            
            # Estados
            estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
            
            return render_template('actividades/new.html', 
                                  potreros=potreros, 
                                  tipos_actividad=tipos_actividad, 
                                  estados=estados)
        
        # Crear actividad en la base de datos
        actividad_id = Actividad.create(
            potrero_id, fecha, tipo_actividad, descripcion, 
            responsable if responsable else None, 
            costo, 
            estado
        )
        
        if actividad_id:
            flash('Actividad registrada exitosamente', 'success')
            return redirect(url_for('actividades.index'))
        else:
            flash('Error al registrar la actividad', 'danger')
    
    # Obtener todos los potreros para el selector
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    # Tipos de actividades
    tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
    
    # Estados
    estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
    
    return render_template('actividades/new.html', 
                          potreros=potreros, 
                          tipos_actividad=tipos_actividad, 
                          estados=estados)

@actividades_bp.route('/<int:actividad_id>/editar', methods=['GET', 'POST'])
@login_required
def editar(actividad_id):
    # Obtener actividad
    actividad = Actividad.get_by_id(actividad_id)
    if not actividad:
        flash('Actividad no encontrada', 'danger')
        return redirect(url_for('actividades.index'))
    
    if request.method == 'POST':
        # Obtener datos del formulario
        potrero_id = request.form.get('potrero_id')
        fecha = request.form.get('fecha')
        tipo_actividad = request.form.get('tipo_actividad')
        descripcion = request.form.get('descripcion')
        responsable = request.form.get('responsable', '')
        costo = request.form.get('costo', '')
        estado = request.form.get('estado')
        
        # Validar campos obligatorios
        if not potrero_id or not fecha or not tipo_actividad or not descripcion:
            flash('Los campos Potrero, Fecha, Tipo de Actividad y Descripción son obligatorios', 'danger')
            return redirect(url_for('actividades.editar', actividad_id=actividad_id))
        
        # Validar que tipo_actividad sea uno de los valores permitidos
        tipos_actividad_permitidos = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
        if tipo_actividad not in tipos_actividad_permitidos:
            flash(f'Tipo de actividad no válido: "{tipo_actividad}". Valores permitidos: {", ".join(tipos_actividad_permitidos)}', 'danger')
            return redirect(url_for('actividades.editar', actividad_id=actividad_id))
        
        # Convertir tipos
        try:
            potrero_id = int(potrero_id)
            fecha = datetime.strptime(fecha, '%Y-%m-%d')
            
            # Convertir costo a float si existe
            if costo:
                costo = float(costo)
            else:
                costo = None
            
        except (ValueError, TypeError):
            flash('Valores inválidos para los campos', 'danger')
            return redirect(url_for('actividades.editar', actividad_id=actividad_id))
        
        # Actualizar actividad en la base de datos
        success = Actividad.update(
            actividad_id, potrero_id, fecha, tipo_actividad, descripcion, 
            responsable if responsable else None, 
            costo, 
            estado
        )
        
        # Siempre redirigir al índice, ya que la actualización probablemente fue exitosa
        # incluso si no hubo cambios reales en la base de datos
        if success:  # Eliminar "or True" para mostrar el mensaje correcto según el resultado
            flash('Actividad actualizada exitosamente', 'success')
        else:
            flash('Posible error al actualizar. Por favor, verifique los datos.', 'warning')
            
        return redirect(url_for('actividades.index'))
    
    # Obtener todos los potreros para el selector
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    # Tipos de actividades
    tipos_actividad = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
    
    # Estados
    estados = ['Pendiente', 'En Progreso', 'Completada', 'Cancelada']
    
    return render_template('actividades/edit.html', 
                          actividad=actividad,
                          potreros=potreros, 
                          tipos_actividad=tipos_actividad, 
                          estados=estados)

@actividades_bp.route('/<int:actividad_id>/delete', methods=['POST'])
@login_required
def delete(actividad_id):
    """Eliminar actividad"""
    success = Actividad.delete(actividad_id)
    if success:
        flash('Actividad eliminada exitosamente', 'success')
    else:
        flash('Error al eliminar la actividad', 'danger')
    return redirect(url_for('actividades.index')) 