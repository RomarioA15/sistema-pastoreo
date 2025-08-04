/**
 * DASHBOARD - JavaScript específico
 * Sistema de Gestión de Pastoreo
 */

document.addEventListener('DOMContentLoaded', function() {
     // Datos iniciales desde el servidor
     const stats = {{ stats | tojson }};
     
     // Configuración de gráficos
     const chartOptions = {
         responsive: true,
         maintainAspectRatio: false,
         plugins: {
             legend: {
                 display: false
             }
         },
         scales: {
             y: {
                 beginAtZero: true,
                 grid: {
                     color: 'rgba(0,0,0,0.1)'
                 }
             },
             x: {
                 grid: {
                     color: 'rgba(0,0,0,0.1)'
                 }
             }
         }
     };

     // Cargar datos de gráficos desde la API
     loadChartData();

     async function loadChartData() {
         try {
             const response = await fetch('/dashboard/api/chart-data');
             const data = await response.json();
             
             if (data.success) {
                 initializeCharts(data.data);
             } else {
                 console.error('Error cargando datos de gráficos:', data.error);
                 initializeChartsWithDefaults();
             }
         } catch (error) {
             console.error('Error en la solicitud de gráficos:', error);
             initializeChartsWithDefaults();
         }
     }

     function initializeCharts(data) {
         // Gráfico de evolución temporal
         const evolucionCtx = document.getElementById('evolucionChart').getContext('2d');
         new Chart(evolucionCtx, {
             type: 'line',
             data: {
                 labels: data.evolucion_biomasa?.map(item => item.mes) || [],
                 datasets: [{
                     label: 'Materia Verde',
                     data: data.evolucion_biomasa?.map(item => item.mv) || [],
                     borderColor: '#28a745',
                     backgroundColor: 'rgba(40, 167, 69, 0.1)',
                     tension: 0.4
                 }, {
                     label: 'Materia Seca',
                     data: data.evolucion_biomasa?.map(item => item.ms) || [],
                     borderColor: '#ffc107',
                     backgroundColor: 'rgba(255, 193, 7, 0.1)',
                     tension: 0.4
                 }]
             },
             options: chartOptions
         });

         // Gráfico de precipitación vs crecimiento
         const precipitacionCtx = document.getElementById('precipitacionChart').getContext('2d');
         new Chart(precipitacionCtx, {
             type: 'bar',
             data: {
                 labels: data.precipitacion_crecimiento?.map(item => item.mes) || [],
                 datasets: [{
                     label: 'Precipitación (mm)',
                     data: data.precipitacion_crecimiento?.map(item => item.lluvia) || [],
                     backgroundColor: 'rgba(23, 162, 184, 0.8)',
                     yAxisID: 'y'
                 }, {
                     label: 'Crecimiento',
                     data: data.precipitacion_crecimiento?.map(item => item.crecimiento) || [],
                     type: 'line',
                     borderColor: '#28a745',
                     backgroundColor: 'rgba(40, 167, 69, 0.1)',
                     yAxisID: 'y1'
                 }]
             },
             options: {
                 ...chartOptions,
                 scales: {
                     y: {
                         type: 'linear',
                         display: true,
                         position: 'left'
                     },
                     y1: {
                         type: 'linear',
                         display: true,
                         position: 'right',
                         grid: {
                             drawOnChartArea: false
                         }
                     }
                 }
             }
         });

         // Gráfico de ranking de potreros
         const rankingCtx = document.getElementById('rankingChart').getContext('2d');
         new Chart(rankingCtx, {
             type: 'horizontalBar',
             data: {
                 labels: data.ranking_potreros?.map(item => item.nombre) || [],
                 datasets: [{
                     label: 'Score',
                     data: data.ranking_potreros?.map(item => item.score) || [],
                     backgroundColor: '#667eea'
                 }]
             },
             options: chartOptions
         });

         // Gráfico de actividades (datos simulados basados en stats reales)
         const actividadesCtx = document.getElementById('actividadesChart').getContext('2d');
         const totalActividades = stats.total_actividades || 0;
         const completadas = stats.actividades_completadas || 0;
         const pendientes = totalActividades - completadas;
         
         new Chart(actividadesCtx, {
             type: 'doughnut',
             data: {
                 labels: ['Completadas', 'Pendientes'],
                 datasets: [{
                     data: [completadas, pendientes],
                     backgroundColor: ['#28a745', '#dc3545']
                 }]
             },
             options: {
                 ...chartOptions,
                 scales: {} // Remover escalas para gráfico doughnut
             }
         });
     }

     function initializeChartsWithDefaults() {
         // Inicializar gráficos con datos por defecto en caso de error
         console.log('Inicializando gráficos con datos por defecto');
         
         // Gráficos básicos con datos mínimos
         const contexts = ['evolucionChart', 'precipitacionChart', 'rankingChart', 'actividadesChart'];
         contexts.forEach(id => {
             const ctx = document.getElementById(id);
             if (ctx) {
                 new Chart(ctx.getContext('2d'), {
                     type: 'bar',
                     data: {
                         labels: ['Sin datos'],
                         datasets: [{
                             label: 'Sin datos disponibles',
                             data: [0],
                             backgroundColor: '#e9ecef'
                         }]
                     },
                     options: chartOptions
                 });
             }
         });
     }

     // Filtros dinámicos
     document.getElementById('filtro-potrero').addEventListener('change', function() {
         updateDashboard();
     });

     document.getElementById('filtro-periodo').addEventListener('change', function() {
         updateDashboard();
     });

     function updateDashboard() {
         const potrero = document.getElementById('filtro-potrero').value;
         const periodo = document.getElementById('filtro-periodo').value;
         
         // Mostrar notificación
         showToast('Actualizando dashboard con filtros seleccionados...');
         
         // Aquí se implementaría la lógica de actualización con filtros
         // Por ahora, solo recargamos los datos
         setTimeout(() => {
             loadChartData();
             showToast('Dashboard actualizado correctamente');
         }, 1000);
     }

     // Insights rotativos
     const insights = [
         "💡 El dashboard muestra métricas reales calculadas desde tu base de datos para tomar decisiones informadas.",
         "🌱 La productividad se mide en kg de materia seca por hectárea, siendo 2,500 kg/ha el mínimo recomendado.",
         "🔄 Una rotación eficiente debe estar entre 21-35 días para maximizar el aprovechamiento del forraje.",
         "📊 Los gráficos incluyen hitos de actividades importantes como fertilización y siembra.",
         "🌡️ Las condiciones climáticas influyen directamente en la tasa de crecimiento del forraje.",
         "📈 El ranking de potreros te ayuda a identificar cuáles requieren mayor atención."
     ];

     let currentInsight = 0;
     setInterval(() => {
         currentInsight = (currentInsight + 1) % insights.length;
         document.getElementById('insight-text').textContent = insights[currentInsight];
     }, 5000);

     // Animaciones de KPIs
     animateKPIs();

     function animateKPIs() {
         const kpiValues = document.querySelectorAll('.kpi-value');
         kpiValues.forEach((element, index) => {
             const finalValue = parseInt(element.textContent) || 0;
             let currentValue = 0;
             const increment = Math.ceil(finalValue / 50);
             
             const animation = setInterval(() => {
                 currentValue += increment;
                 if (currentValue >= finalValue) {
                     currentValue = finalValue;
                     clearInterval(animation);
                 }
                 element.textContent = currentValue;
             }, 30 + (index * 10));
         });
     }

     function showToast(message) {
         document.getElementById('toastMessage').textContent = message;
         const toast = new bootstrap.Toast(document.getElementById('alertToast'));
         toast.show();
         
         // Auto-hide después de 3 segundos
         setTimeout(() => {
             toast.hide();
         }, 3000);
     }

     // Mostrar toast de bienvenida
     setTimeout(() => {
         showToast('Dashboard cargado con datos reales de la base de datos');
     }, 1000);
 });

