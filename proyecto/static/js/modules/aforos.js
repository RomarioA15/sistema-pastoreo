/**
 * AFOROS - JavaScript específico con Heurísticas de Nielsen
 * Sistema de Gestión de Pastoreo
 */

// Variables globales
let selectedPotrero = null;

// Función principal de inicialización
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('aforoForm')) {
        initializeFormValidation();
        initializePotreroSelector();
        initializeTooltips();
        initializeRealTimeValidation();
    }
});

// Inicializar validación del formulario
function initializeFormValidation() {
    const form = document.getElementById('aforoForm');
    
    form.addEventListener('input', function() {
        validateForm();
    });
    
    form.addEventListener('change', function() {
        validateForm();
    });
}

// Validar formulario completo
function validateForm() {
    const potrero = document.getElementById('potrero_id').value;
    const fecha = document.getElementById('fecha').value;
    
    let isValid = potrero && fecha;
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = !isValid;
        
        if (isValid) {
            submitBtn.classList.remove('btn-outline-success');
            submitBtn.classList.add('btn-success');
        } else {
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-outline-success');
        }
    }
    
    return isValid;
}

// Inicializar selector de potrero
function initializePotreroSelector() {
    const potreroSelect = document.getElementById('potrero_id');
    
    if (potreroSelect) {
        potreroSelect.addEventListener('change', function() {
            updatePotreroInfo();
            validateForm();
        });
        
        // Inicializar si hay valor existente
        if (potreroSelect.value) {
            updatePotreroInfo();
        }
    }
}

// Actualizar información del potrero
function updatePotreroInfo() {
    const potreroSelect = document.getElementById('potrero_id');
    const selectedOption = potreroSelect.options[potreroSelect.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
        selectedPotrero = {
            nombre: selectedOption.text.split('(')[0].trim(),
            hectareas: selectedOption.getAttribute('data-hectareas'),
            tipoPasto: selectedOption.getAttribute('data-tipo-pasto'),
            etapaGanado: selectedOption.getAttribute('data-etapa-ganado')
        };
        
        const potreroInfo = document.getElementById('potrero-info');
        const potreroDetails = document.getElementById('potrero-details');
        
        if (potreroInfo && potreroDetails) {
            potreroDetails.innerHTML = `
                <div class="mb-1"><strong>📍 Potrero:</strong> ${selectedPotrero.nombre}</div>
                <div class="mb-1"><strong>📏 Extensión:</strong> ${selectedPotrero.hectareas} hectáreas</div>
                <div class="mb-1"><strong>🌾 Tipo de Pasto:</strong> ${selectedPotrero.tipoPasto}</div>
                <div class="mb-1"><strong>🐄 Etapa:</strong> ${selectedPotrero.etapaGanado}</div>
            `;
            
            potreroInfo.style.display = 'block';
        }
    } else {
        const potreroInfo = document.getElementById('potrero-info');
        if (potreroInfo) {
            potreroInfo.style.display = 'none';
        }
        selectedPotrero = null;
    }
}

// Inicializar tooltips
function initializeTooltips() {
    // Inicializar tooltips de Bootstrap si está disponible
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        const tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// Función para inicializar validación en tiempo real
function initializeRealTimeValidation() {
    // Validación del selector de potrero
    const potreroSelect = document.getElementById('potrero_id');
    if (potreroSelect) {
        potreroSelect.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
            } else {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            }
            validateForm();
        });
    }
    
    // Validación del campo fecha
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            if (this.value) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
            } else {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            }
            validateForm();
        });
    }
}

// Mostrar errores de validación
function showValidationErrors() {
    const errorMessages = document.getElementById('errorMessages');
    let errors = [];
    
    const potrero = document.getElementById('potrero_id').value;
    const fecha = document.getElementById('fecha').value;
    
    if (!potrero) {
        errors.push('Debe seleccionar un potrero');
    }
    if (!fecha) {
        errors.push('Debe seleccionar una fecha');
    }
    
    if (errors.length > 0) {
        errorMessages.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Por favor corrija los siguientes errores:</h6>
                <ul class="mb-0">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
        errorMessages.style.display = 'block';
        
        // Scroll hacia los errores
        errorMessages.scrollIntoView({ behavior: 'smooth' });
    } else {
        errorMessages.style.display = 'none';
    }
}