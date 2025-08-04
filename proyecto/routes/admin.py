from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_required, current_user
from datetime import datetime
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import User
from db import mysql

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/')
@login_required
def index():
    """Página principal del módulo de administración"""
    try:
        cursor = mysql.connection.cursor()
        
        # Obtener estadísticas del sistema
        cursor.execute("SELECT COUNT(*) as total FROM users")
        total_usuarios = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM fincas WHERE activa = TRUE")
        total_fincas = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM potreros")
        total_potreros = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM aforos WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")
        aforos_mes = cursor.fetchone()['total']
        
        # Obtener fincas para el selector
        cursor.execute("SELECT id, nombre, area_total, propietario FROM fincas WHERE activa = TRUE ORDER BY nombre")
        fincas = cursor.fetchall()
        
        # Obtener roles
        cursor.execute("SELECT * FROM roles ORDER BY nombre")
        roles = cursor.fetchall()
        
        # Obtener finca actual del usuario
        finca_actual = None
        if current_user.finca_actual_id:
            cursor.execute("SELECT * FROM fincas WHERE id = %s", (current_user.finca_actual_id,))
            finca_actual = cursor.fetchone()
        
        cursor.close()
        
        stats = {
            'total_usuarios': total_usuarios,
            'total_fincas': total_fincas,
            'total_potreros': total_potreros,
            'aforos_mes': aforos_mes
        }
        
        estadisticas = {
            'total_fincas': total_fincas,
            'usuarios_activos': total_usuarios,
            'roles_admin': len(roles),
            'fincas_activas': total_fincas
        }
        
        # Obtener roles del usuario actual (simulado)
        roles_usuario = []
        
        return render_template('admin/index.html', 
                             stats=stats,
                             fincas=fincas,
                             roles=roles,
                             finca_actual=finca_actual,
                             total_usuarios=total_usuarios,
                             estadisticas=estadisticas,
                             roles_usuario=roles_usuario)
        
    except Exception as e:
        flash(f'Error al cargar estadísticas: {str(e)}', 'error')
        return render_template('admin/index.html', 
                             stats={},
                             fincas=[],
                             roles=[],
                             finca_actual=None,
                             total_usuarios=0,
                             estadisticas={},
                             roles_usuario=[])

@admin_bp.route('/usuarios')
@login_required
def usuarios():
    """Gestión de usuarios"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT u.*, f.nombre as finca_nombre 
            FROM users u 
            LEFT JOIN fincas f ON u.finca_actual_id = f.id 
            ORDER BY u.nombre
        """)
        usuarios = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/usuarios/index.html', usuarios=usuarios)
        
    except Exception as e:
        flash(f'Error al cargar usuarios: {str(e)}', 'error')
        return render_template('admin/usuarios/index.html', usuarios=[])

@admin_bp.route('/usuarios/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo_usuario():
    """Crear nuevo usuario"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            email = request.form.get('email').strip()
            password = request.form.get('password')
            finca_id = request.form.get('finca_id')
            
            if not nombre or not email or not password:
                flash('Todos los campos son obligatorios', 'error')
                raise ValueError('Campos incompletos')
            
            # Verificar si el email ya existe
            existing_user = User.get_by_email(email)
            if existing_user:
                flash('Este correo electrónico ya está registrado', 'error')
                raise ValueError('Email duplicado')
            
            # Crear usuario
            user_id = User.create(nombre, email, password)
            
            if user_id and finca_id:
                # Asignar finca si fue seleccionada
                cursor = mysql.connection.cursor()
                cursor.execute("UPDATE users SET finca_actual_id = %s WHERE id = %s", 
                             (finca_id, user_id))
                mysql.connection.commit()
                cursor.close()
            
            if user_id:
                flash('Usuario creado exitosamente', 'success')
                return redirect(url_for('admin.usuarios'))
            else:
                flash('Error al crear el usuario', 'error')
                
        except Exception as e:
            flash(f'Error al procesar usuario: {str(e)}', 'error')
    
    # Obtener lista de fincas
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM fincas WHERE activa = TRUE ORDER BY nombre")
        fincas = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/usuarios/nuevo.html', fincas=fincas)
        
    except Exception as e:
        flash(f'Error al cargar formulario: {str(e)}', 'error')
        return render_template('admin/usuarios/nuevo.html', fincas=[])

@admin_bp.route('/usuarios/<int:user_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_usuario(user_id):
    """Editar usuario"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            email = request.form.get('email').strip()
            finca_id = request.form.get('finca_id')
            
            if not nombre or not email:
                flash('Nombre y email son obligatorios', 'error')
                raise ValueError('Campos incompletos')
            
            cursor = mysql.connection.cursor()
            cursor.execute("""
                UPDATE users SET nombre = %s, email = %s, finca_actual_id = %s 
                WHERE id = %s
            """, (nombre, email, finca_id, user_id))
            mysql.connection.commit()
            
            if cursor.rowcount > 0:
                flash('Usuario actualizado exitosamente', 'success')
                cursor.close()
                return redirect(url_for('admin.usuarios'))
            else:
                flash('No se encontró el usuario a actualizar', 'error')
            
            cursor.close()
                
        except Exception as e:
            flash(f'Error al actualizar usuario: {str(e)}', 'error')
    
    try:
        # Obtener usuario actual
        usuario = User.get_by_id(user_id)
        if not usuario:
            flash('Usuario no encontrado', 'error')
            return redirect(url_for('admin.usuarios'))
        
        # Obtener lista de fincas
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM fincas WHERE activa = TRUE ORDER BY nombre")
        fincas = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/usuarios/editar.html', 
                             usuario=usuario, fincas=fincas)
                             
    except Exception as e:
        flash(f'Error al cargar usuario: {str(e)}', 'error')
        return redirect(url_for('admin.usuarios'))

