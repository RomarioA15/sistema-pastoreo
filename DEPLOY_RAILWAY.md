# Despliegue en Railway

## 🚂 Archivos de Configuración Creados

1. **railway.json** - Configuración principal de Railway
2. **nixpacks.toml** - Configuración del build process
3. **wsgi.py** - Punto de entrada WSGI para producción
4. **init_railway_db.py** - Script de inicialización de MySQL

## 🚀 Pasos para Desplegar

### 1. En Railway.app

1. Ve a [railway.app](https://railway.app) y crea una cuenta con GitHub
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Selecciona tu repositorio `sistema-pastoreo`

### 2. Agregar Base de Datos MySQL

1. En el dashboard del proyecto, haz clic en **"+ New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente las variables de entorno

### 3. Configuración Automática

Railway detectará automáticamente:
- ✅ **Python/Flask** app
- ✅ **requirements.txt** para dependencias  
- ✅ **nixpacks.toml** para configuración de build
- ✅ **railway.json** para configuración de deploy

### 4. Variables de Entorno (Automáticas)

Railway configurará automáticamente:
- `MYSQLHOST` - Host de la base de datos
- `MYSQLPORT` - Puerto (3306)
- `MYSQLUSER` - Usuario de la base de datos
- `MYSQLPASSWORD` - Contraseña de la base de datos  
- `MYSQLDATABASE` - Nombre de la base de datos

### 5. Después del Despliegue

Una vez desplegado:
- Tu app estará en: `https://sistema-pastoreo-production.up.railway.app`
- La base de datos se inicializa automáticamente
- **Credenciales por defecto:**
  - Usuario: `admin@pastoreo.com`
  - Contraseña: `admin123`

## 💰 Costos

- **$5 USD gratis por mes** (más que suficiente)
- Sin necesidad de tarjeta de crédito inicialmente
- Facturación por uso real

## 📊 Monitoreo

- Dashboard con métricas en tiempo real
- Logs de aplicación y base de datos
- Endpoint de salud: `/health`

## 🔧 Troubleshooting

Si hay problemas:
1. Revisa los **logs en Railway dashboard**
2. Verifica que **MySQL esté ejecutándose**
3. Comprueba las **variables de entorno**

## ✨ Ventajas de Railway

- ✅ **$5 gratis mensuales**
- ✅ **MySQL incluido gratis** 
- ✅ **Deploy automático** desde GitHub
- ✅ **No requiere tarjeta** inicialmente
- ✅ **Escalado automático**
- ✅ **SSL gratuito**