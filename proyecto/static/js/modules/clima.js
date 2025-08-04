/**
 * Módulo JavaScript para Clima - Sistema de Gestión de Pastoreo
 * Manejo de API meteorológica, interfaces responsivas y heurísticas Nielsen
 * Arquitectura modular y estados de carga para experiencia de usuario óptima
 */

// =============================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =============================================================================

const ClimaModule = {
    // Configuración de la API
    config: {
        apiTimeout: 10000,
        retryAttempts: 3,
        updateInterval: 300000, // 5 minutos
        animationDuration: 300
    },
    
    // Estado del módulo
    state: {
        isLoading: false,
        hasError: false,
        lastUpdate: null,
        weatherData: null,
        retryCount: 0
    },
    
    // Cache de datos
    cache: {
        currentWeather: null,
        forecast: null,
        alerts: []
    }
};

// =============================================================================
// INICIALIZACIÓN DEL MÓDULO
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌤️ Inicializando Módulo de Clima...');
    
    // Inicializar componentes principales
    ClimaModule.init();
    
    // Configurar event listeners
    ClimaModule.setupEventListeners();
    
    // Configurar tooltips educativos
    ClimaModule.setupEducationalTooltips();
    
    // Inicializar animaciones
    ClimaModule.initAnimations();
    
    console.log('✅ Módulo de Clima inicializado correctamente');
});

// =============================================================================
// FUNCIONES PRINCIPALES DE INICIALIZACIÓN
// =============================================================================

ClimaModule.init = function() {
    // Verificar soporte del navegador
    if (!this.checkBrowserSupport()) {
        this.showCompatibilityWarning();
        return;
    }
    
    // Cargar datos climáticos iniciales
    this.loadInitialData();
    
    // Configurar actualizaciones automáticas
    this.setupAutoRefresh();
    
    // Configurar gestión de pestañas
    this.setupTabNavigation();
};

ClimaModule.checkBrowserSupport = function() {
    // Verificar APIs necesarias
    const required = [
        'fetch',
        'localStorage',
        'addEventListener',
        'querySelector'
    ];
    
    return required.every(api => window[api] || document[api]);
};

// =============================================================================
// GESTIÓN DE DATOS DE API
// =============================================================================

ClimaModule.loadInitialData = function() {
    console.log('📡 Cargando datos climáticos iniciales...');
    
    this.showLoadingState();
    
    // Simular carga de API (reemplazar con llamada real)
    setTimeout(() => {
        if (Math.random() > 0.2) { // 80% éxito
            this.loadMockWeatherData();
        } else {
            this.handleApiError('Error de conectividad con la API meteorológica');
        }
    }, 1500 + Math.random() * 1000); // Tiempo realista de carga
};

ClimaModule.loadMockWeatherData = function() {
    // Datos simulados realistas para demostración
    const weatherData = {
        current: {
            temperature: 26 + Math.random() * 6, // 26-32°C
            description: this.getRandomWeatherDescription(),
            humidity: 55 + Math.random() * 25, // 55-80%
            windSpeed: 5 + Math.random() * 15, // 5-20 km/h
            pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
            precipitation: Math.random() * 5, // 0-5 mm
            icon: 'sun',
            timestamp: new Date()
        },
        yesterday: {
            temperature: 24 + Math.random() * 4,
            description: this.getRandomWeatherDescription()
        },
        forecast: this.generateForecastData(),
        alerts: this.generateWeatherAlerts()
    };
    
    this.processWeatherData(weatherData);
};

