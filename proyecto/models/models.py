from db import mysql
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
from flask import current_app
from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['id'])
        self.nombre = user_data['nombre']
        self.email = user_data['email']
        self.password = user_data['password']
        self.finca_actual_id = user_data.get('finca_actual_id')
        self.finca_actual_nombre = user_data.get('finca_actual_nombre')
    
    def get_id(self):
        return self.id
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_active(self):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    @staticmethod
    def create(nombre, email, password):
        cursor = mysql.connection.cursor()
        try:
            hashed_password = generate_password_hash(password)
            cursor.execute(
                "INSERT INTO users (nombre, email, password) VALUES (%s, %s, %s)",
                (nombre, email, hashed_password)
            )
            mysql.connection.commit()
            user_id = cursor.lastrowid
            cursor.close()
            return user_id
        except Exception as e:
            mysql.connection.rollback()
            cursor.close()
            print(f"Error creating user: {e}")
            return None
        
    @staticmethod
    def get_by_email(email):
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT u.*, f.nombre as finca_actual_nombre 
            FROM users u 
            LEFT JOIN fincas f ON u.finca_actual_id = f.id 
            WHERE u.email = %s
        """, (email,))
        user_data = cursor.fetchone()
        cursor.close()
        if user_data:
            return User(user_data)
        return None
    
    @staticmethod
    def get_by_id(user_id):
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT u.*, f.nombre as finca_actual_nombre 
            FROM users u 
            LEFT JOIN fincas f ON u.finca_actual_id = f.id 
            WHERE u.id = %s
        """, (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        if user_data:
            return User(user_data)
        return None
        
    def check_password(self, password):
        return check_password_hash(self.password, password)

class Potrero:
    @staticmethod
    def get_all(page=1, per_page=10):
        offset = (page - 1) * per_page
        
        query = """
            SELECT p.*, 
                a.fecha as ultima_fecha,
                (
                    SELECT COALESCE(DATEDIFF(a1.fecha, MAX(a2.fecha)), 0)
                    FROM aforos a1
                    LEFT JOIN aforos a2 ON a1.potrero_id = a2.potrero_id AND a1.fecha > a2.fecha
                    WHERE a1.potrero_id = p.id AND a1.fecha = a.fecha
                    GROUP BY a1.id
                ) as dias_rotacion,
                (
                    SELECT AVG(dias_entre_aforos) 
                    FROM (
                        SELECT 
                            DATEDIFF(a1.fecha, a2.fecha) as dias_entre_aforos
                        FROM 
                            aforos a1
                        JOIN 
                            aforos a2 ON a1.potrero_id = a2.potrero_id AND a1.fecha > a2.fecha
                        WHERE 
                            a1.potrero_id = p.id
                        ORDER BY 
                            a1.fecha
                    ) as diffs
                ) as promedio_rotacion
            FROM potreros p
            LEFT JOIN (
                SELECT potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca
                FROM aforos a
                WHERE (potrero_id, fecha) IN (
                    SELECT potrero_id, MAX(fecha) as max_fecha
                    FROM aforos
                    GROUP BY potrero_id
                )
            ) a ON p.id = a.potrero_id
            ORDER BY p.nombre
            LIMIT %s OFFSET %s
        """
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, (per_page, offset))
        potreros = cursor.fetchall()
        
        # Contar total para paginación
        cursor.execute("SELECT COUNT(*) as total FROM potreros")
        total = cursor.fetchone()['total']
        cursor.close()
        
        return potreros, total
    
    @staticmethod
    def get_by_id(potrero_id):
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM potreros WHERE id = %s", (potrero_id,))
        potrero = cursor.fetchone()
        cursor.close()
        return potrero
    
    @staticmethod
    def create(nombre, hectareas, tipo_pasto, etapa_ganado, descripcion=None):
        cursor = mysql.connection.cursor()
        cursor.execute(
            "INSERT INTO potreros (nombre, hectareas, tipo_pasto, etapa_ganado, descripcion) "
            "VALUES (%s, %s, %s, %s, %s)",
            (nombre, hectareas, tipo_pasto, etapa_ganado, descripcion)
        )
        mysql.connection.commit()
        potrero_id = cursor.lastrowid
        cursor.close()
        return potrero_id
    
    @staticmethod
    def update(potrero_id, nombre, hectareas, tipo_pasto, etapa_ganado, descripcion=None):
        cursor = mysql.connection.cursor()
        cursor.execute(
            "UPDATE potreros SET nombre = %s, hectareas = %s, tipo_pasto = %s, etapa_ganado = %s, "
            "descripcion = %s WHERE id = %s",
            (nombre, hectareas, tipo_pasto, etapa_ganado, descripcion, potrero_id)
        )
        mysql.connection.commit()
        affected_rows = cursor.rowcount
        cursor.close()
        return affected_rows > 0
    
    @staticmethod
    def delete(potrero_id):
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM potreros WHERE id = %s", (potrero_id,))
        mysql.connection.commit()
        affected_rows = cursor.rowcount
        cursor.close()
        return affected_rows > 0

    @staticmethod
    def get_ultimo_aforo_info():
        """
        Obtiene información sobre el último aforo de cada potrero y calcula los días en rotación.
        Retorna una lista de diccionarios con id del potrero, nombre, fecha del último aforo y días en rotación.
        """
        query = """
            SELECT 
                p.id, 
                p.nombre, 
                p.hectareas,
                p.tipo_pasto,
                p.etapa_ganado,
                p.descripcion,
                a.fecha as ultima_fecha, 
                DATEDIFF(CURDATE(), a.fecha) as dias_desde_ultimo_aforo,
                a.dias_rotacion,
                a.promedio_dias_rotacion,
                a.materia_verde,
                a.porcentaje_ms,
                a.materia_seca
            FROM 
                potreros p
            LEFT JOIN (
                SELECT potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca, 
                       dias_rotacion, promedio_dias_rotacion
                FROM aforos
                WHERE (potrero_id, fecha) IN (
                    SELECT potrero_id, MAX(fecha) as max_fecha
                    FROM aforos
                    GROUP BY potrero_id
                )
            ) a ON p.id = a.potrero_id
            ORDER BY p.nombre
        """
        
        cursor = mysql.connection.cursor()
        cursor.execute(query)
        resultados = cursor.fetchall()
        cursor.close()
        
        return resultados

