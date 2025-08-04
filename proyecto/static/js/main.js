/**
 * JavaScript Principal - Sistema de Gestión de Pastoreo
 * Funcionalidades básicas y coordinación con otros módulos
 */

// Sistema principal simplificado
const PastoreoSystem = {
    
    // Configuración
    config: {
        ajaxTimeout: 30000,
        animationDuration: 300,
        toastDuration: 5000
    },
    
    // Inicialización
    init() {
        this.forms.init();
        this.notifications.init();
        this.feedback.init();
        this.accessibility.init();
        this.utils.makeTablesResponsive();
        console.log('✅ Sistema de Pastoreo inicializado');
    },
    
    // Sistema de retroalimentación mejorado
    feedback: {
        init() {
            this.setupButtonFeedback();
            this.setupProgressIndicators();
            this.setupConfirmations();
        },
        
        setupButtonFeedback() {
            // Feedback visual inmediato en botones
            document.addEventListener('click', (e) => {
                if (e.target.matches('button, .btn, [role="button"]')) {
                    const button = e.target;
                    button.classList.add('btn-clicked');
                    setTimeout(() => button.classList.remove('btn-clicked'), 150);
                }
            });
        },
        
        setupProgressIndicators() {
            // Indicadores de progreso para operaciones largas
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', (e) => {
                    this.showProgress('Procesando solicitud...', 'info');
                });
            });
        },
        
        setupConfirmations() {
            // Confirmaciones elegantes para acciones críticas
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-confirm]')) {
                    e.preventDefault();
                    const message = e.target.dataset.confirm;
                    this.showConfirmDialog(message, () => {
                        // Ejecutar acción original
                        if (e.target.href) window.location.href = e.target.href;
                        if (e.target.onclick) e.target.onclick();
                    });
                }
            });
        },
        
        showProgress(message, type = 'info') {
            const progressToast = PastoreoSystem.notifications.create(
                `<div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    ${message}
                </div>`, 
                type
            );
            progressToast.id = 'progress-toast';
            PastoreoSystem.notifications.display(progressToast);
            return progressToast;
        },
        
        hideProgress() {
            const progressToast = document.getElementById('progress-toast');
            if (progressToast) {
                PastoreoSystem.notifications.hide(progressToast);
            }
        },
        
        showConfirmDialog(message, onConfirm, onCancel = null) {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-question-circle text-warning me-2"></i>
                                Confirmar acción
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancelar
                            </button>
                            <button type="button" class="btn btn-primary" id="confirm-action">
                                <i class="fas fa-check me-1"></i>Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            
            modal.querySelector('#confirm-action').addEventListener('click', () => {
                bsModal.hide();
                if (onConfirm) onConfirm();
            });
            
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
                if (onCancel) onCancel();
            });
            
            bsModal.show();
        }
    },
    
    // Mejoras de accesibilidad
    accessibility: {
        init() {
            this.setupKeyboardNavigation();
            this.setupFocusManagement();
            this.setupScreenReaderSupport();
        },
        
        setupKeyboardNavigation() {
            // Navegación por teclado mejorada
            document.addEventListener('keydown', (e) => {
                // Alt + M para ir al menú principal
                if (e.altKey && e.key === 'm') {
                    e.preventDefault();
                    const sidebar = document.getElementById('sidebar-nav');
                    if (sidebar) sidebar.focus();
                }
                
                // Alt + C para ir al contenido principal
                if (e.altKey && e.key === 'c') {
                    e.preventDefault();
                    const main = document.getElementById('main-content');
                    if (main) main.focus();
                }
                
                // Escape para cerrar modales y overlays
                if (e.key === 'Escape') {
                    const overlay = document.querySelector('.sidebar-overlay:not(.d-none)');
                    if (overlay) toggleSidebar();
                }
            });
        },
        
        setupFocusManagement() {
            // Gestión de foco para elementos dinámicos
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.matches('.modal, .alert, .toast')) {
                            // Enfocar en elementos nuevos importantes
                            const focusable = node.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                            if (focusable) {
                                setTimeout(() => focusable.focus(), 100);
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        },
        
        setupScreenReaderSupport() {
            // Anuncios para screen readers
            this.announcer = document.createElement('div');
            this.announcer.setAttribute('aria-live', 'polite');
            this.announcer.setAttribute('aria-atomic', 'true');
            this.announcer.className = 'visually-hidden';
            document.body.appendChild(this.announcer);
        },
        
        announce(message) {
            // Anunciar mensajes a screen readers
            this.announcer.textContent = message;
            setTimeout(() => this.announcer.textContent = '', 1000);
        }
    },
    
    // Formularios mejorados
    forms: {
        init() {
            this.setupValidation();
            this.preventDoubleSubmit();
            this.setupAutoSave();
        },
        
        setupValidation() {
            const forms = document.querySelectorAll('form[data-validate]');
            forms.forEach(form => {
                form.addEventListener('submit', this.validate);
                // Validación en tiempo real
                form.addEventListener('input', this.validateField);
                form.addEventListener('blur', this.validateField, true);
            });
        },
        
        validateField(e) {
            const field = e.target;
            if (field.hasAttribute('required') || field.value.trim()) {
                if (field.checkValidity()) {
                    PastoreoSystem.forms.showSuccess(field);
                } else {
                    PastoreoSystem.forms.showError(field, field.validationMessage);
                }
            } else {
                PastoreoSystem.forms.clearError(field);
            }
        },
        
        validate(e) {
            const form = e.target;
            let isValid = true;
            
            // Campos requeridos
            const required = form.querySelectorAll('[required]');
            required.forEach(field => {
                if (!field.value.trim()) {
                    PastoreoSystem.forms.showError(field, 'Campo obligatorio');
                    isValid = false;
                } else {
                    PastoreoSystem.forms.clearError(field);
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                PastoreoSystem.notifications.show('Por favor corrige los errores marcados', 'error');
                PastoreoSystem.accessibility.announce('Formulario contiene errores, por favor revisa los campos marcados');
                
                // Enfocar en el primer campo con error
                const firstError = form.querySelector('.is-invalid');
                if (firstError) firstError.focus();
            } else {
                PastoreoSystem.accessibility.announce('Formulario enviado correctamente');
            }
        },
        
        showError(field, message) {
            field.classList.remove('is-valid');
            field.classList.add('is-invalid');
            field.setAttribute('aria-invalid', 'true');
            
            let feedback = field.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                field.parentElement.appendChild(feedback);
            }
            feedback.textContent = message;
            feedback.setAttribute('role', 'alert');
        },
        
        showSuccess(field) {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
            field.setAttribute('aria-invalid', 'false');
            
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        },
        
        clearError(field) {
            field.classList.remove('is-invalid', 'is-valid');
            field.removeAttribute('aria-invalid');
            const feedback = field.parentElement.querySelector('.invalid-feedback');
            if (feedback) feedback.remove();
        },
        
        preventDoubleSubmit() {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('submit', function() {
                    const btn = form.querySelector('button[type="submit"]');
                    if (btn && !btn.disabled) {
                        btn.disabled = true;
                        const originalText = btn.innerHTML;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
                        
                        // Restaurar botón después de 5 segundos como fallback
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                        }, 5000);
                    }
                });
            });
        },
        
        setupAutoSave() {
            // Auto-guardado para formularios largos
            const autoSaveForms = document.querySelectorAll('form[data-autosave]');
            autoSaveForms.forEach(form => {
                const saveData = PastoreoSystem.utils.debounce(() => {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    localStorage.setItem(`autosave_${form.id}`, JSON.stringify(data));
                    PastoreoSystem.notifications.show('Borrador guardado automáticamente', 'info', 2000);
                }, 2000);
                
                form.addEventListener('input', saveData);
                
                // Restaurar datos al cargar
                const savedData = localStorage.getItem(`autosave_${form.id}`);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    Object.keys(data).forEach(key => {
                        const field = form.querySelector(`[name="${key}"]`);
                        if (field) field.value = data[key];
                    });
                }
            });
        }
    },
    
    // Notificaciones mejoradas
    notifications: {
        init() {
            if (!document.getElementById('toast-container')) {
                const container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'position-fixed top-0 end-0 p-3';
                container.style.zIndex = '1060';
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-atomic', 'true');
                document.body.appendChild(container);
            }
        },
        
        show(message, type = 'info', duration = 5000) {
            const toast = this.create(message, type);
            this.display(toast);
            
            // Auto-hide solo si no es un error crítico
            if (type !== 'error' || duration > 0) {
                setTimeout(() => this.hide(toast), duration);
            }
            
            // Anunciar a screen readers
            PastoreoSystem.accessibility.announce(message);
        },
        
        create(message, type) {
            const toastId = 'toast-' + Date.now();
            const toast = document.createElement('div');
            toast.id = toastId;
            toast.className = `toast align-items-center text-white bg-${this.getBootstrapColor(type)} border-0`;
            toast.setAttribute('role', 'alert');
            toast.setAttribute('aria-live', 'assertive');
            toast.setAttribute('aria-atomic', 'true');
            
            const icons = {
                success: 'fa-check-circle',
                error: 'fa-exclamation-triangle',
                warning: 'fa-exclamation-circle',
                info: 'fa-info-circle'
            };
            
            toast.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas ${icons[type] || icons.info} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                            aria-label="Cerrar notificación" 
                            onclick="PastoreoSystem.notifications.hide(document.getElementById('${toastId}'))">
                    </button>
                </div>
            `;
            
            return toast;
        },
        
        getBootstrapColor(type) {
            const colors = {
                success: 'success',
                error: 'danger',
                warning: 'warning',
                info: 'primary'
            };
            return colors[type] || colors.info;
        },
        
        display(toast) {
            const container = document.getElementById('toast-container');
            container.appendChild(toast);
            
            // Inicializar toast de Bootstrap
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
        },
        
        hide(toast) {
            if (toast && toast.parentElement) {
                const bsToast = bootstrap.Toast.getInstance(toast);
                if (bsToast) {
                    bsToast.hide();
                } else {
                    toast.remove();
                }
            }
        }
    },
    
    // Utilidades
    utils: {
        makeTablesResponsive() {
            const tables = document.querySelectorAll('table:not(.no-responsive)');
            tables.forEach(table => {
                if (!table.parentElement.classList.contains('table-responsive')) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-responsive';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                }
            });
        },
        
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
        },
        
        formatNumber(num, decimals = 2) {
            return parseFloat(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        
        ajax(url, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                timeout: this.config.ajaxTimeout
            };
            
            const config = Object.assign(defaultOptions, options);
            
            return fetch(url, config)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .catch(error => {
                    console.error('Error en petición AJAX:', error);
                    PastoreoSystem.notifications.show('Error en la conexión', 'error');
                    throw error;
                });
        }
    }
};

// Función toggleSidebar ya está definida en base.html

// Función global de inicialización
window.initPastoreo = function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PastoreoSystem.init());
    } else {
        PastoreoSystem.init();
    }
};

// Auto-inicialización
window.initPastoreo(); 