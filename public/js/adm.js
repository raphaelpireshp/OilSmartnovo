// OilSmart - Sistema Administrativo
// adm.js - Funcionalidades JavaScript com Backend Integrado

// Variáveis globais
let currentPage = 'dashboard';
let currentUser = null;
const API_BASE = '/api';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    atualizarDataHora();
    setInterval(atualizarDataHora, 60000);
});

// Funções de autenticação
async function verificarAutenticacao() {
    try {
        const response = await fetch(`${API_BASE}/usuario`, {
            credentials: 'include'
        });

        if (response.ok) {
            currentUser = await response.json();
            mostrarDashboard();
        } else {
            mostrarLogin();
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        mostrarLogin();
    }
}

async function fazerLogin() {
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const errorMsg = document.getElementById('loginError');
    const btn = document.querySelector('#loginForm .auth-btn');

    btn.disabled = true;
    btn.innerHTML = '<div class="loading"></div> Entrando...';

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            errorMsg.style.display = 'none';
            mostrarDashboard();
        } else {
            errorMsg.textContent = data.error || 'Erro ao fazer login';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Erro de conexão. Tente novamente.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Entrar no Sistema';
    }
}

async function fazerCadastro() {
    const nome = document.getElementById('cadastroNome').value;
    const email = document.getElementById('cadastroEmail').value;
    const senha = document.getElementById('cadastroSenha').value;
    const confirmarSenha = document.getElementById('cadastroConfirmarSenha').value;
    const errorMsg = document.getElementById('cadastroError');
    const btn = document.querySelector('#cadastroForm .auth-btn');

    // Validação básica
    if (senha !== confirmarSenha) {
        errorMsg.textContent = 'As senhas não coincidem';
        errorMsg.style.display = 'block';
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="loading"></div> Criando conta...';

    try {
        const response = await fetch(`${API_BASE}/cadastro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Conta criada com sucesso! Faça login para continuar.');
            voltarParaLogin();
        } else {
            errorMsg.textContent = data.error || 'Erro ao criar conta';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Erro de conexão. Tente novamente.';
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Criar Conta';
    }
}

async function fazerLogout() {
    try {
        await fetch(`${API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    } finally {
        currentUser = null;
        mostrarLogin();
    }
}

// Função para mostrar o formulário de cadastro
function mostrarCadastro() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('cadastroCard').style.display = 'block';
}

// Função para voltar ao login
function voltarParaLogin() {
    document.getElementById('cadastroCard').style.display = 'none';
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('adminContainer').style.display = 'none';
    voltarParaLogin();
}

function mostrarDashboard() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'flex';
    
    // Atualizar informações do usuário na sidebar
    if (currentUser) {
        document.querySelector('.user-name').textContent = currentUser.nome;
        document.querySelector('.user-role').textContent = currentUser.tipo === 'admin' ? 'Super Admin' : 'Usuário';
    }
    
    carregarDadosDashboard();
    navegarPara('dashboard');
}

// Navegação
function navegarPara(pagina) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar a seção selecionada
    document.getElementById(pagina).classList.add('active');
    
    // Atualizar o menu ativo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[onclick="navegarPara('${pagina}')"]`).classList.add('active');
    
    // Atualizar título da página
    const titulos = {
        'dashboard': 'Dashboard',
        'produtos': 'Produtos',
        'vendas': 'Vendas',
        'funcionarios': 'Funcionários',
        'relatorios': 'Relatórios'
    };
    
    document.getElementById('pageTitle').textContent = titulos[pagina] || 'Dashboard';
    
    // Carregar dados específicos da página
    if (pagina === 'produtos') {
        carregarProdutos();
    } else if (pagina === 'vendas') {
        carregarVendas();
    } else if (pagina === 'funcionarios') {
        carregarFuncionarios();
    }
    
    currentPage = pagina;
}