class Aforo:
    @staticmethod
    def get_all(page=1, per_page=10, fecha_inicio=None, fecha_fin=None, potrero_id=None):
        offset = (page - 1) * per_page
        query = "SELECT a.*, p.nombre as potrero_nombre, p.hectareas FROM aforos a JOIN potreros p ON a.potrero_id = p.id WHERE 1=1"
        params = []
        
        if fecha_inicio:
            query += " AND a.fecha >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND a.fecha <= %s"
            params.append(fecha_fin)
        if potrero_id:
            query += " AND a.potrero_id = %s"
            params.append(potrero_id)
            
        query += " ORDER BY a.fecha DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        aforos = cursor.fetchall()
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM aforos a WHERE 1=1"
        count_params = []
        
        if fecha_inicio:
            count_query += " AND a.fecha >= %s"
            count_params.append(fecha_inicio)
        if fecha_fin:
            count_query += " AND a.fecha <= %s"
            count_params.append(fecha_fin)
        if potrero_id:
            count_query += " AND a.potrero_id = %s"
            count_params.append(potrero_id)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        cursor.close()
        return aforos, total
    
    @staticmethod
    def create(potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca, observaciones=None, dias_rotacion=None, promedio_dias_rotacion=None, altura_pasto=None, peso_verde=None, peso_seco=None):
        cursor = mysql.connection.cursor()
        
        # Determinar días en rotación si no se proporciona
        if dias_rotacion is None:
            # Obtener la fecha del último aforo para este potrero
            cursor.execute(
                "SELECT MAX(fecha) as ultima_fecha FROM aforos WHERE potrero_id = %s AND fecha < %s",
                (potrero_id, fecha)
            )
            resultado = cursor.fetchone()
            ultima_fecha = resultado['ultima_fecha'] if resultado else None
            
            if ultima_fecha:
                # Calcular días entre el último aforo y el actual
                dias_rotacion = (fecha.date() - ultima_fecha).days
            else:
                # Si no hay aforos previos, usar 0 como valor predeterminado
                dias_rotacion = 0
        
        # Calcular promedio de días en rotación si no se proporciona
        if promedio_dias_rotacion is None:
            cursor.execute(
                "SELECT AVG(dias_rotacion) as promedio FROM aforos WHERE potrero_id = %s AND dias_rotacion IS NOT NULL AND dias_rotacion > 0",
                (potrero_id,)
            )
            resultado = cursor.fetchone()
            promedio_anterior = resultado['promedio'] if resultado and resultado['promedio'] else 0
            
            # Calcular el nuevo promedio, incluyendo el valor actual si es mayor que 0
            if dias_rotacion and dias_rotacion > 0:
                # Obtener la cantidad de registros anteriores con días_rotacion > 0
                cursor.execute(
                    "SELECT COUNT(*) as total FROM aforos WHERE potrero_id = %s AND dias_rotacion IS NOT NULL AND dias_rotacion > 0",
                    (potrero_id,)
                )
                count_result = cursor.fetchone()
                num_registros = count_result['total'] if count_result else 0
                
                if num_registros > 0:
                    # Si hay registros anteriores, calcular el nuevo promedio incluyendo el valor actual
                    promedio_dias_rotacion = (float(promedio_anterior) * num_registros + float(dias_rotacion)) / (num_registros + 1)
                else:
                    # Si no hay registros anteriores, el promedio es el valor actual
                    promedio_dias_rotacion = float(dias_rotacion)
            else:
                # Si el valor actual es 0, mantener el promedio anterior
                promedio_dias_rotacion = promedio_anterior if promedio_anterior > 0 else 0
        
        # Obtener hectáreas del potrero para calcular totales
        cursor.execute("SELECT hectareas FROM potreros WHERE id = %s", (potrero_id,))
        potrero = cursor.fetchone()
        hectareas = float(potrero['hectareas']) if potrero else 0
        
        # Calcular totales (multiplicando por hectáreas y por 10000 m² por hectárea)
        materia_verde_total = float(materia_verde) * hectareas * 10000
        materia_seca_total = float(materia_seca) * hectareas * 10000
        
        cursor.execute(
            """INSERT INTO aforos 
               (potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca, 
                dias_rotacion, promedio_dias_rotacion, materia_verde_total, materia_seca_total, observaciones,
                altura_pasto, peso_verde, peso_seco) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (potrero_id, fecha, materia_verde, porcentaje_ms, materia_seca, 
             dias_rotacion, promedio_dias_rotacion, materia_verde_total, materia_seca_total, observaciones,
             altura_pasto, peso_verde, peso_seco)
        )
        mysql.connection.commit()
        aforo_id = cursor.lastrowid
        cursor.close()
        return aforo_id
    
    @staticmethod
    def get_data_for_chart(potrero_id=None, meses=6):
        query = """
            SELECT p.nombre, a.fecha, AVG(a.materia_seca) as promedio 
            FROM aforos a 
            JOIN potreros p ON a.potrero_id = p.id
            WHERE a.fecha >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        """
        params = [meses]
        
        if potrero_id:
            query += " AND a.potrero_id = %s"
            params.append(potrero_id)
            
        query += " GROUP BY p.id, MONTH(a.fecha) ORDER BY a.fecha DESC"
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        data = cursor.fetchall()
        cursor.close()
        return data

    @staticmethod
    def get_average_rotation_days(potrero_id=None):
        try:
            cur = mysql.connection.cursor()
            
            query = """
                SELECT AVG(dias_rotacion) as avg_rotation_days
                FROM aforos
                WHERE dias_rotacion > 0
            """
            params = []
            
            if potrero_id:
                query += " AND potrero_id = %s"
                params.append(potrero_id)
            
            cur.execute(query, params)
            result = cur.fetchone()
            
            return float(result['avg_rotation_days']) if result and result['avg_rotation_days'] else 0
        except Exception as e:
            current_app.logger.error(f"Error in get_average_rotation_days: {e}")
            return 0

    @staticmethod
    def get_average_matter(potrero_id=None):
        try:
            cur = mysql.connection.cursor()
            
            query = """
                SELECT 
                    AVG(materia_verde) as avg_green_matter,
                    AVG(materia_seca) as avg_dry_matter
                FROM aforos
            """
            params = []
            
            if potrero_id:
                query += " WHERE potrero_id = %s"
                params.append(potrero_id)
            
            cur.execute(query, params)
            result = cur.fetchone()
            
            avg_green = float(result['avg_green_matter']) if result and result['avg_green_matter'] else 0
            avg_dry = float(result['avg_dry_matter']) if result and result['avg_dry_matter'] else 0
            
            return avg_green, avg_dry
        except Exception as e:
            current_app.logger.error(f"Error in get_average_matter: {e}")
            return 0, 0

    @staticmethod
    def get_average_matter_percentage(potrero_id=None):
        try:
            cur = mysql.connection.cursor()
            
            query = """
                SELECT 
                    AVG(porcentaje_ms) as avg_dry_matter_pct
                FROM aforos
            """
            params = []
            
            if potrero_id:
                query += " WHERE potrero_id = %s"
                params.append(potrero_id)
            
            cur.execute(query, params)
            result = cur.fetchone()
            
            avg_dry_pct = float(result['avg_dry_matter_pct']) if result and result['avg_dry_matter_pct'] else 0
            avg_green_pct = 100 - avg_dry_pct
            
            return avg_green_pct, avg_dry_pct
        except Exception as e:
            current_app.logger.error(f"Error in get_average_matter_percentage: {e}")
            return 0, 0

    @staticmethod
    def get_last_by_potrero(potrero_id):
        try:
            cur = mysql.connection.cursor()
            
            cur.execute("""
                SELECT *
                FROM aforos
                WHERE potrero_id = %s
                ORDER BY fecha DESC
                LIMIT 1
            """, (potrero_id,))
            
            return cur.fetchone()
        except Exception as e:
            current_app.logger.error(f"Error in get_last_by_potrero: {e}")
            return None

    @staticmethod
    def get_top_producers(potrero_id=None, limit=10):
        try:
            cur = mysql.connection.cursor()
            
            query = """
                SELECT 
                    p.id,
                    p.nombre,
                    AVG(a.materia_verde) as avg_green_matter
                FROM potreros p
                JOIN aforos a ON p.id = a.potrero_id
            """
            params = []
            
            if potrero_id:
                query += " WHERE p.id = %s"
                params.append(potrero_id)
            
            query += """
                GROUP BY p.id, p.nombre
                ORDER BY avg_green_matter DESC
                LIMIT %s
            """
            params.append(limit)
            
            cur.execute(query, params)
            potreros = cur.fetchall()
            
            return [{
                'id': p['id'],
                'nombre': p['nombre'],
                'avg_green_matter': float(p['avg_green_matter'])
            } for p in potreros]
        except Exception as e:
            current_app.logger.error(f"Error in get_top_producers: {e}")
            return []

    @staticmethod
    def get_rotation_history(potrero_id=None):
        try:
            cur = mysql.connection.cursor()
            
            if potrero_id:
                # Get history for a specific potrero
                cur.execute("""
                    SELECT 
                        a.id,
                        a.fecha,
                        p.nombre as potrero_nombre,
                        a.dias_rotacion
                    FROM aforos a
                    JOIN potreros p ON a.potrero_id = p.id
                    WHERE a.potrero_id = %s
                    ORDER BY a.fecha DESC
                    LIMIT 20
                """, (potrero_id,))
            else:
                # Get the latest aforo for each potrero
                cur.execute("""
                    SELECT 
                        a.id,
                        a.fecha,
                        p.nombre as potrero_nombre,
                        a.dias_rotacion
                    FROM aforos a
                    JOIN (
                        SELECT potrero_id, MAX(fecha) as max_fecha
                        FROM aforos
                        GROUP BY potrero_id
                    ) as latest ON a.potrero_id = latest.potrero_id AND a.fecha = latest.max_fecha
                    JOIN potreros p ON a.potrero_id = p.id
                    ORDER BY a.dias_rotacion DESC
                    LIMIT 20
                """)
            
            aforos = cur.fetchall()
            
            return [{
                'id': a['id'],
                'fecha': a['fecha'].strftime('%Y-%m-%d'),
                'potrero_nombre': a['potrero_nombre'],
                'dias_rotacion': a['dias_rotacion']
            } for a in aforos]
        except Exception as e:
            current_app.logger.error(f"Error in get_rotation_history: {e}")
            return []

    @staticmethod
    def get_timeline_data(potrero_id=None, months=12):
        try:
            cur = mysql.connection.cursor()
            
            fecha_inicio = (datetime.now() - timedelta(days=30*months)).strftime('%Y-%m-%d')
            fecha_fin = datetime.now().strftime('%Y-%m-%d')
            
            # Build base query
            query = """
                SELECT 
                    a.fecha,
                    a.potrero_id,
                    p.nombre as potrero_nombre,
                    a.materia_verde,
                    a.materia_seca,
                    a.porcentaje_ms
                FROM aforos a
                JOIN potreros p ON a.potrero_id = p.id
                WHERE a.fecha BETWEEN %s AND %s
            """
            params = [fecha_inicio, fecha_fin]
            
            # Add filter by potrero if specified
            if potrero_id:
                query += " AND a.potrero_id = %s"
                params.append(potrero_id)
            
            query += " ORDER BY a.fecha"
            
            cur.execute(query, params)
            aforos = cur.fetchall()
            
            return [{
                'fecha': a['fecha'].strftime('%Y-%m-%d'),
                'potrero_id': a['potrero_id'],
                'potrero_nombre': a['potrero_nombre'],
                'materia_verde': float(a['materia_verde']),
                'materia_seca': float(a['materia_seca']),
                'porcentaje_ms': float(a['porcentaje_ms'])
            } for a in aforos]
        except Exception as e:
            current_app.logger.error(f"Error in get_timeline_data: {e}")
            return []

class PH:
    @staticmethod
    def get_all(page=1, per_page=10, fecha_inicio=None, fecha_fin=None, potrero_id=None):
        offset = (page - 1) * per_page
        query = "SELECT ph.*, p.nombre as potrero_nombre FROM ph ph JOIN potreros p ON ph.potrero_id = p.id WHERE 1=1"
        params = []
        
        if fecha_inicio:
            query += " AND ph.fecha >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND ph.fecha <= %s"
            params.append(fecha_fin)
        if potrero_id:
            query += " AND ph.potrero_id = %s"
            params.append(potrero_id)
            
        query += " ORDER BY ph.fecha DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        ph_records = cursor.fetchall()
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM ph WHERE 1=1"
        count_params = []
        
        if fecha_inicio:
            count_query += " AND fecha >= %s"
            count_params.append(fecha_inicio)
        if fecha_fin:
            count_query += " AND fecha <= %s"
            count_params.append(fecha_fin)
        if potrero_id:
            count_query += " AND potrero_id = %s"
            count_params.append(potrero_id)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        cursor.close()
        return ph_records, total
    
    @staticmethod
    def create(potrero_id, fecha, valor, observaciones=None):
        if not 0 <= valor <= 14:
            return None
            
        cursor = mysql.connection.cursor()
        cursor.execute(
            "INSERT INTO ph (potrero_id, fecha, valor, observaciones) VALUES (%s, %s, %s, %s)",
            (potrero_id, fecha, valor, observaciones)
        )
        mysql.connection.commit()
        ph_id = cursor.lastrowid
        cursor.close()
        return ph_id
        
    @staticmethod
    def get_data_for_chart(potrero_id=None, meses=6):
        query = """
            SELECT p.nombre, DATE_FORMAT(ph.fecha, '%Y-%m') as fecha_mes, AVG(ph.valor) as promedio 
            FROM ph ph 
            JOIN potreros p ON ph.potrero_id = p.id
            WHERE ph.fecha >= DATE_SUB(CURDATE(), INTERVAL %s MONTH)
        """
        params = [meses]
        
        if potrero_id:
            query += " AND ph.potrero_id = %s"
            params.append(potrero_id)
            
        query += " GROUP BY p.id, p.nombre, DATE_FORMAT(ph.fecha, '%Y-%m') ORDER BY fecha_mes"
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        data = cursor.fetchall()
        cursor.close()
        return data

class Actividad:
    @staticmethod
    def get_all(page=1, per_page=10, fecha_inicio=None, fecha_fin=None, potrero_id=None, tipo_actividad=None, estado=None):
        offset = (page - 1) * per_page
        query = """
            SELECT a.*, p.nombre as potrero_nombre 
            FROM actividades a 
            JOIN potreros p ON a.potrero_id = p.id 
            WHERE 1=1
        """
        params = []
        
        if fecha_inicio:
            query += " AND a.fecha >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND a.fecha <= %s"
            params.append(fecha_fin)
        if potrero_id:
            query += " AND a.potrero_id = %s"
            params.append(potrero_id)
        if tipo_actividad:
            query += " AND a.tipo_actividad = %s"
            params.append(tipo_actividad)
        if estado:
            query += " AND a.estado = %s"
            params.append(estado)
            
        query += " ORDER BY a.fecha DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        actividades = cursor.fetchall()
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM actividades a WHERE 1=1"
        count_params = []
        
        if fecha_inicio:
            count_query += " AND a.fecha >= %s"
            count_params.append(fecha_inicio)
        if fecha_fin:
            count_query += " AND a.fecha <= %s"
            count_params.append(fecha_fin)
        if potrero_id:
            count_query += " AND a.potrero_id = %s"
            count_params.append(potrero_id)
        if tipo_actividad:
            count_query += " AND a.tipo_actividad = %s"
            count_params.append(tipo_actividad)
        if estado:
            count_query += " AND a.estado = %s"
            count_params.append(estado)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        cursor.close()
        return actividades, total
    
    @staticmethod
    def create(potrero_id, fecha, tipo_actividad, descripcion, responsable=None, costo=None, estado="Pendiente"):
        cursor = mysql.connection.cursor()
        
        # Depuración - Registrar los valores que estamos intentando insertar
        print(f"DEBUG - Valores para insertar en actividades:")
        print(f"potrero_id: {potrero_id} - tipo: {type(potrero_id)}")
        print(f"fecha: {fecha} - tipo: {type(fecha)}")
        print(f"tipo_actividad: '{tipo_actividad}' - tipo: {type(tipo_actividad)}")
        print(f"descripcion: {descripcion[:20]}... - tipo: {type(descripcion)}")
        print(f"responsable: {responsable} - tipo: {type(responsable)}")
        print(f"costo: {costo} - tipo: {type(costo)}")
        print(f"estado: '{estado}' - tipo: {type(estado)}")
        
        # Verificar si tipo_actividad es un valor permitido
        valores_permitidos = ['Riego', 'Fumigación', 'Reparación de Cercas', 'Limpieza', 'Fertilización', 'Otro']
        if tipo_actividad not in valores_permitidos:
            print(f"ERROR - Valor no permitido para tipo_actividad: '{tipo_actividad}'")
            print(f"Valores permitidos: {valores_permitidos}")
            return None
        
        query = """
            INSERT INTO actividades 
            (potrero_id, fecha, tipo_actividad, descripcion, responsable, costo, estado) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        try:
            cursor.execute(query, (potrero_id, fecha, tipo_actividad, descripcion, responsable, costo, estado))
            mysql.connection.commit()
            actividad_id = cursor.lastrowid
            cursor.close()
            return actividad_id
        except Exception as e:
            print(f"ERROR en la inserción: {e}")
            cursor.close()
            return None
    
    @staticmethod
    def get_by_id(actividad_id):
        cursor = mysql.connection.cursor()
        query = """
            SELECT a.*, p.nombre as potrero_nombre 
            FROM actividades a 
            JOIN potreros p ON a.potrero_id = p.id 
            WHERE a.id = %s
        """
        cursor.execute(query, (actividad_id,))
        actividad = cursor.fetchone()
        cursor.close()
        return actividad
    
    @staticmethod
    def update(actividad_id, potrero_id, fecha, tipo_actividad, descripcion, responsable=None, costo=None, estado=None):
        cursor = mysql.connection.cursor()
        
        # Depuración - Registrar los valores que estamos intentando actualizar
        print(f"DEBUG - Valores para actualizar en actividades (ID: {actividad_id}):")
        print(f"potrero_id: {potrero_id} - tipo: {type(potrero_id)}")
        print(f"fecha: {fecha} - tipo: {type(fecha)}")
        print(f"tipo_actividad: '{tipo_actividad}' - tipo: {type(tipo_actividad)}")
        print(f"descripcion: {descripcion[:20]}... - tipo: {type(descripcion)}")
        print(f"responsable: {responsable} - tipo: {type(responsable)}")
        print(f"costo: {costo} - tipo: {type(costo)}")
        print(f"estado: '{estado}' - tipo: {type(estado)}")
        
        try:
            query = """
                UPDATE actividades SET 
                potrero_id = %s,
                fecha = %s,
                tipo_actividad = %s,
                descripcion = %s,
                responsable = %s,
                costo = %s,
                estado = %s
                WHERE id = %s
            """
            cursor.execute(
                query, 
                (potrero_id, fecha, tipo_actividad, descripcion, responsable, costo, estado, actividad_id)
            )
            mysql.connection.commit()
            
            # Consideramos la operación exitosa incluso si no hay cambios reales
            # (por ejemplo, si los datos eran iguales a los existentes)
            print(f"DEBUG - Actualización: Filas afectadas: {cursor.rowcount}")
            cursor.close()
            return True
        except Exception as e:
            print(f"ERROR en la actualización: {e}")
            mysql.connection.commit()  # Para liberar cualquier bloqueo
            cursor.close()
            return False
    
    @staticmethod
    def delete(actividad_id):
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM actividades WHERE id = %s", (actividad_id,))
        mysql.connection.commit()
        affected_rows = cursor.rowcount
        cursor.close()
        return affected_rows > 0

    @staticmethod
    def get_in_progress(potrero_id=None):
        try:
            cur = mysql.connection.cursor()
            
            query = """
                SELECT 
                    a.id,
                    a.descripcion,
                    a.fecha_inicio,
                    a.fecha_fin,
                    a.estado,
                    a.porcentaje_avance,
                    p.nombre as potrero_nombre
                FROM actividades a
                JOIN potreros p ON a.potrero_id = p.id
                WHERE a.estado = 'en_progreso'
            """
            params = []
            
            if potrero_id:
                query += " AND a.potrero_id = %s"
                params.append(potrero_id)
            
            query += " ORDER BY a.fecha_inicio"
            
            cur.execute(query, params)
            actividades = cur.fetchall()
            
            return [{
                'id': a['id'],
                'descripcion': a['descripcion'],
                'fecha_inicio': a['fecha_inicio'].strftime('%Y-%m-%d') if a['fecha_inicio'] else None,
                'fecha_fin': a['fecha_fin'].strftime('%Y-%m-%d') if a['fecha_fin'] else None,
                'estado': a['estado'],
                'porcentaje_avance': a['porcentaje_avance'],
                'potrero_nombre': a['potrero_nombre']
            } for a in actividades]
        except Exception as e:
            current_app.logger.error(f"Error in get_in_progress: {e}")
            return []

class Clima:
    @staticmethod
    def get_all(page=1, per_page=10, fecha_inicio=None, fecha_fin=None):
        """Obtener todos los registros de clima con paginación y filtros"""
        offset = (page - 1) * per_page
        query = "SELECT * FROM clima WHERE 1=1"
        params = []
        
        if fecha_inicio:
            query += " AND fecha >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND fecha <= %s"
            params.append(fecha_fin)
            
        query += " ORDER BY fecha DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        registros = cursor.fetchall()
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM clima WHERE 1=1"
        count_params = []
        
        if fecha_inicio:
            count_query += " AND fecha >= %s"
            count_params.append(fecha_inicio)
        if fecha_fin:
            count_query += " AND fecha <= %s"
            count_params.append(fecha_fin)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        cursor.close()
        return registros, total
    
    @staticmethod
    def create(fecha, temperatura_min, temperatura_max, temperatura_promedio, humedad, 
               presion, lluvia, velocidad_viento, direccion_viento, nubosidad, 
               horas_sol, descripcion, icono, probabilidad_lluvia=0, uv_index=None, 
               visibilidad=None, punto_rocio=None):
        """Crear un nuevo registro de clima"""
        cursor = mysql.connection.cursor()
        query = """
            INSERT INTO clima 
            (fecha, temperatura_min, temperatura_max, temperatura_promedio, humedad, 
             presion, lluvia, velocidad_viento, direccion_viento, nubosidad, 
             horas_sol, descripcion, icono, probabilidad_lluvia, uv_index, 
             visibilidad, punto_rocio) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        try:
            cursor.execute(query, (
                fecha, temperatura_min, temperatura_max, temperatura_promedio, 
                humedad, presion, lluvia, velocidad_viento, direccion_viento, 
                nubosidad, horas_sol, descripcion, icono, probabilidad_lluvia, 
                uv_index, visibilidad, punto_rocio
            ))
            mysql.connection.commit()
            clima_id = cursor.lastrowid
            cursor.close()
            return clima_id
        except Exception as e:
            print(f"Error creando registro de clima: {e}")
            cursor.close()
            return None
    
    @staticmethod
    def get_by_fecha(fecha):
        """Obtener registro de clima por fecha específica"""
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM clima WHERE fecha = %s", (fecha,))
        registro = cursor.fetchone()
        cursor.close()
        return registro
    
    @staticmethod
    def update_or_create(fecha, temperatura_min, temperatura_max, temperatura_promedio, 
                        humedad, presion, lluvia, velocidad_viento, direccion_viento, 
                        nubosidad, horas_sol, descripcion, icono, probabilidad_lluvia=0, 
                        uv_index=None, visibilidad=None, punto_rocio=None):
        """Actualizar registro existente o crear uno nuevo"""
        # Verificar si ya existe un registro para esta fecha
        existing = Clima.get_by_fecha(fecha)
        
        if existing:
            # Actualizar registro existente
            cursor = mysql.connection.cursor()
            query = """
                UPDATE clima SET 
                temperatura_min = %s, temperatura_max = %s, temperatura_promedio = %s,
                humedad = %s, presion = %s, lluvia = %s, velocidad_viento = %s,
                direccion_viento = %s, nubosidad = %s, horas_sol = %s,
                descripcion = %s, icono = %s, probabilidad_lluvia = %s,
                uv_index = %s, visibilidad = %s, punto_rocio = %s
                WHERE fecha = %s
            """
            try:
                cursor.execute(query, (
                    temperatura_min, temperatura_max, temperatura_promedio, humedad, 
                    presion, lluvia, velocidad_viento, direccion_viento, nubosidad, 
                    horas_sol, descripcion, icono, probabilidad_lluvia, uv_index, 
                    visibilidad, punto_rocio, fecha
                ))
                mysql.connection.commit()
                cursor.close()
                return existing['id']
            except Exception as e:
                print(f"Error actualizando registro de clima: {e}")
                cursor.close()
                return None
        else:
            # Crear nuevo registro
            return Clima.create(
                fecha, temperatura_min, temperatura_max, temperatura_promedio, 
                humedad, presion, lluvia, velocidad_viento, direccion_viento, 
                nubosidad, horas_sol, descripcion, icono, probabilidad_lluvia, 
                uv_index, visibilidad, punto_rocio
            )
    
    @staticmethod
    def get_latest(days=7):
        """Obtener los últimos N días de registros climáticos"""
        cursor = mysql.connection.cursor()
        cursor.execute(
            "SELECT * FROM clima ORDER BY fecha DESC LIMIT %s", 
            (days,)
        )
        registros = cursor.fetchall()
        cursor.close()
        return registros
    
    @staticmethod
    def get_data_for_chart(days=30):
        """Obtener datos formateados para gráficos"""
        registros = Clima.get_latest(days)
        
        data = {
            'fechas': [],
            'temperatura_min': [],
            'temperatura_max': [],
            'temperatura_promedio': [],
            'lluvia': [],
            'humedad': [],
            'velocidad_viento': []
        }
        
        for registro in reversed(registros):  # Invertir para orden cronológico
            data['fechas'].append(registro['fecha'].strftime('%Y-%m-%d'))
            data['temperatura_min'].append(float(registro['temperatura_min']))
            data['temperatura_max'].append(float(registro['temperatura_max']))
            data['temperatura_promedio'].append(float(registro['temperatura_promedio']))
            data['lluvia'].append(float(registro['lluvia']))
            data['humedad'].append(registro['humedad'])
            data['velocidad_viento'].append(float(registro['velocidad_viento']))
        
        return data
    
    @staticmethod
    def get_monthly_summary(año=None, mes=None):
        """Obtener resumen mensual del clima"""
        if not año:
            año = datetime.now().year
        if not mes:
            mes = datetime.now().month
            
        cursor = mysql.connection.cursor()
        query = """
            SELECT 
                COUNT(*) as total_dias,
                AVG(temperatura_min) as temp_min_promedio,
                AVG(temperatura_max) as temp_max_promedio,
                AVG(temperatura_promedio) as temp_promedio,
                MIN(temperatura_min) as temp_min_absoluta,
                MAX(temperatura_max) as temp_max_absoluta,
                SUM(lluvia) as lluvia_total,
                AVG(lluvia) as lluvia_promedio,
                AVG(humedad) as humedad_promedio,
                AVG(velocidad_viento) as viento_promedio,
                SUM(horas_sol) as horas_sol_total
            FROM clima 
            WHERE YEAR(fecha) = %s AND MONTH(fecha) = %s
        """
        cursor.execute(query, (año, mes))
        resultado = cursor.fetchone()
        cursor.close()
        return resultado 

class Recorrido:
    @staticmethod
    def get_all(page=1, per_page=10, fecha_inicio=None, fecha_fin=None, potrero_id=None):
        """Obtener todos los recorridos con paginación y filtros"""
        offset = (page - 1) * per_page
        query = """
            SELECT r.*, p.nombre as potrero_nombre, p.hectareas 
            FROM recorridos r 
            JOIN potreros p ON r.potrero_id = p.id 
            WHERE 1=1
        """
        params = []
        
        if fecha_inicio:
            query += " AND r.fecha >= %s"
            params.append(fecha_inicio)
        if fecha_fin:
            query += " AND r.fecha <= %s"
            params.append(fecha_fin)
        if potrero_id:
            query += " AND r.potrero_id = %s"
            params.append(potrero_id)
            
        query += " ORDER BY r.fecha DESC LIMIT %s OFFSET %s"
        params.extend([per_page, offset])
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        recorridos = cursor.fetchall()
        
        # Contar total
        count_query = "SELECT COUNT(*) as total FROM recorridos r WHERE 1=1"
        count_params = []
        
        if fecha_inicio:
            count_query += " AND r.fecha >= %s"
            count_params.append(fecha_inicio)
        if fecha_fin:
            count_query += " AND r.fecha <= %s"
            count_params.append(fecha_fin)
        if potrero_id:
            count_query += " AND r.potrero_id = %s"
            count_params.append(potrero_id)
            
        cursor.execute(count_query, tuple(count_params))
        total = cursor.fetchone()['total']
        cursor.close()
        return recorridos, total
    
    @staticmethod
    def create(potrero_id, fecha, altura_promedio, altura_minima, altura_maxima, 
               cobertura_vegetal, estado_general, puntos_medicion=5, 
               humedad_suelo=None, presencia_plagas=False, necesita_riego=False, 
               necesita_fertilizacion=False, observaciones=None, responsable=None):
        """Crear un nuevo recorrido"""
        from datetime import datetime
        
        # Calcular número de semana
        semana_numero = fecha.isocalendar()[1] if isinstance(fecha, datetime) else datetime.strptime(str(fecha), '%Y-%m-%d').isocalendar()[1]
        
        cursor = mysql.connection.cursor()
        
        # Insertar el recorrido
        query = """
            INSERT INTO recorridos 
            (potrero_id, fecha, semana_numero, altura_promedio, altura_minima, altura_maxima, 
             cobertura_vegetal, estado_general, puntos_medicion, humedad_suelo, 
             presencia_plagas, necesita_riego, necesita_fertilizacion, observaciones, responsable) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            cursor.execute(query, (
                potrero_id, fecha, semana_numero, altura_promedio, altura_minima, altura_maxima,
                cobertura_vegetal, estado_general, puntos_medicion, humedad_suelo,
                presencia_plagas, necesita_riego, necesita_fertilizacion, observaciones, responsable
            ))
            recorrido_id = cursor.lastrowid
            mysql.connection.commit()
            
            # Calcular y actualizar tasas de crecimiento
            Recorrido._calcular_tasas_crecimiento(recorrido_id, potrero_id, fecha)
            
            cursor.close()
            return recorrido_id
        except Exception as e:
            current_app.logger.error(f"Error creando recorrido: {e}")
            cursor.close()
            return None
    
    @staticmethod
    def _calcular_tasas_crecimiento(recorrido_id, potrero_id, fecha):
        """Calcular tasas de crecimiento basadas en el recorrido anterior"""
        cursor = mysql.connection.cursor()
        
        try:
            # Buscar el recorrido anterior más reciente
            cursor.execute("""
                SELECT altura_promedio, fecha 
                FROM recorridos 
                WHERE potrero_id = %s AND fecha < %s 
                ORDER BY fecha DESC 
                LIMIT 1
            """, (potrero_id, fecha))
            
            anterior = cursor.fetchone()
            
            if anterior:
                # Obtener altura actual
                cursor.execute("SELECT altura_promedio FROM recorridos WHERE id = %s", (recorrido_id,))
                actual = cursor.fetchone()
                
                if actual:
                    altura_anterior = float(anterior['altura_promedio'])
                    altura_actual = float(actual['altura_promedio'])
                    fecha_anterior = anterior['fecha']
                    
                    # Calcular diferencia en días
                    if isinstance(fecha, str):
                        fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
                    
                    dias_diferencia = (fecha - fecha_anterior).days
                    
                    if dias_diferencia > 0:
                        # Calcular tasas
                        crecimiento_total = altura_actual - altura_anterior
                        tasa_diaria = crecimiento_total / dias_diferencia
                        tasa_semanal = tasa_diaria * 7
                        
                        # Actualizar el registro
                        cursor.execute("""
                            UPDATE recorridos 
                            SET tasa_crecimiento_diaria = %s, tasa_crecimiento_semanal = %s 
                            WHERE id = %s
                        """, (tasa_diaria, tasa_semanal, recorrido_id))
                        
                        mysql.connection.commit()
                        
        except Exception as e:
            current_app.logger.error(f"Error calculando tasas de crecimiento: {e}")
        finally:
            cursor.close()
    
    @staticmethod
    def get_by_id(recorrido_id):
        """Obtener un recorrido por ID"""
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT r.*, p.nombre as potrero_nombre, p.hectareas 
            FROM recorridos r 
            JOIN potreros p ON r.potrero_id = p.id 
            WHERE r.id = %s
        """, (recorrido_id,))
        recorrido = cursor.fetchone()
        cursor.close()
        return recorrido
    
    @staticmethod
    def update(recorrido_id, potrero_id, fecha, altura_promedio, altura_minima, altura_maxima, 
               cobertura_vegetal, estado_general, puntos_medicion=5, 
               humedad_suelo=None, presencia_plagas=False, necesita_riego=False, 
               necesita_fertilizacion=False, observaciones=None, responsable=None):
        """Actualizar un recorrido existente"""
        from datetime import datetime
        
        semana_numero = fecha.isocalendar()[1] if isinstance(fecha, datetime) else datetime.strptime(str(fecha), '%Y-%m-%d').isocalendar()[1]
        
        cursor = mysql.connection.cursor()
        query = """
            UPDATE recorridos SET 
            potrero_id = %s, fecha = %s, semana_numero = %s, altura_promedio = %s, 
            altura_minima = %s, altura_maxima = %s, cobertura_vegetal = %s, 
            estado_general = %s, puntos_medicion = %s, humedad_suelo = %s, 
            presencia_plagas = %s, necesita_riego = %s, necesita_fertilizacion = %s, 
            observaciones = %s, responsable = %s 
            WHERE id = %s
        """
        
        try:
            cursor.execute(query, (
                potrero_id, fecha, semana_numero, altura_promedio, altura_minima, altura_maxima,
                cobertura_vegetal, estado_general, puntos_medicion, humedad_suelo,
                presencia_plagas, necesita_riego, necesita_fertilizacion, observaciones, 
                responsable, recorrido_id
            ))
            mysql.connection.commit()
            
            # Recalcular tasas de crecimiento
            Recorrido._calcular_tasas_crecimiento(recorrido_id, potrero_id, fecha)
            
            affected_rows = cursor.rowcount
            cursor.close()
            return affected_rows > 0
        except Exception as e:
            current_app.logger.error(f"Error actualizando recorrido: {e}")
            cursor.close()
            return False
    
    @staticmethod
    def delete(recorrido_id):
        """Eliminar un recorrido"""
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM recorridos WHERE id = %s", (recorrido_id,))
        mysql.connection.commit()
        affected_rows = cursor.rowcount
        cursor.close()
        return affected_rows > 0
    
    @staticmethod
    def get_growth_data_for_chart(potrero_id=None, weeks=12):
        """Obtener datos de crecimiento para gráficos"""
        query = """
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m-%d') as fecha,
                altura_promedio,
                tasa_crecimiento_semanal,
                tasa_crecimiento_diaria,
                cobertura_vegetal,
                estado_general,
                potrero_id,
                (SELECT nombre FROM potreros WHERE id = r.potrero_id) as potrero_nombre
            FROM recorridos r
            WHERE 1=1
        """
        params = []
        
        if potrero_id:
            query += " AND potrero_id = %s"
            params.append(potrero_id)
            
        query += " ORDER BY fecha DESC LIMIT %s"
        params.append(weeks)
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        resultados = cursor.fetchall()
        cursor.close()
        
        # Organizar datos para gráficos
        data = {
            'fechas': [],
            'alturas': [],
            'tasas_semanales': [],
            'tasas_diarias': [],
            'coberturas': [],
            'estados': [],
            'potreros': []
        }
        
        for resultado in reversed(resultados):  # Invertir para orden cronológico
            data['fechas'].append(resultado['fecha'])
            data['alturas'].append(float(resultado['altura_promedio']))
            data['tasas_semanales'].append(float(resultado['tasa_crecimiento_semanal']) if resultado['tasa_crecimiento_semanal'] else 0)
            data['tasas_diarias'].append(float(resultado['tasa_crecimiento_diaria']) if resultado['tasa_crecimiento_diaria'] else 0)
            data['coberturas'].append(float(resultado['cobertura_vegetal']))
            data['estados'].append(resultado['estado_general'])
            data['potreros'].append(resultado['potrero_nombre'])
        
        return data
    
    @staticmethod
    def get_latest_by_potrero():
        """Obtener el último recorrido de cada potrero"""
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT r.*, p.nombre as potrero_nombre, p.hectareas,
                   DATEDIFF(CURDATE(), r.fecha) as dias_desde_recorrido
            FROM recorridos r
            JOIN potreros p ON r.potrero_id = p.id
            WHERE (r.potrero_id, r.fecha) IN (
                SELECT potrero_id, MAX(fecha) as max_fecha
                FROM recorridos
                GROUP BY potrero_id
            )
            ORDER BY p.nombre
        """)
        resultados = cursor.fetchall()
        cursor.close()
        return resultados
    
    @staticmethod
    def get_weekly_summary(potrero_id=None):
        """Obtener resumen semanal de crecimiento"""
        query = """
            SELECT 
                potrero_id,
                (SELECT nombre FROM potreros WHERE id = r.potrero_id) as potrero_nombre,
                AVG(altura_promedio) as altura_promedio,
                AVG(tasa_crecimiento_semanal) as tasa_promedio_semanal,
                AVG(cobertura_vegetal) as cobertura_promedio,
                COUNT(*) as total_recorridos,
                MAX(fecha) as ultimo_recorrido
            FROM recorridos r
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
        """
        params = []
        
        if potrero_id:
            query += " AND potrero_id = %s"
            params.append(potrero_id)
            
        query += " GROUP BY potrero_id ORDER BY potrero_nombre"
        
        cursor = mysql.connection.cursor()
        cursor.execute(query, tuple(params))
        resultados = cursor.fetchall()
        cursor.close()
        return resultados
    
    @staticmethod
    def get_growth_alerts():
        """Obtener alertas de crecimiento (potreros con bajo crecimiento o problemas)"""
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT r.*, p.nombre as potrero_nombre,
                   CASE 
                       WHEN r.tasa_crecimiento_semanal < 1.0 THEN 'Crecimiento lento'
                       WHEN r.altura_promedio < 15.0 THEN 'Altura muy baja'
                       WHEN r.cobertura_vegetal < 70.0 THEN 'Cobertura insuficiente'
                       WHEN r.presencia_plagas = 1 THEN 'Presencia de plagas'
                       WHEN r.estado_general IN ('Malo', 'Crítico') THEN 'Estado crítico'
                       ELSE 'Normal'
                   END as tipo_alerta,
                   DATEDIFF(CURDATE(), r.fecha) as dias_desde_recorrido
            FROM recorridos r
            JOIN potreros p ON r.potrero_id = p.id
            WHERE (r.potrero_id, r.fecha) IN (
                SELECT potrero_id, MAX(fecha) as max_fecha
                FROM recorridos
                GROUP BY potrero_id
            )
            AND (
                r.tasa_crecimiento_semanal < 1.0 
                OR r.altura_promedio < 15.0 
                OR r.cobertura_vegetal < 70.0 
                OR r.presencia_plagas = 1 
                OR r.estado_general IN ('Malo', 'Crítico')
            )
            ORDER BY r.fecha DESC
        """)
        alertas = cursor.fetchall()
        cursor.close()
        return alertas

class PuntoMedicion:
    @staticmethod
    def create(recorrido_id, punto_numero, altura_pasto, calidad_forraje,
               coordenada_x=None, coordenada_y=None, observacion_punto=None, foto_url=None,
               peso_verde=None, peso_seco=None, densidad=None):
        """Crear un nuevo punto de medición"""
        cursor = mysql.connection.cursor()
        query = """
            INSERT INTO puntos_medicion 
            (recorrido_id, punto_numero, coordenada_x, coordenada_y, altura_pasto, 
             densidad, calidad_forraje, observacion_punto, foto_url, peso_verde, peso_seco) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        try:
            cursor.execute(query, (
                recorrido_id, punto_numero, coordenada_x, coordenada_y, altura_pasto,
                densidad, calidad_forraje, observacion_punto, foto_url, peso_verde, peso_seco
            ))
            mysql.connection.commit()
            punto_id = cursor.lastrowid
            cursor.close()
            return punto_id
        except Exception as e:
            current_app.logger.error(f"Error creando punto de medición: {e}")
            cursor.close()
            return None
    
    @staticmethod
    def get_by_recorrido(recorrido_id):
        """Obtener todos los puntos de medición de un recorrido"""
        cursor = mysql.connection.cursor()
        cursor.execute("""
            SELECT * FROM puntos_medicion 
            WHERE recorrido_id = %s 
            ORDER BY punto_numero
        """, (recorrido_id,))
        puntos = cursor.fetchall()
        cursor.close()
        return puntos
    
    @staticmethod
    def delete_by_recorrido(recorrido_id):
        """Eliminar todos los puntos de medición de un recorrido"""
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM puntos_medicion WHERE recorrido_id = %s", (recorrido_id,))
        mysql.connection.commit()
        affected_rows = cursor.rowcount
        cursor.close()
        return affected_rows 

