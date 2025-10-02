// adm.js - VERSÃO CORRIGIDA E COMPLETA

// Verificar autenticação
async function checkAuth() {
    try {
        const response = await fetch('/api/admin/check-auth', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.success) {
            window.location.href = '/login-adm.html';
            return null;
        }
        
        return data.admin;
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/login-adm.html';
        return null;
    }
}

// Fazer logout
async function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        try {
            await fetch('/api/admin/logout', { 
                method: 'POST',
                credentials: 'include'
            });
            window.location.href = '/login-adm.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            window.location.href = '/login-adm.html';
        }
    }
}

// API calls com sessão
async function apiCall(url, options = {}) {
    const defaultOptions = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (response.status === 401) {
        window.location.href = '/login-adm.html';
        throw new Error('Não autorizado');
    }

    return response;
}

// Carregar dados do dashboard
async function loadDashboard() {
    try {
        const response = await apiCall('/api/admin/dashboard');
        const data = await response.json();

        if (data.metrics) {
            document.getElementById('totalAgendamentos').textContent = data.metrics.totalAgendamentos;
            document.getElementById('agendamentosPendentes').textContent = data.metrics.agendamentosPendentes;
            document.getElementById('agendamentosConfirmados').textContent = data.metrics.agendamentosConfirmados;
            document.getElementById('agendamentosConcluidos').textContent = data.metrics.agendamentosConcluidos;
            document.getElementById('agendamentosRecentes').textContent = data.metrics.agendamentosRecentes;
            document.getElementById('valorTotal').textContent = `R$ ${data.metrics.valorTotal.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

// Carregar agendamentos da oficina logada
async function loadAgendamentos(status = 'todos') {
    try {
        showLoading('agendamentosTable');
        
        let url = '/api/admin/agendamentos';
        if (status !== 'todos') {
            url += `?status=${status}`;
        }

        const response = await apiCall(url);
        const data = await response.json();

        renderAgendamentos(data.agendamentos);
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        showNotification('Erro ao carregar agendamentos', 'error');
    } finally {
        hideLoading('agendamentosTable');
    }
}

// Renderizar agendamentos na tabela
function renderAgendamentos(agendamentos) {
    const tbody = document.getElementById('agendamentosTable');
    if (!tbody) return;

    if (agendamentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">Nenhum agendamento encontrado</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = agendamentos.map(agendamento => `
        <tr>
            <td>${agendamento.protocolo}</td>
            <td>${formatDate(agendamento.data_hora)}</td>
            <td>${agendamento.cliente_nome}</td>
            <td>${agendamento.cliente_telefone}</td>
            <td>${agendamento.veiculo}</td>
            <td>${agendamento.servicos}</td>
            <td>R$ ${parseFloat(agendamento.total_servico || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${agendamento.status || 'pendente'}">
                    ${getStatusText(agendamento.status || 'pendente')}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="viewAgendamento(${agendamento.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${agendamento.status === 'pendente' ? `
                    <button class="btn btn-sm btn-primary" onclick="updateStatus(${agendamento.id}, 'confirmado')" title="Confirmar">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showCancelModal(${agendamento.id})" title="Cancelar">
                        <i class="fas fa-times"></i>
                    </button>
                    ` : ''}
                    ${agendamento.status === 'confirmado' ? `
                    <button class="btn btn-sm btn-success" onclick="updateStatus(${agendamento.id}, 'concluido')" title="Concluir">
                        <i class="fas fa-check-double"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Carregar estoque
async function loadEstoque() {
    try {
        showLoading('estoqueTable');
        const response = await apiCall('/api/admin/estoque');
        const data = await response.json();

        renderEstoque(data.estoque);
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        showNotification('Erro ao carregar estoque', 'error');
    } finally {
        hideLoading('estoqueTable');
    }
}

// Renderizar estoque
function renderEstoque(estoque) {
    const tbody = document.getElementById('estoqueTable');
    if (!tbody) return;

    if (estoque.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    Nenhum item em estoque
                    <br>
                    <button class="btn btn-primary mt-2" onclick="showAddProductModal()">
                        <i class="fas fa-plus"></i> Adicionar Produto
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = estoque.map(item => `
        <tr>
            <td>${item.nome_produto}</td>
            <td>${item.marca}</td>
            <td>${item.tipo_produto}</td>
            <td>
                <input type="number"
                    value="${item.quantidade}"
                    min="0"
                    onchange="updateEstoque(${item.id}, this.value)"
                    class="quantity-input">
            </td>
            <td>R$ ${parseFloat(item.preco || 0).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeProduct(${item.id})" title="Remover">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Atualizar estoque
async function updateEstoque(id, quantidade) {
    try {
        const response = await apiCall(`/api/admin/estoque/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ quantidade: parseInt(quantidade) })
        });

        if (response.ok) {
            showNotification('Estoque atualizado com sucesso!', 'success');
            loadEstoque();
        }
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        showNotification('Erro ao atualizar estoque', 'error');
    }
}

// Remover produto
async function removeProduct(id) {
    if (confirm('Tem certeza que deseja remover este produto do estoque?')) {
        try {
            const response = await apiCall(`/api/admin/estoque/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Produto removido com sucesso!', 'success');
                loadEstoque();
            }
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            showNotification('Erro ao remover produto', 'error');
        }
    }
}

// Mostrar modal para adicionar produto
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Adicionar Produto</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addProductForm">
                    <div class="form-group">
                        <label for="productName">Nome do Produto</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productBrand">Marca</label>
                        <input type="text" id="productBrand" required>
                    </div>
                    <div class="form-group">
                        <label for="productType">Tipo</label>
                        <select id="productType" required>
                            <option value="">Selecione o tipo</option>
                            <option value="Óleo">Óleo</option>
                            <option value="Filtro">Filtro</option>
                            <option value="Peça">Peça</option>
                            <option value="Acessório">Acessório</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="productQuantity">Quantidade</label>
                        <input type="number" id="productQuantity" min="0" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Preço (R$)</label>
                        <input type="number" id="productPrice" min="0" step="0.01" required>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addProduct()">Adicionar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Fechar modal
function closeModal(button) {
    const modal = button.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Adicionar produto
async function addProduct() {
    const productName = document.getElementById('productName').value;
    const productBrand = document.getElementById('productBrand').value;
    const productType = document.getElementById('productType').value;
    const productQuantity = document.getElementById('productQuantity').value;
    const productPrice = document.getElementById('productPrice').value;

    if (!productName || !productBrand || !productType) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    try {
        const response = await apiCall('/api/admin/estoque', {
            method: 'POST',
            body: JSON.stringify({
                nome_produto: productName,
                marca: productBrand,
                tipo_produto: productType,
                quantidade: parseInt(productQuantity),
                preco: parseFloat(productPrice)
            })
        });

        if (response.ok) {
            showNotification('Produto adicionado com sucesso!', 'success');
            closeModal(document.querySelector('#addProductForm'));
            loadEstoque();
        }
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showNotification('Erro ao adicionar produto', 'error');
    }
}

// Atualizar status do agendamento
async function updateStatus(id, status) {
    try {
        const response = await apiCall(`/api/admin/agendamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            showNotification('Status atualizado com sucesso!', 'success');
            loadAgendamentos();
        }
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error);
        showNotification('Erro ao atualizar agendamento', 'error');
    }
}

// Mostrar modal de cancelamento
function showCancelModal(id) {
    const motivo = prompt('Digite o motivo do cancelamento:');
    if (motivo !== null && motivo.trim() !== '') {
        updateStatus(id, 'cancelado');
    }
}

// Visualizar detalhes do agendamento
async function viewAgendamento(id) {
    try {
        const response = await apiCall(`/api/admin/agendamentos/${id}`);
        const data = await response.json();

        const agendamento = data.agendamento;

        // Preencher modal de detalhes
        document.getElementById('detailProtocolo').textContent = agendamento.protocolo;
        document.getElementById('detailData').textContent = formatDate(agendamento.data_hora);
        document.getElementById('detailCliente').textContent = agendamento.cliente_nome;
        document.getElementById('detailCpf').textContent = agendamento.cliente_cpf || 'Não informado';
        document.getElementById('detailTelefone').textContent = agendamento.cliente_telefone;
        document.getElementById('detailEmail').textContent = agendamento.cliente_email;
        document.getElementById('detailVeiculo').textContent = agendamento.veiculo;
        document.getElementById('detailServicos').textContent = agendamento.servicos;
        document.getElementById('detailTotal').textContent = `R$ ${parseFloat(agendamento.total_servico || 0).toFixed(2)}`;
        document.getElementById('detailStatus').textContent = getStatusText(agendamento.status || 'pendente');
        document.getElementById('detailStatus').className = `status-badge status-${agendamento.status || 'pendente'}`;

        if (agendamento.motivo_cancelamento) {
            document.getElementById('detailMotivo').textContent = agendamento.motivo_cancelamento;
            document.getElementById('motivoContainer').style.display = 'block';
        } else {
            document.getElementById('motivoContainer').style.display = 'none';
        }

        // Mostrar modal
        showModal('agendamentoDetailModal');
    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        showNotification('Erro ao carregar detalhes do agendamento', 'error');
    }
}

// Carregar relatórios
async function loadRelatorios() {
    try {
        const dataInicio = document.getElementById('relatorioDataInicio').value;
        const dataFim = document.getElementById('relatorioDataFim').value;

        let url = '/api/admin/relatorios/agendamentos';
        if (dataInicio && dataFim) {
            url += `?data_inicio=${dataInicio}&data_fim=${dataFim}`;
        }

        const response = await apiCall(url);
        const data = await response.json();

        renderRelatorios(data.relatorio);
    } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
        showNotification('Erro ao carregar relatórios', 'error');
    }
}

// Renderizar relatórios
function renderRelatorios(relatorio) {
    const tbody = document.getElementById('relatoriosTable');
    if (!tbody) return;

    if (relatorio.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center">Nenhum dado encontrado para o período</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = relatorio.map(item => `
        <tr>
            <td>${getStatusText(item.status)}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${parseFloat(item.valor_total || 0).toFixed(2)}</td>
        </tr>
    `).join('');
}

// Utilitários
function formatDate(dateString) {
    if (!dateString) return 'Não definida';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function getStatusText(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmado': 'Confirmado',
        'concluido': 'Concluído',
        'cancelado': 'Cancelado',
        'fora_prazo': 'Fora do Prazo'
    };
    return statusMap[status] || status;
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<tr><td colspan="10" class="text-center"><div class="loading"></div></td></tr>';
    }
}

function hideLoading(elementId) {
    // Implementação básica - pode ser expandida conforme necessário
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Navegação entre seções
function showSection(sectionId) {
    // Esconder todas as seções
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar seção selecionada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Atualizar menu ativo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Atualizar título da página
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const sectionTitles = {
            'dashboard': 'Dashboard',
            'agendamentos': 'Agendamentos',
            'estoque': 'Estoque',
            'relatorios': 'Relatórios'
        };
        pageTitle.textContent = sectionTitles[sectionId] || 'Dashboard';
    }

    // Carregar dados específicos da seção
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'agendamentos':
            loadAgendamentos();
            break;
        case 'estoque':
            loadEstoque();
            break;
        case 'relatorios':
            loadRelatorios();
            break;
    }
}

// Toggle sidebar (para responsividade)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
}

// Atualizar data e hora
function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('pt-BR');
    }
    
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('pt-BR');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    const admin = await checkAuth();
    if (admin) {
        // Atualizar informações do usuário na interface
        const userNameElement = document.getElementById('userName');
        const oficinaNameElement = document.getElementById('oficinaName');
        const sidebarUserNameElement = document.getElementById('sidebarUserName');
        const sidebarUserRoleElement = document.getElementById('sidebarUserRole');
        
        if (userNameElement) userNameElement.textContent = admin.nome;
        if (oficinaNameElement) oficinaNameElement.textContent = admin.oficina_nome;
        if (sidebarUserNameElement) sidebarUserNameElement.textContent = admin.nome;
        if (sidebarUserRoleElement) sidebarUserRoleElement.textContent = 'Oficina';

        // Event listeners
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
        
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

        // Filtros
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                loadAgendamentos(this.value);
            });
        }

        const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
        if (gerarRelatorioBtn) gerarRelatorioBtn.addEventListener('click', loadRelatorios);

        // Fechar modais
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Atualizar data e hora
        updateDateTime();
        setInterval(updateDateTime, 1000);

        // Carregar dashboard inicial
        loadDashboard();
    }
});