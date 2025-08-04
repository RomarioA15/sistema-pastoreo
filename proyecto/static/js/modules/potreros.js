/**
 * POTREROS - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

// Variables globales del mapa
let mapData = {
    potreros: [],
    elements: {
        bebederos: [],
        cercas: [],
        rios: [],
        caminos: [],
        arboles: [],
        casas: []
    }
};

let selectedTool = 'select';
let selectedPotrero = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentDraggedElement = null;

// Variables del formulario
let selectedCattleStage = null;
    
    // Función principal de inicialización
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar mapa si existe
        if (document.getElementById('mapGrid')) {
            initializeMap();
            
            // Verificar si hay un nuevo potrero para destacar
            if (window.nuevoPotrero) {
                setTimeout(() => {
                    highlightNewPotrero(window.nuevoPotrero);
                }, 500);
            }
        }
        
        // Inicializar formularios si existen
        if (document.getElementById('potreroForm')) {
            initializeFormValidation();
            initializeGrassTypeOptions();
            initializeCattleStageCards();
            initializeAreaCalculator();
            initializeDynamicFeedback();
        }
    });

    // Inicializar validación del formulario
    function initializeFormValidation() {
        const form = document.getElementById('potreroForm');
        
        form.addEventListener('input', function() {
            validateForm();
        });
    }

    // Validar formulario completo
    function validateForm() {
        const nombre = document.getElementById('nombre').value.trim();
        const hectareas = parseFloat(document.getElementById('hectareas').value);
        const tipoPasto = document.getElementById('tipo_pasto').value.trim();
        
        let isValid = nombre && hectareas > 0 && tipoPasto && selectedCattleStage;
        
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

    // Inicializar opciones de tipo de pasto
    function initializeGrassTypeOptions() {
        const grassOptions = document.querySelectorAll('.grass-type-option');
        const input = document.getElementById('tipo_pasto');
        
        grassOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remover selección previa
                grassOptions.forEach(o => o.classList.remove('selected'));
                
                // Seleccionar actual
                this.classList.add('selected');
                
                // Actualizar input
                if (this.dataset.value === 'Otro') {
                    input.value = '';
                    input.focus();
                } else {
                    input.value = this.dataset.value;
                }
                
                updateDynamicFeedback();
                validateForm();
            });
        });
        
        // También validar cuando se escribe directamente
        input.addEventListener('input', function() {
            // Remover selección de opciones
            grassOptions.forEach(o => o.classList.remove('selected'));
            validateForm();
        });
    }

    // Inicializar tarjetas de etapa del ganado
    function initializeCattleStageCards() {
        const cards = document.querySelectorAll('.cattle-stage-card');
        const hiddenInput = document.getElementById('etapa_ganado');
        
        cards.forEach(card => {
            card.addEventListener('click', function() {
                // Remover selección previa
                cards.forEach(c => c.classList.remove('selected'));
                
                // Seleccionar actual
                this.classList.add('selected');
                selectedCattleStage = this.dataset.value;
                hiddenInput.value = selectedCattleStage;
                
                updateDynamicFeedback();
                validateForm();
            });
        });
    }

    // Inicializar calculadora de área
    function initializeAreaCalculator() {
        const hectareasInput = document.getElementById('hectareas');
        
        hectareasInput.addEventListener('input', function() {
            const hectareas = parseFloat(this.value);
            
            if (hectareas > 0) {
                // Mostrar calculadora
                document.getElementById('area-calculator').style.display = 'block';
                
                // Calcular equivalencias
                const metrosCuadrados = hectareas * 10000;
                const manzanas = hectareas / 0.7; // 1 manzana ≈ 0.7 ha
                const cargaEstimada = Math.round(hectareas * 2); // Estimación conservadora
                
                document.getElementById('equiv-metros').textContent = metrosCuadrados.toLocaleString();
                document.getElementById('equiv-manzanas').textContent = manzanas.toFixed(1);
                document.getElementById('carga-estimada').textContent = cargaEstimada;
            } else {
                document.getElementById('area-calculator').style.display = 'none';
            }
            
            validateForm();
        });
    }

    // Inicializar feedback dinámico
    function initializeDynamicFeedback() {
        updateDynamicFeedback();
    }

    // Actualizar feedback dinámico
    function updateDynamicFeedback() {
        const hectareas = parseFloat(document.getElementById('hectareas').value);
        const tipoPasto = document.getElementById('tipo_pasto').value;
        const feedbackDiv = document.getElementById('dynamic-feedback');
        const feedbackContent = document.getElementById('feedback-content');
        
        if (!hectareas || !tipoPasto || !selectedCattleStage) {
            feedbackDiv.style.display = 'none';
            return;
        }
        
        let feedback = '';
        let alertClass = 'alert-info';
        
        // Recomendaciones según el tamaño
        if (hectareas < 1) {
            feedback += `
                <div class="small">
                    <div class="text-warning mb-2"><strong>⚠️ Potrero Pequeño:</strong></div>
                    <ul class="ps-3 mb-2">
                        <li>Ideal para rotación rápida</li>
                        <li>Requiere manejo intensivo</li>
                        <li>Perfecto para ${selectedCattleStage.toLowerCase()}</li>
                    </ul>
                </div>
            `;
        } else if (hectareas > 5) {
            feedback += `
                <div class="small">
                    <div class="text-success mb-2"><strong>✅ Potrero Grande:</strong></div>
                    <ul class="ps-3 mb-2">
                        <li>Permite pastoreo extensivo</li>
                        <li>Considera subdivisiones futuras</li>
                        <li>Buena capacidad para ${selectedCattleStage.toLowerCase()}</li>
                    </ul>
                </div>
            `;
        }
        
        // Recomendaciones según tipo de pasto
        if (tipoPasto.toLowerCase().includes('alfalfa')) {
            feedback += `
                <div class="small">
                    <div class="text-info mb-2"><strong>🌱 Sobre la Alfalfa:</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>Excelente para ganado de ordeño</li>
                        <li>Requiere suelos bien drenados</li>
                        <li>Alto contenido proteico</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-success';
        } else if (tipoPasto.toLowerCase().includes('festuca')) {
            feedback += `
                <div class="small">
                    <div class="text-info mb-2"><strong>🌾 Sobre la Festuca:</strong></div>
                    <ul class="ps-3 mb-0">
                        <li>Muy resistente al pastoreo</li>
                        <li>Adaptada a climas diversos</li>
                        <li>Buena para manejo intensivo</li>
                    </ul>
                </div>
            `;
            alertClass = 'alert-info';
        }
        
        if (feedback) {
            feedbackDiv.className = `alert alert-dynamic ${alertClass}`;
            feedbackContent.innerHTML = feedback;
            feedbackDiv.style.display = 'block';
        } else {
            feedbackDiv.style.display = 'none';
        }
    }

    // Validar al cargar valores existentes
    const initialStage = "{{ request.form.get('etapa_ganado', '') }}";
    if (initialStage) {
        document.querySelector(`[data-value="${initialStage}"]`).click();
    }

// =============================================================================
// FUNCIONES DEL MAPA INTERACTIVO
// =============================================================================

// Inicializar mapa interactivo
function initializeMap() {
    console.log('Inicializando mapa interactivo de potreros...');
    
    // Crear grid del mapa
    createMapGrid();
    
    // Inicializar herramientas
    initializeToolPalette();
    
    // Agregar botón de actualización
    addRefreshButton();
    
    // Cargar potreros existentes
    loadExistingPotreros();
    
    // Cargar layout guardado (si existe)
    setTimeout(() => {
        loadMapLayout();
    }, 100); // Pequeño delay para asegurar que los potreros se carguen primero
    
    // Inicializar atajos de teclado
    initializeKeyboardShortcuts();
    
    console.log('Mapa interactivo inicializado correctamente');
}

// Crear grid del mapa
function createMapGrid() {
    const mapGrid = document.getElementById('mapGrid');
    if (!mapGrid) {
        console.error('Elemento mapGrid no encontrado');
        return;
    }
    
    // Limpiar grid existente
    mapGrid.innerHTML = '';
    
    // Agregar clase CSS para el grid
    mapGrid.className = 'map-grid';
    
    // Crear 400 celdas (20x20)
    for (let i = 0; i < 400; i++) {
        const cell = document.createElement('div');
        cell.className = 'map-grid-cell';
        cell.dataset.index = i;
        cell.dataset.row = Math.floor(i / 20);
        cell.dataset.col = i % 20;
        
        // Agregar eventos de celda
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('mouseenter', handleCellHover);
        cell.addEventListener('mouseleave', handleCellLeave);
        
        mapGrid.appendChild(cell);
    }
    
    console.log('Grid del mapa creado: 400 celdas (20x20)');
}

// Inicializar paleta de herramientas
function initializeToolPalette() {
    const paletteItems = document.querySelectorAll('.palette-item, .potreros-tool');
    
    paletteItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover selección activa
            paletteItems.forEach(p => p.classList.remove('active'));
            
            // Seleccionar herramienta
            this.classList.add('active');
            
            const tool = this.dataset.tool;
            const action = this.dataset.action;
            
            if (tool) {
                selectedTool = tool;
                console.log('Herramienta seleccionada:', selectedTool);
                
                // Actualizar cursor del mapa
                const mapGrid = document.getElementById('mapGrid');
                if (mapGrid) {
                    if (tool === 'select') {
                        mapGrid.style.cursor = 'default';
                    } else {
                        mapGrid.style.cursor = 'crosshair';
                    }
                }
            } else if (action) {
                handlePaletteAction(action);
            }
        });
    });
}

// Manejar click en celda del mapa
function handleCellClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const cell = event.target;
    
    // Verificar si es realmente una celda del grid
    if (!cell.classList.contains('map-grid-cell')) {
        console.log('Click no es en una celda del grid');
        return;
    }
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // Validar coordenadas
    if (isNaN(row) || isNaN(col) || row < 0 || row >= 20 || col < 0 || col >= 20) {
        console.error('Coordenadas inválidas:', row, col);
        return;
    }
    
    console.log(`Click en celda [${row}, ${col}] con herramienta: ${selectedTool}`);
    
    switch (selectedTool) {
        case 'select':
            // Deseleccionar elementos activos
            const infoPanel = document.getElementById('potreroInfo');
            if (infoPanel) {
                infoPanel.style.display = 'none';
                infoPanel.classList.remove('visible');
            }
            document.querySelectorAll('.map-potrero').forEach(p => {
                p.style.boxShadow = '';
            });
            document.querySelectorAll('.map-element[data-selected="true"]').forEach(el => {
                el.dataset.selected = 'false';
                el.style.border = '';
                el.style.boxShadow = '';
            });
            selectedPotrero = null;
            break;
        case 'bebedero':
            addMapElement('bebedero', row, col);
            break;
        case 'cerca':
            addMapElement('cerca', row, col);
            break;
        case 'rio':
            addMapElement('rio', row, col);
            break;
        case 'camino':
            addMapElement('camino', row, col);
            break;
        case 'arbol':
            addMapElement('arbol', row, col);
            break;
        case 'casa':
            addMapElement('casa', row, col);
            break;
        default:
            console.log('Herramienta no reconocida:', selectedTool);
    }
}

// Manejar hover en celda
function handleCellHover(event) {
    const cell = event.target;
    
    // Solo aplicar hover si no hay elementos en la celda
    if (!cell.querySelector('.map-element, .map-potrero')) {
        if (selectedTool !== 'select') {
            // Mostrar preview de la herramienta
            cell.style.backgroundColor = 'rgba(40, 167, 69, 0.3)';
            cell.style.cursor = 'crosshair';
        } else {
            cell.style.cursor = 'pointer';
        }
    }
}

// Manejar salida del hover
function handleCellLeave(event) {
    const cell = event.target;
    
    // Limpiar efectos de hover
    if (!cell.querySelector('.map-element, .map-potrero')) {
        cell.style.backgroundColor = '';
        cell.style.cursor = '';
    }
}

// Agregar elemento al mapa
function addMapElement(type, row, col) {
    // Validar tipo de elemento
    const validTypes = ['bebedero', 'cerca', 'rio', 'camino', 'arbol', 'casa'];
    if (!validTypes.includes(type)) {
        console.error('Tipo de elemento inválido:', type);
        return false;
    }
    
    const cellIndex = row * 20 + col;
    const cell = document.querySelector(`[data-index="${cellIndex}"]`);
    
    if (!cell) {
        console.error('Celda no encontrada para índice:', cellIndex);
        showNotification('Posición inválida en el mapa', 'danger');
        return false;
    }
    
    // Verificar si la celda ya está ocupada
    if (isCellOccupied(cell)) {
        console.log('Celda ocupada por otro elemento');
        showNotification('Esta posición ya está ocupada', 'warning');
        return false;
    }
    
    // Crear elemento visual
    const element = document.createElement('div');
    element.className = `map-element ${type}`;
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.zIndex = '5';
    element.dataset.type = type;
    element.dataset.row = row;
    element.dataset.col = col;
    element.dataset.selected = 'false';
    element.title = `${type.charAt(0).toUpperCase() + type.slice(1)} [${row}, ${col}]`;
    
    // Agregar icono según tipo
    const icon = document.createElement('i');
    switch (type) {
        case 'bebedero':
            icon.className = 'fas fa-tint';
            break;
        case 'cerca':
            icon.className = 'fas fa-grip-lines';
            break;
        case 'rio':
            icon.className = 'fas fa-water';
            break;
        case 'camino':
            icon.className = 'fas fa-road';
            break;
        case 'arbol':
            icon.className = 'fas fa-tree';
            break;
        case 'casa':
            icon.className = 'fas fa-home';
            break;
    }
    
    element.appendChild(icon);
    
    // Hacer elemento clickeable y seleccionable
    element.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (selectedTool === 'select') {
            // Toggle selección
            const isSelected = this.dataset.selected === 'true';
            if (isSelected) {
                this.dataset.selected = 'false';
                this.style.border = '';
                this.style.boxShadow = '';
            } else {
                // Deseleccionar otros elementos si no se mantiene Ctrl
                if (!e.ctrlKey && !e.metaKey) {
                    document.querySelectorAll('.map-element[data-selected="true"]').forEach(el => {
                        el.dataset.selected = 'false';
                        el.style.border = '';
                        el.style.boxShadow = '';
                    });
                }
                
                this.dataset.selected = 'true';
                this.style.border = '2px solid white';
                this.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.8)';
            }
        }
        
        console.log(`Clicked ${type} at [${row}, ${col}]`);
    });
    
    // Posicionar celda de forma relativa
    cell.style.position = 'relative';
    cell.appendChild(element);
    
    // Guardar en datos del mapa
    const elementArrayName = type === 'arbol' ? 'arboles' : (type === 'casa' ? 'casas' : type + 's');
    mapData.elements[elementArrayName].push({
        row: row,
        col: col,
        id: Date.now()
    });
    
    // Actualizar estadísticas
    updateMapStats();
    
    // Mostrar notificación de éxito
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} agregado al mapa`, 'success');
    
    console.log(`Agregado ${type} en [${row}, ${col}]`);
    return true;
}

// Manejar acciones de la paleta
function handlePaletteAction(action) {
    switch (action) {
        case 'clear':
            if (confirm('¿Estás seguro de que quieres limpiar el mapa?')) {
                clearMap();
            }
            break;
        case 'save':
            saveMapLayout();
            break;
        case 'refresh':
            refreshPotrerosList();
            break;
        case 'zoom':
            toggleMapZoom();
            break;
        case 'info':
            showMapInfo();
            break;
    }
}

// Limpiar mapa
function clearMap() {
    // Limpiar elementos visuales
    document.querySelectorAll('.map-element').forEach(el => el.remove());
    
    // Limpiar datos
    mapData.elements = {
        bebederos: [],
        cercas: [],
        rios: [],
        caminos: [],
        arboles: [],
        casas: []
    };
    
    // Actualizar estadísticas
    updateMapStats();
    
    console.log('Mapa limpiado');
}

// Guardar layout del mapa
function saveMapLayout() {
    try {
        const layout = {
            elements: mapData.elements,
            potreros: mapData.potreros,
            timestamp: new Date().toISOString()
        };
        
        // Guardar en localStorage por ahora
        localStorage.setItem('potrerosMapLayout', JSON.stringify(layout));
        
        // Mostrar confirmación
        showNotification('Mapa guardado correctamente', 'success');
        
        console.log('Layout guardado:', layout);
    } catch (error) {
        console.error('Error al guardar el mapa:', error);
        showNotification('Error al guardar el mapa', 'danger');
    }
}

// Cargar layout del mapa
function loadMapLayout() {
    try {
        const savedLayout = localStorage.getItem('potrerosMapLayout');
        if (savedLayout) {
            const layout = JSON.parse(savedLayout);
            
            // Limpiar elementos existentes antes de cargar
            clearMapElements();
            
            // Restaurar elementos
            if (layout.elements) {
                Object.keys(layout.elements).forEach(elementType => {
                    if (layout.elements[elementType]) {
                        layout.elements[elementType].forEach(element => {
                            const type = elementType.slice(0, -1); // Remover 's' del final
                            addMapElement(type, element.row, element.col);
                        });
                    }
                });
            }
            
            // Restaurar posiciones de potreros
            if (layout.potreros) {
                layout.potreros.forEach(potrero => {
                    const existingPotrero = document.querySelector(`[data-potrero-id="${potrero.id}"]`);
                    if (existingPotrero) {
                        // Mover potrero a la posición guardada
                        const cellIndex = potrero.row * 20 + potrero.col;
                        const cell = document.querySelector(`[data-index="${cellIndex}"]`);
                        if (cell && !isCellOccupied(cell, existingPotrero)) {
                            cell.appendChild(existingPotrero);
                            existingPotrero.dataset.row = potrero.row;
                            existingPotrero.dataset.col = potrero.col;
                            updatePotreroPosition(potrero.id, potrero.row, potrero.col);
                        }
                    }
                });
            }
            
            showNotification('Mapa cargado correctamente', 'info');
            console.log('Layout cargado:', layout);
        }
    } catch (error) {
        console.error('Error al cargar el mapa:', error);
        showNotification('Error al cargar el mapa guardado', 'warning');
    }
}

// Limpiar solo elementos del mapa, no potreros
function clearMapElements() {
    document.querySelectorAll('.map-element').forEach(el => el.remove());
    
    // Limpiar datos
    mapData.elements = {
        bebederos: [],
        cercas: [],
        rios: [],
        caminos: [],
        arboles: [],
        casas: []
    };
}

// Cargar potreros existentes
function loadExistingPotreros() {
    console.log('Cargando potreros existentes...');
    
    // Obtener potreros del template
    const potrerosList = document.getElementById('potrerosList');
    if (!potrerosList) {
        console.warn('Lista de potreros no encontrada');
        return;
    }
    
    const potreroItems = potrerosList.querySelectorAll('.potrero-list-item');
    console.log(`Encontrados ${potreroItems.length} potreros`);
    
    if (potreroItems.length === 0) {
        console.log('No hay potreros para cargar');
        return;
    }
    
    potreroItems.forEach((item, index) => {
        try {
            const potreroId = item.dataset.potreroId;
            const nameElement = item.querySelector('strong');
            const sizeElement = item.querySelector('small');
            
            if (!nameElement || !sizeElement) {
                console.warn(`Elementos faltantes en potrero ${index}`);
                return;
            }
            
            const potreroName = nameElement.textContent.trim();
            const potreroSize = sizeElement.textContent.trim();
            
            // Posicionar potreros de forma organizada
            const { row, col } = getOptimalPosition(index, potreroItems.length);
            
            addPotreroToMap(potreroId, potreroName, potreroSize, row, col);
            
            // Hacer lista items clickeable
            item.addEventListener('click', function() {
                highlightPotreroOnMap(potreroId);
            });
            
        } catch (error) {
            console.error(`Error procesando potrero ${index}:`, error);
        }
    });
    
    console.log('Potreros cargados exitosamente');
}

// Calcular posición óptima para potreros
function getOptimalPosition(index, total) {
    // Organizar potreros en una cuadrícula ordenada
    const padding = 2; // Margen desde los bordes
    const spacing = 3; // Espaciado entre potreros
    const maxCols = Math.floor((20 - padding * 2) / spacing);
    
    const row = padding + Math.floor(index / maxCols) * spacing;
    const col = padding + (index % maxCols) * spacing;
    
    // Asegurar que no se salgan del mapa
    return {
        row: Math.min(row, 17),
        col: Math.min(col, 17)
    };
}

// Agregar potrero al mapa
function addPotreroToMap(id, name, size, row, col) {
    console.log(`Agregando potrero: ${name} en [${row}, ${col}]`);
    
    const cellIndex = row * 20 + col;
    const cell = document.querySelector(`[data-index="${cellIndex}"]`);
    
    if (!cell) {
        console.error(`Celda no encontrada para potrero ${name} en índice ${cellIndex}`);
        return false;
    }
    
    // Verificar si ya existe un potrero con este ID
    const existingPotrero = document.querySelector(`[data-potrero-id="${id}"]`);
    if (existingPotrero) {
        console.log(`Potrero ${name} ya existe en el mapa`);
        return false;
    }
    
    // Verificar si la celda está ocupada
    if (isCellOccupied(cell)) {
        console.warn(`Celda ocupada para potrero ${name}, buscando posición alternativa`);
        // Buscar posición alternativa cercana
        const newPosition = findNearbyEmptyCell(row, col);
        if (newPosition) {
            row = newPosition.row;
            col = newPosition.col;
            const newCellIndex = row * 20 + col;
            const newCell = document.querySelector(`[data-index="${newCellIndex}"]`);
            if (newCell) {
                cell = newCell;
            } else {
                console.error(`No se pudo encontrar celda alternativa para ${name}`);
                return false;
            }
        } else {
            console.error(`No hay posiciones disponibles cerca de [${row}, ${col}] para ${name}`);
            return false;
        }
    }
    
    // Crear elemento potrero
    const potrero = document.createElement('div');
    potrero.className = 'map-potrero';
    potrero.style.position = 'absolute';
    potrero.style.width = '100%';
    potrero.style.height = '100%';
    potrero.style.background = 'var(--grass-green)';
    potrero.style.border = '2px solid var(--potreros-primary)';
    potrero.style.borderRadius = 'var(--border-radius)';
    potrero.style.display = 'flex';
    potrero.style.alignItems = 'center';
    potrero.style.justifyContent = 'center';
    potrero.style.color = 'white';
    potrero.style.fontSize = '10px';
    potrero.style.fontWeight = 'bold';
    potrero.style.cursor = 'move';
    potrero.style.zIndex = '10';
    potrero.style.top = '0';
    potrero.style.left = '0';
    potrero.textContent = name.substring(0, 3).toUpperCase();
    potrero.title = `${name} - ${size}`;
    
    potrero.dataset.potreroId = id;
    potrero.dataset.row = row;
    potrero.dataset.col = col;
    
    // Eventos de potrero
    potrero.addEventListener('click', function(e) {
        e.stopPropagation();
        selectPotrero(id, name, size);
    });
    
    potrero.addEventListener('mousedown', startDrag);
    
    // Posicionar en celda
    cell.style.position = 'relative';
    cell.appendChild(potrero);
    
    // Guardar en datos
    mapData.potreros.push({
        id: id,
        name: name,
        size: size,
        row: row,
        col: col
    });
    
    // Actualizar estadísticas
    updateMapStats();
    
    console.log(`Potrero ${name} agregado exitosamente al mapa en [${row}, ${col}]`);
    return true;
}

// Seleccionar potrero
function selectPotrero(id, name, size) {
    selectedPotrero = id;
    
    // Mostrar panel de información
    const infoPanel = document.getElementById('potreroInfo');
    const detailsDiv = document.getElementById('potreroDetails');
    
    if (infoPanel && detailsDiv) {
        detailsDiv.innerHTML = `
            <div class="mb-2">
                <strong>${name}</strong><br>
                <small class="text-muted">${size}</small>
            </div>
            <div class="small">
                <div>Estado: <span class="badge bg-success">Activo</span></div>
                <div>Tipo: Pastoreo</div>
            </div>
        `;
        
        infoPanel.classList.add('visible');
        infoPanel.style.display = 'block';
    }
    
    // Resaltar potrero
    document.querySelectorAll('.map-potrero').forEach(p => {
        p.style.boxShadow = '';
    });
    
    const selectedElement = document.querySelector(`[data-potrero-id="${id}"]`);
    if (selectedElement) {
        selectedElement.style.boxShadow = '0 0 0 3px rgba(40, 167, 69, 0.5)';
    }
    
    console.log('Potrero seleccionado:', name);
}

// Inicializar eventos drag & drop
function startDrag(e) {
    isDragging = true;
    currentDraggedElement = e.target;
    
    const rect = e.target.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    // Destacar elemento siendo arrastrado
    currentDraggedElement.style.boxShadow = '0 0 10px rgba(40, 167, 69, 0.8)';
    currentDraggedElement.style.opacity = '0.8';
    currentDraggedElement.style.zIndex = '100';
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);
    
    e.preventDefault();
}

function handleDrag(e) {
    if (!isDragging || !currentDraggedElement) return;
    
    const mapGrid = document.getElementById('mapGrid');
    const rect = mapGrid.getBoundingClientRect();
    
    // Calcular nueva posición en grid
    const cellWidth = rect.width / 20;
    const cellHeight = rect.height / 20;
    
    const newCol = Math.max(0, Math.min(19, Math.floor((e.clientX - rect.left) / cellWidth)));
    const newRow = Math.max(0, Math.min(19, Math.floor((e.clientY - rect.top) / cellHeight)));
    
    // Verificar si es una nueva posición diferente
    const currentRow = parseInt(currentDraggedElement.dataset.row);
    const currentCol = parseInt(currentDraggedElement.dataset.col);
    
    if (newRow !== currentRow || newCol !== currentCol) {
        // Verificar si la nueva posición está disponible
        const newCellIndex = newRow * 20 + newCol;
        const newCell = document.querySelector(`[data-index="${newCellIndex}"]`);
        
        if (newCell && !isCellOccupied(newCell, currentDraggedElement)) {
            // Remover de celda actual
            const currentCellIndex = currentRow * 20 + currentCol;
            const currentCell = document.querySelector(`[data-index="${currentCellIndex}"]`);
            
            // Mover elemento a la nueva celda
            newCell.appendChild(currentDraggedElement);
            currentDraggedElement.dataset.row = newRow;
            currentDraggedElement.dataset.col = newCol;
            
            // Actualizar datos del mapa
            updatePotreroPosition(currentDraggedElement.dataset.potreroId, newRow, newCol);
            
            // Mostrar feedback visual
            newCell.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
            setTimeout(() => {
                newCell.style.backgroundColor = '';
            }, 300);
        }
    }
}

// Verificar si una celda está ocupada por otro elemento
function isCellOccupied(cell, excludeElement = null) {
    const existingElements = cell.querySelectorAll('.map-element, .map-potrero');
    for (let element of existingElements) {
        if (element !== excludeElement) {
            return true;
        }
    }
    return false;
}

// Buscar celda vacía cerca de una posición dada
function findNearbyEmptyCell(targetRow, targetCol, maxRadius = 3) {
    for (let radius = 1; radius <= maxRadius; radius++) {
        // Buscar en un patrón circular alrededor de la posición objetivo
        for (let dr = -radius; dr <= radius; dr++) {
            for (let dc = -radius; dc <= radius; dc++) {
                // Solo verificar el borde del círculo actual
                if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
                
                const newRow = targetRow + dr;
                const newCol = targetCol + dc;
                
                // Verificar que esté dentro de los límites del mapa
                if (newRow >= 0 && newRow < 20 && newCol >= 0 && newCol < 20) {
                    const cellIndex = newRow * 20 + newCol;
                    const cell = document.querySelector(`[data-index="${cellIndex}"]`);
                    
                    if (cell && !isCellOccupied(cell)) {
                        return { row: newRow, col: newCol };
                    }
                }
            }
        }
    }
    return null; // No se encontró celda vacía
}

// Actualizar posición del potrero en los datos
function updatePotreroPosition(potreroId, newRow, newCol) {
    const potrero = mapData.potreros.find(p => p.id == potreroId);
    if (potrero) {
        potrero.row = newRow;
        potrero.col = newCol;
    }
}

function endDrag() {
    isDragging = false;
    
    // Restaurar apariencia del elemento
    if (currentDraggedElement) {
        currentDraggedElement.style.opacity = '1';
        currentDraggedElement.style.zIndex = '10';
        // Mantener box-shadow para elemento seleccionado
        if (selectedPotrero != currentDraggedElement.dataset.potreroId) {
            currentDraggedElement.style.boxShadow = '';
        }
    }
    
    currentDraggedElement = null;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', endDrag);
}

// Actualizar estadísticas del mapa
function updateMapStats() {
    try {
        const statBebederos = document.getElementById('statBebederos');
        const statCercas = document.getElementById('statCercas');
        const statRios = document.getElementById('statRios');
        const statCaminos = document.getElementById('statCaminos');
        const statArboles = document.getElementById('statArboles');
        const statCasas = document.getElementById('statCasas');
        const statPotreros = document.getElementById('statPotreros');
        
        if (statBebederos) statBebederos.textContent = mapData.elements.bebederos.length;
        if (statCercas) statCercas.textContent = mapData.elements.cercas.length;
        if (statRios) statRios.textContent = mapData.elements.rios.length;
        if (statCaminos) statCaminos.textContent = mapData.elements.caminos.length;
        if (statArboles) statArboles.textContent = mapData.elements.arboles.length;
        if (statCasas) statCasas.textContent = mapData.elements.casas.length;
        if (statPotreros) statPotreros.textContent = mapData.potreros.length;
        
        console.log('Estadísticas actualizadas:', {
            bebederos: mapData.elements.bebederos.length,
            cercas: mapData.elements.cercas.length,
            rios: mapData.elements.rios.length,
            caminos: mapData.elements.caminos.length,
            arboles: mapData.elements.arboles.length,
            casas: mapData.elements.casas.length,
            potreros: mapData.potreros.length
        });
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
    }
}

// Inicializar atajos de teclado
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        switch (e.key.toLowerCase()) {
            case 's':
                if (!e.target.matches('input, textarea')) {
                    document.querySelector('[data-tool="select"]').click();
                    e.preventDefault();
                }
                break;
            case 'b':
                if (!e.target.matches('input, textarea')) {
                    document.querySelector('[data-tool="bebedero"]').click();
                    e.preventDefault();
                }
                break;
            case 'c':
                if (!e.target.matches('input, textarea')) {
                    document.querySelector('[data-tool="cerca"]').click();
                    e.preventDefault();
                }
                break;
            case 'r':
                if (!e.target.matches('input, textarea')) {
                    document.querySelector('[data-tool="rio"]').click();
                    e.preventDefault();
                }
                break;
            case 'delete':
                if (selectedPotrero) {
                    deleteSelectedElement();
                }
                break;
        }
    });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove después de 3 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// =============================================================================
// FUNCIONES ADICIONALES DEL MAPA
// =============================================================================

// Funciones del panel de información
function editPotrero() {
    if (selectedPotrero) {
        window.location.href = `/potreros/${selectedPotrero}/editar`;
    }
}

function deletePotrero() {
    if (selectedPotrero && confirm('¿Estás seguro de que quieres eliminar este potrero?')) {
        // Crear formulario para eliminación
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/potreros/${selectedPotrero}/delete`;
        form.style.display = 'none';
        document.body.appendChild(form);
        form.submit();
    }
}

// Función para eliminar elemento seleccionado (potreros o elementos del mapa)
function deleteSelectedElement() {
    if (selectedPotrero) {
        deletePotrero();
    } else {
        // Buscar elementos del mapa seleccionados
        const selectedElements = document.querySelectorAll('.map-element[data-selected="true"]');
        if (selectedElements.length > 0) {
            if (confirm(`¿Eliminar ${selectedElements.length} elemento(s) del mapa?`)) {
                selectedElements.forEach(element => {
                    const type = element.dataset.type;
                    const row = parseInt(element.dataset.row);
                    const col = parseInt(element.dataset.col);
                    
                    // Remover del mapa visual
                    element.remove();
                    
                    // Remover de los datos
                    const elementArrayName = type === 'arbol' ? 'arboles' : (type === 'casa' ? 'casas' : type + 's');
                    const elementArray = mapData.elements[elementArrayName];
                    const index = elementArray.findIndex(el => el.row === row && el.col === col);
                    if (index > -1) {
                        elementArray.splice(index, 1);
                    }
                });
                
                updateMapStats();
                showNotification('Elementos eliminados del mapa', 'success');
            }
        } else {
            showNotification('Selecciona un elemento para eliminar', 'warning');
        }
    }
}

// Resaltar potrero en mapa desde lista
function highlightPotreroOnMap(potreroId) {
    const potreroElement = document.querySelector(`[data-potrero-id="${potreroId}"]`);
    if (potreroElement) {
        // Simular click para seleccionar
        potreroElement.click();
        
        // Scroll hacia el elemento si es necesario
        potreroElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }
}

// =============================================================================
// FUNCIONES DEL FORMULARIO MULTI-PASO CON HEURÍSTICAS DE NIELSEN
// =============================================================================

let currentStep = 1;
const totalSteps = 3;

// Inicializar funcionalidades del formulario
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('potreroForm')) {
        initializeSingleFormValidation();
        initializeTooltips();
    }
});

// Inicializar validación del formulario único
function initializeSingleFormValidation() {
    const form = document.getElementById('potreroForm');
    
    // Inicializar listeners para cambios en el formulario
    form.addEventListener('input', function() {
        validateForm();
    });
    
    form.addEventListener('change', function() {
        validateForm();
    });
    
    // Validación en tiempo real para campos específicos
    initializeRealTimeValidation();
}

// Validar formulario completo
function validateForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const hectareas = parseFloat(document.getElementById('hectareas').value);
    
    let isValid = true;
    
    // Validar nombre
    const nombreInput = document.getElementById('nombre');
    if (!nombre) {
        nombreInput.classList.add('is-invalid');
        nombreInput.classList.remove('is-valid');
        isValid = false;
    } else {
        nombreInput.classList.add('is-valid');
        nombreInput.classList.remove('is-invalid');
    }
    
    // Validar hectáreas
    const hectareasInput = document.getElementById('hectareas');
    if (!hectareas || hectareas <= 0) {
        hectareasInput.classList.add('is-invalid');
        hectareasInput.classList.remove('is-valid');
        isValid = false;
    } else {
        hectareasInput.classList.add('is-valid');
        hectareasInput.classList.remove('is-invalid');
        
        // Actualizar feedback de área
        updateAreaFeedback(hectareas);
    }
    
    // Habilitar/deshabilitar botón de envío
    const submitBtn = document.querySelector('button[type="submit"]');
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

// Mostrar errores de validación
function showValidationErrors() {
    const errorMessages = document.getElementById('errorMessages');
    let errors = [];
    
    const nombre = document.getElementById('nombre').value.trim();
    const hectareas = parseFloat(document.getElementById('hectareas').value);
    
    if (!nombre) {
        errors.push('El nombre del potrero es obligatorio');
    }
    if (!hectareas || hectareas <= 0) {
        errors.push('El área debe ser mayor a 0 hectáreas');
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

// Calculadora de área
function calcularArea() {
    const largo = parseFloat(document.getElementById('largo').value);
    const ancho = parseFloat(document.getElementById('ancho').value);
    
    if (largo && ancho && largo > 0 && ancho > 0) {
        const metrosCuadrados = largo * ancho;
        const hectareas = metrosCuadrados / 10000;
        
        // Actualizar campo de hectáreas
        document.getElementById('hectareas').value = hectareas.toFixed(2);
        
        // Trigger evento para actualizar validación
        document.getElementById('hectareas').dispatchEvent(new Event('input'));
        
        // Mostrar resultado en la calculadora
        const resultDiv = document.createElement('div');
        resultDiv.className = 'alert alert-success mt-2';
        resultDiv.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            Resultado: ${metrosCuadrados.toLocaleString()} m² = ${hectareas.toFixed(2)} hectáreas
        `;
        
        // Remover resultado anterior si existe
        const existingResult = document.querySelector('.area-calculator .alert-success');
        if (existingResult) {
            existingResult.remove();
        }
        
        document.getElementById('areaCalculator').appendChild(resultDiv);
    }
}

// Mostrar/ocultar calculadora
document.addEventListener('DOMContentLoaded', function() {
    const calculatorBtn = document.getElementById('calculatorBtn');
    if (calculatorBtn) {
        calculatorBtn.addEventListener('click', function() {
            const calculator = document.getElementById('areaCalculator');
            if (calculator.style.display === 'none') {
                calculator.style.display = 'block';
                this.innerHTML = '<i class="fas fa-times"></i>';
            } else {
                calculator.style.display = 'none';
                this.innerHTML = '<i class="fas fa-calculator"></i>';
            }
        });
    }
});

// Actualizar feedback de área
function updateAreaFeedback(hectareas) {
    const feedbackDiv = document.getElementById('areaFeedback');
    const metrosCuadrados = hectareas * 10000;
    const capacidadEstimada = Math.round(hectareas * 2); // 2 animales por hectárea
    
    document.getElementById('metrosCuadrados').textContent = metrosCuadrados.toLocaleString();
    document.getElementById('capacidadEstimada').textContent = capacidadEstimada;
    
    feedbackDiv.style.display = 'block';
}

// Función para inicializar validación en tiempo real
function initializeRealTimeValidation() {
    // Validación del nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', function() {
            if (this.value.trim().length >= 3) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
            } else {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
            }
            validateForm();
        });
    }
    
    // Validación del área
    const hectareasInput = document.getElementById('hectareas');
    if (hectareasInput) {
        hectareasInput.addEventListener('input', function() {
            const value = parseFloat(this.value);
            if (value > 0) {
                this.classList.add('is-valid');
                this.classList.remove('is-invalid');
                updateAreaFeedback(value);
            } else {
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                const feedbackDiv = document.getElementById('areaFeedback');
                if (feedbackDiv) {
                    feedbackDiv.style.display = 'none';
                }
            }
            validateForm();
        });
    }
}

// =============================================================================
// FUNCIONES PARA MANEJO DE NUEVOS POTREROS
// =============================================================================

// Destacar nuevo potrero recién creado
function highlightNewPotrero(potreroId) {
    console.log('Destacando nuevo potrero:', potreroId);
    
    // Buscar el potrero en la lista
    const potreroItem = document.querySelector(`[data-potrero-id="${potreroId}"]`);
    if (potreroItem) {
        // Destacar en la lista
        potreroItem.style.background = 'rgba(40, 167, 69, 0.1)';
        potreroItem.style.border = '2px solid var(--success-color)';
        
        // Hacer scroll hacia el elemento
        potreroItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Destacar en el mapa
        const mapPotrero = document.querySelector(`[data-potrero-id="${potreroId}"].map-potrero`);
        if (mapPotrero) {
            mapPotrero.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.8)';
            mapPotrero.style.animation = 'pulse 2s infinite';
            
            // Seleccionar automáticamente
            const nombre = mapPotrero.title.split(' - ')[0];
            const size = mapPotrero.title.split(' - ')[1] || '';
            selectPotrero(potreroId, nombre, size);
        }
        
        // Mostrar notificación
        showNotification('¡Nuevo potrero agregado al mapa!', 'success');
        
        // Remover el destacado después de unos segundos
        setTimeout(() => {
            if (potreroItem) {
                potreroItem.style.background = '';
                potreroItem.style.border = '';
            }
            if (mapPotrero) {
                mapPotrero.style.animation = '';
                // Mantener el box-shadow si está seleccionado
                if (selectedPotrero != potreroId) {
                    mapPotrero.style.boxShadow = '';
                }
            }
            
            // Limpiar parámetro de URL
            if (window.history && window.history.replaceState) {
                const url = new URL(window.location);
                url.searchParams.delete('nuevo_potrero');
                window.history.replaceState({}, '', url);
            }
        }, 5000);
    } else {
        // Si no encontramos el potrero, puede que necesitemos refrescar la lista
        console.log('Potrero no encontrado en la lista, refrescando...');
        refreshPotrerosList();
    }
}

// Refrescar lista de potreros desde el servidor
function refreshPotrerosList() {
    console.log('Refrescando lista de potreros...');
    
    // Hacer petición para obtener potreros actualizados
    fetch('/potreros/api/data')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                updatePotrerosList(data.data);
                updateMapPotreros(data.data);
                showNotification('Lista de potreros actualizada', 'info');
            }
        })
        .catch(error => {
            console.error('Error al refrescar potreros:', error);
            showNotification('Error al actualizar la lista', 'warning');
        });
}

// Actualizar lista de potreros en el sidebar
function updatePotrerosList(potreros) {
    const potrerosList = document.getElementById('potrerosList');
    if (!potrerosList) return;
    
    potrerosList.innerHTML = '';
    
    potreros.forEach(potrero => {
        const potreroDiv = document.createElement('div');
        potreroDiv.className = 'potrero-list-item';
        potreroDiv.dataset.potreroId = potrero.id;
        
        potreroDiv.innerHTML = `
            <div class="potrero-item-content">
                <div class="potrero-item-info">
                    <strong>${potrero.nombre}</strong>
                    <small>${potrero.hectareas} ha</small>
                </div>
                <div class="potrero-cube">
                    <div class="cube-face cube-front"></div>
                    <div class="cube-shadow"></div>
                </div>
            </div>
        `;
        
        // Agregar event listener
        potreroDiv.addEventListener('click', function() {
            highlightPotreroOnMap(potrero.id);
        });
        
        potrerosList.appendChild(potreroDiv);
    });
    
    // Actualizar estadísticas
    const statPotreros = document.getElementById('statPotreros');
    if (statPotreros) {
        statPotreros.textContent = potreros.length;
    }
}

// Actualizar potreros en el mapa
function updateMapPotreros(potreros) {
    // Limpiar potreros existentes del mapa
    document.querySelectorAll('.map-potrero').forEach(potrero => {
        potrero.remove();
    });
    
    // Limpiar datos del mapa
    mapData.potreros = [];
    
    // Agregar potreros actualizados
    potreros.forEach((potrero, index) => {
        const { row, col } = getOptimalPosition(index, potreros.length);
        addPotreroToMap(potrero.id, potrero.nombre, `${potrero.hectareas} ha`, row, col);
    });
}

// Agregar botón de actualización al mapa
function addRefreshButton() {
    const toolbar = document.querySelector('.potreros-tool-palette');
    if (toolbar) {
        const refreshButton = document.createElement('div');
        refreshButton.className = 'potreros-tool palette-item';
        refreshButton.dataset.action = 'refresh';
        refreshButton.innerHTML = `
            <div class="potreros-tool-icon text-primary">
                <i class="fas fa-sync"></i>
            </div>
            <div class="potreros-tool-name">Actualizar</div>
        `;
        
        refreshButton.addEventListener('click', function() {
            refreshPotrerosList();
        });
        
        toolbar.appendChild(refreshButton);
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

// =============================================================================
// FUNCIONES ADICIONALES DEL MAPA
// =============================================================================

// Variable para controlar el zoom
let isMapZoomed = false;

// Alternar zoom del mapa
function toggleMapZoom() {
    const mapContainer = document.querySelector('.potreros-map-container');
    const mapGrid = document.getElementById('mapGrid');
    
    if (!mapContainer || !mapGrid) {
        showNotification('Mapa no encontrado', 'error');
        return;
    }
    
    isMapZoomed = !isMapZoomed;
    
    if (isMapZoomed) {
        // Aplicar zoom
        mapContainer.style.height = '600px';
        mapContainer.style.maxHeight = '600px';
        mapGrid.style.height = '600px';
        mapGrid.style.maxHeight = '600px';
        
        // Cambiar icono
        const zoomIcon = document.querySelector('[data-action="zoom"] i');
        if (zoomIcon) {
            zoomIcon.className = 'fas fa-search-minus';
        }
        
        showNotification('Mapa ampliado', 'info');
    } else {
        // Restaurar tamaño normal
        mapContainer.style.height = '400px';
        mapContainer.style.maxHeight = '400px';
        mapGrid.style.height = '400px';
        mapGrid.style.maxHeight = '400px';
        
        // Cambiar icono
        const zoomIcon = document.querySelector('[data-action="zoom"] i');
        if (zoomIcon) {
            zoomIcon.className = 'fas fa-search-plus';
        }
        
        showNotification('Mapa restaurado', 'info');
    }
}

// Mostrar información del mapa
function showMapInfo() {
    const totalElements = Object.values(mapData.elements).reduce((sum, arr) => sum + arr.length, 0);
    const totalPotreros = mapData.potreros.length;
    
    const infoMessage = `
        <div class="alert alert-info" style="margin: 0;">
            <h6><i class="fas fa-info-circle me-2"></i>Información del Mapa</h6>
            <hr>
            <div class="row text-center">
                <div class="col-6">
                    <div class="h4 text-primary">${totalPotreros}</div>
                    <small>Potreros</small>
                </div>
                <div class="col-6">
                    <div class="h4 text-success">${totalElements}</div>
                    <small>Elementos</small>
                </div>
            </div>
            <hr>
            <div class="small">
                <div><strong>Bebederos:</strong> ${mapData.elements.bebederos.length}</div>
                <div><strong>Cercas:</strong> ${mapData.elements.cercas.length}</div>
                <div><strong>Ríos:</strong> ${mapData.elements.rios.length}</div>
                <div><strong>Caminos:</strong> ${mapData.elements.caminos.length}</div>
                <div><strong>Árboles:</strong> ${mapData.elements.arboles.length}</div>
                <div><strong>Casas:</strong> ${mapData.elements.casas.length}</div>
            </div>
            <hr>
            <div class="small text-muted">
                <div><strong>Herramienta activa:</strong> ${selectedTool}</div>
                <div><strong>Grid:</strong> 20 × 20 celdas (400 total)</div>
                <div><strong>Tamaño:</strong> ${isMapZoomed ? 'Ampliado' : 'Normal'}</div>
            </div>
        </div>
    `;
    
    // Crear modal de información
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-map me-2"></i>
                        Información del Mapa
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${infoMessage}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="potreroMapDebug.testMapFunctionality()">
                        <i class="fas fa-cogs me-1"></i>Probar Funciones
                    </button>
                    <button type="button" class="btn btn-success" onclick="potreroMapDebug.createTestScenario()">
                        <i class="fas fa-play me-1"></i>Escenario de Prueba
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Mostrar modal
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // Limpiar modal al cerrarse
        modal.addEventListener('hidden.bs.modal', function() {
            modal.remove();
        });
    } else {
        // Fallback si Bootstrap no está disponible
        showNotification(
            `Información del Mapa: ${totalPotreros} potreros, ${totalElements} elementos. Herramienta activa: ${selectedTool}`,
            'info'
        );
    }
}

// =============================================================================
// FUNCIONES DE DIAGNÓSTICO Y PRUEBA
// =============================================================================

// Función para probar la funcionalidad del mapa
function testMapFunctionality() {
    console.log('=== INICIANDO PRUEBA DEL MAPA ===');
    
    // Verificar elementos del DOM
    const mapGrid = document.getElementById('mapGrid');
    const potrerosList = document.getElementById('potrerosList');
    const toolbar = document.querySelector('.potreros-tool-palette');
    
    console.log('Elementos del DOM:', {
        mapGrid: !!mapGrid,
        potrerosList: !!potrerosList,
        toolbar: !!toolbar
    });
    
    if (mapGrid) {
        const cells = mapGrid.querySelectorAll('.map-grid-cell');
        console.log(`Grid creado con ${cells.length} celdas`);
    }
    
    if (potrerosList) {
        const potreros = potrerosList.querySelectorAll('.potrero-list-item');
        console.log(`${potreros.length} potreros encontrados en la lista`);
    }
    
    if (toolbar) {
        const tools = toolbar.querySelectorAll('.potreros-tool');
        console.log(`${tools.length} herramientas encontradas`);
    }
    
    // Verificar datos del mapa
    console.log('Estado del mapa:', {
        selectedTool: selectedTool,
        selectedPotrero: selectedPotrero,
        mapData: mapData
    });
    
    console.log('=== PRUEBA COMPLETADA ===');
}

// Función para simular colocación de elementos
function simulateElementPlacement() {
    console.log('Simulando colocación de elementos...');
    
    // Simular colocación de bebedero
    console.log('Colocando bebedero en [5,5]');
    addMapElement('bebedero', 5, 5);
    
    // Simular colocación de cerca
    console.log('Colocando cerca en [10,10]');
    addMapElement('cerca', 10, 10);
    
    // Simular colocación de río
    console.log('Colocando río en [15,15]');
    addMapElement('rio', 15, 15);
    
    console.log('Simulación completada');
}

// Función para exponer al alcance global para debugging
window.potreroMapDebug = {
    testMapFunctionality,
    simulateElementPlacement,
    mapData,
    selectedTool: () => selectedTool,
    selectedPotrero: () => selectedPotrero,
    // Funciones adicionales para testing
    clearMap: () => clearMap(),
    saveMap: () => saveMapLayout(),
    loadMap: () => loadMapLayout(),
    refreshPotreros: () => refreshPotrerosList(),
    addElement: (type, row, col) => addMapElement(type, row, col),
    createTestScenario: () => {
        console.log('Creando escenario de prueba...');
        // Limpiar mapa
        clearMap();
        // Agregar elementos de prueba
        addMapElement('bebedero', 2, 2);
        addMapElement('bebedero', 2, 17);
        addMapElement('cerca', 0, 10);
        addMapElement('cerca', 19, 10);
        addMapElement('rio', 10, 0);
        addMapElement('camino', 5, 5);
        addMapElement('camino', 5, 6);
        addMapElement('camino', 5, 7);
        addMapElement('arbol', 3, 8);
        addMapElement('arbol', 15, 3);
        addMapElement('casa', 1, 1);
        console.log('Escenario de prueba creado!');
    }
};

console.log('🗺️ Mapa interactivo de potreros cargado');
console.log('💡 Usa potreroMapDebug.testMapFunctionality() para probar funcionalidad');
console.log('🎮 Usa potreroMapDebug.createTestScenario() para crear un escenario de prueba');

