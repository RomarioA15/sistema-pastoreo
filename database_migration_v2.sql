-- =====================================================
-- MIGRACIÓN DE BASE DE DATOS - PASTOREO v2.0
-- Sistema optimizado con mejores prácticas
-- =====================================================

-- Desactivar foreign key checks temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. TABLAS DE CONFIGURACIÓN Y METADATOS
-- =====================================================

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_clave (clave),
    INDEX idx_activo (activo)
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(64) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    user_id INT,
    changes TEXT, -- JSON con los cambios
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_action_date (action, created_at),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- 2. GESTIÓN DE USUARIOS Y PERMISOS
-- =====================================================

-- Optimización de tabla users
CREATE TABLE IF NOT EXISTS users_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    cargo VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMP NULL,
    intentos_login INT DEFAULT 0,
    bloqueado_hasta TIMESTAMP NULL,
    finca_actual_id INT,
    preferencias JSON, -- Configuraciones del usuario
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_activo (activo),
    INDEX idx_finca_actual (finca_actual_id),
    INDEX idx_ultimo_login (ultimo_login),
    INDEX idx_deleted_at (deleted_at)
);

-- Tabla de fincas mejorada
CREATE TABLE IF NOT EXISTS fincas_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(20),
    direccion TEXT,
    municipio VARCHAR(100),
    departamento VARCHAR(100),
    coordenadas POINT, -- Coordenadas GPS
    area_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    altitud INT, -- metros sobre el nivel del mar
    precipitacion_anual DECIMAL(8,2), -- mm
    temperatura_promedio DECIMAL(4,1), -- °C
    propietario_id INT,
    activa BOOLEAN DEFAULT TRUE,
    configuracion JSON, -- Configuraciones específicas de la finca
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nombre (nombre),
    INDEX idx_propietario (propietario_id),
    INDEX idx_activa (activa),
    SPATIAL INDEX idx_coordenadas (coordenadas)
);

-- =====================================================
-- 3. SISTEMA DE POTREROS OPTIMIZADO
-- =====================================================

-- Tabla de potreros mejorada
CREATE TABLE IF NOT EXISTS potreros_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    finca_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20), -- Código interno del potrero
    hectareas DECIMAL(8,2) NOT NULL,
    tipo_pasto ENUM('brachiaria', 'kikuyu', 'estrella', 'guinea', 'maralfalfa', 'imperial', 'mulato', 'otro') NOT NULL,
    variedad_pasto VARCHAR(100),
    etapa_ganado ENUM('cria', 'levante', 'ceba', 'ordeño', 'reproductores', 'secas') NOT NULL,
    estado ENUM('disponible', 'ocupado', 'descanso', 'mantenimiento', 'fertilizacion') DEFAULT 'disponible',
    fecha_siembra DATE,
    fecha_ultimo_mantenimiento DATE,
    pendiente ENUM('plano', 'leve', 'moderada', 'fuerte') DEFAULT 'leve',
    tipo_suelo VARCHAR(100),
    ph_suelo DECIMAL(3,1),
    coordenadas POLYGON, -- Polígono del potrero
    descripcion TEXT,
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    capacidad_teorica_animales INT DEFAULT 0, -- Basado en hectáreas
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    INDEX idx_finca (finca_id),
    INDEX idx_nombre (nombre),
    INDEX idx_codigo (codigo),
    INDEX idx_tipo_pasto (tipo_pasto),
    INDEX idx_etapa_ganado (etapa_ganado),
    INDEX idx_estado (estado),
    INDEX idx_activo (activo),
    INDEX idx_deleted_at (deleted_at),
    SPATIAL INDEX idx_coordenadas (coordenadas),
    
    UNIQUE KEY uk_finca_nombre (finca_id, nombre),
    UNIQUE KEY uk_finca_codigo (finca_id, codigo)
);

-- =====================================================
-- 4. SISTEMA DE AFORACIÓN OPTIMIZADO
-- =====================================================

