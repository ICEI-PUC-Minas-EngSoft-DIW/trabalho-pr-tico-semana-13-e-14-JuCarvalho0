// Define a URL base da API do JSON Server
const API_URL = 'http://localhost:3000/artefatos'; 


function formatarMoeda(valor) {
    // Garante que o valor é um número (limpa 'R$', etc. se necessário)
    let valorLimpo = String(valor).replace('R$ ', '').replace('.', '').replace(',', '.'); 
    const numericValue = parseFloat(valorLimpo);
    if (isNaN(numericValue)) return 'R$ --';
    
    return numericValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Adiciona os event listeners de exclusão a todos os botões .btn-delete
function adicionarAcoesExclusao() {
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const nome = e.target.dataset.nome;
            if (confirm(`Tem certeza que deseja EXCLUIR o artefato "${nome}" (ID ${id})?`)) {
                try {
                    const response = await fetch(`${API_URL}/${id}`, {
                        method: 'DELETE', // Método DELETE para remover
                    });

                    if (response.ok) {
                        alert(`Artefato ID ${id} excluído com sucesso!`);
                        // Recarrega a lista ou redireciona
                        if (document.getElementById('lista-produtos')) {
                            buscarArtefatos(); 
                        } else if (document.getElementById('detalhe-container')) {
                            window.location.href = 'index.html#colecao'; // Volta para a lista
                        }
                    } else {
                        alert('Falha ao excluir o artefato. Status: ' + response.status);
                    }
                } catch (error) {
                    console.error('Erro ao excluir:', error);
                    alert('Erro de conexão com o JSON Server.');
                }
            }
        });
    });
}


async function buscarArtefatos() {
    const $listaContainer = document.getElementById('lista-produtos');

    const $colecaoHeader = document.getElementById('colecao');
    if ($listaContainer && $colecaoHeader && !$colecaoHeader.querySelector('.btn-primary')) {
        const headerRow = $colecaoHeader.querySelector('.row.justify-content-center');
        if (headerRow) {
            headerRow.insertAdjacentHTML('afterend', `
                <div class="row mb-4">
                    <div class="col-12 text-end">
                        <a href="cadastro_artefato.html" class="btn btn-primary"><i class="fas fa-plus-circle me-2"></i>Cadastrar Novo Artefato</a>
                    </div>
                </div>
            `);
        }
    }


    if (!$listaContainer) return;

    try {
        // Requisita todos os dados da API
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const artefatos = await response.json();
        
        renderizarCarrossel(artefatos);
        renderizarLista(artefatos);
        adicionarAcoesExclusao(); 

    } catch (error) {
        console.error("Erro ao buscar artefatos:", error);
        $listaContainer.innerHTML = `<div class="col-12"><p class="alert alert-danger">Não foi possível carregar os dados. Verifique se o JSON Server está rodando em ${API_URL}.</p></div>`;
    }
}

function renderizarCarrossel(artefatos) {
    const $carouselInner = document.querySelector('#carouselDestaques .carousel-inner');
    if (!$carouselInner) return;

    $carouselInner.innerHTML = ''; // Limpa o placeholder
    const destaques = artefatos.filter(item => item.destaque);
    
    destaques.forEach((item, index) => {
        const activeClass = index === 0 ? 'active' : '';
        
        // Adiciona o prefixo 'pasta img/' aqui para exibir corretamente
        const carouselItem = `
            <div class="carousel-item ${activeClass}">
                <img src="pasta img/${item.imagem}" class="d-block w-100 carousel-img" alt="${item.nome}">
                <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-75 p-3 rounded">
                    <h5 class="text-gold"><a href="detalhes.html?id=${item.id}" class="text-white text-decoration-none">${item.nome}</a></h5>
                    <p>${item.descricao.substring(0, 100)}...</p>
                    <a href="detalhes.html?id=${item.id}" class="btn btn-sm btn-outline-light mt-2">Ver Detalhes</a>
                </div>
            </div>
        `;
        $carouselInner.innerHTML += carouselItem;
    });
}

function renderizarLista(artefatos) {
    const $listaContainer = document.getElementById('lista-produtos');
    if (!$listaContainer) return;
    
    $listaContainer.innerHTML = ''; // Limpa a lista existente

    artefatos.forEach(item => {
        const card = `
            <div class="col-lg-4 col-md-6 mb-4 fade-in-up">
                <div class="card product-card h-100 shadow">
                    <div class="card-img-wrapper">
                        <img src="pasta img/${item.imagem}" class="card-img-top card-img-custom" alt="${item.nome}">
                    </div>
                    <div class="card-body">
                        <h5 class="card-title">${item.nome}</h5>
                        <p class="card-text">${item.descricao.substring(0, 100)}...</p>
                        <p class="price-tag fw-bold text-gold">${formatarMoeda(item.preco)}</p>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <a href="detalhes.html?id=${item.id}" class="btn btn-outline-dark btn-sm flex-grow-1 me-2">Detalhes</a>
                        <a href="cadastro_artefato.html?id=${item.id}" class="btn btn-sm btn-outline-primary me-2"><i class="fas fa-edit"></i> Editar</a>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${item.id}" data-nome="${item.nome}"><i class="fas fa-trash-alt"></i> Excluir</button>
                    </div>
                </div>
            </div>
        `;
        $listaContainer.innerHTML += card;
    });
}

