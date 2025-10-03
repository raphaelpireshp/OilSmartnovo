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
// Renderizar agendamentos na tabela - VERSÃO ATUALIZADA
// Renderizar agendamentos na tabela - VERSÃO CORRIGIDA
function renderAgendamentos(agendamentos) {
    const tbody = document.getElementById('agendamentosTable');
    if (!tbody) return;

    if (agendamentos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Nenhum agendamento encontrado</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = agendamentos.map(agendamento => `
        <tr>
            <td>
                <strong>${agendamento.cliente_nome}</strong>
                ${agendamento.cliente_email ? `<br><small>${agendamento.cliente_email}</small>` : ''}
            </td>
            <td>${agendamento.cliente_telefone}</td>
            <td>${agendamento.veiculo}</td>
            <td>
                <div class="servicos-list">
                    ${agendamento.servicos}
                </div>
                ${agendamento.total_servico ? `<div class="servico-total">R$ ${parseFloat(agendamento.total_servico || 0).toFixed(2)}</div>` : ''}
            </td>
            <td>${formatDate(agendamento.data_hora)}</td>
            <td>
                <span class="status-badge status-${agendamento.status || 'pendente'}">
                    ${getStatusText(agendamento.status || 'pendente')}
                    ${agendamento.divergencia ? ' <i class="fas fa-exclamation-triangle"></i>' : ''}
                </span>
                ${agendamento.cancelado_por ? `<br><small>Cancelado por: ${agendamento.cancelado_por}</small>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <!-- Botão Visualizar -->
                    <button class="btn btn-sm btn-outline" onclick="viewAgendamento(${agendamento.id})" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    <!-- Botão Registrar Divergência -->
                    ${(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && !agendamento.divergencia ? `
                        <button class="btn btn-sm btn-warning" onclick="registrarDivergencia(${agendamento.id})" title="Registrar Divergência">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                    ` : ''}
                    
                    <!-- Botão Concluir (só aparece quando o cliente fornecer o protocolo) -->
                    ${agendamento.status === 'confirmado' && agendamento.protocolo ? `
                        <button class="btn btn-sm btn-success" onclick="concluirAgendamento(${agendamento.id})" title="Concluir Agendamento">
                            <i class="fas fa-check-double"></i>
                        </button>
                    ` : ''}
                    
                    <!-- Botão Cancelar -->
                    ${agendamento.status === 'pendente' || agendamento.status === 'confirmado' ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelarAgendamento(${agendamento.id})" title="Cancelar">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    
                    <!-- Campo para inserir protocolo (APARECE SEMPRE para agendamentos pendentes/confirmados SEM protocolo) -->
                    ${(agendamento.status === 'pendente' || agendamento.status === 'confirmado') && !agendamento.protocolo ? `
                        <div class="protocol-input-container" style="margin-top: 5px;">
                            <input type="text" 
                                   id="protocol-input-${agendamento.id}" 
                                   placeholder="Digite o protocolo do cliente"
                                   class="protocol-input"
                                   style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; width: 120px;">
                            <button class="btn btn-sm btn-info" onclick="adicionarProtocolo(${agendamento.id})" title="Adicionar Protocolo" style="margin-left: 5px;">
                                <i class="fas fa-tag"></i> Add
                            </button>
                        </div>
                    ` : ''}


                </div>
            </td>
        </tr>
    `).join('');
}

// Adicionar protocolo ao agendamento
// Adicionar protocolo ao agendamento - VERSÃO MELHORADA
async function adicionarProtocolo(id) {
    const inputElement = document.getElementById(`protocol-input-${id}`);
    
    if (!inputElement) {
        const protocolo = prompt('Digite o protocolo fornecido pelo cliente:');
        if (protocolo && protocolo.trim() !== '') {
            await enviarProtocolo(id, protocolo.trim());
        }
        return;
    }

    const protocolo = inputElement.value.trim();
    
    if (!protocolo) {
        showNotification('Por favor, digite o protocolo do cliente', 'warning');
        inputElement.focus();
        return;
    }

    await enviarProtocolo(id, protocolo);
}

async function enviarProtocolo(id, protocolo) {
    try {
        const response = await apiCall(`/api/admin/agendamentos/${id}/protocolo`, {
            method: 'PUT',
            body: JSON.stringify({ 
                protocolo: protocolo,
                status: 'confirmado' // Muda automaticamente para confirmado quando adiciona protocolo
            })
        });

        if (response.ok) {
            showNotification('✅ Protocolo adicionado com sucesso! Agora você pode concluir o agendamento quando o serviço for finalizado.', 'success');
            loadAgendamentos();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Erro ao adicionar protocolo', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar protocolo:', error);
        showNotification('Erro ao adicionar protocolo', 'error');
    }
}

// Registrar divergência
// CORRIGIR a função registrarDivergencia no adm.js
async function registrarDivergencia(id) {
    const divergencia = prompt('Descreva a divergência encontrada (ex: Cliente não compareceu, Veículo diferente do agendado, etc.):');
    
    if (divergencia && divergencia.trim() !== '') {
        try {
            console.log('🎯 Registrando divergência para agendamento:', id);
            console.log('📝 Divergência:', divergencia);
            
            const response = await apiCall(`/api/admin/agendamentos/${id}/divergencia`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    divergencia: divergencia.trim(),
                    status: 'divergencia'
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                showNotification('✅ Divergência registrada com sucesso! O cliente será notificado.', 'warning');
                
                // Recarregar a lista de agendamentos
                setTimeout(() => {
                    loadAgendamentos();
                }, 1000);
            } else {
                throw new Error(data.message || 'Erro ao registrar divergência');
            }
        } catch (error) {
            console.error('❌ Erro ao registrar divergência:', error);
            showNotification('❌ Erro ao registrar divergência: ' + error.message, 'error');
        }
    } else if (divergencia !== null) {
        showNotification('❌ É necessário informar a divergência', 'warning');
    }
}

// Concluir agendamento (quando o cliente fornecer o protocolo)
async function concluirAgendamento(id) {
    if (confirm('Deseja marcar este agendamento como CONCLUÍDO?\n\nEsta ação não pode ser desfeita.')) {
        try {
            const response = await apiCall(`/api/admin/agendamentos/${id}/concluir`, {
                method: 'PUT'
            });

            if (response.ok) {
                showNotification('Agendamento concluído com sucesso!', 'success');
                loadAgendamentos();
            } else {
                const data = await response.json();
                showNotification(data.message || 'Erro ao concluir agendamento', 'error');
            }
        } catch (error) {
            console.error('Erro ao concluir agendamento:', error);
            showNotification('Erro ao concluir agendamento', 'error');
        }
    }
}

// Cancelar agendamento - VERSÃO MELHORADA
// Cancelar agendamento - VERSÃO MELHORADA
async function cancelarAgendamento(id) {
    const motivo = prompt('Digite o motivo do cancelamento (este motivo será visível para o cliente):');
    
    if (motivo && motivo.trim() !== '') {
        if (confirm('Tem certeza que deseja cancelar este agendamento?\n\nO cliente será notificado sobre o cancelamento.')) {
            try {
                const response = await apiCall(`/api/admin/agendamentos/${id}/cancelar`, {
                    method: 'PUT',
                    body: JSON.stringify({ 
                        status: 'cancelado',
                        motivo_cancelamento: motivo.trim(),
                        cancelado_por: 'oficina'
                    })
                });

                if (response.ok) {
                    showNotification('Agendamento cancelado com sucesso! O cliente será notificado.', 'info');
                    loadAgendamentos();
                }
            } catch (error) {
                console.error('Erro ao cancelar agendamento:', error);
                showNotification('Erro ao cancelar agendamento', 'error');
            }
        }
    } else if (motivo !== null) {
        showNotification('É necessário informar o motivo do cancelamento', 'warning');
    }
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

// Visualizar detalhes do agendamento - VERSÃO ATUALIZADA
async function viewAgendamento(id) {
    try {
        const response = await apiCall(`/api/admin/agendamentos/${id}`);
        const data = await response.json();

        const agendamento = data.agendamento;

        // Preencher modal de detalhes
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

        // Mostrar motivo do cancelamento se existir
        if (agendamento.motivo_cancelamento) {
            document.getElementById('detailMotivo').textContent = agendamento.motivo_cancelamento;
            document.getElementById('motivoContainer').style.display = 'block';
        } else {
            document.getElementById('motivoContainer').style.display = 'none';
        }

        // Mostrar divergência se existir
if (agendamento.divergencia) {
    document.getElementById('detailDivergencia').textContent = agendamento.divergencia;
    document.getElementById('divergenciaContainer').style.display = 'block';
} else {
    document.getElementById('divergenciaContainer').style.display = 'none';
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
        'fora_prazo': 'Fora do Prazo',
        'divergencia': 'Com Divergência'
    };
    return statusMap[status] || status;
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<tr><td colspan="8" class="text-center"><div class="loading"></div></td></tr>';
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
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
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
// ===== Concluir agendamento pelo protocolo =====
document.getElementById("btnConcluir").addEventListener("click", concluirAgendamento);

async function concluirAgendamento() {
    const protocolo = document.getElementById("protocoloInput").value.trim();
    const msg = document.getElementById("msgConcluir");

    if (!protocolo) {
        msg.innerText = "Digite um protocolo válido.";
        msg.style.color = "red";
        return;
    }

    try {
        const response = await fetch("/api/admin/agendamentos/concluir", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ protocolo: protocolo })

        });

        const data = await response.json();
        msg.innerText = data.message;
        msg.style.color = data.success ? "green" : "red";

        if (data.success && typeof carregarAgendamentos === "function") {
            carregarAgendamentos(); // Atualiza a lista
        }
    } catch (error) {
        console.error("Erro:", error);
        msg.innerText = "Erro ao concluir agendamento.";
        msg.style.color = "red";
    }
}
// ===== Concluir agendamento por protocolo (campo único) =====
// Coloque no final do adm.js. Espera que exista um input com id="protocoloInput" e button id="btnConcluir" no admindex.html
if (document.getElementById('btnConcluir')) {
    document.getElementById('btnConcluir').addEventListener('click', concluirPorProtocolo);
}

// Função corrigida para concluir por protocolo
async function concluirPorProtocolo() {
    const input = document.getElementById('protocoloInput');
    const msgEl = document.getElementById('msgConcluir');
    
    if (!input) {
        console.error('❌ Input de protocolo não encontrado');
        return;
    }

    const protocolo = input.value.trim();
    
    if (!protocolo) {
        if (msgEl) { 
            msgEl.innerText = 'Digite um protocolo válido.'; 
            msgEl.style.color = 'red'; 
        }
        return;
    }

    console.log('🎯 Tentando concluir agendamento com protocolo:', protocolo);

    if (!confirm(`Concluir agendamento com protocolo ${protocolo}? Esta ação marcará como CONCLUÍDO.`)) {
        return;
    }

    try {
        // Mostrar loading
        if (msgEl) { 
            msgEl.innerText = 'Processando...'; 
            msgEl.style.color = 'blue'; 
        }

        // Tenta a rota principal primeiro
        let response = await fetch('/api/admin/agendamentos/concluir-por-protocolo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ protocolo })
        });

        // Se der 404, tenta a rota alternativa
        if (response.status === 404) {
            console.log('🔄 Tentando rota alternativa...');
            response = await fetch('/api/admin/concluir-protocolo', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ protocolo })
            });
        }

        // Log da resposta para debug
        console.log('📨 Status da resposta:', response.status);
        
        const data = await response.json();
        console.log('📨 Dados da resposta:', data);

        if (response.ok && data.success) {
            if (msgEl) { 
                msgEl.innerText = '✅ Agendamento concluído com sucesso!'; 
                msgEl.style.color = 'green'; 
            }
            
            // Limpar input
            input.value = '';
            
            // Atualizar lista de agendamentos
            setTimeout(() => {
                if (typeof loadAgendamentos === 'function') {
                    loadAgendamentos();
                }
                if (typeof loadDashboard === 'function') {
                    loadDashboard();
                }
            }, 1000);
            
        } else {
            let errorMsg = data.message || 'Erro ao concluir agendamento';
            
            if (msgEl) { 
                msgEl.innerText = `❌ ${errorMsg}`; 
                msgEl.style.color = 'red'; 
            }
        }
    } catch (err) {
        console.error('❌ Erro concluirPorProtocolo:', err);
        if (msgEl) { 
            msgEl.innerText = '❌ Erro de conexão. Tente novamente.'; 
            msgEl.style.color = 'red'; 
        }
    }
}

// Atualizar o event listener
if (document.getElementById('btnConcluir')) {
    document.getElementById('btnConcluir').addEventListener('click', concluirPorProtocolo);
}

// Função de debug para verificar protocolos no banco
async function debugProtocolos() {
    try {
        const response = await fetch('/api/admin/debug/protocolos', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.protocolos) {
            console.log('🔍 Todos os agendamentos e protocolos:');
            data.protocolos.forEach(ag => {
                console.log(`ID: ${ag.id}, Protocolo: "${ag.protocolo}", Status: ${ag.status}`);
            });
            
            // Mostrar também na interface
            const msgEl = document.getElementById('msgConcluir');
            if (msgEl) {
                msgEl.innerHTML = `Protocolos encontrados: ${data.protocolos.map(p => p.protocolo).join(', ')}`;
                msgEl.style.color = 'blue';
            }
        }
    } catch (error) {
        console.error('Erro no debug:', error);
    }
}

// Chamar esta função no console do navegador para debug
window.debugProtocolos = debugProtocolos;

// Chamar esta função no console do navegador para debug
window.debugProtocolos = debugProtocolos;