-- Tabla de aforos principal
CREATE TABLE IF NOT EXISTS aforos_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    potrero_id INT NOT NULL,
    fecha DATE NOT NULL,
    responsable_id INT,
    metodologia ENUM('cuadrante', 'transecto', 'mixta') DEFAULT 'cuadrante',
    numero_muestras INT DEFAULT 5,
    -- Resultados calculados
    materia_verde DECIMAL(8,2) NOT NULL, -- kg/ha
    materia_seca DECIMAL(8,2) NOT NULL, -- kg/ha
    porcentaje_ms DECIMAL(5,2) NOT NULL,
    altura_promedio DECIMAL(5,1), -- cm
    -- Datos de rotación
    dias_rotacion INT,
    promedio_dias_rotacion DECIMAL(5,1),
    fecha_entrada DATE,
    fecha_salida DATE,
    -- Estado y observaciones
    estado_pasto ENUM('excelente', 'bueno', 'regular', 'bajo', 'critico') DEFAULT 'regular',
    observaciones TEXT,
    clima_condiciones VARCHAR(200),
    validado BOOLEAN DEFAULT FALSE,
    validado_por INT,
    validado_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_potrero (potrero_id),
    INDEX idx_fecha (fecha),
    INDEX idx_responsable (responsable_id),
    INDEX idx_potrero_fecha (potrero_id, fecha),
    INDEX idx_estado_pasto (estado_pasto),
    INDEX idx_validado (validado),
    INDEX idx_created_at (created_at),
    
    UNIQUE KEY uk_potrero_fecha (potrero_id, fecha)
);

-- Tabla de muestras individuales de aforo
CREATE TABLE IF NOT EXISTS muestras_aforo_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    aforo_id INT NOT NULL,
    numero_muestra TINYINT NOT NULL,
    -- Ubicación de la muestra
    coordenada_x DECIMAL(10,6),
    coordenada_y DECIMAL(10,6),
    -- Mediciones
    peso_verde DECIMAL(8,3) NOT NULL, -- gramos
    peso_seco DECIMAL(8,3), -- gramos
    altura_pasto DECIMAL(4,1), -- cm
    area_cuadrante DECIMAL(6,4) DEFAULT 0.25, -- m²
    -- Calidad
    porcentaje_hoja DECIMAL(5,2),
    porcentaje_tallo DECIMAL(5,2),
    porcentaje_material_muerto DECIMAL(5,2),
    densidad_plantas INT, -- plantas por m²
    observacion_muestra TEXT,
    foto_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_aforo (aforo_id),
    INDEX idx_numero_muestra (numero_muestra),
    
    FOREIGN KEY (aforo_id) REFERENCES aforos_v2(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. GESTIÓN DE GANADO
-- =====================================================

-- Tabla de lotes de ganado
CREATE TABLE IF NOT EXISTS lotes_ganado_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    finca_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(20),
    numero_animales INT NOT NULL DEFAULT 0,
    peso_promedio DECIMAL(6,2), -- kg
    edad_promedio INT, -- meses
    categoria ENUM('cria', 'levante', 'ceba', 'vacas_ordeño', 'vacas_secas', 'toros', 'novillas') NOT NULL,
    raza_predominante VARCHAR(100),
    fecha_ingreso DATE,
    origen VARCHAR(200),
    estado ENUM('activo', 'vendido', 'trasladado', 'muerto') DEFAULT 'activo',
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_finca (finca_id),
    INDEX idx_nombre (nombre),
    INDEX idx_codigo (codigo),
    INDEX idx_categoria (categoria),
    INDEX idx_estado (estado),
    
    UNIQUE KEY uk_finca_codigo (finca_id, codigo)
);

