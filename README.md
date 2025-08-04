# 🌱 Sistema de Gestión de Pastoreo v2.0

[![Version](https://img.shields.io/badge/version-2.0-green.svg)](https://github.com/tu-usuario/pastoreo)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/flask-2.3.2-black.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/license-MIT-orange.svg)](LICENSE)

Sistema web integral para la gestión y monitoreo de operaciones ganaderas, desarrollado en Flask con enfoque en usabilidad y funcionalidad.

## 🚀 Características Principales

- **📊 Dashboard Intuitivo**: Panel de control con métricas clave
- **🌱 Gestión de Potreros**: Administración completa de praderas
- **📏 Sistema de Aforos**: Medición de disponibilidad forrajera
- **⚡ Actividades**: Registro y seguimiento de tareas
- **🐄 Manejo de Ganado**: Control de lotes y movimientos
- **🌤️ Datos Climáticos**: Monitoreo de condiciones ambientales
- **🚶 Recorridos**: Planificación y registro de inspecciones
- **🧪 Mediciones de pH**: Control de calidad del suelo
- **👥 Sistema de Usuarios**: Autenticación y permisos

## 📋 Requisitos Previos

- **Python 3.8+**
- **MySQL 5.7+ o 8.0+**
- **pip** (gestor de paquetes de Python)

## 🛠️ Instalación Rápida

### 1. Clonar/Descargar el Proyecto
```bash
# Si tienes git instalado
git clone <url-del-repositorio>
cd pastoreo-web

# O descarga y extrae el archivo ZIP
```

### 2. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar Base de Datos

#### Opción A: Configuración Automática (Recomendada)
```bash
# Edita init_database.sql con tus credenciales de MySQL si es necesario
# Luego ejecuta en MySQL:
mysql -u root -p < init_database.sql
```

#### Opción B: Configuración Manual
1. Crear base de datos:
```sql
CREATE DATABASE pastoreo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Ejecutar el script de inicialización:
```bash
mysql -u root -p pastoreo < init_database.sql
```

### 4. Configurar Variables de Entorno (Opcional)
Copia `env_example.txt` a `.env` y modifica según tu configuración:
```bash
cp env_example.txt .env
```

Edita `.env`:
```env
MYSQL_HOST=localhost
MYSQL_USER=tu_usuario
MYSQL_PASSWORD=tu_contraseña
MYSQL_DB=pastoreo
```

### 5. Ejecutar la Aplicación
```bash
python run.py
```

O usando el método tradicional:
```bash
python app.py
```

## 🔑 Acceso al Sistema

Una vez iniciado, accede a: **http://localhost:5000**

### Credenciales por Defecto:
- **Usuario**: `admin@pastoreo.com`
- **Contraseña**: `admin123`

## 📱 Uso del Sistema

### Dashboard Principal
- Vista general con estadísticas clave
- Accesos rápidos a todas las funcionalidades
- Información del usuario y finca actual

### Gestión de Potreros
- **Ver Potreros**: Lista con información detallada
- **Crear Potrero**: Formulario para nuevos potreros
- **Editar**: Modificar datos existentes
- **Visualizador**: Mapa visual del estado de rotación

### Sistema de Aforos
- **Registrar Aforos**: Medir disponibilidad forrajera
- **Gestionar Muestras**: Detalle de mediciones
- **Histórico**: Consultar datos anteriores
- **Reportes**: Análisis de productividad

### Control de Actividades
- **Nueva Actividad**: Registrar tareas realizadas
- **Seguimiento**: Monitor de estados
- **Calendario**: Vista temporal de actividades
- **Reportes**: Análisis de costos y eficiencia

### Manejo de Ganado
- **Lotes**: Gestión de grupos de animales
- **Movimientos**: Control de traslados
- **Balance Forrajero**: Cálculo de carga animal
- **Histórico**: Seguimiento de movimientos

### Datos Climáticos
- **Clima Actual**: Condiciones en tiempo real
- **Histórico**: Consulta de datos pasados
- **Reportes**: Análisis meteorológico

### Recorridos
- **Planificar**: Crear nuevos recorridos
- **Registrar**: Documentar inspecciones
- **Análisis**: Evaluación de resultados
- **Dashboard de Crecimiento**: Métricas de pastos

## 🔧 Configuración Avanzada

### Base de Datos
El sistema utiliza MySQL con las siguientes tablas principales:
- `users`: Usuarios del sistema
- `fincas`: Información de fincas
- `potreros`: Datos de potreros
- `aforos`: Registros de mediciones
- `actividades`: Control de tareas
- `clima`: Datos meteorológicos

### Personalización
- **CSS**: Modifica `proyecto/static/css/style.css`
- **JavaScript**: Scripts en `proyecto/static/js/`
- **Templates**: HTML en `proyecto/templates/`

### Permisos y Roles
El sistema incluye control de acceso granular:
- **Administrador**: Acceso completo
- **Operador**: Funciones operativas
- **Consulta**: Solo lectura

## 🐛 Solución de Problemas

### Error de Conexión a MySQL
```bash
# Verificar que MySQL esté ejecutándose
sudo systemctl status mysql

# Verificar credenciales
mysql -u root -p
```

### Error de Dependencias
```bash
# Reinstalar dependencias
pip install --upgrade -r requirements.txt
```

### Error de Permisos
```bash
# En Linux/Mac, dar permisos de ejecución
chmod +x run.py
```

### Problemas de Puerto
Si el puerto 5000 está ocupado, modifica en `run.py`:
```python
app.run(port=8000)  # Cambiar a puerto disponible
```

## 📁 Estructura del Proyecto

```
Pastoreo Web 1.1/
├── app.py                      # Aplicación principal
├── run.py                      # Script de inicio
├── config.py                   # Configuraciones
├── db.py                       # Conexión a base de datos
├── requirements.txt            # Dependencias
├── init_database.sql           # Script de base de datos
├── proyecto/
│   ├── models/                 # Modelos de datos
│   ├── routes/                 # Rutas y controladores
│   ├── templates/              # Plantillas HTML
│   ├── static/                 # Archivos estáticos
│   └── utils/                  # Utilidades
├── logs/                       # Archivos de registro
└── flask_session/              # Sesiones de usuario
```

## 🔐 Seguridad

- Autenticación requerida para todas las funciones
- Hashing seguro de contraseñas
- Protección CSRF
- Validación de entrada de datos
- Logs de auditoría

## 🚀 Despliegue en Producción

Para un entorno de producción:

1. **Configurar variables de entorno**:
```env
FLASK_ENV=production
SECRET_KEY=tu-clave-secreta-muy-segura
```

2. **Usar servidor WSGI**:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

3. **Configurar proxy reverso** (Nginx recomendado)

## 📞 Soporte

Para reportar problemas o solicitar funcionalidades:
- Documenta el error específico
- Incluye versión de Python y MySQL
- Proporciona logs de error si están disponibles

## 📄 Licencia

Este proyecto está desarrollado para uso en gestión ganadera.

## 🔄 Actualizaciones

### v2.0 - Actual
- ✅ Interfaz moderna y responsive
- ✅ Sistema de permisos simplificado
- ✅ Dashboard mejorado
- ✅ Navegación optimizada
- ✅ Funcionalidad completa operativa

---

**¡Sistema listo para uso en producción! 🎉** 