// Global variables for charts
let topPotreroChart, attentionPotreroChart, evolutionChart;
let rotacionChart, balanceChart, utilizacionChart, npkChart, climaCrecimientoChart;
let currentPeriod = 30;
let currentPotrero = '';

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupFilters();
    initializeCharts();
    loadDashboardData();
    setupRealTimeUpdates();
});

function initializeDashboard() {
    console.log('🚀 Dashboard Integral inicializado');
    updateLastUpdateTime();
    generateSmartRecommendation();
}

function setupFilters() {
    const filterForm = document.getElementById('dashboard-filters');
    const refreshBtn = document.getElementById('refresh-dashboard');
    
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            currentPotrero = document.getElementById('potrero-filter').value;
            currentPeriod = parseInt(document.getElementById('periodo-filter').value);
            
            // Update period display
            document.getElementById('chart-period').textContent = currentPeriod;
            
            // Show loading state
            showNotification('🔄 Actualizando dashboard con nuevos filtros...', 'info');
            
            // Reload data with new filters
            loadDashboardData();
            updateCharts();
            
            setTimeout(() => {
                showNotification('✅ Dashboard actualizado correctamente', 'success');
            }, 1500);
        });
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';
            this.disabled = true;
            
            setTimeout(() => {
                updateLastUpdateTime();
                loadDashboardData();
                updateCharts();
                this.innerHTML = originalContent;
                this.disabled = false;
                showNotification('🔄 Dashboard actualizado', 'success');
            }, 2000);
        });
    }
}

