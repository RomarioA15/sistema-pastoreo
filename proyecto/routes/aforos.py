from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify
from flask_login import login_required
from datetime import datetime
import json
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from proyecto.models.models import Aforo, Potrero, MuestraAforo
from db import mysql


aforos_bp = Blueprint('aforos', __name__, url_prefix='/aforos')

@aforos_bp.route('/')
@login_required
def index():
    page = request.args.get('page', 1, type=int)
    
    # Filtros
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')
    potrero_id = request.args.get('potrero_id')
    
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
    
    # Obtener aforos filtrados
    aforos, total = Aforo.get_all(
        page=page, 
        fecha_inicio=fecha_inicio, 
        fecha_fin=fecha_fin, 
        potrero_id=potrero_id
    )
    
    # Calcular páginas para paginación
    per_page = 10
    pages = (total + per_page - 1) // per_page
    
    # Obtener todos los potreros para el selector de filtros
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    return render_template('aforos/index.html', 
                          aforos=aforos, 
                          potreros=potreros,
                          page=page,
                          pages=pages,
                          total=total,
                          fecha_inicio=fecha_inicio.strftime('%Y-%m-%d') if fecha_inicio else '',
                          fecha_fin=fecha_fin.strftime('%Y-%m-%d') if fecha_fin else '',
                          potrero_id=potrero_id)

