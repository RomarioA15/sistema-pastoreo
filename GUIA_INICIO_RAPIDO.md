# 🚀 Guía de Inicio Rápido - Sistema de Pastoreo

Esta guía te permitirá ejecutar el sistema en menos de 5 minutos.

## ✅ Lista de Verificación Previa

Antes de comenzar, asegúrate de tener:

- [x] Python 3.8+ instalado
- [x] MySQL ejecutándose
- [x] Acceso de administrador a MySQL
- [x] Git (opcional, para clonar)

## 🎯 Instalación en 4 Pasos

### Paso 1: Preparar el Proyecto
```bash
# Descargar/clonar el proyecto
# Si tienes los archivos descargados, ve al directorio:
cd "Pastoreo Web 1.1"

# O si clonas desde git:
# git clone <url-repositorio>
# cd pastoreo-web
```

### Paso 2: Instalar Dependencias
```bash
# Instalar todas las dependencias necesarias
pip install -r requirements.txt
```

### Paso 3: Configurar Base de Datos
```bash
# Opción A: Configuración automática (recomendada)
mysql -u root -p < init_database.sql

# Opción B: Manual
mysql -u root -p
CREATE DATABASE pastoreo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pastoreo;
SOURCE init_database.sql;
EXIT;
```

### Paso 4: Ejecutar el Sistema
```bash
# Método recomendado
python run.py

# O método alternativo
python app.py
```

## 🌐 Acceder al Sistema

1. **Abrir navegador**: Ve a `http://localhost:5000`
2. **Iniciar sesión** con las credenciales por defecto:
   - **Usuario**: `admin@pastoreo.com`
   - **Contraseña**: `admin123`

## 🎉 ¡Listo!

Ahora tienes acceso completo al sistema con:

### 📊 Dashboard Principal
- Vista de estadísticas generales
- Accesos rápidos a todas las funciones

### 🌱 Módulos Disponibles
- **Potreros**: Gestión de praderas
- **Aforos**: Medición de forraje
- **Actividades**: Registro de tareas
- **Ganado**: Control de lotes
- **Clima**: Datos meteorológicos
- **Recorridos**: Inspecciones
- **pH**: Mediciones de suelo

## 🔧 Configuración Opcional

### Cambiar Credenciales de Base de Datos
Si tu MySQL tiene credenciales diferentes:

1. Copia el archivo de ejemplo:
```bash
cp env_example.txt .env
```

2. Edita `.env` con tus credenciales:
```env
MYSQL_HOST=localhost
MYSQL_USER=tu_usuario
MYSQL_PASSWORD=tu_contraseña
MYSQL_DB=pastoreo
```

### Cambiar Puerto de la Aplicación
Si el puerto 5000 está ocupado, edita `run.py`:
```python
app.run(port=8000)  # Cambiar a puerto libre
```

## 🆘 Solución Rápida de Problemas

### Error: "No module named 'flask'"
```bash
pip install flask flask-mysqldb flask-login flask-session
```

### Error: "Can't connect to MySQL"
```bash
# Verificar que MySQL esté corriendo
# Windows:
net start mysql
# Linux/Mac:
sudo systemctl start mysql
```

### Error: "Access denied for user"
- Verifica usuario y contraseña de MySQL
- Asegúrate de tener permisos para crear bases de datos

### Puerto ocupado
```bash
# Buscar proceso usando el puerto
netstat -ano | findstr :5000
# Matar proceso o usar otro puerto
```

## 📱 Primeros Pasos en el Sistema

### 1. Crear tu Primer Potrero
1. Ve a "Potreros" en el menú
2. Clic en "Nuevo Potrero"
3. Completa la información básica
4. Guardar

### 2. Registrar un Aforo
1. Ve a "Aforos"
2. Clic en "Nuevo Aforo"
3. Selecciona el potrero
4. Registra las mediciones

### 3. Programar una Actividad
1. Ve a "Actividades"
2. Clic en "Nueva Actividad"
3. Define la tarea y fecha
4. Guardar

## 🎓 Video Tutorial (Próximamente)
- Instalación paso a paso
- Tour completo del sistema
- Casos de uso comunes

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Verifica que seguiste todos los pasos
2. Revisa los logs en la consola
3. Consulta la documentación completa en `README.md`
4. Verifica que MySQL esté ejecutándose

## 🔄 Actualizaciones del Sistema

Para mantener el sistema actualizado:
```bash
# Respaldar base de datos
mysqldump -u root -p pastoreo > backup.sql

# Aplicar nuevas migraciones (cuando estén disponibles)
python run.py --update

# Reiniciar el sistema
python run.py
```

---

**¡El sistema está listo para gestionar tu operación ganadera! 🐄🌱**

*Tiempo estimado de instalación: 3-5 minutos* 