-- Tabla de movimientos de ganado
CREATE TABLE IF NOT EXISTS movimientos_ganado_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lote_id INT NOT NULL,
    potrero_origen_id INT,
    potrero_destino_id INT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE,
    numero_animales INT NOT NULL,
    peso_entrada DECIMAL(8,2), -- kg total
    peso_salida DECIMAL(8,2), -- kg total
    motivo ENUM('rotacion', 'manejo', 'sanidad', 'venta', 'traslado') NOT NULL,
    responsable_id INT,
    observaciones TEXT,
    carga_animal DECIMAL(6,2), -- animales por hectárea
    dias_permanencia INT,
    ganancia_peso_total DECIMAL(8,2), -- kg
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_lote (lote_id),
    INDEX idx_potrero_origen (potrero_origen_id),
    INDEX idx_potrero_destino (potrero_destino_id),
    INDEX idx_fecha_entrada (fecha_entrada),
    INDEX idx_fecha_salida (fecha_salida),
    INDEX idx_motivo (motivo),
    INDEX idx_responsable (responsable_id),
    
    FOREIGN KEY (lote_id) REFERENCES lotes_ganado_v2(id) ON DELETE CASCADE,
    FOREIGN KEY (potrero_origen_id) REFERENCES potreros_v2(id),
    FOREIGN KEY (potrero_destino_id) REFERENCES potreros_v2(id)
);

-- =====================================================
-- 6. DATOS CLIMÁTICOS
-- =====================================================

-- Tabla de datos climáticos optimizada
CREATE TABLE IF NOT EXISTS clima_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    finca_id INT,
    fecha DATE NOT NULL,
    -- Temperaturas
    temperatura_min DECIMAL(4,1),
    temperatura_max DECIMAL(4,1),
    temperatura_promedio DECIMAL(4,1),
    -- Humedad y presión
    humedad DECIMAL(5,2), -- %
    presion DECIMAL(7,2), -- hPa
    punto_rocio DECIMAL(4,1), -- °C
    -- Precipitación
    lluvia DECIMAL(6,2) DEFAULT 0, -- mm
    intensidad_lluvia ENUM('sin_lluvia', 'llovizna', 'lluvia_ligera', 'lluvia_moderada', 'lluvia_fuerte', 'tormenta'),
    -- Viento
    velocidad_viento DECIMAL(5,2), -- km/h
    direccion_viento VARCHAR(3), -- N, NE, E, SE, S, SW, W, NW
    rafagas_viento DECIMAL(5,2), -- km/h
    -- Radiación y visibilidad
    horas_sol DECIMAL(4,2),
    radiacion_solar DECIMAL(8,2), -- W/m²
    uv_index TINYINT,
    visibilidad DECIMAL(5,2), -- km
    -- Cobertura nubosa
    nubosidad TINYINT, -- % (0-100)
    tipo_nubes VARCHAR(100),
    -- Metadatos
    descripcion VARCHAR(200),
    icono VARCHAR(50),
    fuente_datos ENUM('manual', 'estacion_meteorologica', 'api_clima', 'satelite') DEFAULT 'manual',
    estacion_id VARCHAR(50), -- ID de estación meteorológica
    calidad_datos ENUM('excelente', 'buena', 'regular', 'baja') DEFAULT 'buena',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_finca_fecha (finca_id, fecha),
    INDEX idx_fecha (fecha),
    INDEX idx_temperatura_min (temperatura_min),
    INDEX idx_temperatura_max (temperatura_max),
    INDEX idx_lluvia (lluvia),
    INDEX idx_fuente_datos (fuente_datos),
    INDEX idx_created_at (created_at),
    
    UNIQUE KEY uk_finca_fecha (finca_id, fecha)
);

-- =====================================================
-- 7. ACTIVIDADES Y TAREAS
-- =====================================================

