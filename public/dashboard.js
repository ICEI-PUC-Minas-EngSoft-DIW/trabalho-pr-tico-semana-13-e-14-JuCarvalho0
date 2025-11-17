const API_URL = 'http://localhost:3000/artefatos';

// Cores para os gráficos
const chartColors = [
    '#D4AF37', '#B8860B', '#5D4037', '#8D6E63', '#A1887F',
    '#C5A880', '#E6BE8A', '#F4E4A6', '#543813', '#8B7355'
];

let charts = {};

async function carregarDashboard() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Erro ao carregar dados');
        
        const artefatos = await response.json();
        atualizarEstatisticas(artefatos);
        renderizarGraficos(artefatos);
        
    } catch (error) {
        console.error('Erro no dashboard:', error);
        document.getElementById('lista-produtos').innerHTML = 
            '<div class="alert alert-danger">Erro ao carregar dados do dashboard</div>';
    }
}

function atualizarEstatisticas(artefatos) {
    const totalArtefatos = artefatos.length;
    const totalValor = artefatos.reduce((sum, item) => sum + parseFloat(item.preco), 0);
    const mediaPreco = totalValor / totalArtefatos;
    
    document.getElementById('total-artefatos').textContent = totalArtefatos;
    document.getElementById('total-valor').textContent = formatarMoeda(totalValor);
    document.getElementById('media-preco').textContent = formatarMoeda(mediaPreco);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function renderizarGraficos(artefatos) {
    renderizarGraficoCategorias(artefatos);
    renderizarGraficoPrecos(artefatos);
    renderizarGraficoPeriodos(artefatos);
    renderizarGraficoMateriais(artefatos);
}

function renderizarGraficoCategorias(artefatos) {
    const categorias = {};
    
    artefatos.forEach(artefato => {
        const categoria = artefato.categoria || 'Sem categoria';
        categorias[categoria] = (categorias[categoria] || 0) + 1;
    });
    
    const ctx = document.getElementById('categoriaChart').getContext('2d');
    
    if (charts.categoria) charts.categoria.destroy();
    
    charts.categoria = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(categorias),
            datasets: [{
                data: Object.values(categorias),
                backgroundColor: chartColors,
                borderColor: '#2C2C2C',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Georgia, serif'
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderizarGraficoPrecos(artefatos) {
    const categorias = {};
    
    artefatos.forEach(artefato => {
        const categoria = artefato.categoria || 'Sem categoria';
        if (!categorias[categoria]) {
            categorias[categoria] = {
                total: 0,
                count: 0
            };
        }
        categorias[categoria].total += parseFloat(artefato.preco);
        categorias[categoria].count += 1;
    });
    
    const categoriasArray = Object.keys(categorias);
    const precosMedios = categoriasArray.map(cat => 
        categorias[cat].total / categorias[cat].count
    );
    
    const ctx = document.getElementById('precoChart').getContext('2d');
    
    if (charts.preco) charts.preco.destroy();
    
    charts.preco = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categoriasArray,
            datasets: [{
                label: 'Preço Médio (R$)',
                data: precosMedios,
                backgroundColor: chartColors[0],
                borderColor: '#B8860B',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatarMoeda(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Preço médio: ${formatarMoeda(context.raw)}`;
                        }
                    }
                }
            }
        }
    });
}

function renderizarGraficoPeriodos(artefatos) {
    const periodos = {};
    
    artefatos.forEach(artefato => {
        // Extrai o século do período
        let periodo = artefato.periodo || 'Desconhecido';
        const seculoMatch = periodo.match(/\b(Século|século)\s+([IXV]+)/i) || 
                           periodo.match(/\b(\d+)\s*[a-z]*\s*[a.c.C.]*/i);
        
        if (seculoMatch) {
            periodo = seculoMatch[2] ? `Século ${seculoMatch[2]}` : `Século ${seculoMatch[1]}`;
        } else if (periodo.match(/\d{4}/)) {
            const ano = periodo.match(/\d{4}/)[0];
            const seculo = Math.ceil(parseInt(ano) / 100);
            periodo = `Século ${seculo}`;
        }
        
        periodos[periodo] = (periodos[periodo] || 0) + 1;
    });
    
    // Ordena por século
    const periodosOrdenados = Object.entries(periodos)
        .sort((a, b) => {
            const numA = a[0].match(/\d+/)?.[0] || 0;
            const numB = b[0].match(/\d+/)?.[0] || 0;
            return parseInt(numA) - parseInt(numB);
        });
    
    const ctx = document.getElementById('periodoChart').getContext('2d');
    
    if (charts.periodo) charts.periodo.destroy();
    
    charts.periodo = new Chart(ctx, {
        type: 'line',
        data: {
            labels: periodosOrdenados.map(p => p[0]),
            datasets: [{
                label: 'Quantidade de Artefatos',
                data: periodosOrdenados.map(p => p[1]),
                backgroundColor: chartColors[2] + '20',
                borderColor: chartColors[2],
                borderWidth: 3,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderizarGraficoMateriais(artefatos) {
    const materiais = {};
    
    artefatos.forEach(artefato => {
        const material = artefato.material || 'Não especificado';
        const materiaisLista = material.split(/[,e]/).map(m => m.trim()).filter(m => m);
        
        materiaisLista.forEach(m => {
            materiais[m] = (materiais[m] || 0) + 1;
        });
    });
    
    // Pega os 8 materiais mais comuns
    const materiaisTop = Object.entries(materiais)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    
    const ctx = document.getElementById('materialChart').getContext('2d');
    
    if (charts.material) charts.material.destroy();
    
    charts.material = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: materiaisTop.map(m => m[0]),
            datasets: [{
                data: materiaisTop.map(m => m[1]),
                backgroundColor: chartColors.slice(2),
                borderColor: '#2C2C2C',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Inicializa o dashboard quando a página carregar
document.addEventListener('DOMContentLoaded', carregarDashboard);