ClimaModule.getRandomWeatherDescription = function() {
    const descriptions = [
        'Despejado',
        'Parcialmente nublado',
        'Nublado',
        'Lluvia ligera',
        'Soleado'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
};

ClimaModule.generateForecastData = function() {
    const forecast = [];
    const days = ['Hoy', 'Mañana', 'Pasado mañana', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    for (let i = 0; i < 7; i++) {
        forecast.push({
            day: days[i] || `Día ${i + 1}`,
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
            tempMax: Math.round(25 + Math.random() * 8),
            tempMin: Math.round(18 + Math.random() * 5),
            description: this.getRandomWeatherDescription(),
            icon: 'sun',
            precipitationProb: Math.round(Math.random() * 80),
            sunshineHours: Math.round(6 + Math.random() * 6)
        });
    }
    
    return forecast;
};

ClimaModule.generateWeatherAlerts = function() {
    const alerts = [];
    const currentTemp = 26 + Math.random() * 6;
    const currentHumidity = 55 + Math.random() * 25;
    
    // Generar alertas basadas en condiciones
    if (currentTemp > 32) {
        alerts.push({
            type: 'high-temp',
            title: `Temperatura Elevada (${Math.round(currentTemp)}°C)`,
            description: 'Proporcionar sombra adicional al ganado y verificar disponibilidad de agua',
            icon: '🔥',
            severity: 'warning'
        });
    }
    
    if (currentHumidity > 80) {
        alerts.push({
            type: 'high-humidity',
            title: `Alta Humedad (${Math.round(currentHumidity)}%)`,
            description: 'Monitorear enfermedades fúngicas en pastos y ganado',
            icon: '💧',
            severity: 'info'
        });
    }
    
    if (currentTemp >= 20 && currentTemp <= 30 && currentHumidity >= 50 && currentHumidity <= 70) {
        alerts.push({
            type: 'optimal',
            title: 'Condiciones Óptimas',
            description: 'Clima ideal para pastoreo y crecimiento de forrajes',
            icon: '✅',
            severity: 'success'
        });
    }
    
    return alerts;
};

// =============================================================================
// PROCESAMIENTO Y VISUALIZACIÓN DE DATOS
// =============================================================================

ClimaModule.processWeatherData = function(data) {
    console.log('🔄 Procesando datos meteorológicos...', data);
    
    // Guardar en caché
    this.cache.currentWeather = data.current;
    this.cache.forecast = data.forecast;
    this.cache.alerts = data.alerts;
    
    // Actualizar estado
    this.state.weatherData = data;
    this.state.lastUpdate = new Date();
    this.state.isLoading = false;
    this.state.hasError = false;
    
    // Ocultar estado de carga
    this.hideLoadingState();
    
    // Actualizar interfaz
    this.updateWeatherInterface(data);
    
    // Calcular y mostrar estadísticas agropecuarias
    this.updateAgriculturalStats(data.current);
    
    // Procesar alertas
    this.updateWeatherAlerts(data.alerts);
    
    console.log('✅ Datos procesados y interfaz actualizada');
};

ClimaModule.updateWeatherInterface = function(data) {
    // Actualizar clima actual
    this.updateCurrentWeather(data.current);
    
    // Actualizar comparación temporal
    this.updateTemporalComparison(data.current, data.yesterday);
    
    // Actualizar parámetros climáticos
    this.updateClimaticParameters(data.current);
    
    // Actualizar pronóstico
    this.updateForecastDisplay(data.forecast);
    
    // Actualizar heliofanía
    this.updateSunshineHours(data.current);
};

ClimaModule.updateCurrentWeather = function(weather) {
    const elements = {
        temp: document.getElementById('currentTemp'),
        description: document.getElementById('currentDescription'),
        details: document.getElementById('currentDetails')
    };
    
    if (elements.temp) {
        elements.temp.textContent = `${Math.round(weather.temperature)}°C`;
        elements.temp.classList.add('clima-fade-in');
    }
    
    if (elements.description) {
        elements.description.textContent = weather.description;
    }
    
    if (elements.details) {
        elements.details.innerHTML = `
            <div class="clima-current-detail">
                <div class="clima-current-detail-value">${Math.round(weather.humidity)}%</div>
                <div class="clima-current-detail-label">Humedad</div>
            </div>
            <div class="clima-current-detail">
                <div class="clima-current-detail-value">${Math.round(weather.windSpeed)} km/h</div>
                <div class="clima-current-detail-label">Viento</div>
            </div>
            <div class="clima-current-detail">
                <div class="clima-current-detail-value">${Math.round(weather.pressure)} hPa</div>
                <div class="clima-current-detail-label">Presión</div>
            </div>
            <div class="clima-current-detail">
                <div class="clima-current-detail-value">${weather.precipitation.toFixed(1)} mm</div>
                <div class="clima-current-detail-label">Precipitación</div>
            </div>
        `;
    }
};

ClimaModule.updateTemporalComparison = function(today, yesterday) {
    const elements = {
        todayTemp: document.getElementById('todayTemp'),
        todayCondition: document.getElementById('todayCondition'),
        yesterdayTemp: document.getElementById('yesterdayTemp'),
        yesterdayCondition: document.getElementById('yesterdayCondition'),
        tempTrend: document.getElementById('tempTrend')
    };
    
    if (elements.todayTemp) {
        elements.todayTemp.textContent = `${Math.round(today.temperature)}°C`;
    }
    
    if (elements.todayCondition) {
        elements.todayCondition.textContent = today.description;
    }
    
    if (elements.yesterdayTemp) {
        elements.yesterdayTemp.textContent = `${Math.round(yesterday.temperature)}°C`;
    }
    
    if (elements.yesterdayCondition) {
        elements.yesterdayCondition.textContent = yesterday.description;
    }
    
    if (elements.tempTrend) {
        const diff = Math.round(today.temperature - yesterday.temperature);
        
        if (diff > 0) {
            elements.tempTrend.textContent = `📈 +${diff}°C más caluroso que ayer`;
            elements.tempTrend.className = 'badge bg-danger';
        } else if (diff < 0) {
            elements.tempTrend.textContent = `📉 ${Math.abs(diff)}°C más fresco que ayer`;
            elements.tempTrend.className = 'badge bg-primary';
        } else {
            elements.tempTrend.textContent = '➡️ Temperatura similar a ayer';
            elements.tempTrend.className = 'badge bg-secondary';
        }
    }
};

ClimaModule.updateClimaticParameters = function(weather) {
    const parameters = {
        temp: document.getElementById('paramTemp'),
        humidity: document.getElementById('paramHumidity'),
        wind: document.getElementById('paramWind'),
        pressure: document.getElementById('paramPressure')
    };
    
    if (parameters.temp) {
        parameters.temp.textContent = `${Math.round(weather.temperature)}°C`;
    }
    
    if (parameters.humidity) {
        parameters.humidity.textContent = `${Math.round(weather.humidity)}%`;
    }
    
    if (parameters.wind) {
        parameters.wind.textContent = `${Math.round(weather.windSpeed)} km/h`;
    }
    
    if (parameters.pressure) {
        parameters.pressure.textContent = `${Math.round(weather.pressure)} hPa`;
    }
};

ClimaModule.updateAgriculturalStats = function(weather) {
    const stats = {
        growth: this.calculateGrowthIndex(weather),
        comfort: this.calculateComfortIndex(weather),
        irrigation: this.calculateIrrigationNeed(weather)
    };
    
    const elements = {
        growth: document.getElementById('growthIndex'),
        comfort: document.getElementById('comfortIndex'),
        irrigation: document.getElementById('irrigationNeed')
    };
    
    if (elements.growth) {
        elements.growth.textContent = stats.growth;
        elements.growth.className = `clima-stat-value ${this.getStatClass(stats.growth)}`;
    }
    
    if (elements.comfort) {
        elements.comfort.textContent = stats.comfort;
        elements.comfort.className = `clima-stat-value ${this.getStatClass(stats.comfort)}`;
    }
    
    if (elements.irrigation) {
        elements.irrigation.textContent = stats.irrigation;
        elements.irrigation.className = `clima-stat-value ${this.getStatClass(stats.irrigation)}`;
    }
};

// =============================================================================
// CÁLCULOS AGROPECUARIOS
// =============================================================================

ClimaModule.calculateGrowthIndex = function(weather) {
    const temp = weather.temperature;
    const humidity = weather.humidity;
    
    if (temp >= 20 && temp <= 30 && humidity >= 50 && humidity <= 70) {
        return 'Excelente';
    } else if (temp >= 15 && temp <= 35 && humidity >= 40 && humidity <= 80) {
        return 'Bueno';
    } else if (temp >= 10 && temp <= 40) {
        return 'Regular';
    } else {
        return 'Deficiente';
    }
};

ClimaModule.calculateComfortIndex = function(weather) {
    const temp = weather.temperature;
    const humidity = weather.humidity;
    const heatIndex = this.calculateHeatIndex(temp, humidity);
    
    if (heatIndex <= 32 && temp >= 15) {
        return 'Óptimo';
    } else if (heatIndex <= 37 && temp >= 10) {
        return 'Moderado';
    } else if (heatIndex > 37 || temp > 35) {
        return 'Estrés';
    } else {
        return 'Frío';
    }
};

ClimaModule.calculateIrrigationNeed = function(weather) {
    const precipitation = weather.precipitation;
    const humidity = weather.humidity;
    const temp = weather.temperature;
    
    if (precipitation > 3 || humidity > 85) {
        return 'Baja';
    } else if (precipitation > 1 || (humidity > 65 && temp < 30)) {
        return 'Media';
    } else if (temp > 30 || humidity < 50) {
        return 'Alta';
    } else {
        return 'Media';
    }
};

ClimaModule.calculateHeatIndex = function(temp, humidity) {
    // Fórmula simplificada del índice de calor
    if (temp < 27) return temp;
    
    const c1 = -8.78469475556;
    const c2 = 1.61139411;
    const c3 = 2.33854883889;
    const c4 = -0.14611605;
    const c5 = -0.012308094;
    
    return c1 + (c2 * temp) + (c3 * humidity) + (c4 * temp * humidity) + (c5 * temp * temp);
};

// =============================================================================
// GESTIÓN DE ESTADOS DE INTERFAZ
// =============================================================================

ClimaModule.showLoadingState = function() {
    const loadingElement = document.getElementById('clima-loading');
    const contentElement = document.querySelector('.clima-main-content .tab-content');
    
    if (loadingElement) {
        loadingElement.style.display = 'flex';
        this.state.isLoading = true;
    }
    
    if (contentElement) {
        contentElement.style.display = 'none';
    }
    
    console.log('⏳ Estado de carga activado');
};

ClimaModule.hideLoadingState = function() {
    const loadingElement = document.getElementById('clima-loading');
    const contentElement = document.querySelector('.clima-main-content .tab-content');
    
    if (loadingElement) {
        loadingElement.style.display = 'none';
        this.state.isLoading = false;
    }
    
    if (contentElement) {
        contentElement.style.display = 'block';
    }
    
    console.log('✅ Estado de carga desactivado');
};

ClimaModule.handleApiError = function(error) {
    console.error('❌ Error de API:', error);
    
    this.state.hasError = true;
    this.state.isLoading = false;
    
    const errorElement = document.getElementById('clima-error');
    const contentElement = document.querySelector('.clima-main-content .tab-content');
    
    if (errorElement) {
        errorElement.style.display = 'block';
    }
    
    if (contentElement) {
        contentElement.style.display = 'none';
    }
    
    // Incrementar contador de reintentos
    this.state.retryCount++;
    
    // Log para debugging
    console.log(`🔄 Intento ${this.state.retryCount}/${this.config.retryAttempts}`);
};

// =============================================================================
// EVENT LISTENERS Y NAVEGACIÓN
// =============================================================================

ClimaModule.setupEventListeners = function() {
    // Botón de actualización
    const btnRefresh = document.getElementById('btnRefresh');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', () => this.handleRefreshClick());
    }
    
    // Botón de reintento
    const btnRetry = document.getElementById('btnRetry');
    if (btnRetry) {
        btnRetry.addEventListener('click', () => this.handleRetryClick());
    }
    
    // Botón de modo offline
    const btnOffline = document.getElementById('btnOfflineMode');
    if (btnOffline) {
        btnOffline.addEventListener('click', () => this.handleOfflineModeClick());
    }
    
    // Navegación de pestañas
    const tabLinks = document.querySelectorAll('[data-bs-toggle="pill"]');
    tabLinks.forEach(tab => {
        tab.addEventListener('click', (e) => this.handleTabClick(e));
    });
    
    console.log('🎯 Event listeners configurados');
};

ClimaModule.handleRefreshClick = function() {
    const btnRefresh = document.getElementById('btnRefresh');
    
    if (btnRefresh) {
        btnRefresh.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
        btnRefresh.disabled = true;
    }
    
    // Simular actualización
    setTimeout(() => {
        this.loadInitialData();
        
        if (btnRefresh) {
            btnRefresh.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Actualizar Datos';
            btnRefresh.disabled = false;
        }
    }, 1000);
};

ClimaModule.handleRetryClick = function() {
    console.log('🔄 Reintentando carga de datos...');
    
    // Ocultar error
    const errorElement = document.getElementById('clima-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Reiniciar estado
    this.state.hasError = false;
    this.state.retryCount = 0;
    
    // Intentar cargar datos nuevamente
    this.loadInitialData();
};

ClimaModule.handleOfflineModeClick = function() {
    console.log('📱 Activando modo offline...');
    
    // Ocultar error
    const errorElement = document.getElementById('clima-error');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Mostrar contenido con datos por defecto
    const contentElement = document.querySelector('.clima-main-content .tab-content');
    if (contentElement) {
        contentElement.style.display = 'block';
    }
    
    // Cargar datos por defecto
    this.loadDefaultData();
    
    // Mostrar notificación
    this.showNotification('Modo offline activado. Mostrando datos locales.', 'info');
};

// =============================================================================
// TOOLTIPS EDUCATIVOS Y ANIMACIONES
// =============================================================================

ClimaModule.setupEducationalTooltips = function() {
    const parameterElements = document.querySelectorAll('.clima-parameter');
    
    parameterElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            this.showEducationalTooltip(e.target);
        });
        
        element.addEventListener('mouseleave', (e) => {
            this.hideEducationalTooltip();
        });
    });
    
    console.log('💡 Tooltips educativos configurados');
};