-- Tabla de actividades mejorada
CREATE TABLE IF NOT EXISTS actividades_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    finca_id INT NOT NULL,
    potrero_id INT,
    lote_id INT, -- Relacionado con lote de ganado si aplica
    tipo_actividad ENUM(
        'fertilizacion', 'siembra', 'mantenimiento', 'control_malezas',
        'riego', 'cercado', 'pesaje', 'vacunacion', 'desparasitacion',
        'revision_sanitaria', 'manejo_reproductivo', 'otro'
    ) NOT NULL,
    subtipo VARCHAR(100), -- Especificación del tipo
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha_programada DATE NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    -- Recursos
    responsable_id INT,
    trabajadores_asignados JSON, -- IDs de trabajadores
    costo_estimado DECIMAL(10,2),
    costo_real DECIMAL(10,2),
    materiales_usados JSON, -- Lista de materiales
    equipos_usados JSON, -- Lista de equipos
    -- Estado
    estado ENUM('programada', 'en_progreso', 'pausada', 'completada', 'cancelada') DEFAULT 'programada',
    prioridad ENUM('baja', 'media', 'alta', 'critica') DEFAULT 'media',
    progreso TINYINT DEFAULT 0, -- % completado
    -- Resultados
    resultados TEXT,
    observaciones TEXT,
    fotos JSON, -- URLs de fotos
    documentos JSON, -- URLs de documentos
    -- Métricas
    duracion_horas DECIMAL(5,2),
    area_trabajada DECIMAL(8,2), -- hectáreas
    rendimiento TEXT, -- Descripción del rendimiento
    -- Seguimiento
    requiere_seguimiento BOOLEAN DEFAULT FALSE,
    fecha_siguiente_revision DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_finca (finca_id),
    INDEX idx_potrero (potrero_id),
    INDEX idx_lote (lote_id),
    INDEX idx_tipo_actividad (tipo_actividad),
    INDEX idx_fecha_programada (fecha_programada),
    INDEX idx_responsable (responsable_id),
    INDEX idx_estado (estado),
    INDEX idx_prioridad (prioridad),
    INDEX idx_requiere_seguimiento (requiere_seguimiento),
    
    FOREIGN KEY (potrero_id) REFERENCES potreros_v2(id),
    FOREIGN KEY (lote_id) REFERENCES lotes_ganado_v2(id)
);

-- =====================================================
-- 8. RECORRIDOS Y MONITOREO
-- =====================================================

-- Tabla de recorridos mejorada
CREATE TABLE IF NOT EXISTS recorridos_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    potrero_id INT NOT NULL,
    fecha DATE NOT NULL,
    responsable_id INT,
    tipo_recorrido ENUM('rutinario', 'especial', 'seguimiento', 'emergencia') DEFAULT 'rutinario',
    -- Mediciones principales
    altura_promedio DECIMAL(5,1) NOT NULL, -- cm
    altura_minima DECIMAL(5,1),
    altura_maxima DECIMAL(5,1),
    cobertura_vegetal DECIMAL(5,2), -- %
    -- Estado general
    estado_general ENUM('excelente', 'bueno', 'regular', 'malo', 'critico') NOT NULL,
    estado_cercas ENUM('excelente', 'bueno', 'regular', 'malo') DEFAULT 'bueno',
    estado_aguaderos ENUM('excelente', 'bueno', 'regular', 'malo') DEFAULT 'bueno',
    estado_saladeros ENUM('excelente', 'bueno', 'regular', 'malo') DEFAULT 'bueno',
    -- Condiciones ambientales
    humedad_suelo ENUM('seco', 'normal', 'humedo', 'encharcado') DEFAULT 'normal',
    compactacion_suelo ENUM('ninguna', 'leve', 'moderada', 'severa') DEFAULT 'ninguna',
    erosion ENUM('ninguna', 'leve', 'moderada', 'severa') DEFAULT 'ninguna',
    -- Problemas identificados
    presencia_plagas BOOLEAN DEFAULT FALSE,
    tipo_plagas VARCHAR(200),
    presencia_enfermedades BOOLEAN DEFAULT FALSE,
    tipo_enfermedades VARCHAR(200),
    presencia_malezas BOOLEAN DEFAULT FALSE,
    tipo_malezas VARCHAR(200),
    -- Necesidades identificadas
    necesita_riego BOOLEAN DEFAULT FALSE,
    necesita_fertilizacion BOOLEAN DEFAULT FALSE,
    necesita_mantenimiento BOOLEAN DEFAULT FALSE,
    necesita_descanso BOOLEAN DEFAULT FALSE,
    -- Datos técnicos
    puntos_medicion TINYINT DEFAULT 5,
    metodologia TEXT,
    condiciones_clima VARCHAR(200),
    -- Observaciones y seguimiento
    observaciones TEXT,
    recomendaciones TEXT,
    acciones_inmediatas TEXT,
    fecha_proximo_recorrido DATE,
    fotos JSON, -- URLs de fotos tomadas
    gps_track TEXT, -- Track GPS del recorrido
    duracion_minutos INT, -- Duración del recorrido
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_potrero (potrero_id),
    INDEX idx_fecha (fecha),
    INDEX idx_responsable (responsable_id),
    INDEX idx_tipo_recorrido (tipo_recorrido),
    INDEX idx_estado_general (estado_general),
    INDEX idx_presencia_plagas (presencia_plagas),
    INDEX idx_necesita_riego (necesita_riego),
    INDEX idx_necesita_fertilizacion (necesita_fertilizacion),
    INDEX idx_created_at (created_at),
    
    UNIQUE KEY uk_potrero_fecha (potrero_id, fecha),
    FOREIGN KEY (potrero_id) REFERENCES potreros_v2(id)
);

