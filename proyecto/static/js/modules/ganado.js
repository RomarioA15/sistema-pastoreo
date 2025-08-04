/**
 * GANADO - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

document.addEventListener('DOMContentLoaded', function() {
    const potreroSelect = document.getElementById('potrero_id');
    const loteSelect = document.getElementById('lote_id');
    const cantidadInput = document.getElementById('cantidad_animales');
    const pesoInput = document.getElementById('peso_promedio_entrada');
    const infoCalculada = document.getElementById('infoCalculada');
    
    // Obtener parámetros de URL (si viene de lotes)
    const urlParams = new URLSearchParams(window.location.search);
    const loteIdParam = urlParams.get('lote_id');
    
    if (loteIdParam) {
        loteSelect.value = loteIdParam;
        actualizarDatosLote();
    }
    
    // Actualizar datos cuando se selecciona un lote
    loteSelect.addEventListener('change', actualizarDatosLote);
    
    // Calcular información cuando cambian los valores
    potreroSelect.addEventListener('change', calcularInfo);
    cantidadInput.addEventListener('input', calcularInfo);
    pesoInput.addEventListener('input', calcularInfo);
    
    function actualizarDatosLote() {
        const selectedOption = loteSelect.options[loteSelect.selectedIndex];
        if (selectedOption.value) {
            const cantidad = parseInt(selectedOption.dataset.cantidad);
            const peso = parseFloat(selectedOption.dataset.peso);
            
            cantidadInput.value = cantidad;
            pesoInput.value = peso;
            calcularInfo();
        }
    }
    
    function calcularInfo() {
        const cantidad = parseInt(cantidadInput.value) || 0;
        const peso = parseFloat(pesoInput.value) || 0;
        const potreroOption = potreroSelect.options[potreroSelect.selectedIndex];
        
        if (cantidad > 0 && peso > 0) {
            const pesoTotal = cantidad * peso;
            const ugm = pesoTotal / 450;
            const consumoDiario = pesoTotal * 0.025; // 2.5% del peso vivo
            
            document.getElementById('pesoTotal').textContent = pesoTotal.toFixed(0);
            document.getElementById('ugm').textContent = ugm.toFixed(2);
            document.getElementById('consumoDiario').textContent = consumoDiario.toFixed(1);
            
            // Calcular carga animal si hay potrero seleccionado
            if (potreroOption.value) {
                const hectareas = parseFloat(potreroOption.dataset.hectareas);
                const cargaKgHa = pesoTotal / hectareas;
                const cargaUgmHa = ugm / hectareas;
                
                document.getElementById('cargaAnimalCalc').textContent = cargaUgmHa.toFixed(2);
                document.getElementById('cargaAnimal').innerHTML = 
                    `<strong>${cargaKgHa.toFixed(0)} kg/ha</strong> | <strong>${cargaUgmHa.toFixed(2)} UGM/ha</strong>`;
                
                // Alertas de carga animal
                let alertClass = 'text-success';
                if (cargaUgmHa > 3) alertClass = 'text-danger';
                else if (cargaUgmHa > 2) alertClass = 'text-warning';
                
                document.getElementById('cargaAnimal').className = `form-control-plaintext ${alertClass}`;
            }
            
            infoCalculada.style.display = 'block';
        } else {
            infoCalculada.style.display = 'none';
            document.getElementById('cargaAnimal').innerHTML = 
                '<span class="text-muted">Selecciona potrero y lote para calcular</span>';
        }
    }
    
    // Validación del formulario
    document.getElementById('nuevoMovimientoForm').addEventListener('submit', function(e) {
        const cantidad = parseInt(cantidadInput.value);
        const peso = parseFloat(pesoInput.value);
        
        if (cantidad <= 0) {
            e.preventDefault();
            alert('La cantidad de animales debe ser mayor a 0');
            cantidadInput.focus();
            return;
        }
        
        if (peso <= 0) {
            e.preventDefault();
            alert('El peso promedio debe ser mayor a 0');
            pesoInput.focus();
            return;
        }
        
        // Confirmar si la carga animal es muy alta
        const potreroOption = potreroSelect.options[potreroSelect.selectedIndex];
        if (potreroOption.value) {
            const hectareas = parseFloat(potreroOption.dataset.hectareas);
            const ugm = (cantidad * peso / 450) / hectareas;
            
            if (ugm > 3) {
                if (!confirm(`La carga animal será de ${ugm.toFixed(2)} UGM/ha, lo cual es muy alta. ¿Deseas continuar?`)) {
                    e.preventDefault();
                    return;
                }
            }
        }
    });
});