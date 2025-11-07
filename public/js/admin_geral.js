// Configurações
const API_BASE_URL = 'http://localhost:3000/api';
const ITEMS_PER_PAGE = 10;

// Estado da aplicação
let currentTab = 'products';
let currentPage = {
    products: 1,
    workshops: 1,
    brands: 1,
    models: 1,
    years: 1
};
let totalPages = {
    products: 1,
    workshops: 1,
    brands: 1,
    models: 1,
    years: 1
};
let searchTerm = {
    products: '',
    workshops: '',
    brands: '',
    models: '',
    years: ''
};

// Configurações de ordenação
let sortConfig = {
    products: { field: 'id', order: 'asc' },
    workshops: { field: 'id', order: 'asc' },
    brands: { field: 'id', order: 'asc' },
    models: { field: 'id_modelo', order: 'asc' },
    years: { field: 'id_ano', order: 'asc' }
};

// Elementos DOM
const statusIndicator = document.getElementById('status-indicator');

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    initializeTabs();
    initializeForms();
    initializeFilters();
    loadInitialData();
    setInterval(checkConnection, 30000);
});

// Inicializar abas
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabId = this.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}
// ========== FUNÇÕES PARA CARREGAR MARCAS, MODELOS E ANOS NOS FORMULÁRIOS ==========

// Carregar marcas para os selects de produtos
async function loadBrandsForProductSelects() {
    try {
        const response = await fetch(`${API_BASE_URL}/marcas`);
        const brands = await response.json();

        // Preencher selects de marca para óleo e filtro
        const oilMarcaSelect = document.getElementById('oil-marca');
        const filterMarcaSelect = document.getElementById('filter-marca');
        
        oilMarcaSelect.innerHTML = '<option value="">Selecione uma marca</option>';
        filterMarcaSelect.innerHTML = '<option value="">Selecione uma marca</option>';

        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.nome;
            
            oilMarcaSelect.appendChild(option.cloneNode(true));
            filterMarcaSelect.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Erro ao carregar marcas para produtos:', error);
        showAlert('Erro ao carregar marcas', 'danger');
    }
}