-- Tabla de puntos de medición en recorridos
CREATE TABLE IF NOT EXISTS puntos_medicion_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recorrido_id INT NOT NULL,
    punto_numero TINYINT NOT NULL,
    coordenada_x DECIMAL(10,6),
    coordenada_y DECIMAL(10,6),
    altura_pasto DECIMAL(5,1) NOT NULL, -- cm
    calidad_forraje ENUM('excelente', 'buena', 'regular', 'mala') NOT NULL,
    densidad ENUM('alta', 'media', 'baja') DEFAULT 'media',
    peso_verde DECIMAL(8,3), -- gramos por m²
    peso_seco DECIMAL(8,3), -- gramos por m²
    observacion_punto TEXT,
    foto_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_recorrido (recorrido_id),
    INDEX idx_punto_numero (punto_numero),
    INDEX idx_calidad_forraje (calidad_forraje),
    
    FOREIGN KEY (recorrido_id) REFERENCES recorridos_v2(id) ON DELETE CASCADE
);

-- =====================================================
-- 9. ANÁLISIS DE pH
-- =====================================================

-- Tabla de análisis de pH optimizada
CREATE TABLE IF NOT EXISTS ph_v2 (
    id INT PRIMARY KEY AUTO_INCREMENT,
    potrero_id INT NOT NULL,
    fecha DATE NOT NULL,
    responsable_id INT,
    -- Ubicación de la muestra
    coordenada_x DECIMAL(10,6),
    coordenada_y DECIMAL(10,6),
    profundidad_cm TINYINT DEFAULT 20,
    -- Mediciones
    valor_ph DECIMAL(3,1) NOT NULL,
    metodo_medicion ENUM('papel_tornasol', 'phmetro_digital', 'laboratorio') DEFAULT 'phmetro_digital',
    -- Condiciones de la muestra
    humedad_muestra ENUM('seca', 'normal', 'humeda') DEFAULT 'normal',
    temperatura_muestra DECIMAL(4,1),
    tipo_suelo VARCHAR(100),
    -- Análisis adicional (si se hizo en laboratorio)
    materia_organica DECIMAL(5,2), -- %
    nitrogeno DECIMAL(6,2), -- ppm
    fosforo DECIMAL(6,2), -- ppm
    potasio DECIMAL(6,2), -- ppm
    calcio DECIMAL(6,2), -- ppm
    magnesio DECIMAL(6,2), -- ppm
    conductividad_electrica DECIMAL(6,2), -- dS/m
    -- Recomendaciones
    recomendacion_cal DECIMAL(8,2), -- kg/ha
    recomendacion_fertilizante TEXT,
    observaciones TEXT,
    laboratorio VARCHAR(200), -- Si fue análisis externo
    numero_muestra_laboratorio VARCHAR(100),
    costo_analisis DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_potrero (potrero_id),
    INDEX idx_fecha (fecha),
    INDEX idx_responsable (responsable_id),
    INDEX idx_valor_ph (valor_ph),
    INDEX idx_metodo_medicion (metodo_medicion),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (potrero_id) REFERENCES potreros_v2(id)
);