@admin_bp.route('/fincas')
@login_required
def fincas():
    """Gestión de fincas"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT f.*, 
                   COUNT(p.id) as total_potreros,
                   COUNT(u.id) as total_usuarios
            FROM fincas f 
            LEFT JOIN potreros p ON f.id = p.finca_id
            LEFT JOIN users u ON f.id = u.finca_actual_id
            GROUP BY f.id
            ORDER BY f.nombre
        """)
        fincas = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/fincas/index.html', fincas=fincas)
        
    except Exception as e:
        flash(f'Error al cargar fincas: {str(e)}', 'error')
        return render_template('admin/fincas/index.html', fincas=[])

@admin_bp.route('/fincas/nueva', methods=['GET', 'POST'])
@login_required
def nueva_finca():
    """Crear nueva finca"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            ubicacion = request.form.get('ubicacion', '').strip()
            hectareas = float(request.form.get('hectareas', 0))
            descripcion = request.form.get('descripcion', '').strip()
            
            if not nombre:
                flash('El nombre de la finca es obligatorio', 'error')
                raise ValueError('Nombre requerido')
            
            cursor = mysql.connection.cursor()
            cursor.execute("""
                INSERT INTO fincas (nombre, ubicacion, hectareas_totales, descripcion, activa)
                VALUES (%s, %s, %s, %s, TRUE)
            """, (nombre, ubicacion, hectareas, descripcion))
            mysql.connection.commit()
            
            finca_id = cursor.lastrowid
            cursor.close()
            
            if finca_id:
                flash('Finca creada exitosamente', 'success')
                return redirect(url_for('admin.fincas'))
            else:
                flash('Error al crear la finca', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar finca: {str(e)}', 'error')
    
    return render_template('admin/fincas/nueva.html')

@admin_bp.route('/fincas/<int:finca_id>/editar', methods=['GET', 'POST'])
@login_required
def editar_finca(finca_id):
    """Editar finca"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            ubicacion = request.form.get('ubicacion', '').strip()
            hectareas = float(request.form.get('hectareas', 0))
            descripcion = request.form.get('descripcion', '').strip()
            activa = request.form.get('activa') == '1'
            
            if not nombre:
                flash('El nombre de la finca es obligatorio', 'error')
                raise ValueError('Nombre requerido')
            
            cursor = mysql.connection.cursor()
            cursor.execute("""
                UPDATE fincas SET nombre = %s, ubicacion = %s, hectareas_totales = %s, 
                                 descripcion = %s, activa = %s
                WHERE id = %s
            """, (nombre, ubicacion, hectareas, descripcion, activa, finca_id))
            mysql.connection.commit()
            
            if cursor.rowcount > 0:
                flash('Finca actualizada exitosamente', 'success')
                cursor.close()
                return redirect(url_for('admin.fincas'))
            else:
                flash('No se encontró la finca a actualizar', 'error')
            
            cursor.close()
                
        except Exception as e:
            flash(f'Error al actualizar finca: {str(e)}', 'error')
    
    try:
        # Obtener finca actual
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM fincas WHERE id = %s", (finca_id,))
        finca = cursor.fetchone()
        cursor.close()
        
        if not finca:
            flash('Finca no encontrada', 'error')
            return redirect(url_for('admin.fincas'))
        
        return render_template('admin/fincas/editar.html', finca=finca)
                             
    except Exception as e:
        flash(f'Error al cargar finca: {str(e)}', 'error')
        return redirect(url_for('admin.fincas'))

