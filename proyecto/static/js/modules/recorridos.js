/**
 * Módulo JavaScript para Recorridos - Sistema de Gestión de Pastoreo
 * Manejo inteligente de formularios, validaciones y heurísticas Nielsen
 * Arquitectura modular y experiencia de usuario optimizada
 */

// =============================================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =============================================================================

const RecorridosModule = {
    // Configuración del módulo
    config: {
        validationTimeout: 500,
        animationDuration: 300,
        tooltipDelay: 800,
        autoSaveInterval: 30000
    },
    
    // Estado del módulo
    state: {
        currentTab: 'recorridos',
        formData: {},
        validationErrors: {},
        isFormValid: false,
        puntosMedicion: []
    },
    
    // Elementos del DOM
    elements: {
        form: null,
        inputs: {},
        tooltips: {},
        tabs: {}
    }
};

// =============================================================================
// INICIALIZACIÓN DEL MÓDULO
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌱 Inicializando Módulo de Recorridos...');
    
    // Inicializar componentes principales
    RecorridosModule.init();
    
    // Configurar event listeners
    RecorridosModule.setupEventListeners();
    
    // Configurar validaciones en tiempo real
    RecorridosModule.setupValidation();
    
    // Inicializar tooltips educativos
    RecorridosModule.setupEducationalTooltips();
    
    // Configurar animaciones
    RecorridosModule.initAnimations();
    
    console.log('✅ Módulo de Recorridos inicializado correctamente');
});

// =============================================================================
// FUNCIONES PRINCIPALES DE INICIALIZACIÓN
// =============================================================================

RecorridosModule.init = function() {
    // Cachear elementos del DOM
    this.cacheElements();
    
    // Configurar fecha por defecto
    this.setupDefaultDate();
    
    // Generar puntos de medición inicial
    this.generateMeasurementPoints();
    
    // Configurar navegación de pestañas
    this.setupTabNavigation();
    
    // Configurar feedback visual
    this.setupVisualFeedback();
};

RecorridosModule.cacheElements = function() {
    // Formulario principal
    this.elements.form = document.getElementById('recorridoForm');
    
    // Inputs principales
    this.elements.inputs = {
        potrero: document.getElementById('potrero_id'),
        fecha: document.getElementById('fecha'),
        alturaMin: document.getElementById('altura_minima'),
        alturaMax: document.getElementById('altura_maxima'),
        alturaProm: document.getElementById('altura_promedio'),
        cobertura: document.getElementById('cobertura_vegetal'),
        puntosMedicion: document.getElementById('puntos_medicion'),
        guardarBtn: document.getElementById('guardar-btn')
    };
    
    // Elementos de feedback
    this.elements.feedback = {
        consejoPotreroDiv: document.getElementById('consejo-potrero'),
        nombrePotreroSpan: document.getElementById('nombre-potrero'),
        feedbackAlturas: document.getElementById('feedback-alturas'),
        advertenciaAlturas: document.getElementById('advertencia-alturas'),
        mensajeAlturas: document.getElementById('mensaje-alturas'),
        mensajeAdvertenciaAlturas: document.getElementById('mensaje-advertencia-alturas')
    };
};

RecorridosModule.setupDefaultDate = function() {
    const fechaInput = this.elements.inputs.fecha;
    if (fechaInput && !fechaInput.value) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }
};

// =============================================================================
// GESTIÓN DE PUNTOS DE MEDICIÓN
// =============================================================================

RecorridosModule.generateMeasurementPoints = function() {
    const puntosMedicionSelect = this.elements.inputs.puntosMedicion;
    if (!puntosMedicionSelect) return;
    
    const numPuntos = parseInt(puntosMedicionSelect.value) || 5;
    const container = document.getElementById('puntosMedicion');
    
    if (!container) return;
    
    this.renderMeasurementPoints(container, numPuntos);
    this.setupPointValidation();
};