-- =====================================================
-- 10. VISTAS PARA CONSULTAS OPTIMIZADAS
-- =====================================================

-- Vista de potreros con última información
CREATE OR REPLACE VIEW vista_potreros_resumen AS
SELECT 
    p.*,
    -- Último aforo
    ua.fecha as ultimo_aforo_fecha,
    ua.materia_verde as ultimo_materia_verde,
    ua.materia_seca as ultimo_materia_seca,
    ua.estado_pasto as ultimo_estado_pasto,
    DATEDIFF(CURDATE(), ua.fecha) as dias_sin_aforo,
    
    -- Último recorrido
    ur.fecha as ultimo_recorrido_fecha,
    ur.estado_general as ultimo_estado_general,
    ur.altura_promedio as ultima_altura_promedio,
    DATEDIFF(CURDATE(), ur.fecha) as dias_sin_recorrido,
    
    -- Último pH
    up.fecha as ultimo_ph_fecha,
    up.valor_ph as ultimo_valor_ph,
    DATEDIFF(CURDATE(), up.fecha) as dias_sin_ph,
    
    -- Estadísticas
    COALESCE(stats.total_aforos, 0) as total_aforos_6_meses,
    COALESCE(stats.promedio_ms, 0) as promedio_ms_6_meses,
    COALESCE(stats.promedio_mv, 0) as promedio_mv_6_meses,
    
    -- Estado consolidado
    CASE 
        WHEN DATEDIFF(CURDATE(), ua.fecha) > 45 OR ua.fecha IS NULL THEN 'sin_datos'
        WHEN ua.estado_pasto IN ('excelente', 'bueno') THEN 'optimo'
        WHEN ua.estado_pasto = 'regular' THEN 'regular'
        ELSE 'requiere_atencion'
    END as estado_consolidado

FROM potreros_v2 p

-- Último aforo
LEFT JOIN (
    SELECT potrero_id, fecha, materia_verde, materia_seca, estado_pasto,
           ROW_NUMBER() OVER (PARTITION BY potrero_id ORDER BY fecha DESC) as rn
    FROM aforos_v2
) ua ON p.id = ua.potrero_id AND ua.rn = 1

-- Último recorrido
LEFT JOIN (
    SELECT potrero_id, fecha, estado_general, altura_promedio,
           ROW_NUMBER() OVER (PARTITION BY potrero_id ORDER BY fecha DESC) as rn
    FROM recorridos_v2
) ur ON p.id = ur.potrero_id AND ur.rn = 1

-- Último pH
LEFT JOIN (
    SELECT potrero_id, fecha, valor_ph,
           ROW_NUMBER() OVER (PARTITION BY potrero_id ORDER BY fecha DESC) as rn
    FROM ph_v2
) up ON p.id = up.potrero_id AND up.rn = 1

-- Estadísticas últimos 6 meses
LEFT JOIN (
    SELECT 
        potrero_id,
        COUNT(*) as total_aforos,
        AVG(materia_seca) as promedio_ms,
        AVG(materia_verde) as promedio_mv
    FROM aforos_v2 
    WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY potrero_id
) stats ON p.id = stats.potrero_id

WHERE p.deleted_at IS NULL;