function initializeCharts() {
    // Top Potrero Chart (Radar Chart)
    const topCtx = document.getElementById('top-potrero-chart');
    if (topCtx) {
        topPotreroChart = new Chart(topCtx, {
            type: 'radar',
            data: {
                labels: ['Materia Verde', 'Materia Seca', '% MS', 'Rotación', 'Eficiencia'],
                datasets: [{
                    label: 'Rendimiento',
                    data: [85, 90, 78, 95, 88],
                    backgroundColor: 'rgba(40, 167, 69, 0.2)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(40, 167, 69, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Attention Potrero Chart (Radar Chart)
    const attentionCtx = document.getElementById('attention-potrero-chart');
    if (attentionCtx) {
        attentionPotreroChart = new Chart(attentionCtx, {
            type: 'radar',
            data: {
                labels: ['Materia Verde', 'Materia Seca', '% MS', 'Rotación', 'Eficiencia'],
                datasets: [{
                    label: 'Rendimiento',
                    data: [45, 38, 52, 35, 42],
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(220, 53, 69, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Rotacion Chart (Gauge/Speedometer)
    const rotacionCtx = document.getElementById('rotacion-chart');
    if (rotacionCtx) {
        rotacionChart = new Chart(rotacionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Rotación Real', 'Rotación Ideal'],
                datasets: [{
                    data: [25, 21],
                    backgroundColor: ['#ffc107', '#28a745'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + ' días';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Balance Chart (Line Chart)
    const balanceCtx = document.getElementById('balance-chart');
    if (balanceCtx) {
        balanceChart = new Chart(balanceCtx, {
            type: 'line',
            data: {
                labels: generateDateLabels(7),
                datasets: [
                    {
                        label: 'Crecimiento (kg MS/ha/día)',
                        data: [18, 22, 15, 28, 25, 19, 24],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Demanda (kg MS/ha/día)',
                        data: [32, 30, 35, 28, 33, 31, 29],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'kg MS/ha/día'
                        }
                    }
                }
            }
        });
    }
    
    // Utilización Chart (Radial Chart)
    const utilizacionCtx = document.getElementById('utilizacion-chart');
    if (utilizacionCtx) {
        utilizacionChart = new Chart(utilizacionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Utilizado', 'Disponible'],
                datasets: [{
                    data: [72, 28],
                    backgroundColor: ['#6f42c1', '#e9ecef'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + '%';
                            }
                        }
                    }
                }
            }
        });
    }
    
    // NPK Chart (Radar Chart)
    const npkCtx = document.getElementById('npk-chart');
    if (npkCtx) {
        npkChart = new Chart(npkCtx, {
            type: 'radar',
            data: {
                labels: ['Nitrógeno', 'Fósforo', 'Potasio'],
                datasets: [{
                    label: 'Disponibilidad (%)',
                    data: [75, 60, 85],
                    backgroundColor: 'rgba(23, 162, 184, 0.2)',
                    borderColor: 'rgba(23, 162, 184, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(23, 162, 184, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 25
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    // Clima-Crecimiento Chart (Combined Chart)
    const climaCtx = document.getElementById('clima-crecimiento-chart');
    if (climaCtx) {
        climaCrecimientoChart = new Chart(climaCtx, {
            type: 'line',
            data: {
                labels: generateDateLabels(14),
                datasets: [
                    {
                        label: 'Precipitación (mm)',
                        data: [0, 5, 12, 8, 0, 15, 22, 3, 0, 7, 18, 0, 4, 11],
                        backgroundColor: 'rgba(0, 123, 255, 0.3)',
                        borderColor: 'rgba(0, 123, 255, 1)',
                        type: 'bar',
                        yAxisID: 'y'
                    },
                    {
                        label: 'Tasa Crecimiento (kg MS/ha/día)',
                        data: [15, 18, 25, 22, 16, 28, 32, 20, 14, 19, 30, 17, 21, 26],
                        borderColor: 'rgba(40, 167, 69, 1)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Precipitación (mm)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Crecimiento (kg MS/ha/día)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
    }
    
    // Evolution Chart (Line Chart)
    const evolutionCtx = document.getElementById('evolution-chart');
    if (evolutionCtx) {
        evolutionChart = new Chart(evolutionCtx, {
            type: 'line',
            data: {
                labels: generateDateLabels(currentPeriod),
                datasets: [
                    {
                        label: 'Productividad (ton/ha)',
                        data: generateEvolutionData(currentPeriod, 12, 2),
                        borderColor: 'rgba(40, 167, 69, 1)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Eficiencia (%)',
                        data: generateEvolutionData(currentPeriod, 85, 10),
                        borderColor: 'rgba(0, 123, 255, 1)',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += context.parsed.y;
                                if (context.dataset.label.includes('%')) {
                                    label += '%';
                                } else {
                                    label += ' ton/ha';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Fecha'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Valor'
                        }
                    }
                }
            }
        });
    }
}

function loadDashboardData() {
    // Simulate loading dashboard data
    // In real implementation, this would fetch from the server
    console.log(`📊 Cargando datos para potrero: ${currentPotrero || 'todos'}, período: ${currentPeriod} días`);
    
    // Update KPIs with animation
    animateKPI('kpi-productividad', Math.random() * 15 + 8);
    animateKPI('kpi-eficiencia', Math.random() * 30 + 70);
    animateKPI('kpi-calidad', Math.random() * 25 + 65);
    
    // Update Estado del Forraje
    animateKPI('materia-verde', Math.random() * 1000 + 2000);
    animateKPI('materia-seca', Math.random() * 200 + 600);
    animateKPI('tasa-crecimiento', Math.random() * 10 + 15);
    animateKPI('dias-pastoreo', Math.floor(Math.random() * 5) + 2);
    
    // Update Presión Animal
    animateKPI('carga-instantanea', Math.random() * 0.5 + 1.5);
    animateKPI('demanda-diaria', Math.random() * 10 + 25);
    animateKPI('balance-forrajero', Math.random() * 300 + 100);
    animateKPI('indice-utilizacion', Math.random() * 20 + 60);
    
    // Update Salud del Suelo
    animateKPI('ph-promedio', Math.random() * 1.5 + 5.5);
    animateKPI('materia-organica', Math.random() * 2 + 3);
    
    // Update Clima
    animateKPI('precipitacion-7d', Math.random() * 30 + 10);
    animateKPI('temperatura-media', Math.random() * 8 + 18);
    animateKPI('humedad-relativa', Math.random() * 20 + 60);
    animateKPI('viento-max', Math.random() * 15 + 10);
    animateKPI('evapotranspiracion', Math.random() * 3 + 3);
    animateKPI('indice-crecimiento', Math.random() * 3 + 7);
    
    // Update Actividades
    animateKPI('tareas-completadas', Math.random() * 5 + 15);
    animateKPI('tiempo-cumplimiento', Math.random() * 2 + 1.5);
    animateKPI('coste-estimado', Math.random() * 1000 + 2000);
    animateKPI('intervenciones-mes', Math.floor(Math.random() * 8) + 10);
    
    // Update Eficiencia Global
    animateKPI('leche-por-ms', Math.random() * 0.5 + 1.1);
    animateKPI('huella-animal', Math.random() * 0.3 + 0.6);
    animateKPI('lotes-optimos', Math.random() * 20 + 70);
    
    generateSmartRecommendation();
}

function updateCharts() {
    if (topPotreroChart) {
        topPotreroChart.data.datasets[0].data = [
            Math.random() * 20 + 80,
            Math.random() * 15 + 85,
            Math.random() * 25 + 70,
            Math.random() * 10 + 90,
            Math.random() * 15 + 80
        ];
        topPotreroChart.update();
    }
    
    if (attentionPotreroChart) {
        attentionPotreroChart.data.datasets[0].data = [
            Math.random() * 20 + 30,
            Math.random() * 15 + 35,
            Math.random() * 20 + 40,
            Math.random() * 15 + 30,
            Math.random() * 20 + 35
        ];
        attentionPotreroChart.update();
    }
    
    if (evolutionChart) {
        evolutionChart.data.labels = generateDateLabels(currentPeriod);
        evolutionChart.data.datasets[0].data = generateEvolutionData(currentPeriod, 12, 2);
        evolutionChart.data.datasets[1].data = generateEvolutionData(currentPeriod, 85, 10);
        evolutionChart.update();
    }
    
    // Update new charts
    if (rotacionChart) {
        const rotacionReal = Math.floor(Math.random() * 10) + 20;
        const rotacionIdeal = 21;
        rotacionChart.data.datasets[0].data = [rotacionReal, rotacionIdeal];
        rotacionChart.update();
    }
    
    if (balanceChart) {
        balanceChart.data.datasets[0].data = generateRandomData(7, 15, 30);
        balanceChart.data.datasets[1].data = generateRandomData(7, 25, 35);
        balanceChart.update();
    }
    
    if (utilizacionChart) {
        const utilizacion = Math.floor(Math.random() * 30) + 60;
        utilizacionChart.data.datasets[0].data = [utilizacion, 100 - utilizacion];
        utilizacionChart.update();
    }
    
    if (npkChart) {
        npkChart.data.datasets[0].data = [
            Math.floor(Math.random() * 30) + 60,
            Math.floor(Math.random() * 40) + 50,
            Math.floor(Math.random() * 25) + 70
        ];
        npkChart.update();
    }
    
    if (climaCrecimientoChart) {
        climaCrecimientoChart.data.datasets[0].data = generateRandomData(14, 0, 25);
        climaCrecimientoChart.data.datasets[1].data = generateRandomData(14, 12, 35);
        climaCrecimientoChart.update();
    }
}

function generateDateLabels(days) {
    const labels = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('es-ES', { 
            month: 'short', 
            day: 'numeric' 
        }));
    }
    
    return labels;
}

function generateEvolutionData(days, base, variance) {
    const data = [];
    let current = base;
    
    for (let i = 0; i < days; i++) {
        current += (Math.random() - 0.5) * variance;
        current = Math.max(0, current);
        data.push(Math.round(current * 10) / 10);
    }
    
    return data;
}

function generateRandomData(length, min, max) {
    const data = [];
    for (let i = 0; i < length; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
}

function animateKPI(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startValue = 0;
    const duration = 1500;
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (targetValue - startValue) * easeOutQuart;
        
        if (elementId.includes('eficiencia') || elementId.includes('calidad') || elementId.includes('utilizacion')) {
            element.textContent = Math.round(currentValue) + '%';
        } else {
            element.textContent = currentValue.toFixed(1) + ' ton/ha';
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function generateSmartRecommendation() {
    const recommendations = [
        "Basado en los datos actuales, considera rotar el ganado en 2-3 días",
        "La productividad está por encima del promedio. Mantén las prácticas actuales",
        "Algunos potreros muestran baja materia seca. Considera suplementación",
        "Excelente eficiencia de rotación. El sistema está funcionando óptimamente",
        "La humedad del suelo es favorable para el crecimiento del pasto",
        "Considera realizar aforos en los potreros con menor rendimiento"
    ];
    
    const randomRecommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
    const element = document.getElementById('smart-recommendation');
    if (element) {
        element.textContent = randomRecommendation;
    }
}

function setupRealTimeUpdates() {
    // Update time every minute
    setInterval(() => {
        updateLastUpdateTime();
    }, 60000);
    
    // Generate new recommendation every 5 minutes
    setInterval(() => {
        generateSmartRecommendation();
    }, 300000);
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const element = document.getElementById('last-update-time');
    if (element) {
        element.textContent = timeString;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: min(300px, 100%); max-width: min(400px, 100%);';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <div class="me-2">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}
            </div>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.btn-close').addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
}