RecorridosModule.renderMeasurementPoints = function(container, numPuntos) {
    let html = '<div class="recorridos-measurements-grid">';
    
    for (let i = 1; i <= numPuntos; i++) {
        html += this.createPointHTML(i);
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Configurar event listeners para los nuevos puntos
    this.setupPointEventListeners(numPuntos);
};

RecorridosModule.createPointHTML = function(pointNumber) {
    return `
        <div class="recorridos-point-container">
            <div class="recorridos-point-header">
                <i class="fas fa-crosshairs"></i>
                Punto ${pointNumber} - Medición
            </div>
            <div class="recorridos-point-body">
                <div class="recorridos-point-metrics">
                    <div class="recorridos-point-metric">
                        <div class="recorridos-point-metric-value">
                            <input type="number" class="recorridos-form-input" 
                                   id="altura_punto_${pointNumber}" 
                                   name="altura_punto_${pointNumber}" 
                                   step="0.5" min="0" max="100"
                                   placeholder="18.5"
                                   data-point="${pointNumber}"
                                   data-metric="altura">
                        </div>
                        <div class="recorridos-point-metric-label">Altura (cm)</div>
                    </div>
                    
                    <div class="recorridos-point-metric">
                        <div class="recorridos-point-metric-value">
                            <input type="number" class="recorridos-form-input" 
                                   id="peso_verde_punto_${pointNumber}" 
                                   name="peso_verde_punto_${pointNumber}" 
                                   step="0.1" min="0"
                                   placeholder="850.5"
                                   data-point="${pointNumber}"
                                   data-metric="peso_verde">
                        </div>
                        <div class="recorridos-point-metric-label">Peso Verde (g)</div>
                    </div>
                    
                    <div class="recorridos-point-metric">
                        <div class="recorridos-point-metric-value">
                            <input type="number" class="recorridos-form-input" 
                                   id="peso_seco_punto_${pointNumber}" 
                                   name="peso_seco_punto_${pointNumber}" 
                                   step="0.1" min="0"
                                   placeholder="212.6"
                                   data-point="${pointNumber}"
                                   data-metric="peso_seco">
                        </div>
                        <div class="recorridos-point-metric-label">Peso Seco (g)</div>
                    </div>
                </div>
                
                <div class="recorridos-form-group">
                    <label for="calidad_punto_${pointNumber}" class="recorridos-form-label">
                        <i class="fas fa-star me-1"></i>Calidad Visual
                    </label>
                    <select class="recorridos-form-input" 
                            id="calidad_punto_${pointNumber}" 
                            name="calidad_punto_${pointNumber}">
                        <option value="">¿Cómo se ve?</option>
                        <option value="Excelente">⭐ Excelente</option>
                        <option value="Buena">😊 Buena</option>
                        <option value="Regular">😐 Regular</option>
                        <option value="Mala">😟 Mala</option>
                    </select>
                </div>
                
                <div class="recorridos-form-group">
                    <label for="observacion_punto_${pointNumber}" class="recorridos-form-label">
                        <i class="fas fa-comment me-1"></i>Observación
                    </label>
                    <textarea class="recorridos-form-input" 
                              id="observacion_punto_${pointNumber}" 
                              name="observacion_punto_${pointNumber}" 
                              rows="2" 
                              placeholder="Condiciones específicas del punto..."></textarea>
                </div>
            </div>
        </div>
    `;
};

RecorridosModule.setupPointEventListeners = function(numPuntos) {
    for (let i = 1; i <= numPuntos; i++) {
        // Event listeners para validación en tiempo real
        const inputs = document.querySelectorAll(`[data-point="${i}"]`);
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.validatePointInput(e.target);
                this.updateGlobalCalculations();
            });
            
            input.addEventListener('blur', (e) => {
                this.validatePointInput(e.target, true);
            });
        });
        
        // Tooltips educativos para cada punto
        this.setupPointTooltips(i);
    }
};

// =============================================================================
// VALIDACIONES INTELIGENTES
// =============================================================================

RecorridosModule.setupValidation = function() {
    const inputs = this.elements.inputs;
    
    // Validación de alturas con cálculo automático de promedio
    if (inputs.alturaMin && inputs.alturaMax) {
        inputs.alturaMin.addEventListener('input', () => this.calculateAverage());
        inputs.alturaMax.addEventListener('input', () => this.calculateAverage());
        inputs.alturaMin.addEventListener('blur', () => this.validateHeights());
        inputs.alturaMax.addEventListener('blur', () => this.validateHeights());
    }
    
    // Validación de cobertura vegetal
    if (inputs.cobertura) {
        inputs.cobertura.addEventListener('input', () => this.validateCoverage());
        inputs.cobertura.addEventListener('blur', () => this.validateCoverage(true));
    }
    
    // Selección de potrero
    if (inputs.potrero) {
        inputs.potrero.addEventListener('change', () => this.handlePotreroSelection());
    }
    
    // Validación global del formulario
    if (this.elements.form) {
        this.elements.form.addEventListener('input', () => this.validateForm());
        this.elements.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }
};

