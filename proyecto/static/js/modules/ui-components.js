/**
 * Componentes UI Modernos - Sistema de Pastoreo v2.1
 * Componentes compatibles con el sistema de diseño unificado
 */

class UIComponents {
    constructor() {
        this.init();
    }

    init() {
        this.initNotifications();
        this.initLoadingStates();
        this.initFormValidation();
        this.bindEvents();
    }

    // =====================================================
    // 1. SISTEMA DE NOTIFICACIONES UNIFICADO
    // =====================================================
    
    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotificationElement(message, type);
        const container = this.getNotificationContainer();
        
        container.appendChild(notification);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto-dismiss
        setTimeout(() => {
            this.dismissNotification(notification);
        }, duration);
        
        return notification;
    }
    
    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `toast-modern toast-${type} alert alert-${this.getBootstrapType(type)} alert-dismissible`;
        notification.setAttribute('role', 'alert');
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="${iconMap[type]} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        return notification;
    }
    
    getBootstrapType(type) {
        const typeMap = {
            success: 'success',
            error: 'danger',
            warning: 'warning',
            info: 'info'
        };
        return typeMap[type] || 'info';
    }
    
    getNotificationContainer() {
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '1080';
            document.body.appendChild(container);
        }
        return container;
    }
    
    dismissNotification(notification) {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // =====================================================
    // 2. ESTADOS DE CARGA SIMPLIFICADOS
    // =====================================================
    
    showGlobalLoading(message = 'Cargando...') {
        const loader = document.getElementById('global-loading');
        if (loader) {
            loader.classList.remove('d-none');
        }
    }
    
    hideGlobalLoading() {
        const loader = document.getElementById('global-loading');
        if (loader) {
            loader.classList.add('d-none');
        }
    }
    
    addButtonLoading(button, loadingText = 'Procesando...') {
        if (!button) return;
        
        const originalText = button.innerHTML;
        const originalDisabled = button.disabled;
        
        button.disabled = true;
        button.classList.add('btn-loading');
        button.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status"></span>
            ${loadingText}
        `;
        
        return () => {
            button.disabled = originalDisabled;
            button.classList.remove('btn-loading');
            button.innerHTML = originalText;
        };
    }

    // =====================================================
    // 3. VALIDACIÓN DE FORMULARIOS SIMPLIFICADA
    // =====================================================
    
    initFormValidation() {
        document.querySelectorAll('.needs-validation').forEach(form => {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        });
        
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('blur', this.validateField.bind(this));
        });
    }
    
    handleFormSubmit(event) {
        const form = event.target;
        const isValid = this.validateForm(form);
        
        if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
            this.showNotification('Por favor corrige los errores en el formulario', 'error');
            
            const firstError = form.querySelector('.is-invalid');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
        }
        
        form.classList.add('was-validated');
    }
    
    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('.form-control, .form-select');
        
        fields.forEach(field => {
            if (!this.validateField({ target: field })) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        // Validación requerida
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = 'Este campo es requerido';
        }
        
        // Validación de email
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                message = 'Por favor ingresa un email válido';
            }
        }
        
        // Validación de números
        if (field.type === 'number' && value) {
            const min = field.getAttribute('min');
            const max = field.getAttribute('max');
            
            if (min && parseFloat(value) < parseFloat(min)) {
                isValid = false;
                message = `El valor mínimo es ${min}`;
            }
            if (max && parseFloat(value) > parseFloat(max)) {
                isValid = false;
                message = `El valor máximo es ${max}`;
            }
        }
        
        this.setFieldValidationState(field, isValid, message);
        return isValid;
    }
    
    setFieldValidationState(field, isValid, message) {
        field.classList.remove('is-valid', 'is-invalid');
        
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
        
        if (!isValid) {
            field.classList.add('is-invalid');
            
            const feedbackEl = document.createElement('div');
            feedbackEl.className = 'invalid-feedback';
            feedbackEl.textContent = message;
            field.parentNode.appendChild(feedbackEl);
        } else if (field.value.trim()) {
            field.classList.add('is-valid');
        }
    }

    // =====================================================
    // 4. UTILIDADES GENERALES
    // =====================================================
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    formatNumber(num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP'
        }).format(amount);
    }
    
    formatDate(date, options = {}) {
        const defaultOptions = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Intl.DateTimeFormat('es-ES', { ...defaultOptions, ...options }).format(new Date(date));
    }
    
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // =====================================================
    // 5. EVENTOS Y BINDINGS
    // =====================================================
    
    bindEvents() {
        // Auto-save en formularios
        document.querySelectorAll('form[data-auto-save]').forEach(form => {
            this.autoSaveForm(form);
        });
        
        // Confirmación en botones peligrosos
        document.querySelectorAll('[data-confirm]').forEach(button => {
            button.addEventListener('click', (e) => {
                const message = button.getAttribute('data-confirm');
                if (!confirm(message)) {
                    e.preventDefault();
                }
            });
        });
        
        // Tooltips automáticos
        this.initTooltips();
    }
    
    initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    initLoadingStates() {
        // Agregar loading a formularios al enviar
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', (e) => {
                const submitBtn = form.querySelector('[type="submit"]');
                if (submitBtn && !form.classList.contains('was-validated')) {
                    this.addButtonLoading(submitBtn);
                }
            });
        });
    }
    
    autoSaveForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        const debouncedSave = this.debounce(() => {
            this.showAutoSaveIndicator();
            // Aquí iría la lógica de auto-guardado
        }, 2000);
        
        inputs.forEach(input => {
            input.addEventListener('input', debouncedSave);
        });
    }
    
    showAutoSaveIndicator() {
        this.showNotification('Cambios guardados automáticamente', 'success', 2000);
    }

    // =====================================================
    // 6. MÉTODOS PÚBLICOS PARA EL DASHBOARD
    // =====================================================
    
    updateStatCard(cardId, value, label, icon) {
        const card = document.getElementById(cardId);
        if (card) {
            const valueEl = card.querySelector('.stat-content h3');
            const labelEl = card.querySelector('.stat-content p');
            const iconEl = card.querySelector('.stat-icon');
            
            if (valueEl) valueEl.textContent = value;
            if (labelEl) labelEl.textContent = label;
            if (iconEl && icon) iconEl.textContent = icon;
        }
    }
    
    animateCards() {
        const cards = document.querySelectorAll('.stat-card-responsive, .action-card, .info-card');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.3s ease';
                
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                });
            }, index * 100);
        });
    }
    
    showComingSoon(modulo) {
        this.showNotification(`Módulo de ${modulo} estará disponible próximamente`, 'info', 3000);
    }
}

// Instancia global
window.uiComponents = new UIComponents();

// Funciones globales para compatibilidad
window.showNotification = function(message, type, duration) {
    return window.uiComponents.showNotification(message, type, duration);
};

window.showGlobalLoading = function(message) {
    return window.uiComponents.showGlobalLoading(message);
};

window.hideGlobalLoading = function() {
    return window.uiComponents.hideGlobalLoading();
};

window.showComingSoon = function(modulo) {
    return window.uiComponents.showComingSoon(modulo);
};

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Animar cards al cargar
    setTimeout(() => {
        window.uiComponents.animateCards();
    }, 100);
});

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
} 