class MuestraAforo:
    @staticmethod
    def create(aforo_id, numero_muestra, peso_verde, altura_pasto=None, observaciones=None):
        """Crear una nueva muestra de aforo"""
        cursor = mysql.connection.cursor()
        cursor.execute(
            """INSERT INTO muestras_aforo 
               (aforo_id, numero_muestra, peso_verde, altura_pasto, observaciones) 
               VALUES (%s, %s, %s, %s, %s)""",
            (aforo_id, numero_muestra, peso_verde, altura_pasto, observaciones)
        )
        mysql.connection.commit()
        muestra_id = cursor.lastrowid
        cursor.close()
        
        # Actualizar promedios del aforo
        MuestraAforo.actualizar_promedios_aforo(aforo_id)
        
        return muestra_id
    
    @staticmethod
    def get_by_aforo(aforo_id):
        """Obtener todas las muestras de un aforo"""
        cursor = mysql.connection.cursor()
        cursor.execute(
            "SELECT * FROM muestras_aforo WHERE aforo_id = %s ORDER BY numero_muestra",
            (aforo_id,)
        )
        muestras = cursor.fetchall()
        cursor.close()
        return muestras
    
    @staticmethod
    def update_peso_seco(muestra_id, peso_seco):
        """Actualizar el peso seco de una muestra"""
        cursor = mysql.connection.cursor()
        
        # Primero obtenemos el aforo_id
        cursor.execute("SELECT aforo_id FROM muestras_aforo WHERE id = %s", (muestra_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            return False
            
        aforo_id = result['aforo_id']
        
        cursor.execute(
            """UPDATE muestras_aforo 
               SET peso_seco = %s, fecha_pesaje_seco = NOW() 
               WHERE id = %s""",
            (peso_seco, muestra_id)
        )
        mysql.connection.commit()
        success = cursor.rowcount > 0
        cursor.close()
        
        # Actualizar promedios del aforo
        if success:
            MuestraAforo.actualizar_promedios_aforo(aforo_id)
        
        return success
    
    @staticmethod
    def delete(muestra_id):
        """Eliminar una muestra"""
        cursor = mysql.connection.cursor()
        
        # Primero obtenemos el aforo_id antes de eliminar
        cursor.execute("SELECT aforo_id FROM muestras_aforo WHERE id = %s", (muestra_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            return False
            
        aforo_id = result['aforo_id']
        
        cursor.execute("DELETE FROM muestras_aforo WHERE id = %s", (muestra_id,))
        mysql.connection.commit()
        success = cursor.rowcount > 0
        cursor.close()
        
        # Actualizar promedios del aforo
        if success:
            MuestraAforo.actualizar_promedios_aforo(aforo_id)
        
        return success
    
    @staticmethod
    def get_by_id(muestra_id):
        """Obtener una muestra por ID"""
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT * FROM muestras_aforo WHERE id = %s", (muestra_id,))
        muestra = cursor.fetchone()
        cursor.close()
        return muestra
    
    @staticmethod
    def update(muestra_id, peso_verde, peso_seco=None, altura_pasto=None, observaciones=None):
        """Actualizar una muestra completa"""
        cursor = mysql.connection.cursor()
        
        # Primero obtenemos el aforo_id
        cursor.execute("SELECT aforo_id FROM muestras_aforo WHERE id = %s", (muestra_id,))
        result = cursor.fetchone()
        if not result:
            cursor.close()
            return False
            
        aforo_id = result['aforo_id']
        
        if peso_seco is not None:
            cursor.execute(
                """UPDATE muestras_aforo 
                   SET peso_verde = %s, peso_seco = %s, altura_pasto = %s, 
                       observaciones = %s, fecha_pesaje_seco = NOW() 
                   WHERE id = %s""",
                (peso_verde, peso_seco, altura_pasto, observaciones, muestra_id)
            )
        else:
            cursor.execute(
                """UPDATE muestras_aforo 
                   SET peso_verde = %s, altura_pasto = %s, observaciones = %s
                   WHERE id = %s""",
                (peso_verde, altura_pasto, observaciones, muestra_id)
            )
        
        mysql.connection.commit()
        success = cursor.rowcount > 0
        cursor.close()
        
        # Actualizar promedios del aforo
        if success:
            MuestraAforo.actualizar_promedios_aforo(aforo_id)
        
        return success
    
    @staticmethod
    def actualizar_promedios_aforo(aforo_id):
        """Actualizar promedios de un aforo basado en sus muestras"""
        cursor = mysql.connection.cursor()
        
        try:
            # Obtener todas las muestras del aforo
            cursor.execute(
                "SELECT * FROM muestras_aforo WHERE aforo_id = %s",
                (aforo_id,)
            )
            muestras = cursor.fetchall()
            
            if not muestras:
                # Si no hay muestras, resetear valores
                cursor.execute(
                    """UPDATE aforos SET
                       num_muestras = 0,
                       peso_verde_promedio = NULL,
                       peso_seco_promedio = NULL,
                       porcentaje_ms_promedio = NULL,
                       muestras_con_peso_seco = 0,
                       estado_muestras = 'incompleto',
                       materia_verde = 0,
                       materia_seca = 0,
                       porcentaje_ms = 0
                       WHERE id = %s""",
                    (aforo_id,)
                )
                mysql.connection.commit()
                return True
            
            # Calcular estadísticas
            num_muestras = len(muestras)
            peso_verde_total = sum(m['peso_verde'] for m in muestras)
            peso_verde_promedio = peso_verde_total / num_muestras
            
            muestras_con_peso_seco = [m for m in muestras if m['peso_seco'] is not None]
            num_muestras_con_peso_seco = len(muestras_con_peso_seco)
            
            peso_seco_promedio = None
            porcentaje_ms_promedio = None
            
            if muestras_con_peso_seco:
                peso_seco_total = sum(m['peso_seco'] for m in muestras_con_peso_seco)
                peso_seco_promedio = peso_seco_total / num_muestras_con_peso_seco
                porcentaje_ms_promedio = (peso_seco_promedio / peso_verde_promedio) * 100
            
            # Determinar estado
            estado_muestras = 'completo' if num_muestras_con_peso_seco == num_muestras else 'incompleto'
            
            # Calcular materia verde y seca por hectárea (marco de 0.25 m²)
            factor_conversion = 10000 / 0.25  # 40000
            materia_verde = (peso_verde_promedio / 1000) * factor_conversion  # kg/ha
            materia_seca = (peso_seco_promedio / 1000 * factor_conversion) if peso_seco_promedio else 0  # kg/ha
            
            # Actualizar tabla aforos
            cursor.execute(
                """UPDATE aforos SET
                   num_muestras = %s,
                   peso_verde_promedio = %s,
                   peso_seco_promedio = %s,
                   porcentaje_ms_promedio = %s,
                   muestras_con_peso_seco = %s,
                   estado_muestras = %s,
                   materia_verde = %s,
                   materia_seca = %s,
                   porcentaje_ms = %s
                   WHERE id = %s""",
                (num_muestras, peso_verde_promedio, peso_seco_promedio,
                 porcentaje_ms_promedio, num_muestras_con_peso_seco, estado_muestras,
                 materia_verde, materia_seca, porcentaje_ms_promedio or 0, aforo_id)
            )
            
            mysql.connection.commit()
            return True
            
        except Exception as e:
            print(f"Error actualizando promedios: {e}")
            return False
        finally:
            cursor.close() 