RecorridosModule.calculateAverage = function() {
    const inputs = this.elements.inputs;
    const feedback = this.elements.feedback;
    
    const min = parseFloat(inputs.alturaMin?.value) || 0;
    const max = parseFloat(inputs.alturaMax?.value) || 0;
    
    // Limpiar feedback anterior
    if (feedback.feedbackAlturas) feedback.feedbackAlturas.style.display = 'none';
    if (feedback.advertenciaAlturas) feedback.advertenciaAlturas.style.display = 'none';
    
    if (min > 0 && max > 0) {
        if (min > max) {
            this.showHeightWarning('La altura mínima no puede ser mayor que la máxima');
            return;
        }
        
        const promedio = (min + max) / 2;
        if (inputs.alturaProm) {
            inputs.alturaProm.value = promedio.toFixed(1);
        }
        
        this.validateHeightRange(min, max, promedio);
    }
};

RecorridosModule.validateHeightRange = function(min, max, promedio) {
    const diferencia = max - min;
    const feedback = this.elements.feedback;
    
    if (diferencia > 25) {
        this.showHeightWarning(`Diferencia muy grande (${diferencia.toFixed(1)} cm). ¿El potrero es muy desuniforme?`);
    } else if (min < 5) {
        this.showHeightWarning('Altura mínima muy baja. ¿El potrero está sobrepastoreado?');
    } else if (max > 50) {
        this.showHeightWarning('Altura máxima muy alta. ¿Hay zonas sin pastorear?');
    } else {
        this.showHeightSuccess(`Promedio: ${promedio.toFixed(1)} cm - Diferencia: ${diferencia.toFixed(1)} cm`);
    }
};

RecorridosModule.showHeightWarning = function(message) {
    const feedback = this.elements.feedback;
    if (feedback.mensajeAdvertenciaAlturas) {
        feedback.mensajeAdvertenciaAlturas.textContent = message;
    }
    if (feedback.advertenciaAlturas) {
        feedback.advertenciaAlturas.style.display = 'block';
    }
};

RecorridosModule.showHeightSuccess = function(message) {
    const feedback = this.elements.feedback;
    if (feedback.mensajeAlturas) {
        feedback.mensajeAlturas.textContent = message;
    }
    if (feedback.feedbackAlturas) {
        feedback.feedbackAlturas.style.display = 'block';
    }
};

RecorridosModule.validateCoverage = function(showFeedback = false) {
    const input = this.elements.inputs.cobertura;
    if (!input) return true;
    
    const value = parseFloat(input.value);
    const isValid = !isNaN(value) && value >= 0 && value <= 100;
    
    if (showFeedback) {
        if (!isValid) {
            this.showInputError(input, 'La cobertura debe estar entre 0 y 100%');
        } else {
            this.clearInputError(input);
            this.showCoverageInterpretation(value);
        }
    }
    
    return isValid;
};

RecorridosModule.showCoverageInterpretation = function(value) {
    let interpretation = '';
    if (value >= 90) interpretation = 'Excelente cobertura';
    else if (value >= 70) interpretation = 'Buena cobertura';
    else if (value >= 50) interpretation = 'Cobertura regular';
    else interpretation = 'Cobertura deficiente - considerar resembrar';
    
    this.showTooltip(this.elements.inputs.cobertura, interpretation, 'success');
};

// =============================================================================
// GESTIÓN DE INTERFAZ Y FEEDBACK
// =============================================================================

RecorridosModule.handlePotreroSelection = function() {
    const select = this.elements.inputs.potrero;
    const feedback = this.elements.feedback;
    
    if (!select || !feedback.consejoPotreroDiv) return;
    
    const selectedOption = select.selectedOptions[0];
    if (selectedOption && selectedOption.value) {
        const nombrePotrero = selectedOption.textContent;
        const hectareas = selectedOption.dataset.hectareas;
        const tipoPasto = selectedOption.dataset.tipoPasto;
        
        if (feedback.nombrePotreroSpan) {
            feedback.nombrePotreroSpan.textContent = nombrePotrero;
        }
        
        feedback.consejoPotreroDiv.style.display = 'block';
        
        // Mostrar consejos específicos según el tipo de pasto
        if (tipoPasto) {
            this.showPastureSpecificAdvice(tipoPasto, hectareas);
        }
    } else {
        feedback.consejoPotreroDiv.style.display = 'none';
    }
};