// Dashboard
async function carregarDadosDashboard() {
    try {
        const response = await fetch(`${API_BASE}/dashboard/metricas`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const metricas = await response.json();
            atualizarMetricas(metricas);
            inicializarGraficos(metricas);
            carregarAtividadesRecentes(metricas);
        } else {
            console.error('Erro ao carregar métricas do dashboard');
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function atualizarMetricas(metricas) {
    document.getElementById('totalVendas').textContent = `R$ ${parseFloat(metricas.totalVendas.total).toFixed(2)}`;
    document.getElementById('totalProdutos').textContent = metricas.totalProdutos.total;
    document.getElementById('totalFuncionarios').textContent = metricas.totalFuncionarios.total;
    document.getElementById('vendasPendentes').textContent = metricas.vendasPendentes.total;
}

function inicializarGraficos(metricas) {
    const ctxVendas = document.getElementById('vendasChart').getContext('2d');
    const ctxCategorias = document.getElementById('categoriasChart').getContext('2d');
    
    // Gráfico de vendas mensais
    new Chart(ctxVendas, {
        type: 'line',
        data: {
            labels: metricas.vendasMes ? Object.keys(metricas.vendasMes).reverse() : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [{
                label: 'Vendas Mensais (R$)',
                data: metricas.vendasMes ? Object.values(metricas.vendasMes).map(m => m.total).reverse() : [12000, 19000, 15000, 18000, 22000, 21000],
                borderColor: '#b49434',
                backgroundColor: 'rgba(180, 148, 52, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Gráfico de categorias
    new Chart(ctxCategorias, {
        type: 'doughnut',
        data: {
            labels: metricas.produtosCategoria ? metricas.produtosCategoria.map(p => p.categoria) : ['Óleos', 'Filtros', 'Aditivos', 'Acessórios'],
            datasets: [{
                data: metricas.produtosCategoria ? metricas.produtosCategoria.map(p => p.quantidade) : [45, 25, 15, 15],
                backgroundColor: ['#b49434', '#213f57', '#d4b15f', '#384d5e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function carregarAtividadesRecentes(metricas) {
    const atividadesList = document.getElementById('atividadesList');
    atividadesList.innerHTML = '';

    if (metricas.vendasRecentes && metricas.vendasRecentes.length > 0) {
        metricas.vendasRecentes.forEach(venda => {
            const atividadeItem = document.createElement('div');
            atividadeItem.className = 'activity-item';
            
            atividadeItem.innerHTML = `
                <div class="activity-icon">
                    <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">Nova venda #${venda.id}</div>
                    <div class="activity-time">${formatarData(venda.data_venda)} - R$ ${venda.total.toFixed(2)}</div>
                </div>
            `;
            
            atividadesList.appendChild(atividadeItem);
        });
    }
}

// Produtos
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE}/produtos`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const produtos = await response.json();
            exibirProdutos(produtos);
        } else {
            console.error('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function exibirProdutos(produtos) {
    const produtosGrid = document.getElementById('produtosGrid');
    produtosGrid.innerHTML = '';
    
    if (produtos.length === 0) {
        produtosGrid.innerHTML = '<p class="text-center">Nenhum produto cadastrado.</p>';
        return;
    }
    
    produtos.forEach(produto => {
        const produtoCard = document.createElement('div');
        produtoCard.className = 'produto-card';
        
        produtoCard.innerHTML = `
            <div class="produto-imagem">
                ${produto.imagem ? `<img src="${produto.imagem}" alt="${produto.nome}">` : 
                  `<i class="fas fa-box-open"></i>`}
            </div>
            <div class="produto-info">
                <h3 class="produto-nome">${produto.nome}</h3>
                <p class="produto-detalhes">${produto.categoria} • ${produto.marca}</p>
                <p class="produto-detalhes">Estoque: ${produto.estoque}</p>
                <p class="produto-preco">R$ ${produto.preco.toFixed(2)}</p>
                <div class="produto-acoes">
                    <button class="btn btn-outline btn-sm" onclick="editarProduto(${produto.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="excluirProduto(${produto.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        produtosGrid.appendChild(produtoCard);
    });
}

function abrirModalProduto() {
    document.getElementById('produtoForm').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('produtoImagemPreview').innerHTML = '<div class="placeholder">Imagem do produto</div>';
    document.getElementById('modalProduto').classList.add('active');
}

async function salvarProduto() {
    const formData = new FormData();
    const id = document.getElementById('produtoId').value;
    const imagemInput = document.getElementById('produtoImagem');
    
    formData.append('nome', document.getElementById('produtoNome').value);
    formData.append('descricao', document.getElementById('produtoDescricao').value);
    formData.append('categoria', document.getElementById('produtoCategoria').value);
    formData.append('marca', document.getElementById('produtoMarca').value);
    formData.append('preco', document.getElementById('produtoPreco').value);
    formData.append('estoque', document.getElementById('produtoEstoque').value);
    
    if (imagemInput.files[0]) {
        formData.append('imagem', imagemInput.files[0]);
    }

    try {
        const url = id ? `${API_BASE}/produtos/${id}` : `${API_BASE}/produtos`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            credentials: 'include',
            body: formData
        });

        if (response.ok) {
            fecharModal('modalProduto');
            carregarProdutos();
            carregarDadosDashboard();
            mostrarMensagem('Produto salvo com sucesso!');
        } else {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar produto', 'error');
        }
    } catch (error) {
        mostrarMensagem('Erro de conexão. Tente novamente.', 'error');
    }
}

async function editarProduto(id) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const produto = await response.json();
            
            document.getElementById('produtoId').value = produto.id;
            document.getElementById('produtoNome').value = produto.nome;
            document.getElementById('produtoDescricao').value = produto.descricao || '';
            document.getElementById('produtoCategoria').value = produto.categoria;
            document.getElementById('produtoMarca').value = produto.marca;
            document.getElementById('produtoPreco').value = produto.preco;
            document.getElementById('produtoEstoque').value = produto.estoque;
            
            const preview = document.getElementById('produtoImagemPreview');
            if (produto.imagem) {
                preview.innerHTML = `<img src="${produto.imagem}" alt="${produto.nome}">`;
            } else {
                preview.innerHTML = '<div class="placeholder">Imagem do produto</div>';
            }
            
            document.getElementById('modalProduto').classList.add('active');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar produto', 'error');
    }
}

async function excluirProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        try {
            const response = await fetch(`${API_BASE}/produtos/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                carregarProdutos();
                carregarDadosDashboard();
                mostrarMensagem('Produto excluído com sucesso!');
            } else {
                mostrarMensagem('Erro ao excluir produto', 'error');
            }
        } catch (error) {
            mostrarMensagem('Erro de conexão. Tente novamente.', 'error');
        }
    }
}

// Funcionários
async function carregarFuncionarios() {
    try {
        const response = await fetch(`${API_BASE}/funcionarios`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const funcionarios = await response.json();
            exibirFuncionarios(funcionarios);
        } else {
            console.error('Erro ao carregar funcionários');
        }
    } catch (error) {
        console.error('Erro ao carregar funcionários:', error);
    }
}

function exibirFuncionarios(funcionarios) {
    const funcionariosGrid = document.getElementById('funcionariosGrid');
    funcionariosGrid.innerHTML = '';
    
    if (funcionarios.length === 0) {
        funcionariosGrid.innerHTML = '<p class="text-center">Nenhum funcionário cadastrado.</p>';
        return;
    }
    
    funcionarios.forEach(funcionario => {
        const funcionarioCard = document.createElement('div');
        funcionarioCard.className = 'funcionario-card';
        
        funcionarioCard.innerHTML = `
            <div class="funcionario-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="funcionario-info">
                <h3 class="funcionario-nome">${funcionario.nome}</h3>
                <p class="funcionario-detalhes">${funcionario.cargo}</p>
                <p class="funcionario-detalhes">${funcionario.email}</p>
                <p class="funcionario-detalhes">${funcionario.telefone}</p>
                <p class="funcionario-detalhes">
                    <span class="status-badge status-${funcionario.status}">${funcionario.status}</span>
                </p>
                <div class="funcionario-acoes">
                    <button class="btn btn-outline btn-sm" onclick="editarFuncionario(${funcionario.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="excluirFuncionario(${funcionario.id})">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        `;
        
        funcionariosGrid.appendChild(funcionarioCard);
    });
}

function abrirModalFuncionario() {
    document.getElementById('funcionarioForm').reset();
    document.getElementById('funcionarioId').value = '';
    document.getElementById('modalFuncionario').classList.add('active');
}

async function salvarFuncionario() {
    const id = document.getElementById('funcionarioId').value;
    const funcionario = {
        nome: document.getElementById('funcionarioNome').value,
        email: document.getElementById('funcionarioEmail').value,
        telefone: document.getElementById('funcionarioTelefone').value,
        cargo: document.getElementById('funcionarioCargo').value,
        departamento: document.getElementById('funcionarioDepartamento').value,
        status: document.getElementById('funcionarioStatus').value
    };

    try {
        const url = id ? `${API_BASE}/funcionarios/${id}` : `${API_BASE}/funcionarios`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(funcionario)
        });

        if (response.ok) {
            fecharModal('modalFuncionario');
            carregarFuncionarios();
            carregarDadosDashboard();
            mostrarMensagem('Funcionário salvo com sucesso!');
        } else {
            const error = await response.json();
            mostrarMensagem(error.error || 'Erro ao salvar funcionário', 'error');
        }
    } catch (error) {
        mostrarMensagem('Erro de conexão. Tente novamente.', 'error');
    }
}

async function editarFuncionario(id) {
    try {
        const response = await fetch(`${API_BASE}/funcionarios/${id}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const funcionario = await response.json();
            
            document.getElementById('funcionarioId').value = funcionario.id;
            document.getElementById('funcionarioNome').value = funcionario.nome;
            document.getElementById('funcionarioEmail').value = funcionario.email;
            document.getElementById('funcionarioTelefone').value = funcionario.telefone;
            document.getElementById('funcionarioCargo').value = funcionario.cargo;
            document.getElementById('funcionarioDepartamento').value = funcionario.departamento;
            document.getElementById('funcionarioStatus').value = funcionario.status;
            
            document.getElementById('modalFuncionario').classList.add('active');
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar funcionário', 'error');
    }
}

async function excluirFuncionario(id) {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
        try {
            const response = await fetch(`${API_BASE}/funcionarios/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                carregarFuncionarios();
                carregarDadosDashboard();
                mostrarMensagem('Funcionário excluído com sucesso!');
            } else {
                mostrarMensagem('Erro ao excluir funcionário', 'error');
            }
        } catch (error) {
            mostrarMensagem('Erro de conexão. Tente novamente.', 'error');
        }
    }
}

// Vendas
async function carregarVendas() {
    try {
        const response = await fetch(`${API_BASE}/vendas`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const vendas = await response.json();
            exibirVendas(vendas);
            atualizarResumoVendas(vendas);
        } else {
            console.error('Erro ao carregar vendas');
        }
    } catch (error) {
        console.error('Erro ao carregar vendas:', error);
    }
}

function exibirVendas(vendas) {
    const vendasTable = document.getElementById('vendasTable').querySelector('tbody');
    vendasTable.innerHTML = '';
    
    if (vendas.length === 0) {
        vendasTable.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma venda registrada.</td></tr>';
        return;
    }
    
    vendas.forEach(venda => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>#${venda.id}</td>
            <td>${formatarData(venda.data_venda)}</td>
            <td>${venda.cliente}</td>
            <td>${venda.total_itens} item(s)</td>
            <td>R$ ${venda.total.toFixed(2)}</td>
            <td><span class="status-badge status-${venda.status}">${venda.status}</span></td>
            <td>
                <button class="btn btn-outline btn-sm" onclick="detalhesVenda(${venda.id})">
                    <i class="fas fa-eye"></i> Detalhes
                </button>
            </td>
        `;
        
        vendasTable.appendChild(tr);
    });
}

function atualizarResumoVendas(vendas) {
    const totalVendas = vendas.reduce((total, venda) => total + venda.total, 0);
    const vendasConfirmadas = vendas.filter(v => v.status === 'confirmado').length;
    const vendasPendentes = vendas.filter(v => v.status === 'pendente').length;
    const mediaVendas = vendas.length > 0 ? totalVendas / vendas.length : 0;
    
    document.getElementById('resumoTotalVendas').textContent = `R$ ${totalVendas.toFixed(2)}`;
    document.getElementById('resumoVendasConfirmadas').textContent = vendasConfirmadas;
    document.getElementById('resumoVendasPendentes').textContent = vendasPendentes;
    document.getElementById('resumoMediaVendas').textContent = `R$ ${mediaVendas.toFixed(2)}`;
}

async function detalhesVenda(id) {
    try {
        const response = await fetch(`${API_BASE}/vendas/${id}`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const venda = await response.json();
            exibirDetalhesVenda(venda);
        }
    } catch (error) {
        mostrarMensagem('Erro ao carregar detalhes da venda', 'error');
    }
}

function exibirDetalhesVenda(venda) {
    const modal = document.getElementById('modalVendaDetalhes');
    const detalhes = modal.querySelector('.modal-body');
    
    detalhes.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>ID da Venda</label>
                <input type="text" value="#${venda.id}" readonly>
            </div>
            <div class="form-group">
                <label>Data</label>
                <input type="text" value="${formatarData(venda.data_venda)}" readonly>
            </div>
        </div>
        <div class="form-group">
            <label>Cliente</label>
            <input type="text" value="${venda.cliente}" readonly>
        </div>
        <div class="form-group">
            <label>Itens</label>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Preço Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${venda.itens.map(item => `
                        <tr>
                            <td>${item.produto_nome}</td>
                            <td>${item.quantidade}</td>
                            <td>R$ ${item.preco_unitario.toFixed(2)}</td>
                            <td>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Status</label>
                <input type="text" value="${venda.status}" readonly>
            </div>
            <div class="form-group">
                <label>Total</label>
                <input type="text" value="R$ ${venda.total.toFixed(2)}" readonly>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Utilitários
function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function atualizarDataHora() {
    const agora = new Date();
    const data = agora.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const hora = agora.toLocaleTimeString('pt-BR');
    
    document.getElementById('currentDate').textContent = data;
    document.getElementById('currentTime').textContent = hora;
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('collapsed');
    overlay.classList.toggle('active');
}

function mostrarMensagem(mensagem, tipo = 'success') {
    // Criar elemento de mensagem
    const mensagemEl = document.createElement('div');
    mensagemEl.className = `mensagem ${tipo}`;
    mensagemEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        background-color: ${tipo === 'error' ? '#dc3545' : '#28a745'};
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    mensagemEl.textContent = mensagem;
    
    document.body.appendChild(mensagemEl);
    
    // Remover após 3 segundos
    setTimeout(() => {
        mensagemEl.remove();
    }, 3000);
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    fazerLogin();
});

document.getElementById('cadastroForm').addEventListener('submit', function(e) {
    e.preventDefault();
    fazerCadastro();
});

document.getElementById('produtoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    salvarProduto();
});

document.getElementById('funcionarioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    salvarFuncionario();
});

// Fechar modais ao clicar no overlay
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Fechar sidebar ao clicar no overlay
document.getElementById('sidebarOverlay').addEventListener('click', function() {
    toggleSidebar();
});

// Preview de imagem
document.getElementById('produtoImagem').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('produtoImagemPreview');
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});