ClimaModule.showEducationalTooltip = function(element) {
    const paramType = element.querySelector('.clima-parameter-label')?.textContent;
    let message = '';
    
    switch(paramType) {
        case 'Temperatura':
            message = 'La temperatura ideal para pastos tropicales está entre 20-30°C. Temperaturas extremas afectan el crecimiento y el bienestar animal.';
            break;
        case 'Humedad Relativa':
            message = 'Humedad óptima: 50-70%. Alta humedad favorece hongos, baja humedad causa estrés hídrico en plantas y animales.';
            break;
        case 'Velocidad del Viento':
            message = 'Viento moderado ayuda a la ventilación. Viento fuerte (>15 km/h) puede causar estrés en animales y daños en cultivos.';
            break;
        case 'Presión Atmosférica':
            message = 'Cambios bruscos de presión pueden indicar cambios climáticos próximos. Útil para planificación de actividades al aire libre.';
            break;
        default:
            message = 'Parámetro climático importante para la gestión agropecuaria.';
    }
    
    this.createTooltip(element, message);
};

ClimaModule.createTooltip = function(element, message) {
    // Remover tooltip anterior
    this.hideEducationalTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'clima-educational-tooltip';
    tooltip.innerHTML = message;
    tooltip.style.cssText = `
        position: absolute;
        background: #333;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        z-index: 1000;
        max-width: 280px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: tooltipFadeIn 0.3s ease-out;
        pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Posicionar tooltip
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const top = rect.top - tooltipRect.height - 10;
    
    tooltip.style.left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10)) + 'px';
    tooltip.style.top = Math.max(10, top) + 'px';
    
    // Guardar referencia
    this.currentTooltip = tooltip;
};

ClimaModule.hideEducationalTooltip = function() {
    if (this.currentTooltip && document.body.contains(this.currentTooltip)) {
        document.body.removeChild(this.currentTooltip);
        this.currentTooltip = null;
    }
};

// =============================================================================
// UTILIDADES Y HELPERS
// =============================================================================

ClimaModule.getStatClass = function(value) {
    const classes = {
        'Excelente': 'text-success',
        'Óptimo': 'text-success',
        'Bueno': 'text-info',
        'Moderado': 'text-warning',
        'Regular': 'text-warning',
        'Estrés': 'text-danger',
        'Deficiente': 'text-danger',
        'Alta': 'text-danger',
        'Media': 'text-warning',
        'Baja': 'text-success'
    };
    
    return classes[value] || 'text-muted';
};

ClimaModule.showNotification = function(message, type = 'info') {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
};

ClimaModule.initAnimations = function() {
    // Intersection Observer para animaciones
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('clima-fade-in');
                }
            });
        }, { threshold: 0.1 });
        
        // Observar elementos animables
        document.querySelectorAll('.clima-card, .clima-parameter, .clima-stat-item').forEach(el => {
            observer.observe(el);
        });
    }
    
    console.log('🎨 Animaciones inicializadas');
};

// =============================================================================
// EXPORTAR MÓDULO
// =============================================================================

window.ClimaModule = ClimaModule;

console.log('🌤️ Módulo de Clima cargado correctamente');