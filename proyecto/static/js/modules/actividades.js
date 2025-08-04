/**
 * ACTIVIDADES - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

function updateActivityPreview() {
    const tipoSelect = document.querySelector('select[name="tipo_actividad"]');
    const infoDiv = document.getElementById('activityTypeInfo');
    
    const activityInfo = {
        'Riego': {
            icon: 'fas fa-tint',
            info: '<strong>Riego:</strong> Considera la cantidad de agua necesaria, presión del sistema y tiempo de aplicación. Revisa que los aspersores funcionen correctamente.',
            tips: ['Riega temprano en la mañana', 'Verifica la humedad del suelo', 'Revisa el sistema de distribución']
        },
        'Fumigación': {
            icon: 'fas fa-spray-can',
            info: '<strong>Fumigación:</strong> Usa equipo de protección personal, verifica la dirección del viento y temperatura. Respeta los tiempos de carencia.',
            tips: ['Usar EPP completo', 'Aplicar sin viento fuerte', 'Respetar dosis recomendadas']
        },
        'Fertilización': {
            icon: 'fas fa-seedling',
            info: '<strong>Fertilización:</strong> Aplica según análisis de suelo, considera la época del año y el tipo de pasto. Distribuye uniformemente.',
            tips: ['Basar en análisis de suelo', 'Aplicar en época húmeda', 'Distribución uniforme']
        },
        'Reparación de Cercas': {
            icon: 'fas fa-wrench',
            info: '<strong>Reparación de Cercas:</strong> Inspecciona postes, alambres y tensores. Lleva herramientas y materiales de repuesto.',
            tips: ['Revisar toda la cerca', 'Llevar materiales extra', 'Verificar tensión de alambres']
        },
        'Limpieza': {
            icon: 'fas fa-broom',
            info: '<strong>Limpieza:</strong> Incluye remoción de malezas, limpieza de bebederos y mantenimiento de instalaciones.',
            tips: ['Limpiar bebederos regularmente', 'Controlar malezas tóxicas', 'Mantener senderos despejados']
        }
    };
    
    if (tipoSelect.value && activityInfo[tipoSelect.value]) {
        const info = activityInfo[tipoSelect.value];
        infoDiv.innerHTML = `
            <div class="mb-2">
                <i class="${info.icon} me-2"></i>
                ${info.info}
            </div>
            <small><strong>Consejos clave:</strong></small>
            <ul class="small mb-0">
                ${info.tips.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        `;
    } else {
        infoDiv.innerHTML = '<p class="mb-0 text-responsive-wrap">Selecciona un tipo de actividad para ver información específica sobre mejores prácticas y consideraciones especiales.</p>';
    }
}

function mostrarAyuda() {
    alert(`🎯 Guía para Crear Actividades:

📝 Información Básica:
• Potrero: Selecciona el área específica
• Fecha: Programa con anticipación
• Tipo: Define claramente la actividad

📋 Descripción Detallada:
• Qué se va a hacer exactamente
• Materiales y herramientas necesarias
• Procedimiento a seguir

👥 Asignación:
• Responsable: Persona a cargo
• Costo: Presupuesto estimado
• Estado: Situación inicial

¡Una buena planificación garantiza mejores resultados!`);
}

// Validaciones del formulario
document.getElementById('actividadForm').addEventListener('submit', function(e) {
    const requiredFields = ['potrero_id', 'fecha', 'tipo_actividad', 'descripcion'];
    let hasError = false;
    
    requiredFields.forEach(fieldName => {
        const field = document.querySelector(`[name="${fieldName}"]`);
        if (!field.value.trim()) {
            field.style.borderColor = '#dc3545';
            hasError = true;
        } else {
            field.style.borderColor = '#e9ecef';
        }
    });
    
    if (hasError) {
        e.preventDefault();
        alert('Por favor completa todos los campos obligatorios marcados con *');
    }
});

// Inicializar página
document.addEventListener('DOMContentLoaded', function() {
    document.body.classList.add('actividades-page');
    
    // Configurar fecha mínima como hoy
    const fechaInput = document.querySelector('input[name="fecha"]');
    if (fechaInput) {
        const today = new Date().toISOString().split('T')[0];
        fechaInput.value = today;
    }
});