-- Vista de balance forrajero
CREATE OR REPLACE VIEW vista_balance_forrajero AS
SELECT 
    DATE(fecha) as fecha,
    SUM(produccion_ms) as produccion_total_ms,
    SUM(consumo_estimado) as consumo_total_estimado,
    SUM(produccion_ms) - SUM(consumo_estimado) as balance_ms,
    AVG(carga_animal) as carga_animal_promedio,
    COUNT(DISTINCT potrero_id) as potreros_evaluados
FROM (
    SELECT 
        a.fecha,
        a.potrero_id,
        p.hectareas,
        a.materia_seca * p.hectareas as produccion_ms,
        COALESCE(mg.numero_animales * 15, 0) as consumo_estimado, -- 15 kg MS por animal/día
        COALESCE(mg.numero_animales / p.hectareas, 0) as carga_animal
    FROM aforos_v2 a
    JOIN potreros_v2 p ON a.potrero_id = p.id
    LEFT JOIN (
        SELECT 
            potrero_destino_id,
            fecha_entrada,
            fecha_salida,
            numero_animales,
            ROW_NUMBER() OVER (PARTITION BY potrero_destino_id ORDER BY fecha_entrada DESC) as rn
        FROM movimientos_ganado_v2
        WHERE fecha_salida IS NULL OR fecha_salida >= CURDATE()
    ) mg ON a.potrero_id = mg.potrero_destino_id AND mg.rn = 1
    WHERE a.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
) balance_data
GROUP BY DATE(fecha)
ORDER BY fecha DESC;

-- =====================================================
-- 11. TRIGGERS PARA AUDITORÍA Y CONSISTENCIA
-- =====================================================

-- Trigger para auditar cambios en potreros
DELIMITER $$
CREATE TRIGGER audit_potreros_update 
AFTER UPDATE ON potreros_v2
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (table_name, record_id, action, changes)
    VALUES ('potreros_v2', NEW.id, 'UPDATE', 
            JSON_OBJECT(
                'old', JSON_OBJECT('nombre', OLD.nombre, 'hectareas', OLD.hectareas, 'estado', OLD.estado),
                'new', JSON_OBJECT('nombre', NEW.nombre, 'hectareas', NEW.hectareas, 'estado', NEW.estado)
            ));
END$$

-- Trigger para actualizar capacidad teórica del potrero
CREATE TRIGGER update_potrero_capacidad
BEFORE UPDATE ON potreros_v2
FOR EACH ROW
BEGIN
    -- Calcular capacidad teórica basada en hectáreas (2 animales por hectárea base)
    SET NEW.capacidad_teorica_animales = ROUND(NEW.hectareas * 2);
END$$

-- Trigger para calcular días de permanencia en movimientos
CREATE TRIGGER calculate_dias_permanencia
BEFORE UPDATE ON movimientos_ganado_v2
FOR EACH ROW
BEGIN
    IF NEW.fecha_salida IS NOT NULL THEN
        SET NEW.dias_permanencia = DATEDIFF(NEW.fecha_salida, NEW.fecha_entrada);
        SET NEW.ganancia_peso_total = NEW.peso_salida - NEW.peso_entrada;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 12. DATOS INICIALES DE CONFIGURACIÓN
-- =====================================================

-- Configuraciones del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
('sistema_version', '2.0', 'Versión del sistema', 'string'),
('dias_rotacion_promedio', '21', 'Días promedio recomendados para rotación', 'number'),
('consumo_animal_diario', '15', 'Consumo promedio diario por animal (kg MS)', 'number'),
('alerta_dias_sin_aforo', '30', 'Días sin aforo para generar alerta', 'number'),
('backup_automatico', 'true', 'Realizar backup automático', 'boolean'),
('notificaciones_email', 'true', 'Enviar notificaciones por email', 'boolean')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- Reactivar foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================

-- Mensaje de finalización
SELECT 'Migración de base de datos completada exitosamente' as mensaje; 