// Carregar modelos baseado na marca selecionada
async function loadModelsForProduct(type) {
    const marcaId = document.getElementById(`${type}-marca`).value;
    const modeloSelect = document.getElementById(`${type}-modelo`);
    const anoSelect = document.getElementById(`${type}-ano`);

    // Resetar selects dependentes
    modeloSelect.innerHTML = '<option value="">Selecione um modelo</option>';
    anoSelect.innerHTML = '<option value="">Selecione um ano</option>';

    if (!marcaId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/modelos-completos`);
        const data = await response.json();

        if (data.success) {
            const modelosFiltrados = data.data.filter(modelo => 
                modelo.id_marca == marcaId
            );

            modelosFiltrados.forEach(modelo => {
                const option = document.createElement('option');
                option.value = modelo.id_modelo;
                option.textContent = `${modelo.nome_modelo} (${modelo.tipo})`;
                modeloSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        showAlert('Erro ao carregar modelos', 'danger');
    }
}

// Carregar anos baseado no modelo selecionado
async function loadYearsForProduct(type) {
    const modeloId = document.getElementById(`${type}-modelo`).value;
    const anoSelect = document.getElementById(`${type}-ano`);

    // Resetar select de anos
    anoSelect.innerHTML = '<option value="">Selecione um ano</option>';

    if (!modeloId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/anos-completos`);
        const data = await response.json();

        if (data.success) {
            const anosFiltrados = data.data.filter(ano => 
                ano.id_modelo == modeloId
            );

            // Ordenar anos do mais recente para o mais antigo
            anosFiltrados.sort((a, b) => b.ano - a.ano);

            anosFiltrados.forEach(ano => {
                const option = document.createElement('option');
                option.value = ano.id_ano;
                option.textContent = ano.ano;
                anoSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar anos:', error);
        showAlert('Erro ao carregar anos', 'danger');
    }
}

// ========== FUNÇÕES PARA PRODUTOS - VERSÃO COM HIERARQUIA MARCA→MODELO→ANO ==========

// Adicionar óleo - VERSÃO CORRIGIDA
async function addOil() {
    const marcaId = document.getElementById('oil-marca').value;
    const modeloId = document.getElementById('oil-modelo').value;
    const anoId = document.getElementById('oil-ano').value; // ✅ Este é o modelo_ano_id

    console.log('🔍 Dados do formulário - IDs:', {
        marcaId, modeloId, anoId
    });

    const oilData = {
        nome: document.getElementById('oil-name').value,
        tipo: document.getElementById('oil-type').value,
        viscosidade: document.getElementById('oil-viscosity').value,
        especificacao: document.getElementById('oil-specification').value,
        marca: document.getElementById('oil-brand').value,
        preco: parseFloat(document.getElementById('oil-price').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/oleo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(oilData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Óleo adicionado com ID:', result.id);
            
            // ✅ CRIA RECOMENDAÇÃO COM O modelo_ano_id CORRETO
            if (anoId) {
                console.log('🎯 Criando recomendação para modelo_ano_id:', anoId);
                await createRecomendacao(parseInt(anoId), result.id, null);
            } else {
                console.warn('⚠️ Nenhum ano selecionado - recomendação não criada');
            }
            
            showAlert('Óleo adicionado com sucesso!', 'success');
            document.getElementById('oil-form').reset();
            loadProducts();
        } else {
            throw new Error('Erro ao adicionar óleo');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        showAlert('Erro ao adicionar óleo: ' + error.message, 'danger');
    }
}

// Adicionar filtro - VERSÃO CORRIGIDA COM VÍNCULO COMPLETO
async function addFilter() {
    const marcaId = document.getElementById('filter-marca').value;
    const modeloId = document.getElementById('filter-modelo').value;
    const anoId = document.getElementById('filter-ano').value;

    console.log('🔍 Dados do formulário - IDs:', {
        marcaId, modeloId, anoId
    });

    const filterData = {
        nome: document.getElementById('filter-name').value,
        tipo: document.getElementById('filter-type').value,
        compatibilidade_modelo: document.getElementById('filter-compatibility').value,
        preco: parseFloat(document.getElementById('filter-price').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/filtro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Filtro adicionado com ID:', result.id);
            
            // ✅ CRIA RECOMENDAÇÃO COM O modelo_ano_id CORRETO
            if (anoId) {
                console.log('🎯 Criando recomendação para modelo_ano_id:', anoId);
                await createRecomendacao(parseInt(anoId), null, result.id);
            } else {
                console.warn('⚠️ Nenhum ano selecionado - recomendação não criada');
            }
            
            showAlert('Filtro adicionado com sucesso!', 'success');
            document.getElementById('filter-form').reset();
            loadProducts();
        } else {
            throw new Error('Erro ao adicionar filtro');
        }
    } catch (error) {
        console.error('❌ Erro:', error);
        showAlert('Erro ao adicionar filtro: ' + error.message, 'danger');
    }
}

// ✅ FUNÇÃO PARA CRIAR RECOMENDAÇÃO
async function createRecomendacao(modeloAnoId, oleoId, filtroId) {
    try {
        const recomendacaoData = {
            modelo_ano_id: modeloAnoId,
            oleo_id: oleoId,
            filtro_id: filtroId
        };

        console.log('🎯 Criando recomendação:', recomendacaoData);

        const response = await fetch(`${API_BASE_URL}/recomendacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recomendacaoData)
        });

        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ Recomendação criada com sucesso! ID:', result.id);
        } else {
            console.warn('⚠️ Não foi possível criar recomendação:', result.error);
        }
    } catch (error) {
        console.warn('⚠️ Erro ao criar recomendação:', error);
    }
}

// Funções auxiliares para obter IDs
async function getOilIdByName(nome) {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/oleo`);
        const oils = await response.json();
        const oil = oils.find(o => o.nome === nome);
        return oil ? oil.id : null;
    } catch (error) {
        console.error('Erro ao buscar ID do óleo:', error);
        return null;
    }
}

async function getFilterIdByName(nome) {
    try {
        const response = await fetch(`${API_BASE_URL}/produtos/filtro`);
        const filters = await response.json();
        const filter = filters.find(f => f.nome === nome);
        return filter ? filter.id : null;
    } catch (error) {
        console.error('Erro ao buscar ID do filtro:', error);
        return null;
    }
}

// Carregar produtos com informações completas - VERSÃO CORRIGIDA
async function loadProducts() {
    try {
        // Buscar óleos
        const oilsResponse = await fetch(`${API_BASE_URL}/produtos/oleo`);
        const oils = await oilsResponse.json();

        // Buscar filtros
        const filtersResponse = await fetch(`${API_BASE_URL}/produtos/filtro`);
        const filters = await filtersResponse.json();

        // Combinar produtos (sem informações de veículo)
        let allProducts = [
            ...oils.map(oil => ({ 
                ...oil, 
                tipo_produto: 'oleo',
                veiculo_info: {} // Vazio pois não temos vínculo no banco
            })),
            ...filters.map(filter => ({ 
                ...filter, 
                tipo_produto: 'filtro',
                veiculo_info: {} // Vazio pois não temos vínculo no banco
            }))
        ];

        // Aplicar filtro de busca (sem buscar informações de veículo)
        if (searchTerm.products) {
            const term = searchTerm.products.toLowerCase();
            allProducts = allProducts.filter(product =>
                product.nome.toLowerCase().includes(term) ||
                (product.marca && product.marca.toLowerCase().includes(term)) ||
                (product.compatibilidade_modelo && product.compatibilidade_modelo.toLowerCase().includes(term)) ||
                (product.viscosidade && product.viscosidade.toLowerCase().includes(term))
            );
        }

        // Aplicar ordenação
        allProducts.sort((a, b) => {
            const field = sortConfig.products.field;
            const order = sortConfig.products.order;
            const multiplier = order === 'asc' ? 1 : -1;

            if (field === 'id') {
                return (a.id - b.id) * multiplier;
            } else if (field === 'nome') {
                return a.nome.localeCompare(b.nome) * multiplier;
            } else if (field === 'preco') {
                return (a.preco - b.preco) * multiplier;
            }
            return 0;
        });

        // Calcular paginação
        totalPages.products = Math.ceil(allProducts.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage.products - 1) * ITEMS_PER_PAGE;
        const paginatedProducts = allProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // Renderizar produtos
        renderProducts(paginatedProducts);
        renderPagination('products', totalPages.products, currentPage.products);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showAlert('Erro ao carregar produtos', 'danger');
    }
}

// Renderizar produtos na tabela - VERSÃO CORRIGIDA
function renderProducts(products) {
    const tbody = document.getElementById('products-table-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum produto encontrado</td></tr>';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('tr');

        // Detalhes específicos do produto
        let detalhes = '';
        if (product.tipo_produto === 'oleo') {
            detalhes = `Viscosidade: ${product.viscosidade}<br>Especificação: ${product.especificacao}`;
        } else {
            detalhes = `Compatibilidade: ${product.compatibilidade_modelo}`;
        }

        // Preço formatado
        const preco = parseFloat(product.preco) || 0;

        row.innerHTML = `
            <td>${product.id}</td>
            <td>
                <span class="product-type-badge ${product.tipo_produto}">
                    ${product.tipo_produto === 'oleo' ? 'Óleo' : 'Filtro'}
                </span>
                <br>
                <small>${product.tipo}</small>
            </td>
            <td>
                <strong>${product.nome}</strong>
                ${product.marca ? `<br><small>Marca: ${product.marca}</small>` : ''}
            </td>
            <td>Não vinculado</td>
            <td>${detalhes}</td>
            <td>R$ ${preco.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="btn-warning action-btn" onclick="editProduct(${product.id}, '${product.tipo_produto}')">Editar</button>
                <button class="btn-danger action-btn" onclick="deleteProduct(${product.id}, '${product.tipo_produto}')">Excluir</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// ========== FUNÇÕES DE EDIÇÃO E EXCLUSÃO ==========

// Editar produto
async function editProduct(id, tipo) {
    try {
        let product;
        if (tipo === 'oleo') {
            const response = await fetch(`${API_BASE_URL}/produtos/oleo/${id}`);
            product = await response.json();
        } else {
            const response = await fetch(`${API_BASE_URL}/produtos/filtro/${id}`);
            product = await response.json();
        }

        // Aqui você pode implementar um modal de edição similar aos outros
        // Por enquanto, vou mostrar um alerta com os dados
        showAlert(`Editando ${tipo === 'oleo' ? 'óleo' : 'filtro'} ID: ${id}\nNome: ${product.nome}\nPreço: R$ ${product.preco}`, 'warning');
        
        // Em uma implementação completa, você abriria um modal de edição
        // preenchido com os dados do produto

    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
        showAlert('Erro ao carregar dados do produto', 'danger');
    }
}

// Excluir produto - VERSÃO CORRIGIDA
async function deleteProduct(id, tipo) {
    const tipoTexto = tipo === 'oleo' ? 'óleo' : 'filtro';
    
    if (!confirm(`Tem certeza que deseja excluir este ${tipoTexto}? Esta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const endpoint = tipo === 'oleo' ? 'oleo' : 'filtro';
        console.log(`🗑️ Excluindo ${tipoTexto} ID:`, id);
        
        const response = await fetch(`${API_BASE_URL}/produtos/${endpoint}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAlert(`${tipoTexto === 'óleo' ? 'Óleo' : 'Filtro'} excluído com sucesso!`, 'success');
            loadProducts();
        } else {
            throw new Error(result.error || `Erro ao excluir ${tipoTexto}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao excluir ${tipoTexto}:`, error);
        showAlert(`Erro ao excluir ${tipoTexto}: ` + error.message, 'danger');
    }
}

// Inicializar formulários
function initializeForms() {

    // Formulário de edição de marca
    document.getElementById('edit-brand-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateBrand();
    });

    // Formulário de edição de modelo
    document.getElementById('edit-model-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateModel();
    });

    // Formulário de edição de ano
    document.getElementById('edit-year-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateYear();
    });
    // Formulário de óleo
    document.getElementById('oil-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addOil();
    });

    // Formulário de filtro
    document.getElementById('filter-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addFilter();
    });
        // Formulário de edição de óleo
    document.getElementById('edit-oil-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateOil();
    });

    // Formulário de edição de filtro
    document.getElementById('edit-filter-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateFilter();
    });

    // Formulário de oficina
    document.getElementById('workshop-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addWorkshop();
    });

    // Formulário de marca
    document.getElementById('brand-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addBrand();
    });

    // Formulário de modelo
    document.getElementById('model-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addModel();
    });

    // Formulário de ano
    document.getElementById('year-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addYear();
    });

    // Botões de limpar formulário
    document.getElementById('clear-oil-form').addEventListener('click', function () {
        document.getElementById('oil-form').reset();
    });

    document.getElementById('clear-filter-form').addEventListener('click', function () {
        document.getElementById('filter-form').reset();
    });

    document.getElementById('clear-workshop-form').addEventListener('click', function () {
        document.getElementById('workshop-form').reset();
    });

    document.getElementById('clear-brand-form').addEventListener('click', function () {
        document.getElementById('brand-form').reset();
    });

    document.getElementById('clear-model-form').addEventListener('click', function () {
        document.getElementById('model-form').reset();
    });

    document.getElementById('clear-year-form').addEventListener('click', function () {
        document.getElementById('year-form').reset();
    });

    // Campos de busca
    document.getElementById('product-search').addEventListener('input', function () {
        searchTerm.products = this.value;
        currentPage.products = 1;
        loadProducts();
    });

    document.getElementById('workshop-search').addEventListener('input', function () {
        searchTerm.workshops = this.value;
        currentPage.workshops = 1;
        loadWorkshops();
    });

    document.getElementById('brand-search').addEventListener('input', function () {
        searchTerm.brands = this.value;
        currentPage.brands = 1;
        loadBrands();
    });

    document.getElementById('model-search').addEventListener('input', function () {
        searchTerm.models = this.value;
        currentPage.models = 1;
        loadModels();
    });

    document.getElementById('year-search').addEventListener('input', function () {
        searchTerm.years = this.value;
        currentPage.years = 1;
        loadYears();
    });

    // Formulário de edição no modal
    document.getElementById('edit-workshop-form').addEventListener('submit', function (e) {
        e.preventDefault();
        updateWorkshop();
    });
}



// Inicializar filtros
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            const type = this.getAttribute('data-type');
            const sortField = this.getAttribute('data-sort');
            const sortOrder = this.getAttribute('data-order');

            // Atualizar configuração de ordenação
            sortConfig[type] = { field: sortField, order: sortOrder };

            // Atualizar botões ativos
            const filterGroup = this.closest('.filter-group');
            filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');

            // Recarregar dados
            currentPage[type] = 1;
            loadDataByType(type);
        });
    });
}

// Trocar aba
function switchTab(tabId) {
    // Atualizar abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');

    currentTab = tabId;

    // Carregar dados específicos da aba se necessário
    if (tabId === 'models') {
        loadBrandsForSelect('model-brand');
    } else if (tabId === 'years') {
        loadModelsForSelect('year-model');
    } else if (tabId === 'products') {
        // CORREÇÃO: Carregar marcas para os selects de produtos
        loadBrandsForProductSelects();
    }

    // Carregar dados da aba
    loadDataByType(tabId);
}

// Carregar dados iniciais
function loadInitialData() {
    checkConnection();
    loadProducts();
    loadBrands();
    // CORREÇÃO: Também carregar marcas para os selects de produtos na inicialização
    loadBrandsForProductSelects();
}

// Verificar conexão com a API
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`);
        if (response.ok) {
            statusIndicator.className = 'alert alert-success';
            statusIndicator.textContent = 'Conectado';
        } else {
            throw new Error('Resposta não OK');
        }
    } catch (error) {
        statusIndicator.className = 'alert alert-danger';
        statusIndicator.textContent = 'Desconectado';
        console.error('Erro de conexão:', error);
    }
}



// ========== FUNÇÕES PARA OFICINAS ==========

// Adicionar oficina - VERSÃO COM VALIDAÇÕES
async function addWorkshop() {
    const workshopData = {
        nome: document.getElementById('workshop-name').value,
        email: document.getElementById('workshop-email').value,
        senha: document.getElementById('workshop-password').value,
        endereco: document.getElementById('workshop-address').value,
        cidade: document.getElementById('workshop-city').value,
        estado: document.getElementById('workshop-state').value,
        cep: document.getElementById('workshop-cep').value,
        telefone: document.getElementById('workshop-phone').value,
        horario_abertura: document.getElementById('workshop-opening').value,
        horario_fechamento: document.getElementById('workshop-closing').value,
        dias_funcionamento: document.getElementById('workshop-days').value,
        lat: document.getElementById('workshop-lat').value,
        lng: document.getElementById('workshop-lng').value
    };

    // Validações no frontend
    if (!workshopData.nome || !workshopData.email || !workshopData.senha ||
        !workshopData.endereco || !workshopData.cidade || !workshopData.estado ||
        !workshopData.cep || !workshopData.telefone) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workshopData.email)) {
        showAlert('Por favor, insira um email válido.', 'danger');
        return;
    }

    // Validação de latitude
    if (workshopData.lat) {
        const latNum = parseFloat(workshopData.lat);
        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            showAlert('Latitude deve ser um número entre -90 e 90.', 'danger');
            return;
        }
    }

    // Validação de longitude
    if (workshopData.lng) {
        const lngNum = parseFloat(workshopData.lng);
        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            showAlert('Longitude deve ser um número entre -180 e 180.', 'danger');
            return;
        }
    }

    // Validação de CEP
    if (workshopData.cep.length < 8) {
        showAlert('CEP deve ter pelo menos 8 caracteres.', 'danger');
        return;
    }

    // Validação de telefone
    const telefoneLimpo = workshopData.telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 10) {
        showAlert('Telefone deve ter pelo menos 10 dígitos.', 'danger');
        return;
    }

    console.log('📤 Dados enviados para API:', workshopData);

    try {
        const response = await fetch(`${API_BASE_URL}/oficina`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workshopData)
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Oficina adicionada com sucesso!', 'success');
            document.getElementById('workshop-form').reset();
            loadWorkshops();
        } else {
            throw new Error(result.error || 'Erro ao adicionar oficina');
        }
    } catch (error) {
        showAlert('Erro ao adicionar oficina: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Carregar oficinas
async function loadWorkshops() {
    try {
        const response = await fetch(`${API_BASE_URL}/oficinas-completas`);
        const data = await response.json();

        if (data.success) {
            let workshops = data.data;

            // Aplicar filtro de busca
            if (searchTerm.workshops) {
                const term = searchTerm.workshops.toLowerCase();
                workshops = workshops.filter(workshop =>
                    workshop.nome.toLowerCase().includes(term) ||
                    workshop.endereco.toLowerCase().includes(term) ||
                    workshop.cidade.toLowerCase().includes(term)
                );
            }

            // Aplicar ordenação
            workshops.sort((a, b) => {
                const field = sortConfig.workshops.field;
                const order = sortConfig.workshops.order;
                const multiplier = order === 'asc' ? 1 : -1;

                if (field === 'id') {
                    return (a.id - b.id) * multiplier;
                } else if (field === 'nome') {
                    return a.nome.localeCompare(b.nome) * multiplier;
                }
                return 0;
            });

            // Calcular paginação
            totalPages.workshops = Math.ceil(workshops.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage.workshops - 1) * ITEMS_PER_PAGE;
            const paginatedWorkshops = workshops.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            // Renderizar oficinas
            renderWorkshops(paginatedWorkshops);
            renderPagination('workshops', totalPages.workshops, currentPage.workshops);
        } else {
            throw new Error(data.message || 'Erro ao carregar oficinas');
        }
    } catch (error) {
        console.error('Erro ao carregar oficinas:', error);
        showAlert('Erro ao carregar oficinas', 'danger');
    }
}

// Renderizar oficinas na tabela - VERSÃO COM MODAL
function renderWorkshops(workshops) {
    const tbody = document.getElementById('workshops-table-body');
    tbody.innerHTML = '';

    if (workshops.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhuma oficina encontrada</td></tr>';
        return;
    }

    workshops.forEach(workshop => {
        const row = document.createElement('tr');

        row.innerHTML = `
                <td>${workshop.id}</td>
                <td><strong>${workshop.nome}</strong></td>
                <td title="${workshop.endereco}">${workshop.endereco}</td>
                <td>${workshop.cidade}/${workshop.estado}</td>
                <td>${workshop.telefone}</td>
                <td>${workshop.horario_abertura} - ${workshop.horario_fechamento}</td>
                <td class="action-buttons">
                    <button class="btn-warning action-btn" onclick="openEditWorkshopModal(${workshop.id})">Editar</button>
                    <button class="btn-danger action-btn" onclick="deleteWorkshop(${workshop.id})">Excluir</button>
                </td>
            `;

        tbody.appendChild(row);
    });
}

// ========== FUNÇÕES PARA MARCAS ==========

// Adicionar marca
async function addBrand() {
    const brandData = {
        nome: document.getElementById('brand-name').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/marca`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(brandData)
        });

        if (response.ok) {
            showAlert('Marca adicionada com sucesso!', 'success');
            document.getElementById('brand-form').reset();
            loadBrands();

            // Atualizar selects que usam marcas
            if (currentTab === 'models') {
                loadBrandsForSelect('model-brand');
            }
        } else {
            throw new Error('Erro ao adicionar marca');
        }
    } catch (error) {
        showAlert('Erro ao adicionar marca: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Carregar marcas
async function loadBrands() {
    try {
        const response = await fetch(`${API_BASE_URL}/marcas`);
        const brands = await response.json();

        // Aplicar filtro de busca
        let filteredBrands = brands;
        if (searchTerm.brands) {
            const term = searchTerm.brands.toLowerCase();
            filteredBrands = brands.filter(brand =>
                brand.nome.toLowerCase().includes(term)
            );
        }

        // Aplicar ordenação
        filteredBrands.sort((a, b) => {
            const field = sortConfig.brands.field;
            const order = sortConfig.brands.order;
            const multiplier = order === 'asc' ? 1 : -1;

            if (field === 'id') {
                return (a.id - b.id) * multiplier;
            } else if (field === 'nome') {
                return a.nome.localeCompare(b.nome) * multiplier;
            }
            return 0;
        });

        // Calcular paginação
        totalPages.brands = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage.brands - 1) * ITEMS_PER_PAGE;
        const paginatedBrands = filteredBrands.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        // Renderizar marcas
        renderBrands(paginatedBrands);
        renderPagination('brands', totalPages.brands, currentPage.brands);

    } catch (error) {
        console.error('Erro ao carregar marcas:', error);
        showAlert('Erro ao carregar marcas', 'danger');
    }
}

// Renderizar marcas na tabela
function renderBrands(brands) {
    const tbody = document.getElementById('brands-table-body');
    tbody.innerHTML = '';

    if (brands.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhuma marca encontrada</td></tr>';
        return;
    }

    brands.forEach(brand => {
        const row = document.createElement('tr');

        row.innerHTML = `
                <td>${brand.id}</td>
                <td>${brand.nome}</td>
                <td class="action-buttons">
                    <button class="btn-warning action-btn" onclick="editBrand(${brand.id})">Editar</button>
                    <button class="btn-danger action-btn" onclick="deleteBrand(${brand.id})">Excluir</button>
                </td>
            `;

        tbody.appendChild(row);
    });
}

// Carregar marcas para select
async function loadBrandsForSelect(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/marcas`);
        const brands = await response.json();

        const select = document.getElementById(selectId);
        select.innerHTML = '<option value="">Selecione uma marca</option>';

        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar marcas para select:', error);
    }
}

// ========== FUNÇÕES PARA MODELOS ==========

// Adicionar modelo
async function addModel() {
    const modelData = {
        nome: document.getElementById('model-name').value,
        marca_id: parseInt(document.getElementById('model-brand').value),
        tipo: document.getElementById('model-type').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/modelo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(modelData)
        });

        if (response.ok) {
            showAlert('Modelo adicionado com sucesso!', 'success');
            document.getElementById('model-form').reset();
            loadModels();

            // Atualizar selects que usam modelos
            if (currentTab === 'years') {
                loadModelsForSelect('year-model');
            }
        } else {
            throw new Error('Erro ao adicionar modelo');
        }
    } catch (error) {
        showAlert('Erro ao adicionar modelo: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Carregar modelos
async function loadModels() {
    try {
        const response = await fetch(`${API_BASE_URL}/modelos-completos`);
        const data = await response.json();

        if (data.success) {
            let models = data.data;

            // Aplicar filtro de busca
            if (searchTerm.models) {
                const term = searchTerm.models.toLowerCase();
                models = models.filter(model =>
                    model.nome_modelo.toLowerCase().includes(term) ||
                    model.nome_marca.toLowerCase().includes(term)
                );
            }

            // Aplicar ordenação
            models.sort((a, b) => {
                const field = sortConfig.models.field;
                const order = sortConfig.models.order;
                const multiplier = order === 'asc' ? 1 : -1;

                if (field === 'id_modelo') {
                    return (a.id_modelo - b.id_modelo) * multiplier;
                } else if (field === 'nome_modelo') {
                    return a.nome_modelo.localeCompare(b.nome_modelo) * multiplier;
                }
                return 0;
            });

            // Calcular paginação
            totalPages.models = Math.ceil(models.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage.models - 1) * ITEMS_PER_PAGE;
            const paginatedModels = models.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            // Renderizar modelos
            renderModels(paginatedModels);
            renderPagination('models', totalPages.models, currentPage.models);
        } else {
            throw new Error(data.message || 'Erro ao carregar modelos');
        }
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
        showAlert('Erro ao carregar modelos', 'danger');
    }
}

// Renderizar modelos na tabela
function renderModels(models) {
    const tbody = document.getElementById('models-table-body');
    tbody.innerHTML = '';

    if (models.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum modelo encontrado</td></tr>';
        return;
    }

    models.forEach(model => {
        const row = document.createElement('tr');

        row.innerHTML = `
                <td>${model.id_modelo}</td>
                <td>${model.nome_modelo}</td>
                <td>${model.nome_marca}</td>
                <td>${model.tipo}</td>
                <td class="action-buttons">
                    <button class="btn-warning action-btn" onclick="editModel(${model.id_modelo})">Editar</button>
                    <button class="btn-danger action-btn" onclick="deleteModel(${model.id_modelo})">Excluir</button>
                </td>
            `;

        tbody.appendChild(row);
    });
}

// Carregar modelos para select
async function loadModelsForSelect(selectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/modelos-completos`);
        const data = await response.json();

        if (data.success) {
            const models = data.data;
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">Selecione um modelo</option>';

            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id_modelo;
                option.textContent = `${model.nome_marca} - ${model.nome_modelo} (${model.tipo})`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar modelos para select:', error);
    }
}

// ========== FUNÇÕES PARA ANOS DE MODELO ==========

// Adicionar ano
async function addYear() {
    const yearData = {
        modelo_id: parseInt(document.getElementById('year-model').value),
        ano: parseInt(document.getElementById('year-value').value)
    };

    try {
        const response = await fetch(`${API_BASE_URL}/ano-modelo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(yearData)
        });

        if (response.ok) {
            showAlert('Ano adicionado com sucesso!', 'success');
            document.getElementById('year-form').reset();
            loadYears();
        } else {
            throw new Error('Erro ao adicionar ano');
        }
    } catch (error) {
        showAlert('Erro ao adicionar ano: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Carregar anos
async function loadYears() {
    try {
        const response = await fetch(`${API_BASE_URL}/anos-completos`);
        const data = await response.json();

        if (data.success) {
            let years = data.data;

            // Aplicar filtro de busca
            if (searchTerm.years) {
                const term = searchTerm.years.toLowerCase();
                years = years.filter(year =>
                    year.nome_marca.toLowerCase().includes(term) ||
                    year.nome_modelo.toLowerCase().includes(term) ||
                    year.ano.toString().includes(term)
                );
            }

            // Aplicar ordenação
            years.sort((a, b) => {
                const field = sortConfig.years.field;
                const order = sortConfig.years.order;
                const multiplier = order === 'asc' ? 1 : -1;

                if (field === 'id_ano') {
                    return (a.id_ano - b.id_ano) * multiplier;
                } else if (field === 'nome_modelo') {
                    return a.nome_modelo.localeCompare(b.nome_modelo) * multiplier;
                }
                return 0;
            });

            // Calcular paginação
            totalPages.years = Math.ceil(years.length / ITEMS_PER_PAGE);
            const startIndex = (currentPage.years - 1) * ITEMS_PER_PAGE;
            const paginatedYears = years.slice(startIndex, startIndex + ITEMS_PER_PAGE);

            // Renderizar anos
            renderYears(paginatedYears);
            renderPagination('years', totalPages.years, currentPage.years);
        } else {
            throw new Error(data.message || 'Erro ao carregar anos');
        }
    } catch (error) {
        console.error('Erro ao carregar anos:', error);
        showAlert('Erro ao carregar anos', 'danger');
    }
}

// Renderizar anos na tabela
function renderYears(years) {
    const tbody = document.getElementById('years-table-body');
    tbody.innerHTML = '';

    if (years.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum ano encontrado</td></tr>';
        return;
    }

    years.forEach(year => {
        const row = document.createElement('tr');

        row.innerHTML = `
                <td>${year.id_ano}</td>
                <td>${year.nome_marca} - ${year.nome_modelo}</td>
                <td>${year.ano}</td>
                <td class="action-buttons">
                    <button class="btn-warning action-btn" onclick="editYear(${year.id_ano})">Editar</button>
                    <button class="btn-danger action-btn" onclick="deleteYear(${year.id_ano})">Excluir</button>
                </td>
            `;

        tbody.appendChild(row);
    });
}

// ========== FUNÇÕES DO MODAL DE EDIÇÃO ==========

// Função para abrir modal de edição
async function openEditWorkshopModal(id) {
    console.log('📝 Abrindo modal para editar oficina ID:', id);

    try {
        // Buscar dados da oficina
        const response = await fetch(`${API_BASE_URL}/oficina-completa/${id}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar dados da oficina');
        }

        const data = await response.json();
        console.log('📦 Dados recebidos:', data);

        if (data.success && data.oficina) {
            const oficina = data.oficina;

            // Preencher o formulário do modal
            document.getElementById('edit-workshop-id').value = oficina.id;
            document.getElementById('edit-workshop-name').value = oficina.nome || '';
            document.getElementById('edit-workshop-email').value = oficina.email || '';
            document.getElementById('edit-workshop-password').value = '';
            document.getElementById('edit-workshop-address').value = oficina.endereco || '';
            document.getElementById('edit-workshop-city').value = oficina.cidade || '';
            document.getElementById('edit-workshop-state').value = oficina.estado || '';
            document.getElementById('edit-workshop-cep').value = oficina.cep || '';
            document.getElementById('edit-workshop-phone').value = oficina.telefone || '';

            // Converter horários
            const horarioAbertura = oficina.horario_abertura ?
                oficina.horario_abertura.substring(0, 5) : '';
            const horarioFechamento = oficina.horario_fechamento ?
                oficina.horario_fechamento.substring(0, 5) : '';

            document.getElementById('edit-workshop-opening').value = horarioAbertura;
            document.getElementById('edit-workshop-closing').value = horarioFechamento;

            document.getElementById('edit-workshop-days').value = oficina.dias_funcionamento || '';
            document.getElementById('edit-workshop-lat').value = oficina.lat || '';
            document.getElementById('edit-workshop-lng').value = oficina.lng || '';

            // Abrir o modal
            document.getElementById('edit-workshop-modal').style.display = 'flex';

            console.log('✅ Modal preenchido e aberto com sucesso!');

        } else {
            throw new Error(data.message || 'Oficina não encontrada');
        }
    } catch (error) {
        console.error('❌ Erro ao abrir modal:', error);
        showAlert('Erro ao carregar dados da oficina: ' + error.message, 'danger');
    }
}

// Função para fechar modal
function closeEditModal() {
    document.getElementById('edit-workshop-modal').style.display = 'none';
    document.getElementById('edit-workshop-form').reset();
}

// Função para atualizar oficina - VERSÃO COM VALIDAÇÕES
async function updateWorkshop() {
    const id = document.getElementById('edit-workshop-id').value;

    // Coletar todos os dados do formulário
    const workshopData = {
        nome: document.getElementById('edit-workshop-name').value,
        email: document.getElementById('edit-workshop-email').value,
        senha: document.getElementById('edit-workshop-password').value,
        endereco: document.getElementById('edit-workshop-address').value,
        cidade: document.getElementById('edit-workshop-city').value,
        estado: document.getElementById('edit-workshop-state').value,
        cep: document.getElementById('edit-workshop-cep').value,
        telefone: document.getElementById('edit-workshop-phone').value,
        horario_abertura: document.getElementById('edit-workshop-opening').value,
        horario_fechamento: document.getElementById('edit-workshop-closing').value,
        dias_funcionamento: document.getElementById('edit-workshop-days').value,
        lat: document.getElementById('edit-workshop-lat').value,
        lng: document.getElementById('edit-workshop-lng').value
    };

    // Validações no frontend
    if (!workshopData.nome || !workshopData.email ||
        !workshopData.endereco || !workshopData.cidade || !workshopData.estado ||
        !workshopData.cep || !workshopData.telefone) {
        showAlert('Por favor, preencha todos os campos obrigatórios.', 'danger');
        return;
    }

    // Validação de latitude
    if (workshopData.lat) {
        const latNum = parseFloat(workshopData.lat);
        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            showAlert('Latitude deve ser um número entre -90 e 90.', 'danger');
            return;
        }
    }

    // Validação de longitude
    if (workshopData.lng) {
        const lngNum = parseFloat(workshopData.lng);
        if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            showAlert('Longitude deve ser um número entre -180 e 180.', 'danger');
            return;
        }
    }

    console.log('📤 Atualizando oficina ID:', id, 'Dados:', workshopData);

    try {
        // Mostrar loading no botão
        const submitBtn = document.querySelector('#edit-workshop-form button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Atualizando...';
        submitBtn.disabled = true;

        const response = await fetch(`${API_BASE_URL}/oficina/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(workshopData)
        });

        // Restaurar botão
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        console.log('📡 Resposta do servidor:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Sucesso:', result);

            showAlert('Oficina atualizada com sucesso!', 'success');
            closeEditModal();
            loadWorkshops();

        } else {
            let errorMessage = 'Erro ao atualizar oficina';

            try {
                const errorData = await response.json();
                console.error('❌ Erro detalhado:', errorData);
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (parseError) {
                console.error('❌ Erro ao parsear resposta:', parseError);
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar oficina:', error);
        showAlert('Erro ao atualizar oficina: ' + error.message, 'danger');
    }
}

// ========== FUNÇÃO PARA EXCLUIR OFICINA - VERSÃO COMPLETA ==========

// Função para excluir oficina - VERSÃO COMPLETA
async function deleteWorkshop(id) {
    if (!confirm(`Tem certeza que deseja excluir a oficina ${id}?\n\nEsta ação é irreversível e excluirá todos os agendamentos relacionados.`)) {
        return;
    }

    console.log('🗑️ Iniciando exclusão da oficina ID:', id);

    try {
        // Mostrar loading
        showAlert('Excluindo oficina...', 'warning');

        const response = await fetch(`${API_BASE_URL}/oficina/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📡 Resposta do servidor:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Sucesso:', result);

            showAlert('Oficina excluída com sucesso!', 'success');
            loadWorkshops(); // Recarregar a lista

        } else {
            let errorMessage = 'Erro ao excluir oficina';

            try {
                const errorData = await response.json();
                console.error('❌ Erro detalhado:', errorData);
                errorMessage = errorData.error || errorData.message || errorMessage;

                // Mensagens específicas para diferentes códigos de status
                if (response.status === 404) {
                    errorMessage = 'Oficina não encontrada';
                } else if (response.status === 500) {
                    errorMessage = 'Erro interno do servidor ao excluir oficina';
                }

            } catch (parseError) {
                console.error('❌ Erro ao parsear resposta:', parseError);
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }

            throw new Error(errorMessage);
        }
    } catch (error) {
        console.error('❌ Erro ao excluir oficina:', error);
        showAlert('Erro ao excluir oficina: ' + error.message, 'danger');
    }
}

// ========== FUNÇÕES AUXILIARES ==========

// Mostrar alerta
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Inserir no início do container
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    // Remover após 5 segundos
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Renderizar paginação - VERSÃO CORRIGIDA
function renderPagination(type, totalPagesCount, currentPageNum) {
    const paginationContainer = document.getElementById(`${type}-pagination`);
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPagesCount <= 1) return;

    // Botão anterior
    const prevButton = document.createElement('button');
    prevButton.className = 'page-btn';
    prevButton.textContent = '«';
    prevButton.disabled = currentPageNum === 1;
    prevButton.addEventListener('click', () => {
        if (currentPageNum > 1) {
            currentPage[type] = currentPageNum - 1;
            loadDataByType(type);
        }
    });
    paginationContainer.appendChild(prevButton);

    // Páginas
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPageNum - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPagesCount, startPage + maxVisiblePages - 1);

    // Ajustar se estiver no início
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPageNum ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => {
            currentPage[type] = i;
            loadDataByType(type);
        });
        paginationContainer.appendChild(pageButton);
    }

    // Botão próximo
    const nextButton = document.createElement('button');
    nextButton.className = 'page-btn';
    nextButton.textContent = '»';
    nextButton.disabled = currentPageNum === totalPagesCount;
    nextButton.addEventListener('click', () => {
        if (currentPageNum < totalPagesCount) {
            currentPage[type] = currentPageNum + 1;
            loadDataByType(type);
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Carregar dados por tipo
function loadDataByType(type) {
    switch (type) {
        case 'products':
            loadProducts();
            break;
        case 'workshops':
            loadWorkshops();
            break;
        case 'brands':
            loadBrands();
            break;
        case 'models':
            loadModels();
            break;
        case 'years':
            loadYears();
            break;
    }
}

// Funções de edição (simuladas)
function editProduct(id, type) {
    showAlert(`Editando produto ${id} do tipo ${type}`, 'warning');
}

function editBrand(id) {
    showAlert(`Editando marca ${id}`, 'warning');
}

function editModel(id) {
    showAlert(`Editando modelo ${id}`, 'warning');
}

function editYear(id) {
    showAlert(`Editando ano ${id}`, 'warning');
}

// Funções de exclusão (simuladas)
function deleteProduct(id, type) {
    if (confirm(`Tem certeza que deseja excluir o produto ${id}?`)) {
        showAlert(`Produto ${id} excluído`, 'success');
        loadDataByType('products');
    }
}

function deleteBrand(id) {
    if (confirm(`Tem certeza que deseja excluir a marca ${id}?`)) {
        showAlert(`Marca ${id} excluída`, 'success');
        loadDataByType('brands');
    }
}

function deleteModel(id) {
    if (confirm(`Tem certeza que deseja excluir o modelo ${id}?`)) {
        showAlert(`Modelo ${id} excluído`, 'success');
        loadDataByType('models');
    }
}

function deleteYear(id) {
    if (confirm(`Tem certeza que deseja excluir o ano ${id}?`)) {
        showAlert(`Ano ${id} excluído`, 'success');
        loadDataByType('years');
    }
}

// ========== FUNÇÕES PARA EDITAR E EXCLUIR MARCAS ==========

// Abrir modal de edição de marca
async function editBrand(id) {
    console.log('📝 Editando marca ID:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/marca/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados da marca');
        }

        const brand = await response.json();

        // Preencher formulário do modal
        document.getElementById('edit-brand-id').value = brand.id;
        document.getElementById('edit-brand-name').value = brand.nome || '';

        // Abrir modal
        document.getElementById('edit-brand-modal').style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar marca:', error);
        showAlert('Erro ao carregar dados da marca: ' + error.message, 'danger');
    }
}

// Fechar modal de marca
function closeEditBrandModal() {
    document.getElementById('edit-brand-modal').style.display = 'none';
    document.getElementById('edit-brand-form').reset();
}

// Atualizar marca
async function updateBrand() {
    const id = document.getElementById('edit-brand-id').value;
    const nome = document.getElementById('edit-brand-name').value;

    if (!nome.trim()) {
        showAlert('Nome da marca é obrigatório', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/marca/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: nome.trim() })
        });

        if (response.ok) {
            showAlert('Marca atualizada com sucesso!', 'success');
            closeEditBrandModal();
            loadBrands();

            // Atualizar selects que usam marcas
            if (currentTab === 'models') {
                loadBrandsForSelect('model-brand');
                loadBrandsForSelect('edit-model-brand');
            }
        } else {
            throw new Error('Erro ao atualizar marca');
        }
    } catch (error) {
        showAlert('Erro ao atualizar marca: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Excluir marca
async function deleteBrand(id) {
    if (!confirm('Tem certeza que deseja excluir esta marca?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/marca/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Marca excluída com sucesso!', 'success');
            loadBrands();

            // Atualizar selects que usam marcas
            if (currentTab === 'models') {
                loadBrandsForSelect('model-brand');
                loadBrandsForSelect('edit-model-brand');
            }
        } else {
            throw new Error('Erro ao excluir marca');
        }
    } catch (error) {
        showAlert('Erro ao excluir marca: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// ========== FUNÇÕES PARA EDITAR E EXCLUIR MODELOS ==========

// Abrir modal de edição de modelo
async function editModel(id) {
    console.log('📝 Editando modelo ID:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/modelo/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do modelo');
        }

        const model = await response.json();

        // Preencher formulário do modal
        document.getElementById('edit-model-id').value = model.id;
        document.getElementById('edit-model-name').value = model.nome || '';
        document.getElementById('edit-model-type').value = model.tipo || 'carro';

        // Carregar marcas no select
        await loadBrandsForSelect('edit-model-brand');
        document.getElementById('edit-model-brand').value = model.marca_id || '';

        // Abrir modal
        document.getElementById('edit-model-modal').style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar modelo:', error);
        showAlert('Erro ao carregar dados do modelo: ' + error.message, 'danger');
    }
}

// Fechar modal de modelo
function closeEditModelModal() {
    document.getElementById('edit-model-modal').style.display = 'none';
    document.getElementById('edit-model-form').reset();
}

// Atualizar modelo
async function updateModel() {
    const id = document.getElementById('edit-model-id').value;
    const nome = document.getElementById('edit-model-name').value;
    const marca_id = document.getElementById('edit-model-brand').value;
    const tipo = document.getElementById('edit-model-type').value;

    if (!nome.trim() || !marca_id || !tipo) {
        showAlert('Todos os campos são obrigatórios', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/modelo/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: nome.trim(),
                marca_id: parseInt(marca_id),
                tipo: tipo
            })
        });

        if (response.ok) {
            showAlert('Modelo atualizado com sucesso!', 'success');
            closeEditModelModal();
            loadModels();

            // Atualizar selects que usam modelos
            if (currentTab === 'years') {
                loadModelsForSelect('year-model');
                loadModelsForSelect('edit-year-model');
            }
        } else {
            throw new Error('Erro ao atualizar modelo');
        }
    } catch (error) {
        showAlert('Erro ao atualizar modelo: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Excluir modelo
async function deleteModel(id) {
    if (!confirm('Tem certeza que deseja excluir este modelo?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/modelo/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Modelo excluído com sucesso!', 'success');
            loadModels();

            // Atualizar selects que usam modelos
            if (currentTab === 'years') {
                loadModelsForSelect('year-model');
                loadModelsForSelect('edit-year-model');
            }
        } else {
            throw new Error('Erro ao excluir modelo');
        }
    } catch (error) {
        showAlert('Erro ao excluir modelo: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// ========== FUNÇÕES PARA EDITAR E EXCLUIR ANOS ==========

// Abrir modal de edição de ano
async function editYear(id) {
    console.log('📝 Editando ano ID:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/ano-modelo/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do ano');
        }

        const year = await response.json();

        // Preencher formulário do modal
        document.getElementById('edit-year-id').value = year.id;
        document.getElementById('edit-year-value').value = year.ano || '';

        // Carregar modelos no select
        await loadModelsForSelect('edit-year-model');
        document.getElementById('edit-year-model').value = year.modelo_id || '';

        // Abrir modal
        document.getElementById('edit-year-modal').style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar ano:', error);
        showAlert('Erro ao carregar dados do ano: ' + error.message, 'danger');
    }
}

// Fechar modal de ano
function closeEditYearModal() {
    document.getElementById('edit-year-modal').style.display = 'none';
    document.getElementById('edit-year-form').reset();
}

// Atualizar ano
async function updateYear() {
    const id = document.getElementById('edit-year-id').value;
    const modelo_id = document.getElementById('edit-year-model').value;
    const ano = document.getElementById('edit-year-value').value;

    if (!modelo_id || !ano) {
        showAlert('Todos os campos são obrigatórios', 'danger');
        return;
    }

    if (ano < 1900 || ano > 2030) {
        showAlert('Ano deve estar entre 1900 e 2030', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/ano-modelo/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modelo_id: parseInt(modelo_id),
                ano: parseInt(ano)
            })
        });

        if (response.ok) {
            showAlert('Ano atualizado com sucesso!', 'success');
            closeEditYearModal();
            loadYears();
        } else {
            throw new Error('Erro ao atualizar ano');
        }
    } catch (error) {
        showAlert('Erro ao atualizar ano: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}

// Excluir ano
async function deleteYear(id) {
    if (!confirm('Tem certeza que deseja excluir este ano?\n\nEsta ação não pode ser desfeita.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/ano-modelo/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showAlert('Ano excluído com sucesso!', 'success');
            loadYears();
        } else {
            throw new Error('Erro ao excluir ano');
        }
    } catch (error) {
        showAlert('Erro ao excluir ano: ' + error.message, 'danger');
        console.error('Erro:', error);
    }
}



// Função para melhorar a confirmação de exclusão
function confirmDelete(productName, productType) {
    return confirm(`Tem certeza que deseja excluir o ${productType} "${productName}"?\n\nEsta ação não pode ser desfeita.`);
}

// Função para carregar detalhes do produto antes de excluir (opcional)
async function getProductDetails(id, tipo) {
    try {
        const endpoint = tipo === 'oleo' ? 'oleo' : 'filtro';
        const response = await fetch(`${API_BASE_URL}/produtos/${endpoint}/${id}`);
        
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar detalhes do produto:', error);
        return null;
    }
}
// Excluir produto com feedback visual
async function deleteProduct(id, tipo) {
    const tipoTexto = tipo === 'oleo' ? 'óleo' : 'filtro';
    
    // Buscar detalhes do produto para mostrar no confirm
    const productDetails = await getProductDetails(id, tipo);
    const productName = productDetails ? productDetails.nome : `ID ${id}`;
    
    if (!confirm(`Tem certeza que deseja excluir o ${tipoTexto} "${productName}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }

    try {
        const endpoint = tipo === 'oleo' ? 'oleo' : 'filtro';
        console.log(`🗑️ Excluindo ${tipoTexto} ID:`, id);
        
        // Mostrar loading
        showAlert(`Excluindo ${tipoTexto}...`, 'warning');
        
        const response = await fetch(`${API_BASE_URL}/produtos/${endpoint}/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showAlert(`${tipoTexto === 'óleo' ? 'Óleo' : 'Filtro'} "${productName}" excluído com sucesso!`, 'success');
            loadProducts();
        } else {
            throw new Error(result.error || `Erro ao excluir ${tipoTexto}`);
        }
    } catch (error) {
        console.error(`❌ Erro ao excluir ${tipoTexto}:`, error);
        showAlert(`Erro ao excluir ${tipoTexto}: ` + error.message, 'danger');
    }
}

// Abrir modal de edição de óleo
async function editProduct(id, tipo) {
    try {
        if (tipo === 'oleo') {
            await openEditOilModal(id);
        } else {
            await openEditFilterModal(id);
        }
    } catch (error) {
        console.error('Erro ao carregar produto para edição:', error);
        showAlert('Erro ao carregar dados do produto', 'danger');
    }
}

// Abrir modal de edição de óleo
async function openEditOilModal(id) {
    console.log('📝 Editando óleo ID:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/oleo/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do óleo');
        }

        const oil = await response.json();

        // Preencher formulário do modal
        document.getElementById('edit-oil-id').value = oil.id;
        document.getElementById('edit-oil-name').value = oil.nome || '';
        document.getElementById('edit-oil-type').value = oil.tipo || 'carro';
        document.getElementById('edit-oil-viscosity').value = oil.viscosidade || '';
        document.getElementById('edit-oil-specification').value = oil.especificacao || '';
        document.getElementById('edit-oil-brand').value = oil.marca || '';
        document.getElementById('edit-oil-price').value = oil.preco || '';

        // Abrir modal
        document.getElementById('edit-oil-modal').style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar óleo:', error);
        showAlert('Erro ao carregar dados do óleo: ' + error.message, 'danger');
    }
}

// Abrir modal de edição de filtro
async function openEditFilterModal(id) {
    console.log('📝 Editando filtro ID:', id);

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/filtro/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do filtro');
        }

        const filter = await response.json();

        // Preencher formulário do modal
        document.getElementById('edit-filter-id').value = filter.id;
        document.getElementById('edit-filter-name').value = filter.nome || '';
        document.getElementById('edit-filter-type').value = filter.tipo || 'carro';
        document.getElementById('edit-filter-compatibility').value = filter.compatibilidade_modelo || '';
        document.getElementById('edit-filter-price').value = filter.preco || '';

        // Abrir modal
        document.getElementById('edit-filter-modal').style.display = 'flex';

    } catch (error) {
        console.error('Erro ao carregar filtro:', error);
        showAlert('Erro ao carregar dados do filtro: ' + error.message, 'danger');
    }
}

// Fechar modal de óleo
function closeEditOilModal() {
    document.getElementById('edit-oil-modal').style.display = 'none';
    document.getElementById('edit-oil-form').reset();
}

// Fechar modal de filtro
function closeEditFilterModal() {
    document.getElementById('edit-filter-modal').style.display = 'none';
    document.getElementById('edit-filter-form').reset();
}
// Atualizar óleo
async function updateOil() {
    const id = document.getElementById('edit-oil-id').value;
    
    const oilData = {
        nome: document.getElementById('edit-oil-name').value,
        tipo: document.getElementById('edit-oil-type').value,
        viscosidade: document.getElementById('edit-oil-viscosity').value,
        especificacao: document.getElementById('edit-oil-specification').value,
        marca: document.getElementById('edit-oil-brand').value,
        preco: parseFloat(document.getElementById('edit-oil-price').value)
    };

    // Validações
    if (!oilData.nome || !oilData.tipo || !oilData.viscosidade || !oilData.especificacao || !oilData.marca || !oilData.preco) {
        showAlert('Todos os campos são obrigatórios', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/oleo/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(oilData)
        });

        if (response.ok) {
            showAlert('Óleo atualizado com sucesso!', 'success');
            closeEditOilModal();
            loadProducts();
        } else {
            throw new Error('Erro ao atualizar óleo');
        }
    } catch (error) {
        console.error('Erro ao atualizar óleo:', error);
        showAlert('Erro ao atualizar óleo: ' + error.message, 'danger');
    }
}

// Atualizar filtro
async function updateFilter() {
    const id = document.getElementById('edit-filter-id').value;
    
    const filterData = {
        nome: document.getElementById('edit-filter-name').value,
        tipo: document.getElementById('edit-filter-type').value,
        compatibilidade_modelo: document.getElementById('edit-filter-compatibility').value,
        preco: parseFloat(document.getElementById('edit-filter-price').value)
    };

    // Validações
    if (!filterData.nome || !filterData.tipo || !filterData.compatibilidade_modelo || !filterData.preco) {
        showAlert('Todos os campos são obrigatórios', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/produtos/filtro/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterData)
        });

        if (response.ok) {
            showAlert('Filtro atualizado com sucesso!', 'success');
            closeEditFilterModal();
            loadProducts();
        } else {
            throw new Error('Erro ao atualizar filtro');
        }
    } catch (error) {
        console.error('Erro ao atualizar filtro:', error);
        showAlert('Erro ao atualizar filtro: ' + error.message, 'danger');
    }
}