async function carregarDetalhes() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    const $container = document.getElementById('detalhe-container');
    if (!$container) return;

    if (!id) {
        $container.innerHTML = `<h1 class="text-danger">ID do artefato não fornecido.</h1>`;
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            $container.innerHTML = `<h1 class="text-danger">Artefato ID ${id} não encontrado ou servidor inacessível.</h1>`;
            return;
        }
        
        const artefato = await response.json();
        renderizarDetalhes(artefato);
        adicionarAcoesExclusao();

    } catch (error) {
        console.error("Erro ao carregar detalhes:", error);
        $container.innerHTML = `<h1 class="text-danger">Erro de rede ou servidor inacessível.</h1>`;
    }
}

function renderizarDetalhes(item) {
    const $container = document.getElementById('detalhe-container');
    if (!$container) return;

    $container.innerHTML = `
        <h1 class="display-4 text-gold mb-4">${item.nome}</h1>
        
        <div class="row mb-5">
            <div class="col-md-6 mb-4">
                <img src="pasta img/${item.imagem}" class="img-fluid rounded shadow-lg" alt="${item.nome}">
            </div>
            
            <div class="col-md-6">
                <p class="lead">${item.descricao}</p>
                <h3 class="text-gold mt-4">${formatarMoeda(item.preco)}</h3>
                
                <hr class="text-gold">
                
                <h4 class="mt-4">Informações Técnicas:</h4>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item"><strong>Categoria:</strong> ${item.categoria}</li>
                    <li class="list-group-item"><strong>Material:</strong> ${item.material || 'Não especificado'}</li>
                    <li class="list-group-item"><strong>Período:</strong> ${item.periodo}</li>
                    <li class="list-group-item"><strong>Data de Cadastro:</strong> ${item.data_cadastro || 'N/A'}</li>
                </ul>

                <div class="mt-4">
                    <button class="btn btn-danger btn-lg btn-delete me-2" data-id="${item.id}" data-nome="${item.nome}"><i class="fas fa-trash-alt"></i> Excluir Artefato</button>
                    <a href="cadastro_artefato.html?id=${item.id}" class="btn btn-primary btn-lg"><i class="fas fa-edit"></i> Editar Artefato</a>
                </div>
            </div>
        </div>
    `;
}



async function inicializarFormularioCadastro() {
    const form = document.getElementById('form-artefato');
    if (!form) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const isEditing = !!itemId;

    if (isEditing) {
        document.querySelector('h1').textContent = 'Editar Artefato Existente';
        document.querySelector('button[type="submit"]').textContent = 'Atualizar Artefato';
        await carregarDadosParaEdicao(itemId); 
    } else {
        document.querySelector('h1').textContent = 'Cadastrar Novo Artefato';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const artefatoData = {
            nome: document.getElementById('nome').value,
            descricao: document.getElementById('descricao').value,
            // Salva o preço como string formatada para número (sem R$)
            preco: parseFloat(document.getElementById('preco').value).toFixed(2), 
            categoria: document.getElementById('categoria').value,
            material: document.getElementById('material').value,
            periodo: document.getElementById('periodo').value,
            // Salva APENAS o nome do arquivo, sem o prefixo 'pasta img/'
            imagem: document.getElementById('imagem').value, 
            destaque: document.getElementById('destaque').checked,
            // Mantém a data de cadastro original (se for edição) ou cria uma nova
            data_cadastro: isEditing ? form.dataset.dataCadastro : new Date().toISOString().slice(0, 10) 
        };
        
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${itemId}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(artefatoData)
            });

            if (response.ok) {
                const artefatoSalvo = await response.json();
                alert(`Artefato "${artefatoSalvo.nome}" ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso!`);
                window.location.href = `detalhes.html?id=${artefatoSalvo.id}`; 
            } else {
                alert(`Falha ao ${isEditing ? 'atualizar' : 'cadastrar'} o artefato. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor.');
        }
    });
}

async function carregarDadosParaEdicao(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            alert('Artefato não encontrado para edição.');
            return;
        }
        const artefato = await response.json();
        
        document.getElementById('nome').value = artefato.nome;
        document.getElementById('descricao').value = artefato.descricao;
        // Converte o preço de volta para o campo de input numérico
        document.getElementById('preco').value = parseFloat(artefato.preco); 
        document.getElementById('categoria').value = artefato.categoria;
        document.getElementById('material').value = artefato.material || '';
        document.getElementById('periodo').value = artefato.periodo;
        
        // Remove o prefixo 'pasta img/' se ele tiver sido salvo no db.json por engano.
        const imageName = artefato.imagem ? artefato.imagem.replace('pasta img/', '') : '';
        document.getElementById('imagem').value = imageName; 

        document.getElementById('destaque').checked = artefato.destaque;
        
        document.getElementById('form-artefato').dataset.dataCadastro = artefato.data_cadastro;

    } catch (error) {
        console.error('Erro ao carregar dados para edição:', error);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // Inicializa a função correta de acordo com a página
    if (document.getElementById('lista-produtos')) {
        buscarArtefatos();
    } else if (document.getElementById('detalhe-container')) {
        carregarDetalhes();
    } else if (document.getElementById('form-artefato')) {
        inicializarFormularioCadastro();
    }
    
    // Lógica de scroll/ativação de links para a página principal (index.html)
    if (document.getElementById('lista-produtos')) { 
        window.addEventListener('scroll', function() {
            const sections = document.querySelectorAll('section');
            const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
            
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                // Se o link for 'index.html#secao', pega apenas o #secao para comparar
                const linkHref = link.getAttribute('href').split('#').pop();
                if (linkHref === current) {
                    link.classList.add('active');
                }
            });
        });
    }
});