from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required, current_user
from datetime import datetime, timedelta
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import mysql

ganado_bp = Blueprint('ganado', __name__, url_prefix='/ganado')

@ganado_bp.route('/')
@login_required
def index():
    """Redirigir a la gestión de lotes"""
    return redirect(url_for('ganado.lotes'))

@ganado_bp.route('/lotes')
@login_required
def lotes():
    """Gestión de lotes de ganado"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT l.*, p.nombre as potrero_nombre,
                   COUNT(m.id) as total_movimientos,
                   MAX(m.fecha_ingreso) as ultimo_movimiento
            FROM lotes_ganado_v2 l
            LEFT JOIN potreros p ON l.potrero_actual_id = p.id
            LEFT JOIN movimientos_ganado_v2 m ON l.id = m.lote_id
            GROUP BY l.id
            ORDER BY l.nombre
        """)
        lotes = cursor.fetchall()
        cursor.close()
        
        return render_template('ganado/lotes.html', lotes=lotes)
        
    except Exception as e:
        flash(f'Error al cargar lotes: {str(e)}', 'error')
        return render_template('ganado/lotes.html', lotes=[])

@ganado_bp.route('/lotes/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo_lote():
    """Crear nuevo lote de ganado"""
    if request.method == 'POST':
        try:
            nombre = request.form.get('nombre').strip()
            numero_animales = int(request.form.get('numero_animales'))
            peso_promedio = float(request.form.get('peso_promedio', 0))
            raza = request.form.get('raza', '').strip()
            edad_promedio = int(request.form.get('edad_promedio', 0))
            potrero_id = request.form.get('potrero_id')
            observaciones = request.form.get('observaciones', '').strip()
            
            if not nombre or numero_animales <= 0:
                flash('Nombre y número de animales son obligatorios', 'error')
                raise ValueError('Datos incompletos')
            
            cursor = mysql.connection.cursor()
            cursor.execute("""
                INSERT INTO lotes (nombre, numero_animales, peso_promedio, raza, 
                                 edad_promedio, potrero_actual_id, observaciones, 
                                 fecha_creacion, usuario_creacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (nombre, numero_animales, peso_promedio, raza, edad_promedio,
                  potrero_id, observaciones, datetime.now(), current_user.id))
            
            lote_id = cursor.lastrowid
            mysql.connection.commit()
            
            # Si se asignó a un potrero, crear movimiento inicial
            if potrero_id and lote_id:
                cursor.execute("""
                    INSERT INTO movimientos_ganado (lote_id, potrero_origen_id, potrero_destino_id,
                                                   fecha_ingreso, motivo, usuario_responsable)
                    VALUES (%s, NULL, %s, %s, 'Ingreso inicial', %s)
                """, (lote_id, potrero_id, datetime.now(), current_user.id))
                mysql.connection.commit()
            
            cursor.close()
            
            if lote_id:
                flash('Lote creado exitosamente', 'success')
                return redirect(url_for('ganado.lotes'))
            else:
                flash('Error al crear el lote', 'error')
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar lote: {str(e)}', 'error')
    
    # Obtener lista de potreros
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        cursor.close()
        
        return render_template('ganado/nuevo_lote.html', potreros=potreros)
        
    except Exception as e:
        flash(f'Error al cargar formulario: {str(e)}', 'error')
        return render_template('ganado/nuevo_lote.html', potreros=[])

@ganado_bp.route('/lotes/<int:lote_id>')
@login_required
def detalle_lote(lote_id):
    """Ver detalles de un lote"""
    try:
        cursor = mysql.connection.cursor()
        
        # Obtener lote
        cursor.execute("""
            SELECT l.*, p.nombre as potrero_nombre, p.hectareas
            FROM lotes_ganado_v2 l
            LEFT JOIN potreros p ON l.potrero_actual_id = p.id
            WHERE l.id = %s
        """, (lote_id,))
        lote = cursor.fetchone()
        
        if not lote:
            flash('Lote no encontrado', 'error')
            return redirect(url_for('ganado.lotes'))
        
        # Obtener historial de movimientos
        cursor.execute("""
            SELECT m.*, 
                   po.nombre as potrero_origen,
                   pd.nombre as potrero_destino,
                   u.nombre as usuario_nombre
            FROM movimientos_ganado_v2 m
            LEFT JOIN potreros po ON m.potrero_origen_id = po.id
            LEFT JOIN potreros pd ON m.potrero_destino_id = pd.id
            LEFT JOIN users u ON m.usuario_responsable = u.id
            WHERE m.lote_id = %s
            ORDER BY m.fecha_ingreso DESC
        """, (lote_id,))
        movimientos = cursor.fetchall()
        
        cursor.close()
        
        return render_template('ganado/detalle_lote.html',
                             lote=lote,
                             movimientos=movimientos)
                             
    except Exception as e:
        flash(f'Error al cargar lote: {str(e)}', 'error')
        return redirect(url_for('ganado.lotes'))

@ganado_bp.route('/movimientos')
@login_required
def movimientos():
    """Historial de movimientos de ganado"""
    page = request.args.get('page', 1, type=int)
    lote_id = request.args.get('lote_id')
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    
    try:
        cursor = mysql.connection.cursor()
        
        # Construir consulta con filtros
        query = """
            SELECT m.*, l.nombre as lote_nombre,
                   po.nombre as potrero_origen,
                   pd.nombre as potrero_destino,
                   u.nombre as usuario_nombre
            FROM movimientos_ganado_v2 m
            JOIN lotes l ON m.lote_id = l.id
            LEFT JOIN potreros po ON m.potrero_origen_id = po.id
            LEFT JOIN potreros pd ON m.potrero_destino_id = pd.id
            LEFT JOIN users u ON m.usuario_responsable = u.id
            WHERE 1=1
        """
        params = []
        
        if lote_id:
            query += " AND m.lote_id = %s"
            params.append(lote_id)
        
        if fecha_inicio:
            query += " AND m.fecha_ingreso >= %s"
            params.append(datetime.strptime(fecha_inicio, '%Y-%m-%d'))
        
        if fecha_fin:
            query += " AND m.fecha_ingreso <= %s"
            params.append(datetime.strptime(fecha_fin, '%Y-%m-%d'))
        
        query += " ORDER BY m.fecha_ingreso DESC LIMIT %s OFFSET %s"
        per_page = 20
        offset = (page - 1) * per_page
        params.extend([per_page, offset])
        
        cursor.execute(query, params)
        movimientos = cursor.fetchall()
        
        # Contar total para paginación
        count_query = query.replace("SELECT m.*, l.nombre as lote_nombre, po.nombre as potrero_origen, pd.nombre as potrero_destino, u.nombre as usuario_nombre", "SELECT COUNT(*)")
        count_query = count_query.split("ORDER BY")[0]  # Remover ORDER BY y LIMIT
        cursor.execute(count_query, params[:-2])  # Excluir LIMIT y OFFSET
        total = cursor.fetchone()['COUNT(*)']
        
        # Obtener lista de lotes para filtro
        cursor.execute("SELECT id, nombre FROM lotes_ganado_v2_ganado_v2 ORDER BY nombre")
        lotes = cursor.fetchall()
        
        cursor.close()
        
        pages = (total + per_page - 1) // per_page
        
        return render_template('ganado/movimientos.html',
                             movimientos=movimientos,
                             lotes=lotes,
                             page=page,
                             pages=pages,
                             total=total,
                             lote_id=lote_id or '',
                             fecha_inicio=fecha_inicio or '',
                             fecha_fin=fecha_fin or '')
                             
    except Exception as e:
        flash(f'Error al cargar movimientos: {str(e)}', 'error')
        return render_template('ganado/movimientos.html',
                             movimientos=[],
                             lotes=[],
                             page=1,
                             pages=1,
                             total=0,
                             lote_id='',
                             fecha_inicio='',
                             fecha_fin='')

@ganado_bp.route('/movimientos/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo_movimiento():
    """Crear nuevo movimiento de ganado"""
    if request.method == 'POST':
        try:
            lote_id = int(request.form.get('lote_id'))
            potrero_destino_id = int(request.form.get('potrero_destino_id'))
            fecha_ingreso = datetime.strptime(request.form.get('fecha_ingreso'), '%Y-%m-%d')
            motivo = request.form.get('motivo', '').strip()
            observaciones = request.form.get('observaciones', '').strip()
            
            cursor = mysql.connection.cursor()
            
            # Obtener potrero actual del lote
            cursor.execute("SELECT potrero_actual_id FROM lotes_ganado_v2_ganado_v2 WHERE id = %s", (lote_id,))
            lote = cursor.fetchone()
            potrero_origen_id = lote['potrero_actual_id'] if lote else None
            
            # Crear movimiento
            cursor.execute("""
                INSERT INTO movimientos_ganado (lote_id, potrero_origen_id, potrero_destino_id,
                                               fecha_ingreso, motivo, observaciones, usuario_responsable)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (lote_id, potrero_origen_id, potrero_destino_id, fecha_ingreso,
                  motivo, observaciones, current_user.id))
            
            # Actualizar potrero actual del lote
            cursor.execute("UPDATE lotes SET potrero_actual_id = %s WHERE id = %s",
                          (potrero_destino_id, lote_id))
            
            mysql.connection.commit()
            cursor.close()
            
            flash('Movimiento registrado exitosamente', 'success')
            return redirect(url_for('ganado.movimientos'))
                
        except ValueError as e:
            flash(f'Error en los datos ingresados: {str(e)}', 'error')
        except Exception as e:
            flash(f'Error al procesar movimiento: {str(e)}', 'error')
    
    try:
        cursor = mysql.connection.cursor()
        
        # Obtener lotes
        cursor.execute("SELECT id, nombre FROM lotes_ganado_v2_ganado_v2 ORDER BY nombre")
        lotes = cursor.fetchall()
        
        # Obtener potreros
        cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
        potreros = cursor.fetchall()
        
        cursor.close()
        
        return render_template('ganado/nuevo_movimiento.html',
                             lotes=lotes,
                             potreros=potreros)
                             
    except Exception as e:
        flash(f'Error al cargar formulario: {str(e)}', 'error')
        return render_template('ganado/nuevo_movimiento.html',
                             lotes=[],
                             potreros=[])

@ganado_bp.route('/balance-forrajero')
@login_required
def balance_forrajero():
    """Calcular balance forrajero"""
    try:
        cursor = mysql.connection.cursor()
        
        # Obtener datos de lotes y potreros
        cursor.execute("""
            SELECT l.*, p.nombre as potrero_nombre, p.hectareas,
                   (l.numero_animales * l.peso_promedio) as peso_total_lote
            FROM lotes_ganado_v2 l
            LEFT JOIN potreros p ON l.potrero_actual_id = p.id
            WHERE l.potrero_actual_id IS NOT NULL
        """)
        lotes_en_potreros = cursor.fetchall()
        
        # Obtener datos de aforos recientes por potrero
        cursor.execute("""
            SELECT potrero_id, 
                   AVG(materia_seca) as ms_promedio,
                   MAX(fecha) as ultima_medicion
            FROM aforos 
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY potrero_id
        """)
        aforos_recientes = cursor.fetchall()
        cursor.close()
        
        # Crear diccionario de aforos por potrero
        aforos_dict = {a['potrero_id']: a for a in aforos_recientes}
        
        # Calcular balance para cada lote
        balances = []
        for lote in lotes_en_potreros:
            potrero_id = lote['potrero_actual_id']
            aforo = aforos_dict.get(potrero_id)
            
            if aforo and lote['hectareas']:
                # Cálculos de balance forrajero
                peso_total = lote['peso_total_lote']
                consumo_diario = peso_total * 0.025  # 2.5% del peso vivo
                ms_disponible = aforo['ms_promedio'] * lote['hectareas']
                dias_disponibles = ms_disponible / consumo_diario if consumo_diario > 0 else 0
                
                balance = {
                    'lote_nombre': lote['nombre'],
                    'potrero_nombre': lote['potrero_nombre'],
                    'numero_animales': lote['numero_animales'],
                    'peso_total': peso_total,
                    'consumo_diario': consumo_diario,
                    'ms_disponible': ms_disponible,
                    'dias_disponibles': dias_disponibles,
                    'ultima_medicion': aforo['ultima_medicion'],
                    'estado': 'Crítico' if dias_disponibles < 7 else 'Atención' if dias_disponibles < 15 else 'Bueno'
                }
                balances.append(balance)
        
        return render_template('ganado/balance_forrajero.html', balances=balances)
        
    except Exception as e:
        flash(f'Error al calcular balance forrajero: {str(e)}', 'error')
        return render_template('ganado/balance_forrajero.html', balances=[])

@ganado_bp.route('/api/lotes-potrero/<int:potrero_id>')
@login_required
def api_lotes_potrero(potrero_id):
    """API para obtener lotes en un potrero específico"""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT id, nombre, numero_animales 
            FROM lotes_ganado_v2 
            WHERE potrero_actual_id = %s
        """, (potrero_id,))
        lotes = cursor.fetchall()
        cursor.close()
        
        return jsonify({
            'success': True,
            'lotes': lotes
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500