RecorridosModule.showPastureSpecificAdvice = function(tipoPasto, hectareas) {
    let advice = '';
    switch(tipoPasto.toLowerCase()) {
        case 'brachiaria':
            advice = 'Para Brachiaria: Altura óptima 20-30 cm. Tolera bien el pastoreo intensivo.';
            break;
        case 'guinea':
            advice = 'Para Guinea: Altura óptima 25-35 cm. Requiere descansos más largos.';
            break;
        case 'estrella':
            advice = 'Para Estrella: Altura óptima 15-25 cm. Excelente para rotación rápida.';
            break;
        default:
            advice = `Para ${tipoPasto}: Consulta las recomendaciones específicas según el tipo de pasto.`;
    }
    
    this.showTooltip(this.elements.inputs.potrero, advice, 'info');
};

RecorridosModule.setupVisualFeedback = function() {
    const guardarBtn = this.elements.inputs.guardarBtn;
    if (!guardarBtn) return;
    
    // Animaciones del botón
    guardarBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.2s ease';
    });
    
    guardarBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    // Feedback visual basado en validación
    if (this.elements.form) {
        this.elements.form.addEventListener('input', () => {
            this.updateButtonState();
        });
    }
};

RecorridosModule.updateButtonState = function() {
    const guardarBtn = this.elements.inputs.guardarBtn;
    if (!guardarBtn) return;
    
    const isValid = this.validateForm();
    
    if (isValid) {
        guardarBtn.style.boxShadow = '0 0 20px rgba(40, 167, 69, 0.5)';
        guardarBtn.classList.add('btn-success');
        guardarBtn.classList.remove('btn-secondary');
    } else {
        guardarBtn.style.boxShadow = 'none';
        guardarBtn.classList.remove('btn-success');
        guardarBtn.classList.add('btn-secondary');
    }
};

// =============================================================================
// TOOLTIPS EDUCATIVOS
// =============================================================================

RecorridosModule.setupEducationalTooltips = function() {
    const tooltipConfigs = {
        'altura_minima': 'Altura más baja encontrada en el potrero. Indica zonas de pastoreo intensivo.',
        'altura_maxima': 'Altura más alta encontrada. Muestra zonas menos pastoreadas o de crecimiento activo.',
        'cobertura_vegetal': 'Porcentaje del suelo cubierto por plantas. >70% es ideal para prevenir erosión.',
        'puntos_medicion': 'Más puntos = mayor precisión. 5 puntos es recomendado para la mayoría de potreros.',
        'estado_general': 'Tu evaluación visual general después de recorrer todo el potrero.',
        'humedad_suelo': 'Presiona el suelo con el pie. La humedad afecta el crecimiento y la compactación.'
    };
    
    Object.entries(tooltipConfigs).forEach(([id, message]) => {
        const element = document.getElementById(id);
        if (element) {
            this.setupElementTooltip(element, message);
        }
    });
};

RecorridosModule.setupElementTooltip = function(element, message) {
    let tooltip = null;
    
    element.addEventListener('mouseenter', () => {
        tooltip = this.createTooltip(element, message);
    });
    
    element.addEventListener('mouseleave', () => {
        if (tooltip) {
            this.removeTooltip(tooltip);
            tooltip = null;
        }
    });
    
    element.addEventListener('focus', () => {
        tooltip = this.createTooltip(element, message);
    });
    
    element.addEventListener('blur', () => {
        if (tooltip) {
            this.removeTooltip(tooltip);
            tooltip = null;
        }
    });
};

RecorridosModule.createTooltip = function(element, message, type = 'info') {
    const tooltip = document.createElement('div');
    tooltip.className = 'recorridos-educational-tooltip';
    tooltip.innerHTML = message;
    
    const typeColors = {
        info: '#17a2b8',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545'
    };
    
    tooltip.style.cssText = `
        position: absolute;
        background: ${typeColors[type] || typeColors.info};
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 13px;
        z-index: 1000;
        max-width: 280px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: tooltipFadeIn 0.3s ease-out;
        pointer-events: none;
        font-weight: 500;
        line-height: 1.4;
    `;
    
    document.body.appendChild(tooltip);
    
    // Posicionar tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const top = rect.top - tooltipRect.height - 10;
    
    tooltip.style.left = Math.max(10, Math.min(left, window.innerWidth - tooltipRect.width - 10)) + 'px';
    tooltip.style.top = Math.max(10, top) + 'px';
    
    return tooltip;
};

RecorridosModule.removeTooltip = function(tooltip) {
    if (tooltip && document.body.contains(tooltip)) {
        tooltip.style.animation = 'tooltipFadeOut 0.2s ease-out forwards';
        setTimeout(() => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        }, 200);
    }
};

