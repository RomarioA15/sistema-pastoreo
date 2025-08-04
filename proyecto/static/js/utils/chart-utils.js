/**
 * Sistema de Gestión de Pastoreo
 * Utilidades para gráficos con Chart.js
 */

/**
 * Crea un gráfico de líneas para mostrar evolución a lo largo del tiempo
 * @param {string} canvasId - ID del elemento canvas
 * @param {Array} labels - Etiquetas para el eje X (fechas)
 * @param {Array} datasets - Conjuntos de datos
 * @param {Object} options - Opciones adicionales para el gráfico
 * @returns {Chart} Instancia del gráfico creado
 */
function createLineChart(canvasId, labels, datasets, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Opciones por defecto
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Fecha'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valor'
                }
            }
        }
    };
    
    // Combinar opciones por defecto con las proporcionadas
    const chartOptions = { ...defaultOptions, ...options };
    
    // Crear gráfico
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Crea un gráfico de barras para comparaciones
 * @param {string} canvasId - ID del elemento canvas
 * @param {Array} labels - Etiquetas para el eje X
 * @param {Array} datasets - Conjuntos de datos
 * @param {Object} options - Opciones adicionales para el gráfico
 * @returns {Chart} Instancia del gráfico creado
 */
function createBarChart(canvasId, labels, datasets, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Opciones por defecto
    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Categoría'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valor'
                }
            }
        }
    };
    
    // Combinar opciones por defecto con las proporcionadas
    const chartOptions = { ...defaultOptions, ...options };
    
    // Crear gráfico
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: chartOptions
    });
}

/**
 * Crea colores aleatorios para usar en gráficos
 * @param {number} count - Cantidad de colores a generar
 * @returns {Array} Arreglo de colores en formato hexadecimal
 */
function generateRandomColors(count) {
    const colors = [];
    const predefinedColors = [
        '#4BC0C0', // Verde azulado
        '#FF6384', // Rosa
        '#36A2EB', // Azul
        '#FFCE56', // Amarillo
        '#9966FF', // Morado
        '#FF9F40', // Naranja
        '#8AC926', // Verde lima
        '#1982C4', // Azul medio
        '#6A4C93', // Morado oscuro
        '#F94144', // Rojo
        '#F3722C', // Naranja medio
        '#F8961E'  // Naranja claro
    ];
    
    // Usar colores predefinidos si la cantidad es menor o igual a su longitud
    if (count <= predefinedColors.length) {
        return predefinedColors.slice(0, count);
    }
    
    // Usar todos los predefinidos
    for (let i = 0; i < predefinedColors.length; i++) {
        colors.push(predefinedColors[i]);
    }
    
    // Generar colores adicionales aleatorios
    for (let i = predefinedColors.length; i < count; i++) {
        const r = Math.floor(Math.random() * 200 + 55); // Evitar colores muy oscuros
        const g = Math.floor(Math.random() * 200 + 55);
        const b = Math.floor(Math.random() * 200 + 55);
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
}

/**
 * Genera versiones transparentes de colores para fondos de gráficos
 * @param {Array} colors - Arreglo de colores a transformar
 * @param {number} opacity - Nivel de opacidad (0-1)
 * @returns {Array} Arreglo de colores con transparencia
 */
function generateTransparentColors(colors, opacity = 0.2) {
    return colors.map(color => {
        if (color.startsWith('rgb')) {
            return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        } else if (color.startsWith('#')) {
            // Convertir de hex a rgba
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    });
}

/**
 * Convierte datos para gráficos de aforos con formato para Chart.js
 * @param {Object} apiData - Datos recibidos de la API
 * @param {string} unit - Unidad de medida para mostrar en tooltips
 * @returns {Object} Datos formateados para Chart.js
 */
function formatAforoChartData(apiData, unit = 'kg MS/ha') {
    const datasets = [];
    const colors = generateRandomColors(apiData.datasets.length);
    const backgroundColors = generateTransparentColors(colors);
    
    for (let i = 0; i < apiData.datasets.length; i++) {
        datasets.push({
            label: apiData.datasets[i].label,
            data: apiData.datasets[i].data,
            borderColor: colors[i],
            backgroundColor: backgroundColors[i],
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    }
    
    return {
        labels: apiData.labels,
        datasets: datasets
    };
}

/**
 * Convierte datos para gráficos de pH con formato para Chart.js
 * @param {Object} apiData - Datos recibidos de la API
 * @returns {Object} Datos formateados para Chart.js
 */
function formatPhChartData(apiData) {
    const datasets = [];
    const colors = generateRandomColors(apiData.datasets.length);
    const backgroundColors = generateTransparentColors(colors);
    
    for (let i = 0; i < apiData.datasets.length; i++) {
        datasets.push({
            label: apiData.datasets[i].label,
            data: apiData.datasets[i].data,
            borderColor: colors[i],
            backgroundColor: backgroundColors[i],
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6
        });
    }
    
    return {
        labels: apiData.labels,
        datasets: datasets
    };
}

/**
 * Crea anotaciones para los niveles de pH
 * @returns {Object} Configuración de anotaciones para niveles de pH
 */
function getPhAnnotations() {
    return {
        acidic: {
            type: 'line',
            yMin: 5.5,
            yMax: 5.5,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                enabled: true,
                content: 'Ácido (<5.5)',
                position: 'start'
            }
        },
        neutral: {
            type: 'line',
            yMin: 7,
            yMax: 7,
            borderColor: 'rgba(75, 192, 192, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                enabled: true,
                content: 'Neutro (7.0)',
                position: 'start'
            }
        },
        alkaline: {
            type: 'line',
            yMin: 7.5,
            yMax: 7.5,
            borderColor: 'rgba(54, 162, 235, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
                enabled: true,
                content: 'Alcalino (>7.5)',
                position: 'start'
            }
        }
    };
} 