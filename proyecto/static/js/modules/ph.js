/**
 * PH - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

// Variables globales
    let selectedPotrero = null;
    
    // Función principal de inicialización
    document.addEventListener('DOMContentLoaded', function() {
        initializeFormValidation();
        initializePHScale();
        initializePotreroSelector();
        initializeDynamicFeedback();
    });

    // Inicializar validación del formulario
    function initializeFormValidation() {
        const form = document.getElementById('phForm');
        const submitBtn = document.getElementById('submitBtn');
        
        form.addEventListener('input', function() {
            validateForm();
        });
    }

    // Validar formulario completo
    function validateForm() {
        const potrero = document.getElementById('potrero_id').value;
        const fecha = document.getElementById('fecha').value;
        const valor = document.getElementById('valor').value;
        
        const isValid = potrero && fecha && valor && valor >= 0 && valor <= 14;
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = !isValid;
        
        if (isValid) {
            submitBtn.classList.remove('btn-outline-success');
            submitBtn.classList.add('btn-success');
        } else {
            submitBtn.classList.remove('btn-success');
            submitBtn.classList.add('btn-outline-success');
        }
    }

    // Inicializar escala de pH
    function initializePHScale() {
        const valorInput = document.getElementById('valor');
        
        valorInput.addEventListener('input', function() {
            updatePHScale();
            updatePHStatus();
            updateDynamicFeedback();
        });
        
        // Inicializar con valor existente
        if (valorInput.value) {
            updatePHScale();
            updatePHStatus();
        }
    }

    // Actualizar escala visual de pH
    function updatePHScale() {
        const pHValue = parseFloat(document.getElementById('valor').value);
        
        if (!isNaN(pHValue) && pHValue >= 0 && pHValue <= 14) {
            // Convertir pH (0-14) a posición en la barra (0-100%)
            const position = (pHValue / 14) * 100;
            
            // Actualizar posición y texto del marcador
            document.getElementById('phMarker').style.left = `${position}%`;
            document.getElementById('phValue').textContent = pHValue.toFixed(1);
        }
    }

    // Actualizar indicador de estado de pH
    function updatePHStatus() {
        const pHValue = parseFloat(document.getElementById('valor').value);
        const emoji = document.getElementById('ph-emoji');
        const statusText = document.getElementById('ph-status-text');
        
        if (isNaN(pHValue)) {
            emoji.textContent = '🤔';
            statusText.textContent = 'Ingresa un valor';
            statusText.className = 'h6 text-muted';
            return;
        }
        
        if (pHValue < 5.5) {
            emoji.textContent = '😰';
            statusText.textContent = 'Muy Ácido';
            statusText.className = 'h6 text-danger';
        } else if (pHValue < 6.5) {
            emoji.textContent = '😐';
            statusText.textContent = 'Lig. Ácido';
            statusText.className = 'h6 text-warning';
        } else if (pHValue <= 7.5) {
            emoji.textContent = '😊';
            statusText.textContent = '¡Perfecto!';
            statusText.className = 'h6 text-success';
        } else {
            emoji.textContent = '😬';
            statusText.textContent = 'Alcalino';
            statusText.className = 'h6 text-primary';
        }
    }

    // Inicializar selector de potrero
    function initializePotreroSelector() {
        const potreroSelect = document.getElementById('potrero_id');
        
        potreroSelect.addEventListener('change', function() {
            updatePotreroInfo();
            updateDynamicFeedback();
        });
        
        // Inicializar si hay valor existente
        if (potreroSelect.value) {
            updatePotreroInfo();
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
                tipoPasto: selectedOption.getAttribute('data-tipo-pasto')
            };
            
            const potreroInfo = document.getElementById('potrero-info');
            const potreroDetails = document.getElementById('potrero-details');
            
            potreroDetails.innerHTML = `
                <div class="small">
                    <div class="mb-1"><strong>📍 Potrero:</strong> ${selectedPotrero.nombre}</div>
                    <div class="mb-1"><strong>📏 Extensión:</strong> ${selectedPotrero.hectareas} hectáreas</div>
                    <div class="mb-1"><strong>🌾 Tipo de Pasto:</strong> ${selectedPotrero.tipoPasto}</div>
                </div>
            `;
            
            potreroInfo.style.display = 'block';
        } else {
            document.getElementById('potrero-info').style.display = 'none';
            selectedPotrero = null;
        }
    }

    // Inicializar feedback dinámico
    function initializeDynamicFeedback() {
        updateDynamicFeedback();
    }

    // Actualizar feedback dinámico
    function updateDynamicFeedback() {
        const pHValue = parseFloat(document.getElementById('valor').value);
        const feedbackDiv = document.getElementById('dynamic-feedback');
        const feedbackContent = document.getElementById('feedback-content');
        
        if (isNaN(pHValue) || !selectedPotrero) {
            feedbackDiv.style.display = 'none';
            return;
        }
        
        let feedback = '';
        let alertClass = 'alert-info';
        
        if (pHValue < 5.5) {
            feedback = `
                <div class="small">
                    <div class="text-danger mb-2"><strong>⚠️ Suelo Muy Ácido</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>Considera aplicar cal agrícola</li>
                        <li>Los nutrientes pueden estar bloqueados</li>
                        <li>El ${selectedPotrero.tipoPasto} puede tener problemas de crecimiento</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-danger';
        } else if (pHValue < 6.5) {
            feedback = `
                <div class="small">
                    <div class="text-warning mb-2"><strong>⚡ Suelo Ligeramente Ácido</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>Rango aceptable para la mayoría de pastos</li>
                        <li>Monitorea la evolución del pH</li>
                        <li>Considera enmiendas orgánicas</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-warning';
        } else if (pHValue <= 7.5) {
            feedback = `
                <div class="small">
                    <div class="text-success mb-2"><strong>✅ Condiciones Ideales</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>pH perfecto para ${selectedPotrero.tipoPasto}</li>
                        <li>Nutrientes disponibles para las plantas</li>
                        <li>Mantén las prácticas actuales</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-success';
        } else {
            feedback = `
                <div class="small">
                    <div class="text-primary mb-2"><strong>🔵 Suelo Alcalino</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>Algunos nutrientes pueden ser menos disponibles</li>
                        <li>Considera acidificar con materia orgánica</li>
                        <li>Monitorea el estado del ${selectedPotrero.tipoPasto}</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-primary';
        }
        
        feedbackDiv.className = `alert alert-dynamic ${alertClass}`;
        feedbackContent.innerHTML = feedback;
        feedbackDiv.style.display = 'block';
    }

    // Inicializar valores existentes al cargar la página
    document.addEventListener('DOMContentLoaded', function() {
        const initialValue = document.getElementById('valor').value;
        if (initialValue) {
            updatePHScale();
            updatePHStatus();
        }
        
        const initialPotrero = document.getElementById('potrero_id').value;
        if (initialPotrero) {
            updatePotreroInfo();
        }
        
        updateDynamicFeedback();
        validateForm();
    });