@admin_bp.route('/configuracion')
@login_required
def configuracion():
    """Configuración del sistema"""
    try:
        cursor = mysql.connection.cursor()
        
        # Obtener configuraciones del sistema (si existieran en una tabla de configuración)
        # Por ahora mostraremos configuraciones básicas
        configs = {
            'app_name': 'Sistema de Gestión de Pastoreo',
            'version': '2.0',
            'timezone': 'America/Bogota',
            'max_file_size': '16MB',
            'session_timeout': '24 horas'
        }
        
        cursor.close()
        
        return render_template('admin/configuracion.html', configs=configs)
        
    except Exception as e:
        flash(f'Error al cargar configuración: {str(e)}', 'error')
        return render_template('admin/configuracion.html', configs={})

@admin_bp.route('/selector-finca')
@login_required
def selector_finca():
    """Selector de finca actual para el usuario"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM fincas WHERE activa = TRUE ORDER BY nombre")
        fincas = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/selector_finca.html', fincas=fincas)
        
    except Exception as e:
        flash(f'Error al cargar fincas: {str(e)}', 'error')
        return render_template('admin/selector_finca.html', fincas=[])

@admin_bp.route('/cambiar-finca', methods=['POST'])
@login_required
def cambiar_finca():
    """Cambiar finca actual del usuario"""
    try:
        finca_id = request.form.get('finca_id')
        
        if not finca_id:
            flash('Debe seleccionar una finca', 'error')
            return redirect(url_for('admin.selector_finca'))
        
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE users SET finca_actual_id = %s WHERE id = %s", 
                      (finca_id, current_user.id))
        mysql.connection.commit()
        cursor.close()
        
        flash('Finca cambiada exitosamente', 'success')
        return redirect(url_for('dashboard_simple.index'))
        
    except Exception as e:
        flash(f'Error al cambiar finca: {str(e)}', 'error')
        return redirect(url_for('admin.selector_finca'))

@admin_bp.route('/roles')
@login_required
def roles():
    """Gestión de roles"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM roles ORDER BY nombre")
        roles = cursor.fetchall()
        cursor.close()
        
        return render_template('admin/roles/index.html', roles=roles)
        
    except Exception as e:
        flash(f'Error al cargar roles: {str(e)}', 'error')
        return render_template('admin/roles/index.html', roles=[])

@admin_bp.route('/roles/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo_rol():
    """Crear nuevo rol"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            descripcion = request.form.get('descripcion', '').strip()
            
            if not nombre:
                flash('El nombre del rol es obligatorio', 'error')
                raise ValueError('Nombre requerido')
            
            cursor = mysql.connection.cursor()
            cursor.execute("""
                INSERT INTO roles (nombre, descripcion)
                VALUES (%s, %s)
            """, (nombre, descripcion))
            mysql.connection.commit()
            
            rol_id = cursor.lastrowid
            cursor.close()
            
            if rol_id:
                flash('Rol creado exitosamente', 'success')
                return redirect(url_for('admin.roles'))
            else:
                flash('Error al crear el rol', 'error')
                
        except Exception as e:
            flash(f'Error al procesar rol: {str(e)}', 'error')
    
    return render_template('admin/roles/nuevo.html')

@admin_bp.route('/dashboard')
@login_required
def dashboard():
    """Dashboard avanzado"""
    try:
        cursor = mysql.connection.cursor()
        
        # Estadísticas avanzadas
        cursor.execute("SELECT COUNT(*) as total FROM fincas WHERE activa = TRUE")
        total_fincas = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM users")
        usuarios_activos = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM roles")
        roles_admin = cursor.fetchone()['total']
        
        cursor.close()
        
        estadisticas = {
            'total_fincas': total_fincas,
            'usuarios_activos': usuarios_activos,
            'roles_admin': roles_admin,
            'fincas_activas': total_fincas
        }
        
        return render_template('admin/dashboard.html', estadisticas=estadisticas)
        
    except Exception as e:
        flash(f'Error al cargar dashboard: {str(e)}', 'error')
        return render_template('admin/dashboard.html', estadisticas={})