@aforos_bp.route('/nuevo', methods=['GET', 'POST'])
@login_required
def nuevo():
    if request.method == 'POST':
        # Determinar si es creación del aforo base o guardado completo
        action = request.form.get('action', 'create_base')
        
        if action == 'create_complete':
            # Procesar formulario completo con muestras
            potrero_id = request.form.get('potrero_id')
            fecha = request.form.get('fecha')
            observaciones = request.form.get('observaciones', '')
            
            # Validar campos obligatorios
            if not potrero_id or not fecha:
                flash('Los campos Potrero y Fecha son obligatorios', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            try:
                potrero_id = int(potrero_id)
                fecha = datetime.strptime(fecha, '%Y-%m-%d')
            except (ValueError, TypeError):
                flash('Valores inválidos para los campos básicos', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            # Procesar muestras
            muestras_data = []
            form_keys = [key for key in request.form.keys() if key.startswith('muestras[')]
            
            # Agrupar muestras por índice
            muestras_indices = set()
            for key in form_keys:
                index = int(key.split('[')[1].split(']')[0])
                muestras_indices.add(index)
            
            total_peso_verde = 0
            total_peso_seco = 0
            total_area = 0
            muestras_validas = 0
            muestras_con_seco = 0
            
            for index in sorted(muestras_indices):
                area_key = f'muestras[{index}][area_m2]'
                peso_verde_key = f'muestras[{index}][peso_verde_g]'
                peso_seco_key = f'muestras[{index}][peso_seco_g]'
                
                area_m2 = float(request.form.get(area_key, 1))
                peso_verde_g = request.form.get(peso_verde_key)
                peso_seco_g = request.form.get(peso_seco_key)
                
                if peso_verde_g and float(peso_verde_g) > 0:
                    peso_verde_g = float(peso_verde_g)
                    peso_seco_g = float(peso_seco_g) if peso_seco_g else 0
                    
                    # Acumular para promedios
                    total_peso_verde += (peso_verde_g / area_m2) * 10  # Convert to kg/ha
                    total_area += area_m2
                    muestras_validas += 1
                    
                    if peso_seco_g > 0:
                        total_peso_seco += (peso_seco_g / area_m2) * 10  # Convert to kg/ha
                        muestras_con_seco += 1
                    
                    muestras_data.append({
                        'area_m2': area_m2,
                        'peso_verde_g': peso_verde_g,
                        'peso_seco_g': peso_seco_g if peso_seco_g > 0 else None
                    })
            
            if muestras_validas == 0:
                flash('Debe ingresar al menos una muestra con peso verde válido', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            # Calcular promedios
            materia_verde_promedio = total_peso_verde / muestras_validas
            materia_seca_promedio = (total_peso_seco / muestras_con_seco) if muestras_con_seco > 0 else 0
            porcentaje_ms = (materia_seca_promedio / materia_verde_promedio * 100) if materia_verde_promedio > 0 else 0
            
            # Obtener hectáreas del potrero
            cursor = mysql.connection.cursor()
            cursor.execute("SELECT hectareas FROM potreros WHERE id = %s", (potrero_id,))
            potrero = cursor.fetchone()
            hectareas = float(potrero['hectareas']) if potrero else 0
            
            # Calcular totales
            materia_verde_total = materia_verde_promedio * hectareas
            materia_seca_total = materia_seca_promedio * hectareas
            
            try:
                # Crear aforo principal
                aforo_id = Aforo.create(
                    potrero_id, fecha, materia_verde_promedio, porcentaje_ms, materia_seca_promedio, 
                    observaciones, materia_verde_total, materia_seca_total, None, None, None
                )
                
                if aforo_id:
                    # Crear muestras individuales
                    for i, muestra in enumerate(muestras_data):
                        muestra_id = MuestraAforo.create(
                            aforo_id, 
                            i + 1, 
                            muestra['peso_verde_g'], 
                            None,  # altura_pasto not used in this form
                            f"Muestra {i + 1}"
                        )
                        
                        # Actualizar peso seco si está disponible
                        if muestra['peso_seco_g'] is not None:
                            MuestraAforo.update_peso_seco(muestra_id, muestra['peso_seco_g'])
                    
                    flash(f'Aforo creado exitosamente con {muestras_validas} muestras', 'success')
                    return redirect(url_for('aforos.index'))
                else:
                    flash('Error al crear el aforo', 'danger')
                    
            except Exception as e:
                cursor.close()
                flash(f'Error al procesar el aforo: {str(e)}', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            cursor.close()
        
        elif action == 'create_base':
            # Mantener funcionalidad original para compatibilidad
            # Crear aforo base con información básica
            potrero_id = request.form.get('potrero_id')
            fecha = request.form.get('fecha')
            observaciones = request.form.get('observaciones', '')
            
            # Validar campos obligatorios
            if not potrero_id or not fecha:
                flash('Los campos Potrero y Fecha son obligatorios', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            try:
                potrero_id = int(potrero_id)
                fecha = datetime.strptime(fecha, '%Y-%m-%d')
            except (ValueError, TypeError):
                flash('Valores inválidos para los campos', 'danger')
                
                # Obtener todos los potreros para el selector
                cursor = mysql.connection.cursor()
                cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
                potreros = cursor.fetchall()
                cursor.close()
                
                return render_template('aforos/new.html', potreros=potreros)
            
            # Crear aforo base (sin muestras aún)
            aforo_id = Aforo.create(
                potrero_id, fecha, 0, 0, 0, observaciones, None, None, None, None, None
            )
            
            if aforo_id:
                return redirect(url_for('aforos.add_muestras', aforo_id=aforo_id))
            else:
                flash('Error al crear el aforo', 'danger')
        
        elif action == 'finalizar':
            # Finalizar aforo y redirigir a la lista
            aforo_id = request.form.get('aforo_id')
            if aforo_id:
                flash('Aforo registrado exitosamente con múltiples muestras', 'success')
                return redirect(url_for('aforos.index'))
    
    # Obtener todos los potreros para el selector
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    return render_template('aforos/new.html', potreros=potreros)

@aforos_bp.route('/add_muestras/<int:aforo_id>', methods=['GET', 'POST'])
@login_required
def add_muestras(aforo_id):
    """Pantalla para agregar muestras a un aforo"""
    # Verificar que el aforo existe
    cursor = mysql.connection.cursor()
    cursor.execute("""
        SELECT a.*, p.nombre as potrero_nombre 
        FROM aforos a 
        JOIN potreros p ON a.potrero_id = p.id 
        WHERE a.id = %s
    """, (aforo_id,))
    aforo = cursor.fetchone()
    cursor.close()
    
    if not aforo:
        flash('Aforo no encontrado', 'danger')
        return redirect(url_for('aforos.index'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'add_muestra':
            # Agregar nueva muestra
            peso_verde = request.form.get('peso_verde')
            altura_pasto = request.form.get('altura_pasto')
            observaciones = request.form.get('observaciones_muestra', '')
            
            if not peso_verde:
                return jsonify({'success': False, 'message': 'El peso verde es obligatorio'})
            
            try:
                peso_verde = float(peso_verde)
                altura_pasto = float(altura_pasto) if altura_pasto else None
                
                # Obtener el siguiente número de muestra
                cursor = mysql.connection.cursor()
                cursor.execute(
                    "SELECT COALESCE(MAX(numero_muestra), 0) + 1 as siguiente FROM muestras_aforo WHERE aforo_id = %s",
                    (aforo_id,)
                )
                siguiente_numero = cursor.fetchone()['siguiente']
                cursor.close()
                
                # Crear la muestra
                muestra_id = MuestraAforo.create(
                    aforo_id, siguiente_numero, peso_verde, altura_pasto, observaciones
                )
                
                if muestra_id:
                    return jsonify({'success': True, 'message': 'Muestra agregada exitosamente'})
                else:
                    return jsonify({'success': False, 'message': 'Error al agregar la muestra'})
                    
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'Valores inválidos'})
        
        elif action == 'finalizar':
            # Finalizar el aforo
            flash('Aforo completado exitosamente', 'success')
            return redirect(url_for('aforos.index'))
    
    # Obtener muestras existentes
    muestras = MuestraAforo.get_by_aforo(aforo_id)
    
    return render_template('aforos/add_muestras.html', aforo=aforo, muestras=muestras)

@aforos_bp.route('/api/muestras/<int:aforo_id>')
@login_required
def api_muestras(aforo_id):
    """API para obtener las muestras de un aforo"""
    muestras = MuestraAforo.get_by_aforo(aforo_id)
    
    # Calcular estadísticas
    total_muestras = len(muestras)
    peso_verde_promedio = sum(m['peso_verde'] for m in muestras) / total_muestras if total_muestras > 0 else 0
    
    muestras_con_peso_seco = [m for m in muestras if m['peso_seco'] is not None]
    peso_seco_promedio = sum(m['peso_seco'] for m in muestras_con_peso_seco) / len(muestras_con_peso_seco) if muestras_con_peso_seco else 0
    porcentaje_ms_promedio = (peso_seco_promedio / peso_verde_promedio * 100) if peso_verde_promedio > 0 else 0
    
    # Convertir a kg/ha (marco de 0.25 m²)
    factor_conversion = 10000 / 0.25
    materia_verde_kg_ha = (peso_verde_promedio / 1000) * factor_conversion
    materia_seca_kg_ha = (peso_seco_promedio / 1000) * factor_conversion
    
    return jsonify({
        'muestras': muestras,
        'estadisticas': {
            'total_muestras': total_muestras,
            'peso_verde_promedio': round(peso_verde_promedio, 2),
            'peso_seco_promedio': round(peso_seco_promedio, 2),
            'porcentaje_ms_promedio': round(porcentaje_ms_promedio, 2),
            'materia_verde_kg_ha': round(materia_verde_kg_ha, 2),
            'materia_seca_kg_ha': round(materia_seca_kg_ha, 2),
            'muestras_completas': len(muestras_con_peso_seco),
            'muestras_pendientes': total_muestras - len(muestras_con_peso_seco)
        }
    })

@aforos_bp.route('/api/muestra/<int:muestra_id>/delete', methods=['POST'])
@login_required
def api_delete_muestra(muestra_id):
    """API para eliminar una muestra"""
    success = MuestraAforo.delete(muestra_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Muestra eliminada exitosamente'})
    else:
        return jsonify({'success': False, 'message': 'Error al eliminar la muestra'})

@aforos_bp.route('/api/data')
@login_required
def api_data():
    potrero_id = request.args.get('potrero_id')
    meses = request.args.get('meses', 6, type=int)
    
    # Convertir potrero_id a entero si existe
    if potrero_id:
        try:
            potrero_id = int(potrero_id)
        except ValueError:
            potrero_id = None
    
    # Obtener datos para gráfica
    data = Aforo.get_data_for_chart(potrero_id=potrero_id, meses=meses)
    
    # Formatear datos para Chart.js
    result = {
        'labels': [],
        'datasets': []
    }
    
    potreros = {}
    fechas = set()
    
    # Organizar datos por potrero y fecha
    for row in data:
        nombre_potrero = row['nombre']
        fecha = row['fecha'].strftime('%Y-%m')
        valor = float(row['promedio'])
        
        fechas.add(fecha)
        
        if nombre_potrero not in potreros:
            potreros[nombre_potrero] = {}
        
        potreros[nombre_potrero][fecha] = valor
    
    # Ordenar fechas
    fechas = sorted(list(fechas))
    result['labels'] = fechas
    
    # Generar colores aleatorios para cada potrero
    colores = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
    
    # Crear datasets para cada potrero
    i = 0
    for potrero, valores in potreros.items():
        dataset = {
            'label': potrero,
            'data': [valores.get(fecha, None) for fecha in fechas],
            'borderColor': colores[i % len(colores)],
            'backgroundColor': colores[i % len(colores)] + '33',  # Agregar transparencia
            'fill': False,
            'tension': 0.1
        }
        result['datasets'].append(dataset)
        i += 1
    
    return jsonify(result)

@aforos_bp.route('/edit_muestras/<int:muestra_id>', methods=['GET', 'POST'])
@login_required
def edit_muestras(muestra_id):
    """Editar muestra de aforo"""
    # Obtener muestra
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM muestras_aforo WHERE id = %s", (muestra_id,))
    muestra = cursor.fetchone()
    
    if not muestra:
        cursor.close()
        flash('Muestra no encontrada', 'danger')
        return redirect(url_for('aforos.index'))
    
    if request.method == 'POST':
        action = request.form.get('action')
        
        if action == 'update_peso_seco':
            # Actualizar peso seco de la muestra
            peso_seco = request.form.get('peso_seco')
            
            if not peso_seco:
                return jsonify({'success': False, 'message': 'Datos incompletos'})
            
            try:
                peso_seco = float(peso_seco)
                
                success = MuestraAforo.update_peso_seco(muestra_id, peso_seco)
                
                if success:
                    return jsonify({'success': True, 'message': 'Peso seco actualizado exitosamente'})
                else:
                    return jsonify({'success': False, 'message': 'Error al actualizar el peso seco'})
                    
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'Valores inválidos'})
        
        elif action == 'update_muestra':
            # Actualizar una muestra completa
            peso_verde = request.form.get('peso_verde')
            peso_seco = request.form.get('peso_seco')
            altura_pasto = request.form.get('altura_pasto')
            observaciones = request.form.get('observaciones', '')
            
            if not peso_verde:
                return jsonify({'success': False, 'message': 'Datos incompletos'})
            
            try:
                peso_verde = float(peso_verde)
                peso_seco = float(peso_seco) if peso_seco else None
                altura_pasto = float(altura_pasto) if altura_pasto else None
                
                success = MuestraAforo.update(muestra_id, peso_verde, peso_seco, altura_pasto, observaciones)
                
                if success:
                    return jsonify({'success': True, 'message': 'Muestra actualizada exitosamente'})
                else:
                    return jsonify({'success': False, 'message': 'Error al actualizar la muestra'})
                    
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'Valores inválidos'})
    
    return render_template('aforos/edit_muestra.html', muestra=muestra)

@aforos_bp.route('/delete_muestra/<int:muestra_id>', methods=['POST'])
@login_required
def delete_muestra(muestra_id):
    """Eliminar muestra"""
    success = MuestraAforo.delete(muestra_id)
    
    if success:
        return jsonify({'success': True, 'message': 'Muestra eliminada exitosamente'})
    else:
        return jsonify({'success': False, 'message': 'Error al eliminar la muestra'})

@aforos_bp.route('/<int:aforo_id>/edit', methods=['GET', 'POST'])
@login_required
def editar(aforo_id):
    # Obtener aforo
    cursor = mysql.connection.cursor()
    cursor.execute("SELECT * FROM aforos WHERE id = %s", (aforo_id,))
    aforo = cursor.fetchone()
    
    if not aforo:
        cursor.close()
        flash('Aforo no encontrado', 'danger')
        return redirect(url_for('aforos.index'))
    
    if request.method == 'POST':
        # Obtener datos del formulario
        potrero_id = request.form.get('potrero_id')
        fecha = request.form.get('fecha')
        materia_verde = request.form.get('materia_verde')
        porcentaje_ms = request.form.get('porcentaje_ms')
        dias_rotacion = request.form.get('dias_rotacion')
        promedio_dias_rotacion = request.form.get('promedio_dias_rotacion')
        observaciones = request.form.get('observaciones', '')
        
        # Validar campos obligatorios
        if not potrero_id or not fecha or not materia_verde or not porcentaje_ms:
            flash('Los campos Potrero, Fecha, Materia Verde y Porcentaje MS son obligatorios', 'danger')
            
            # Obtener todos los potreros para el selector
            cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            return render_template('aforos/edit.html', aforo=aforo, potreros=potreros)
        
        # Convertir tipos
        try:
            potrero_id = int(potrero_id)
            materia_verde = float(materia_verde)
            porcentaje_ms = float(porcentaje_ms)
            fecha = datetime.strptime(fecha, '%Y-%m-%d')
            
            # Calcular materia seca a partir de materia verde y porcentaje
            materia_seca = materia_verde * (porcentaje_ms / 100)
            
            # Convertir días de rotación si se proporciona
            if dias_rotacion:
                dias_rotacion = int(dias_rotacion)
            else:
                # Si no se proporciona, calcular automáticamente
                cursor.execute(
                    "SELECT MAX(fecha) as ultima_fecha FROM aforos WHERE potrero_id = %s AND fecha < %s AND id != %s",
                    (potrero_id, fecha, aforo_id)
                )
                resultado = cursor.fetchone()
                ultima_fecha = resultado['ultima_fecha'] if resultado and resultado['ultima_fecha'] else None
                
                if ultima_fecha:
                    dias_rotacion = (fecha - ultima_fecha).days
                else:
                    dias_rotacion = 0
                
            # Convertir promedio de días de rotación si se proporciona
            if promedio_dias_rotacion:
                promedio_dias_rotacion = float(promedio_dias_rotacion)
            else:
                # Si no se proporciona, calcular el promedio actual sin incluir este aforo
                cursor.execute(
                    "SELECT AVG(dias_rotacion) as promedio FROM aforos WHERE potrero_id = %s AND dias_rotacion IS NOT NULL AND dias_rotacion > 0 AND id != %s",
                    (potrero_id, aforo_id)
                )
                resultado = cursor.fetchone()
                promedio_anterior = resultado['promedio'] if resultado and resultado['promedio'] else 0
                
                # Si hay un valor de días de rotación válido, incluirlo en el promedio
                if dias_rotacion and dias_rotacion > 0:
                    # Obtener la cantidad de registros anteriores con días_rotacion > 0
                    cursor.execute(
                        "SELECT COUNT(*) as total FROM aforos WHERE potrero_id = %s AND dias_rotacion IS NOT NULL AND dias_rotacion > 0 AND id != %s",
                        (potrero_id, aforo_id)
                    )
                    count_result = cursor.fetchone()
                    num_registros = count_result['total'] if count_result else 0
                    
                    if num_registros > 0:
                        # Calcular nuevo promedio incluyendo el valor actual
                        promedio_dias_rotacion = (promedio_anterior * num_registros + float(dias_rotacion)) / (num_registros + 1)
                    else:
                        # Si no hay registros previos válidos, usar el valor actual
                        promedio_dias_rotacion = float(dias_rotacion)
                else:
                    # Si el valor actual es 0 o nulo, mantener el promedio anterior
                    promedio_dias_rotacion = promedio_anterior if promedio_anterior > 0 else 0
            
        except (ValueError, TypeError):
            flash('Valores inválidos para los campos', 'danger')
            
            # Obtener todos los potreros para el selector
            cursor.execute("SELECT id, nombre FROM potreros ORDER BY nombre")
            potreros = cursor.fetchall()
            cursor.close()
            
            return render_template('aforos/edit.html', aforo=aforo, potreros=potreros)
        
        # Actualizar aforo en la base de datos
        cursor.execute(
            """UPDATE aforos
               SET potrero_id = %s, fecha = %s, materia_verde = %s, porcentaje_ms = %s, 
                   materia_seca = %s, dias_rotacion = %s, promedio_dias_rotacion = %s,
                   observaciones = %s, updated_at = NOW()
               WHERE id = %s""",
            (potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca, 
             dias_rotacion, promedio_dias_rotacion, observaciones, aforo_id)
        )
        
        # Verificar si la primera actualización fue exitosa
        update_success = cursor.rowcount > 0
        
        # Obtener hectáreas del potrero para calcular totales
        cursor.execute("SELECT hectareas FROM potreros WHERE id = %s", (potrero_id,))
        potrero = cursor.fetchone()
        hectareas = float(potrero['hectareas']) if potrero else 0
        
        # Calcular y actualizar totales
        materia_verde_total = materia_verde * hectareas * 10000
        materia_seca_total = materia_seca * hectareas * 10000
        
        # Actualizar los totales basados en las hectáreas del potrero
        cursor.execute(
            """UPDATE aforos
               SET materia_verde_total = %s, materia_seca_total = %s
               WHERE id = %s""",
            (materia_verde_total, materia_seca_total, aforo_id)
        )
        
        mysql.connection.commit()
        
        # Usar el resultado de la primera actualización para determinar el éxito
        if update_success:
            cursor.close()
            flash('Aforo actualizado exitosamente', 'success')
            return redirect(url_for('aforos.index'))
        else:
            flash('Error al actualizar el aforo', 'danger')
    
    # Obtener todos los potreros para el selector
    cursor.execute("SELECT id, nombre, hectareas FROM potreros ORDER BY nombre")
    potreros = cursor.fetchall()
    cursor.close()
    
    return render_template('aforos/edit.html', aforo=aforo, potreros=potreros)

@aforos_bp.route('/<int:aforo_id>/delete', methods=['POST'])
@login_required
def delete(aforo_id):
    """Eliminar aforo"""
    cursor = mysql.connection.cursor()
    cursor.execute("DELETE FROM aforos WHERE id = %s", (aforo_id,))
    mysql.connection.commit()
    success = cursor.rowcount > 0
    cursor.close()
    
    if success:
        flash('Aforo eliminado exitosamente', 'success')
    else:
        flash('Error al eliminar el aforo', 'danger')
    
    return redirect(url_for('aforos.index')) 