// =============================================================================
// VALIDACIÓN Y ENVÍO DE FORMULARIO
// =============================================================================

RecorridosModule.validateForm = function() {
    const inputs = this.elements.inputs;
    const required = ['potrero', 'fecha', 'alturaMin', 'alturaMax', 'cobertura'];
    
    let isValid = true;
    
    required.forEach(fieldName => {
        const input = inputs[fieldName];
        if (input && !input.value) {
            isValid = false;
        }
    });
    
    // Validaciones específicas
    if (inputs.alturaMin && inputs.alturaMax) {
        const min = parseFloat(inputs.alturaMin.value);
        const max = parseFloat(inputs.alturaMax.value);
        if (min >= max) isValid = false;
    }
    
    if (inputs.cobertura) {
        const cobertura = parseFloat(inputs.cobertura.value);
        if (isNaN(cobertura) || cobertura < 0 || cobertura > 100) {
            isValid = false;
        }
    }
    
    this.state.isFormValid = isValid;
    return isValid;
};

RecorridosModule.handleFormSubmit = function(e) {
    const isValid = this.validateForm();
    
    if (!isValid) {
        e.preventDefault();
        this.showValidationErrors();
        return false;
    }
    
    // Mostrar loading en el botón
    const guardarBtn = this.elements.inputs.guardarBtn;
    if (guardarBtn) {
        guardarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        guardarBtn.disabled = true;
    }
    
    return true;
};

RecorridosModule.showValidationErrors = function() {
    const inputs = this.elements.inputs;
    
    if (inputs.alturaMin && inputs.alturaMax) {
        const min = parseFloat(inputs.alturaMin.value);
        const max = parseFloat(inputs.alturaMax.value);
        if (min >= max) {
            this.showInputError(inputs.alturaMax, 'La altura máxima debe ser mayor que la mínima');
        }
    }
    
    if (inputs.cobertura) {
        const cobertura = parseFloat(inputs.cobertura.value);
        if (isNaN(cobertura) || cobertura < 0 || cobertura > 100) {
            this.showInputError(inputs.cobertura, 'La cobertura debe estar entre 0 y 100%');
        }
    }
};

// =============================================================================
// UTILIDADES Y HELPERS
// =============================================================================

RecorridosModule.showInputError = function(input, message) {
    input.style.borderColor = '#dc3545';
    this.showTooltip(input, message, 'danger');
};

RecorridosModule.clearInputError = function(input) {
    input.style.borderColor = '#28a745';
};

RecorridosModule.showTooltip = function(element, message, type = 'info') {
    // Remover tooltip anterior
    const existingTooltip = element.dataset.tooltip;
    if (existingTooltip) {
        this.removeTooltip(document.getElementById(existingTooltip));
    }
    
    const tooltip = this.createTooltip(element, message, type);
    const tooltipId = 'tooltip_' + Date.now();
    tooltip.id = tooltipId;
    element.dataset.tooltip = tooltipId;
    
    setTimeout(() => {
        this.removeTooltip(tooltip);
        delete element.dataset.tooltip;
    }, 3000);
};

RecorridosModule.initAnimations = function() {
    // CSS para animaciones de tooltips
    if (!document.getElementById('recorridos-tooltip-styles')) {
        const style = document.createElement('style');
        style.id = 'recorridos-tooltip-styles';
        style.textContent = `
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateY(5px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes tooltipFadeOut {
                from { opacity: 1; transform: translateY(0); }
                to { opacity: 0; transform: translateY(-5px); }
            }
            .recorridos-educational-tooltip {
                animation: tooltipFadeIn 0.3s ease-out;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Intersection Observer para animaciones de entrada
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'recorridosFadeIn 0.6s ease-out';
                }
            });
        }, { threshold: 0.1 });
        
        document.querySelectorAll('.recorridos-fade-in').forEach(el => {
            observer.observe(el);
        });
    }
};

// =============================================================================
// FUNCIONES GLOBALES EXPUESTAS
// =============================================================================

// Función global para generar puntos de medición (llamada desde HTML)
window.generarPuntosMedicion = function() {
    RecorridosModule.generateMeasurementPoints();
};

// Función global para calcular promedio (llamada desde HTML)
window.calcularPromedio = function() {
    RecorridosModule.calculateAverage();
};

// Exportar módulo
window.RecorridosModule = RecorridosModule;

console.log('🌱 Módulo de Recorridos cargado correctamente');