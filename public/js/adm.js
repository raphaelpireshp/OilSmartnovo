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
// Renderizar estoque na tabela
function renderEstoqueCompleto(estoque) {
    const tbody = document.getElementById('estoqueTable');
    if (!tbody) return;

    if (estoque.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Nenhum produto encontrado</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = estoque.map(item => `
        <tr>
            <td>${item.produto_nome || 'N/A'}</td>
            <td>${item.marca || 'Geral'}</td>
            <td>${item.tipo_produto}</td>
            <td>${item.quantidade}</td>
            <td>R$ ${parseFloat(item.preco || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${item.status || 'ativo'}">
                    ${item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Ativo'}
                </span>
            </td>
            <td>${formatDate(item.cadastrado_em) || 'N/A'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="editProduto(${item.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduto(${item.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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


// Mostrar modal para adicionar produto
// adm.js - ATUALIZAÇÕES PARA ESTOQUE POR VEÍCULO

// ==================== FUNÇÕES PARA MODAIS ====================

// Modal para adicionar produto simples (óleo ou filtro)
function showAddProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Adicionar Produto Simples</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addProductForm">
                    <div class="form-group">
                        <label for="productType">Tipo de Produto</label>
                        <select id="productType" required onchange="toggleProductFields()">
                            <option value="">Selecione o tipo</option>
                            <option value="oleo">Óleo</option>
                            <option value="filtro">Filtro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="productName">Nome do Produto</label>
                        <input type="text" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productBrand">Marca do Produto</label>
                        <input type="text" id="productBrand" required>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Preço (R$)</label>
                        <input type="number" id="productPrice" min="0" step="0.01" required>
                    </div>
                    <!-- Campos específicos para óleo -->
                    <div id="oilFields" style="display: none;">
                        <div class="form-group">
                            <label for="oilViscosity">Viscosidade</label>
                            <input type="text" id="oilViscosity" placeholder="Ex: 5W-30">
                        </div>
                        <div class="form-group">
                            <label for="oilSpecification">Especificação</label>
                            <input type="text" id="oilSpecification" placeholder="Ex: API SN/CF">
                        </div>
                    </div>
                    <!-- Campos específicos para filtro -->
                    <div id="filterFields" style="display: none;">
                        <div class="form-group">
                            <label for="filterCompatibility">Compatibilidade</label>
                            <input type="text" id="filterCompatibility" placeholder="Ex: Compatível com Honda Civic">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addProductSimple()">Adicionar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Alternar campos específicos do produto
function toggleProductFields() {
    const productType = document.getElementById('productType').value;
    const oilFields = document.getElementById('oilFields');
    const filterFields = document.getElementById('filterFields');
    
    if (oilFields) oilFields.style.display = productType === 'oleo' ? 'block' : 'none';
    if (filterFields) filterFields.style.display = productType === 'filtro' ? 'block' : 'none';
}

// Modal para adicionar produto por veículo
function showVehicleProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Adicionar Produto por Veículo</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="vehicleProductForm">
                    <!-- Seleção de Veículo -->
                    <div class="form-section">
                        <h4>Selecionar Veículo</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicleBrand">Marca</label>
                                <select id="vehicleBrand" required onchange="loadVehicleModels(this.value)">
                                    <option value="">Selecione a marca</option>
                                </select>
                                <button type="button" class="btn btn-sm btn-outline" onclick="showAddBrandModal()" style="margin-top: 5px;">
                                    <i class="fas fa-plus"></i> Nova Marca
                                </button>
                            </div>
                            <div class="form-group">
                                <label for="vehicleModel">Modelo</label>
                                <select id="vehicleModel" required onchange="loadVehicleYears(this.value)" disabled>
                                    <option value="">Selecione o modelo</option>
                                </select>
                                <button type="button" class="btn btn-sm btn-outline" onclick="showAddModelModal()" style="margin-top: 5px;">
                                    <i class="fas fa-plus"></i> Novo Modelo
                                </button>
                            </div>
                            <div class="form-group">
                                <label for="vehicleYear">Ano</label>
                                <select id="vehicleYear" required disabled>
                                    <option value="">Selecione o ano</option>
                                </select>
                                <button type="button" class="btn btn-sm btn-outline" onclick="showAddYearModal()" style="margin-top: 5px;">
                                    <i class="fas fa-plus"></i> Novo Ano
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seleção de Produto -->
                    <div class="form-section">
                        <h4>Selecionar Produto</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productTypeVehicle">Tipo</label>
                                <select id="productTypeVehicle" required onchange="loadVehicleProducts()">
                                    <option value="">Selecione o tipo</option>
                                    <option value="oleo">Óleo</option>
                                    <option value="filtro">Filtro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vehicleProduct">Produto</label>
                                <select id="vehicleProduct" required disabled>
                                    <option value="">Selecione o produto</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Preço -->
                    <div class="form-section">
                        <h4>Preço</h4>
                        <div class="form-group">
                            <label for="vehiclePrice">Preço (R$)</label>
                            <input type="number" id="vehiclePrice" min="0" step="0.01" required>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addVehicleProduct()">Adicionar ao Estoque</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadVehicleBrands();
}

// ==================== FUNÇÕES PARA ADICIONAR DADOS ====================

// Adicionar produto simples
async function addProductSimple() {
    const productType = document.getElementById('productType').value;
    const productName = document.getElementById('productName').value;
    const productBrand = document.getElementById('productBrand').value;
    const productPrice = document.getElementById('productPrice').value;

    if (!productType || !productName || !productBrand || !productPrice) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }

    const productData = {
        nome: productName,
        tipo: productType,
        marca: productBrand,
        preco: parseFloat(productPrice)
    };

    // Adicionar campos específicos
    if (productType === 'oleo') {
        productData.viscosidade = document.getElementById('oilViscosity').value;
        productData.especificacao = document.getElementById('oilSpecification').value;
    } else if (productType === 'filtro') {
        productData.compatibilidade_modelo = document.getElementById('filterCompatibility').value;
    }

    try {
        const response = await apiCall('/api/admin/estoque/produto-simples', {
            method: 'POST',
            body: JSON.stringify(productData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Produto adicionado com sucesso!', 'success');
            closeModal(document.querySelector('#addProductForm'));
            // Recarregar lista de produtos se estiver no modal de veículo
            if (document.getElementById('productTypeVehicle')) {
                loadVehicleProducts();
            }
        } else {
            showNotification(data.message || 'Erro ao adicionar produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        showNotification('Erro ao adicionar produto', 'error');
    }
}

// Adicionar produto por veículo
async function addVehicleProduct() {
    const brandId = document.getElementById('vehicleBrand').value;
    const modelId = document.getElementById('vehicleModel').value;
    const yearId = document.getElementById('vehicleYear').value;
    const productType = document.getElementById('productTypeVehicle').value;
    const productId = document.getElementById('vehicleProduct').value;
    const price = document.getElementById('vehiclePrice').value;
    
    // Validações
    if (!brandId || !modelId || !yearId || !productType || !productId || !price) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        const productData = {
            produto_id: productId,
            tipo_produto: productType,
            modelo_ano_id: yearId,
            preco: parseFloat(price)
        };
        
        const response = await apiCall('/api/admin/estoque/produto-veiculo', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Produto adicionado ao estoque com sucesso!', 'success');
            closeModal(document.querySelector('#vehicleProductForm'));
            loadEstoqueCompleto();
        } else {
            showNotification(data.message || 'Erro ao adicionar produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar produto por veículo:', error);
        showNotification('Erro ao adicionar produto', 'error');
    }
}

// ==================== FUNÇÕES PARA CARREGAR DADOS ====================

// ==================== FUNÇÕES CORRIGIDAS PARA ESTOQUE ====================

async function loadEstoqueCompleto() {
    try {
        showLoading('estoqueTable');
        
        // Tenta a rota completa primeiro, depois a simples
        let response = await apiCall('/api/admin/estoque');
        
        // Se der 404, tenta a rota simples
        if (response.status === 404) {
            console.log('Rota completa não encontrada, tentando rota simples...');
            response = await apiCall('/api/admin/estoque');
        }
        
        const data = await response.json();

        if (data.success) {
            if (data.estoque) {
                renderEstoqueCompleto(data.estoque);
            } else {
                // Se não tiver dados, mostra estado vazio
                renderEstoqueCompleto([]);
            }
        } else {
            showNotification('Erro ao carregar estoque: ' + (data.message || 'Erro desconhecido'), 'error');
            renderEstoqueCompleto([]);
        }
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        showNotification('Erro ao carregar estoque. Verifique o console.', 'error');
        renderEstoqueCompleto([]);
    } finally {
        hideLoading('estoqueTable');
    }
}

// ==================== FUNÇÕES CORRIGIDAS PARA HORÁRIOS ESPECIAIS ====================

async function loadSpecialHours() {
    try {
        console.log('Carregando horários especiais...');
        let response = await apiCall('/api/admin/horarios-especiais');
        
        // Se der 404, tenta criar a tabela primeiro
        if (response.status === 404) {
            console.log('Tabela de horários especiais não existe ainda');
            document.getElementById('specialHoursList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <p>Sistema de horários especiais não configurado</p>
                    <p class="small">As tabelas necessárias ainda não foram criadas</p>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (data.success && data.horarios_especiais) {
            renderSpecialHours(data.horarios_especiais);
        } else {
            document.getElementById('specialHoursList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>Nenhum horário especial configurado</p>
                    <button class="btn btn-primary mt-2" onclick="showAddSpecialHourModal()">
                        <i class="fas fa-plus"></i> Adicionar Primeiro Horário
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar horários especiais:', error);
        document.getElementById('specialHoursList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar horários especiais</p>
                <p class="small">${error.message}</p>
                <button class="btn btn-secondary mt-2" onclick="loadSpecialHours()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

async function loadExceptions() {
    try {
        console.log('Carregando exceções...');
        let response = await apiCall('/api/admin/horarios-excecoes');
        
        // Se der 404, tenta criar a tabela primeiro
        if (response.status === 404) {
            console.log('Tabela de exceções não existe ainda');
            document.getElementById('exceptionsList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tools"></i>
                    <p>Sistema de exceções não configurado</p>
                    <p class="small">As tabelas necessárias ainda não foram criadas</p>
                </div>
            `;
            return;
        }
        
        const data = await response.json();
        console.log('Exceções recebidas:', data);

        if (data.success && data.excecoes) {
            renderExceptions(data.excecoes);
        } else {
            document.getElementById('exceptionsList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Nenhuma exceção configurada</p>
                    <button class="btn btn-primary mt-2" onclick="showAddExceptionModal()">
                        <i class="fas fa-plus"></i> Adicionar Primeira Exceção
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar exceções:', error);
        document.getElementById('exceptionsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar exceções</p>
                <p class="small">${error.message}</p>
                <button class="btn btn-secondary mt-2" onclick="loadExceptions()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}
// Funções para intervalo entre agendamentos
function calcularCapacidadeAtendimento() {
    const intervaloSelecionado = document.querySelector('input[name="intervaloAgendamento"]:checked').value;
    const intervaloNum = parseInt(intervaloSelecionado);
    
    // Calcular horas de trabalho (considerando 8 horas por padrão)
    const horasTrabalho = 8; // 08:00 às 18:00 = 10 horas, mas considerando 8 horas líquidas
    const minutosTrabalho = horasTrabalho * 60;
    
    // Calcular número máximo de atendimentos
    const maxAtendimentos = Math.floor(minutosTrabalho / intervaloNum);
    
    // Atualizar display
    document.getElementById('intervaloSelecionado').textContent = 
        intervaloNum === 30 ? '30 minutos' : 
        intervaloNum === 45 ? '45 minutos' : 
        intervaloNum === 60 ? '1 hora' : 
        intervaloNum === 90 ? '1 hora e 30 minutos' : '2 horas';
    
    document.getElementById('totalAtendimentos').textContent = maxAtendimentos;
    
    console.log(`Intervalo: ${intervaloNum}min - Capacidade: ${maxAtendimentos} atendimentos`);
}

// Carregar configuração do intervalo
async function loadIntervaloConfig() {
    try {
        const response = await apiCall('/api/admin/configuracoes/intervalo');
        const data = await response.json();
        
        if (data.success && data.intervalo) {
            const radio = document.querySelector(`input[name="intervaloAgendamento"][value="${data.intervalo}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de intervalo:', error);
        // Usar valor padrão de 45 minutos
        const radio = document.querySelector('input[name="intervaloAgendamento"][value="45"]');
        if (radio) radio.checked = true;
    }
    
    calcularCapacidadeAtendimento();
}

// Salvar configuração do intervalo
async function salvarIntervaloConfig() {
    const intervalo = document.querySelector('input[name="intervaloAgendamento"]:checked').value;
    
    try {
        const response = await apiCall('/api/admin/configuracoes/intervalo', {
            method: 'PUT',
            body: JSON.stringify({ intervalo: parseInt(intervalo) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Intervalo entre agendamentos salvo com sucesso!', 'success');
            calcularCapacidadeAtendimento();
        } else {
            showNotification(data.message || 'Erro ao salvar intervalo', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar intervalo:', error);
        showNotification('Erro ao salvar intervalo entre agendamentos', 'error');
    }
}

// Event listeners para intervalo
document.addEventListener('DOMContentLoaded', function() {
    const intervaloRadios = document.querySelectorAll('input[name="intervaloAgendamento"]');
    intervaloRadios.forEach(radio => {
        radio.addEventListener('change', calcularCapacidadeAtendimento);
    });
    
    // Atualizar função salvarConfiguracoes para incluir o intervalo
    const originalSalvarConfiguracoes = window.salvarConfiguracoes;
    window.salvarConfiguracoes = async function() {
        await originalSalvarConfiguracoes();
        await salvarIntervaloConfig();
    };
    
    // Carregar configuração quando a seção for aberta
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        originalShowSection(sectionId);
        
        if (sectionId === 'configuracoes') {
            setTimeout(() => {
                loadIntervaloConfig();
            }, 100);
        }
    };
});

// ==================== FUNÇÕES PARA CAPACIDADE SIMULTÂNEA ====================

// Carregar configuração da capacidade
async function loadCapacidadeConfig() {
    try {
        const response = await apiCall('/api/admin/configuracoes/capacidade');
        const data = await response.json();
        
        if (data.success && data.capacidade) {
            const select = document.getElementById('capacidadeAtendimento');
            if (select) {
                select.value = data.capacidade;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de capacidade:', error);
        // Usar valor padrão de 1
        const select = document.getElementById('capacidadeAtendimento');
        if (select) select.value = 1;
    }
    
    atualizarPreviewCapacidade();
}

// Salvar configuração da capacidade
async function salvarCapacidadeConfig() {
    const capacidade = document.getElementById('capacidadeAtendimento').value;
    
    try {
        const response = await apiCall('/api/admin/configuracoes/capacidade', {
            method: 'PUT',
            body: JSON.stringify({ capacidade: parseInt(capacidade) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Capacidade de atendimento salva com sucesso!', 'success');
            atualizarPreviewCapacidade();
        } else {
            showNotification(data.message || 'Erro ao salvar capacidade', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar capacidade:', error);
        showNotification('Erro ao salvar capacidade de atendimento', 'error');
    }
}

// Atualizar preview da capacidade
function atualizarPreviewCapacidade() {
    const capacidade = document.getElementById('capacidadeAtendimento').value;
    const preview = document.getElementById('previewCapacidade');
    
    if (!preview) return;
    
    let descricao = '';
    if (capacidade == 1) {
        descricao = 'Atendimento individual (1 cliente por horário)';
    } else if (capacidade == 2) {
        descricao = 'Atendimento duplo (2 clientes simultâneos por horário)';
    } else if (capacidade == 3) {
        descricao = 'Atendimento triplo (3 clientes simultâneos por horário)';
    } else {
        descricao = `Atendimento múltiplo (${capacidade} clientes simultâneos por horário)`;
    }
    
    preview.innerHTML = `
        <div class="capacidade-preview">
            <h4 style="margin: 0 0 10px 0; color: var(--primary-color);">
                <i class="fas fa-users"></i>
                Capacidade de Atendimento
            </h4>
            <p style="margin: 5px 0; font-size: 14px;">
                <strong>Configurado:</strong> ${capacidade} cliente(s) por horário
            </p>
            <p style="margin: 5px 0; font-size: 14px; color: var(--success-color);">
                ${descricao}
            </p>
            <p style="margin: 5px 0; font-size: 12px; color: var(--text-light);">
                Isso afeta quantos agendamentos podem ser feitos no mesmo horário
            </p>
        </div>
    `;
}
// ==================== FUNÇÕES PARA GESTÃO DE VEÍCULOS ====================

// Modal para adicionar marca
function showAddBrandModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Nova Marca</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addBrandForm">
                    <div class="form-group">
                        <label for="brandName">Nome da Marca</label>
                        <input type="text" id="brandName" required placeholder="Ex: Toyota, Honda, etc.">
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addBrand()">Adicionar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Modal para adicionar modelo
function showAddModelModal() {
    const brandSelect = document.getElementById('vehicleBrand');
    const currentBrandId = brandSelect.value;
    
    if (!currentBrandId) {
        showNotification('Selecione uma marca primeiro', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Novo Modelo</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addModelForm">
                    <div class="form-group">
                        <label for="modelName">Nome do Modelo</label>
                        <input type="text" id="modelName" required placeholder="Ex: Civic, Corolla, etc.">
                    </div>
                    <div class="form-group">
                        <label for="modelType">Tipo de Veículo</label>
                        <select id="modelType" required>
                            <option value="carro">Carro</option>
                            <option value="moto">Moto</option>
                        </select>
                    </div>
                    <input type="hidden" id="modelBrandId" value="${currentBrandId}">
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addModel()">Adicionar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Modal para adicionar ano
function showAddYearModal() {
    const modelSelect = document.getElementById('vehicleModel');
    const currentModelId = modelSelect.value;
    
    if (!currentModelId) {
        showNotification('Selecione um modelo primeiro', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h3>Novo Ano</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addYearForm">
                    <div class="form-group">
                        <label for="yearValue">Ano</label>
                        <input type="number" id="yearValue" min="1900" max="2030" required placeholder="Ex: 2023">
                    </div>
                    <input type="hidden" id="yearModelId" value="${currentModelId}">
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addYear()">Adicionar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Adicionar marca
async function addBrand() {
    const brandName = document.getElementById('brandName').value.trim();
    
    if (!brandName) {
        showNotification('Digite o nome da marca', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/api/admin/marcas', {
            method: 'POST',
            body: JSON.stringify({ nome: brandName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Marca adicionada com sucesso!', 'success');
            closeModal(document.querySelector('#addBrandForm'));
            // Recarregar a lista de marcas
            loadVehicleBrands();
        } else {
            showNotification(data.message || 'Erro ao adicionar marca', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar marca:', error);
        showNotification('Erro ao adicionar marca', 'error');
    }
}

// Adicionar modelo
async function addModel() {
    const modelName = document.getElementById('modelName').value.trim();
    const modelType = document.getElementById('modelType').value;
    const brandId = document.getElementById('modelBrandId').value;
    
    if (!modelName) {
        showNotification('Digite o nome do modelo', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/api/admin/modelos', {
            method: 'POST',
            body: JSON.stringify({ 
                nome: modelName, 
                marca_id: brandId,
                tipo: modelType 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Modelo adicionado com sucesso!', 'success');
            closeModal(document.querySelector('#addModelForm'));
            // Recarregar a lista de modelos
            loadVehicleModels(brandId);
        } else {
            showNotification(data.message || 'Erro ao adicionar modelo', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar modelo:', error);
        showNotification('Erro ao adicionar modelo', 'error');
    }
}

// Adicionar ano
async function addYear() {
    const yearValue = document.getElementById('yearValue').value;
    const modelId = document.getElementById('yearModelId').value;
    
    if (!yearValue) {
        showNotification('Digite o ano', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/api/admin/modelo_anos', {
            method: 'POST',
            body: JSON.stringify({ 
                modelo_id: modelId, 
                ano: parseInt(yearValue)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Ano adicionado com sucesso!', 'success');
            closeModal(document.querySelector('#addYearForm'));
            // Recarregar a lista de anos
            loadVehicleYears(modelId);
        } else {
            showNotification(data.message || 'Erro ao adicionar ano', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar ano:', error);
        showNotification('Erro ao adicionar ano', 'error');
    }
}

// ==================== FUNÇÕES AUXILIARES ====================

// Alternar status do produto
async function toggleProductStatus(productId, activate) {
    try {
        const response = await apiCall(`/api/admin/estoque/${productId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ ativo: activate })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            loadEstoqueCompleto();
        } else {
            showNotification(data.message || 'Erro ao atualizar status', 'error');
        }
    } catch (error) {
        console.error('Erro ao alternar status:', error);
        showNotification('Erro ao atualizar status', 'error');
    }
}

// Remover produto
async function removeProduct(productId) {
    if (!confirm('Tem certeza que deseja remover este produto do estoque?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/admin/estoque/${productId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Produto removido com sucesso!', 'success');
            loadEstoqueCompleto();
        } else {
            showNotification(data.message || 'Erro ao remover produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao remover produto:', error);
        showNotification('Erro ao remover produto', 'error');
    }
}

// Fechar modal
function closeModal(element) {
    const modal = element.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Carregar estoque se estiver na página de estoque
    if (document.getElementById('estoqueTable')) {
        loadEstoqueCompleto();
    }
});
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

// ATUALIZE a função showSection para incluir horários especiais:
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
            'horarios-especiais': 'Horários Especiais', // ADICIONE ESTE
            'relatorios': 'Relatórios',
            'configuracoes': 'Configurações'
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
            loadEstoqueCompleto(); // MUDE PARA loadEstoqueCompleto
            break;
        case 'horarios-especiais': // ADICIONE ESTE CASO
            initHorariosEspeciais();
            break;
        case 'relatorios':
            loadRelatorios();
            break;
        case 'configuracoes':
            loadConfiguracoes();
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


// adm.js - COMPLETAR funções de configurações

// Carregar configurações da oficina
async function loadConfiguracoes() {
    try {
        const response = await apiCall('/api/admin/configuracoes');
        const data = await response.json();

        if (data.success && data.oficina) {
            const oficina = data.oficina;
            
            // Preencher horários
            if (oficina.horario_abertura) {
                document.getElementById('horarioAbertura').value = oficina.horario_abertura.substring(0, 5);
            }
            if (oficina.horario_fechamento) {
                document.getElementById('horarioFechamento').value = oficina.horario_fechamento.substring(0, 5);
            }
            
            // Preencher dias de funcionamento
            if (oficina.dias_funcionamento) {
                const diasArray = oficina.dias_funcionamento.toLowerCase().split(',');
                diasArray.forEach(dia => {
                    const checkbox = document.getElementById(dia.trim());
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }
            
            // Preencher informações da oficina
            if (oficina.nome) {
                document.getElementById('oficinaNome').value = oficina.nome;
            }
            if (oficina.telefone) {
                document.getElementById('oficinaTelefone').value = oficina.telefone;
            }
            if (oficina.endereco) {
                document.getElementById('oficinaEndereco').value = oficina.endereco;
            }
            
            // Atualizar preview
            atualizarPreviewHorario();
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showNotification('Erro ao carregar configurações', 'error');
    }
}

// Salvar configurações
async function salvarConfiguracoes() {
    try {
        // Coletar dados
        const horarioAbertura = document.getElementById('horarioAbertura').value;
        const horarioFechamento = document.getElementById('horarioFechamento').value;
        
        // Coletar dias selecionados
        const diasSelecionados = [];
        const diasCheckboxes = document.querySelectorAll('.dias-semana-grid input[type="checkbox"]:checked');
        diasCheckboxes.forEach(checkbox => {
            diasSelecionados.push(checkbox.value);
        });
        
        const dados = {
            nome: document.getElementById('oficinaNome').value,
            telefone: document.getElementById('oficinaTelefone').value,
            endereco: document.getElementById('oficinaEndereco').value,
            horario_abertura: horarioAbertura + ':00',
            horario_fechamento: horarioFechamento + ':00',
            dias_funcionamento: diasSelecionados.join(',')
        };

        const response = await apiCall('/api/admin/configuracoes', {
            method: 'PUT',
            body: JSON.stringify(dados)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Configurações salvas com sucesso!', 'success');
            atualizarPreviewHorario();
            
            // Atualizar o nome da oficina no header se foi alterado
            const oficinaNameElement = document.getElementById('oficinaName');
            if (oficinaNameElement && dados.nome) {
                oficinaNameElement.textContent = dados.nome;
            }
        } else {
            showNotification(data.message || 'Erro ao salvar configurações', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showNotification('Erro ao salvar configurações', 'error');
    }
}

// Atualizar preview do horário
function atualizarPreviewHorario() {
    const preview = document.getElementById('previewHorario');
    const horarioAbertura = document.getElementById('horarioAbertura').value;
    const horarioFechamento = document.getElementById('horarioFechamento').value;
    
    if (!preview) return;
    
    if (!horarioAbertura || !horarioFechamento) {
        preview.innerHTML = '<p>Configure os horários de abertura e fechamento</p>';
        return;
    }
    
    const diasSemana = [
        { id: 'segunda', nome: 'Segunda-feira' },
        { id: 'terca', nome: 'Terça-feira' },
        { id: 'quarta', nome: 'Quarta-feira' },
        { id: 'quinta', nome: 'Quinta-feira' },
        { id: 'sexta', nome: 'Sexta-feira' },
        { id: 'sabado', nome: 'Sábado' },
        { id: 'domingo', nome: 'Domingo' }
    ];
    
    let html = '<div class="horario-preview-list">';
    
    diasSemana.forEach(dia => {
        const checkbox = document.getElementById(dia.id);
        const estaAberto = checkbox && checkbox.checked;
        
        html += `
            <div class="horario-item">
                <span class="dia-semana">${dia.nome}</span>
                <span class="${estaAberto ? 'horario-funcionamento' : 'horario-fechado'}">
                    ${estaAberto ? `${horarioAbertura} - ${horarioFechamento}` : 'Fechado'}
                </span>
            </div>
        `;
    });
    
    html += '</div>';
    preview.innerHTML = html;
}
// Event listeners para atualizar preview em tempo real
document.addEventListener('DOMContentLoaded', function() {
    // Atualizar preview quando horários mudarem
    const horarioInputs = document.querySelectorAll('#horarioAbertura, #horarioFechamento');
    horarioInputs.forEach(input => {
        input.addEventListener('change', atualizarPreviewHorario);
    });
    
    // Atualizar preview quando dias mudarem
    const diaCheckboxes = document.querySelectorAll('.dias-semana-grid input[type="checkbox"]');
    diaCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', atualizarPreviewHorario);
    });
    
    // Adicionar ao switch case de navegação
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        originalShowSection(sectionId);
        
        if (sectionId === 'configuracoes') {
            loadConfiguracoes();
        }
    };
});

// ==================== GESTÃO DE ESTOQUE AVANÇADA ====================

// Carregar estoque com filtros
async function loadEstoque(filters = {}) {
    try {
        showLoading('estoqueTable');
        
        let url = '/api/admin/estoque';
        const params = new URLSearchParams();
        
        if (filters.tipo && filters.tipo !== 'todos') {
            params.append('tipo', filters.tipo);
        }
        if (filters.marca && filters.marca !== 'todos') {
            params.append('marca_veiculo', filters.marca);
        }
        if (filters.status && filters.status !== 'todos') {
            params.append('status', filters.status);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await apiCall(url);
        const data = await response.json();

        renderEstoque(data.estoque);
        populateMarcaFilter(data.marcas);
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        showNotification('Erro ao carregar estoque', 'error');
    } finally {
        hideLoading('estoqueTable');
    }
}

// Popular filtro de marcas
function populateMarcaFilter(marcas) {
    const marcaFilter = document.getElementById('estoqueMarcaFilter');
    if (!marcaFilter || !marcas) return;
    
    // Manter opção atual selecionada
    const currentValue = marcaFilter.value;
    
    marcaFilter.innerHTML = '<option value="todos">Todas</option>';
    
    marcas.forEach(marca => {
        const option = document.createElement('option');
        option.value = marca.id;
        option.textContent = marca.nome;
        marcaFilter.appendChild(option);
    });
    
    // Restaurar seleção anterior se ainda existir
    if (currentValue && currentValue !== 'todos') {
        marcaFilter.value = currentValue;
    }
}

// Filtrar estoque
function filterEstoque() {
    const filters = {
        tipo: document.getElementById('estoqueTipoFilter').value,
        marca: document.getElementById('estoqueMarcaFilter').value,
        status: document.getElementById('estoqueStatusFilter').value
    };
    
    loadEstoque(filters);
}

// Renderizar estoque com opções avançadas
function renderEstoque(estoque) {
    const tbody = document.getElementById('estoqueTable');
    if (!tbody) return;

    if (estoque.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h4>Nenhum produto em estoque</h4>
                        <p>Adicione produtos ao estoque para começar</p>
                        <button class="btn btn-primary mt-2" onclick="showAddProductModal()">
                            <i class="fas fa-plus"></i> Adicionar Produto
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = estoque.map(item => `
        <tr class="${item.ativo === 0 ? 'inactive-item' : ''}">
            <td>
                <div class="product-info">
                    <strong>${item.nome_produto}</strong>
                    ${item.compatibilidade_veiculo ? `
                        <small class="vehicle-compatibility">
                            <i class="fas fa-car"></i> ${item.compatibilidade_veiculo}
                        </small>
                    ` : ''}
                </div>
            </td>
            <td>${item.marca || '-'}</td>
            <td>
                <span class="product-type-badge ${item.tipo_produto}">
                    ${item.tipo_produto === 'oleo' ? 'Óleo' : 'Filtro'}
                </span>
            </td>
            <td>
                <div class="quantity-controls">
                    <input type="number" 
                           value="${item.quantidade}" 
                           min="0" 
                           onchange="updateEstoque(${item.id}, this.value)"
                           class="quantity-input"
                           ${item.ativo === 0 ? 'disabled' : ''}>
                    ${item.quantidade_minima && item.quantidade <= item.quantidade_minima ? `
                        <span class="low-stock-warning" title="Estoque baixo">
                            <i class="fas fa-exclamation-triangle"></i>
                        </span>
                    ` : ''}
                </div>
            </td>
            <td>R$ ${parseFloat(item.preco || 0).toFixed(2)}</td>
            <td>
                <span class="status-badge status-${item.ativo ? 'ativo' : 'inativo'}">
                    ${item.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>${formatDate(item.data_cadastro)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="viewProductDetails(${item.id})" title="Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    ${item.ativo ? `
                        <button class="btn btn-sm btn-warning" onclick="toggleProductStatus(${item.id}, false)" title="Desativar">
                            <i class="fas fa-pause"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="toggleProductStatus(${item.id}, true)" title="Ativar">
                            <i class="fas fa-play"></i>
                        </button>
                    `}
                    
                    <button class="btn btn-sm btn-danger" onclick="removeProduct(${item.id})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Modal para adicionar produto por veículo
function showVehicleProductModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Adicionar Produto por Veículo</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="vehicleProductForm">
                    <!-- Seleção de Veículo -->
                    <div class="form-section">
                        <h4>Selecionar Veículo</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicleBrand">Marca</label>
                                <select id="vehicleBrand" required onchange="loadVehicleModels(this.value)">
                                    <option value="">Selecione a marca</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vehicleModel">Modelo</label>
                                <select id="vehicleModel" required onchange="loadVehicleYears(this.value)" disabled>
                                    <option value="">Selecione o modelo</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vehicleYear">Ano</label>
                                <select id="vehicleYear" required disabled>
                                    <option value="">Selecione o ano</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Seleção de Produto -->
                    <div class="form-section">
                        <h4>Selecionar Produto</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="productTypeVehicle">Tipo</label>
                                <select id="productTypeVehicle" required onchange="loadVehicleProducts()">
                                    <option value="">Selecione o tipo</option>
                                    <option value="oleo">Óleo</option>
                                    <option value="filtro">Filtro</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="vehicleProduct">Produto</label>
                                <select id="vehicleProduct" required disabled>
                                    <option value="">Selecione o produto</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Informações do Estoque -->
                    <div class="form-section">
                        <h4>Informações do Estoque</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="vehicleQuantity">Quantidade</label>
                                <input type="number" id="vehicleQuantity" min="0" value="0" required>
                            </div>
                            <div class="form-group">
                                <label for="vehicleMinQuantity">Quantidade Mínima</label>
                                <input type="number" id="vehicleMinQuantity" min="0" value="5">
                            </div>
                            <div class="form-group">
                                <label for="vehiclePrice">Preço (R$)</label>
                                <input type="number" id="vehiclePrice" min="0" step="0.01" required>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addVehicleProduct()">Adicionar ao Estoque</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadVehicleBrands();
}

// Modal para gerenciar veículos
function showManageVehiclesModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3>Gerenciar Veículos</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="vehicle-management-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" onclick="switchVehicleTab('marcas')">Marcas</button>
                        <button class="tab-btn" onclick="switchVehicleTab('modelos')">Modelos</button>
                        <button class="tab-btn" onclick="switchVehicleTab('anos')">Anos</button>
                    </div>
                    
                    <div id="marcasTab" class="tab-content active">
                        <div class="tab-header">
                            <h4>Gerenciar Marcas</h4>
                            <button class="btn btn-sm btn-success" onclick="showAddBrandModal()">
                                <i class="fas fa-plus"></i> Nova Marca
                            </button>
                        </div>
                        <div class="vehicle-list" id="brandsList">
                            Carregando marcas...
                        </div>
                    </div>
                    
                    <div id="modelosTab" class="tab-content">
                        <div class="tab-header">
                            <h4>Gerenciar Modelos</h4>
                            <button class="btn btn-sm btn-success" onclick="showAddModelModal()">
                                <i class="fas fa-plus"></i> Novo Modelo
                            </button>
                        </div>
                        <div class="vehicle-list" id="modelsList">
                            Selecione a aba "Marcas" primeiro
                        </div>
                    </div>
                    
                    <div id="anosTab" class="tab-content">
                        <div class="tab-header">
                            <h4>Gerenciar Anos</h4>
                            <button class="btn btn-sm btn-success" onclick="showAddYearModal()">
                                <i class="fas fa-plus"></i> Novo Ano
                            </button>
                        </div>
                        <div class="vehicle-list" id="yearsList">
                            Selecione a aba "Modelos" primeiro
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadVehicleManagementData();
}

// Carregar dados para gestão de veículos
async function loadVehicleManagementData() {
    await loadBrandsList();
}

// Alternar entre abas de gestão de veículos
function switchVehicleTab(tabName) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`[onclick="switchVehicleTab('${tabName}')"]`).classList.add('active');
    
    // Carregar dados específicos da aba
    switch(tabName) {
        case 'marcas':
            loadBrandsList();
            break;
        case 'modelos':
            loadModelsList();
            break;
        case 'anos':
            loadYearsList();
            break;
    }
}

// ==================== FUNÇÕES PARA CARREGAR DADOS DE VEÍCULOS ====================

// Carregar marcas para o modal
async function loadVehicleBrands() {
    try {
        const response = await apiCall('/api/admin/marcas');
        const data = await response.json();
        
        const brandSelect = document.getElementById('vehicleBrand');
        if (brandSelect && data.marcas) {
            brandSelect.innerHTML = '<option value="">Selecione a marca</option>';
            data.marcas.forEach(marca => {
                const option = document.createElement('option');
                option.value = marca.id;
                option.textContent = marca.nome;
                brandSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar marcas:', error);
    }
}

// Carregar modelos baseado na marca
async function loadVehicleModels(brandId) {
    const modelSelect = document.getElementById('vehicleModel');
    const yearSelect = document.getElementById('vehicleYear');
    
    if (!brandId) {
        modelSelect.disabled = true;
        modelSelect.innerHTML = '<option value="">Selecione o modelo</option>';
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        return;
    }
    
    try {
        const response = await apiCall(`/api/admin/modelos?marca_id=${brandId}`);
        const data = await response.json();
        
        modelSelect.innerHTML = '<option value="">Selecione o modelo</option>';
        if (data.modelos) {
            data.modelos.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.nome;
                modelSelect.appendChild(option);
            });
        }
        modelSelect.disabled = false;
        
        // Resetar anos
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        
    } catch (error) {
        console.error('Erro ao carregar modelos:', error);
    }
}

// Carregar anos baseado no modelo
async function loadVehicleYears(modelId) {
    const yearSelect = document.getElementById('vehicleYear');
    
    if (!modelId) {
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        return;
    }
    
    try {
        const response = await apiCall(`/api/admin/modelo_anos?modelo_id=${modelId}`);
        const data = await response.json();
        
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        if (data.anos) {
            data.anos.forEach(ano => {
                const option = document.createElement('option');
                option.value = ano.id;
                option.textContent = ano.ano;
                yearSelect.appendChild(option);
            });
        }
        yearSelect.disabled = false;
        
    } catch (error) {
        console.error('Erro ao carregar anos:', error);
    }
}

// Carregar produtos baseado no tipo
async function loadVehicleProducts() {
    const typeSelect = document.getElementById('productTypeVehicle');
    const productSelect = document.getElementById('vehicleProduct');
    
    if (!typeSelect.value) {
        productSelect.disabled = true;
        productSelect.innerHTML = '<option value="">Selecione o produto</option>';
        return;
    }
    
    try {
        const endpoint = typeSelect.value === 'oleo' ? '/api/admin/produtos/oleos' : '/api/admin/produtos/filtros';
        const response = await apiCall(endpoint);
        const data = await response.json();
        
        productSelect.innerHTML = '<option value="">Selecione o produto</option>';
        if (data.produtos) {
            data.produtos.forEach(produto => {
                const option = document.createElement('option');
                option.value = produto.id;
                option.textContent = `${produto.nome} - R$ ${parseFloat(produto.preco || 0).toFixed(2)}`;
                option.dataset.preco = produto.preco || 0;
                productSelect.appendChild(option);
            });
        }
        productSelect.disabled = false;
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

// ==================== FUNÇÕES PARA GESTÃO DE VEÍCULOS ====================

// Carregar lista de marcas
async function loadBrandsList() {
    try {
        const response = await apiCall('/api/admin/marcas');
        const data = await response.json();
        
        const brandsList = document.getElementById('brandsList');
        if (brandsList && data.marcas) {
            if (data.marcas.length === 0) {
                brandsList.innerHTML = '<p class="no-data">Nenhuma marca cadastrada</p>';
                return;
            }
            
            brandsList.innerHTML = data.marcas.map(marca => `
                <div class="vehicle-item">
                    <div class="vehicle-info">
                        <strong>${marca.nome}</strong>
                        <span class="vehicle-count">${marca.total_modelos || 0} modelos</span>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn btn-sm btn-outline" onclick="editBrand(${marca.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteBrand(${marca.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar lista de marcas:', error);
    }
}

// Carregar lista de modelos
async function loadModelsList() {
    try {
        const response = await apiCall('/api/admin/modelos-completos');
        const data = await response.json();
        
        const modelsList = document.getElementById('modelsList');
        if (modelsList && data.modelos) {
            if (data.modelos.length === 0) {
                modelsList.innerHTML = '<p class="no-data">Nenhum modelo cadastrado</p>';
                return;
            }
            
            modelsList.innerHTML = data.modelos.map(modelo => `
                <div class="vehicle-item">
                    <div class="vehicle-info">
                        <strong>${modelo.nome}</strong>
                        <div class="vehicle-details">
                            <span class="brand-name">${modelo.marca_nome}</span>
                            <span class="vehicle-type ${modelo.tipo}">${modelo.tipo === 'carro' ? 'Carro' : 'Moto'}</span>
                            <span class="vehicle-count">${modelo.total_anos || 0} anos</span>
                        </div>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn btn-sm btn-outline" onclick="editModel(${modelo.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteModel(${modelo.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar lista de modelos:', error);
    }
}

// Carregar lista de anos
async function loadYearsList() {
    try {
        const response = await apiCall('/api/admin/modelo_anos-completos');
        const data = await response.json();
        
        const yearsList = document.getElementById('yearsList');
        if (yearsList && data.anos) {
            if (data.anos.length === 0) {
                yearsList.innerHTML = '<p class="no-data">Nenhum ano cadastrado</p>';
                return;
            }
            
            yearsList.innerHTML = data.anos.map(ano => `
                <div class="vehicle-item">
                    <div class="vehicle-info">
                        <strong>${ano.ano}</strong>
                        <div class="vehicle-details">
                            <span class="model-name">${ano.modelo_nome}</span>
                            <span class="brand-name">${ano.marca_nome}</span>
                        </div>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn btn-sm btn-outline" onclick="editYear(${ano.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteYear(${ano.id})" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar lista de anos:', error);
    }
}

// ==================== FUNÇÕES PARA ADICIONAR/EDITAR VEÍCULOS ====================

// Modal para adicionar marca
function showAddBrandModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Nova Marca</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addBrandForm">
                    <div class="form-group">
                        <label for="brandName">Nome da Marca</label>
                        <input type="text" id="brandName" required placeholder="Ex: Toyota, Honda, etc.">
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addBrand()">Adicionar Marca</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Adicionar nova marca
async function addBrand() {
    const brandName = document.getElementById('brandName').value.trim();
    
    if (!brandName) {
        showNotification('Digite o nome da marca', 'error');
        return;
    }
    
    try {
        const response = await apiCall('/api/admin/marcas', {
            method: 'POST',
            body: JSON.stringify({ nome: brandName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Marca adicionada com sucesso!', 'success');
            closeModal(document.querySelector('#addBrandForm'));
            loadBrandsList();
        } else {
            showNotification(data.message || 'Erro ao adicionar marca', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar marca:', error);
        showNotification('Erro ao adicionar marca', 'error');
    }
}

// Adicionar produto por veículo
async function addVehicleProduct() {
    const brandId = document.getElementById('vehicleBrand').value;
    const modelId = document.getElementById('vehicleModel').value;
    const yearId = document.getElementById('vehicleYear').value;
    const productType = document.getElementById('productTypeVehicle').value;
    const productId = document.getElementById('vehicleProduct').value;
    const quantity = document.getElementById('vehicleQuantity').value;
    const minQuantity = document.getElementById('vehicleMinQuantity').value;
    const price = document.getElementById('vehiclePrice').value;
    
    // Validações
    if (!brandId || !modelId || !yearId || !productType || !productId || !quantity || !price) {
        showNotification('Preencha todos os campos obrigatórios', 'error');
        return;
    }
    
    try {
        const productData = {
            produto_id: productId,
            tipo_produto: productType,
            quantidade: parseInt(quantity),
            quantidade_minima: parseInt(minQuantity) || 5,
            preco: parseFloat(price),
            modelo_ano_id: yearId
        };
        
        const response = await apiCall('/api/admin/estoque/veiculo', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Produto adicionado ao estoque com sucesso!', 'success');
            closeModal(document.querySelector('#vehicleProductForm'));
            loadEstoque();
        } else {
            showNotification(data.message || 'Erro ao adicionar produto', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar produto por veículo:', error);
        showNotification('Erro ao adicionar produto', 'error');
    }
}

// ==================== FUNÇÕES DE CONTROLE DE ESTOQUE ====================

// Alternar status do produto (ativo/inativo)
async function toggleProductStatus(productId, activate) {
    const action = activate ? 'ativar' : 'desativar';
    
    if (!confirm(`Tem certeza que deseja ${action} este produto?`)) {
        return;
    }
    
    try {
        const response = await apiCall(`/api/admin/estoque/${productId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ ativo: activate })
        });
        
        if (response.ok) {
            showNotification(`Produto ${activate ? 'ativado' : 'desativado'} com sucesso!`, 'success');
            loadEstoque();
        } else {
            const data = await response.json();
            showNotification(data.message || `Erro ao ${action} produto`, 'error');
        }
    } catch (error) {
        console.error(`Erro ao ${action} produto:`, error);
        showNotification(`Erro ao ${action} produto`, 'error');
    }
}

// Ver detalhes do produto
async function viewProductDetails(productId) {
    try {
        const response = await apiCall(`/api/admin/estoque/${productId}/detalhes`);
        const data = await response.json();
        
        if (data.success) {
            showProductDetailsModal(data.produto);
        } else {
            showNotification(data.message || 'Erro ao carregar detalhes', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar detalhes do produto:', error);
        showNotification('Erro ao carregar detalhes', 'error');
    }
}

// Modal de detalhes do produto
function showProductDetailsModal(produto) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3>Detalhes do Produto</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <div class="product-details">
                    <div class="detail-section">
                        <h4>Informações Básicas</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Nome:</label>
                                <span>${produto.nome_produto}</span>
                            </div>
                            <div class="detail-item">
                                <label>Tipo:</label>
                                <span class="product-type-badge ${produto.tipo_produto}">
                                    ${produto.tipo_produto === 'oleo' ? 'Óleo' : 'Filtro'}
                                </span>
                            </div>
                            <div class="detail-item">
                                <label>Marca:</label>
                                <span>${produto.marca || '-'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Status:</label>
                                <span class="status-badge status-${produto.ativo ? 'ativo' : 'inativo'}">
                                    ${produto.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Estoque</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Quantidade:</label>
                                <span>${produto.quantidade}</span>
                            </div>
                            <div class="detail-item">
                                <label>Quantidade Mínima:</label>
                                <span>${produto.quantidade_minima || 'Não definida'}</span>
                            </div>
                            <div class="detail-item">
                                <label>Preço:</label>
                                <span>R$ ${parseFloat(produto.preco || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${produto.compatibilidade_veiculo ? `
                    <div class="detail-section">
                        <h4>Compatibilidade</h4>
                        <p>${produto.compatibilidade_veiculo}</p>
                    </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h4>Datas</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <label>Cadastrado em:</label>
                                <span>${formatDate(produto.data_cadastro)}</span>
                            </div>
                            ${produto.data_atualizacao ? `
                            <div class="detail-item">
                                <label>Atualizado em:</label>
                                <span>${formatDate(produto.data_atualizacao)}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Atualizar função existente de atualização de estoque
async function updateEstoque(id, quantidade) {
    try {
        const response = await apiCall(`/api/admin/estoque/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ 
                quantidade: parseInt(quantidade),
                atualizado_por: 'admin'
            })
        });

        if (response.ok) {
            showNotification('Estoque atualizado com sucesso!', 'success');
            loadEstoque();
        } else {
            const data = await response.json();
            showNotification(data.message || 'Erro ao atualizar estoque', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar estoque:', error);
        showNotification('Erro ao atualizar estoque', 'error');
    }
}

// Atualizar função de remoção de produto
async function removeProduct(id) {
    if (confirm('Tem certeza que deseja remover este produto do estoque?\n\nEsta ação não pode ser desfeita.')) {
        try {
            const response = await apiCall(`/api/admin/estoque/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Produto removido com sucesso!', 'success');
                loadEstoque();
            } else {
                const data = await response.json();
                showNotification(data.message || 'Erro ao remover produto', 'error');
            }
        } catch (error) {
            console.error('Erro ao remover produto:', error);
            showNotification('Erro ao remover produto', 'error');
        }
    }
}

// ==================== HORÁRIOS ESPECIAIS - FUNÇÕES CORRIGIDAS ====================

// Função para carregar horários especiais
async function loadSpecialHours() {
    try {
        console.log('Carregando horários especiais...');
        const response = await apiCall('/api/admin/horarios-especiais');
        const data = await response.json();
        console.log('Dados recebidos:', data);

        if (data.success && data.horarios_especiais) {
            renderSpecialHours(data.horarios_especiais);
        } else {
            document.getElementById('specialHoursList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>Nenhum horário especial configurado</p>
                    <button class="btn btn-primary mt-2" onclick="showAddSpecialHourModal()">
                        <i class="fas fa-plus"></i> Adicionar Primeiro Horário
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar horários especiais:', error);
        document.getElementById('specialHoursList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar horários especiais</p>
                <button class="btn btn-secondary mt-2" onclick="loadSpecialHours()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Função para carregar exceções
async function loadExceptions() {
    try {
        console.log('Carregando exceções...');
        const response = await apiCall('/api/admin/horarios-excecoes');
        const data = await response.json();
        console.log('Exceções recebidas:', data);

        if (data.success && data.excecoes) {
            renderExceptions(data.excecoes);
        } else {
            document.getElementById('exceptionsList').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Nenhuma exceção configurada</p>
                    <button class="btn btn-primary mt-2" onclick="showAddExceptionModal()">
                        <i class="fas fa-plus"></i> Adicionar Primeira Exceção
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar exceções:', error);
        document.getElementById('exceptionsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar exceções</p>
                <button class="btn btn-secondary mt-2" onclick="loadExceptions()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// Renderizar horários especiais - VERSÃO CORRIGIDA
function renderSpecialHours(horarios) {
    const container = document.getElementById('specialHoursList');
    if (!container) {
        console.error('Container specialHoursList não encontrado!');
        return;
    }

    if (!horarios || horarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Nenhum horário especial configurado</p>
                <button class="btn btn-primary mt-2" onclick="showAddSpecialHourModal()">
                    <i class="fas fa-plus"></i> Adicionar Primeiro Horário
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = horarios.map(horario => {
        // CORREÇÃO: Formatar a data corretamente
        let dataFormatada;
        try {
            // Tenta diferentes formatos de data
            const dataObj = new Date(horario.data_especial);
            
            // Verifica se a data é válida
            if (isNaN(dataObj.getTime())) {
                // Se não for válida, tenta formatar manualmente
                const partes = horario.data_especial.split('-');
                if (partes.length === 3) {
                    dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
                } else {
                    dataFormatada = 'Data inválida';
                }
            } else {
                // Data válida, formata normalmente
                dataFormatada = dataObj.toLocaleDateString('pt-BR');
            }
        } catch (error) {
            console.error('Erro ao formatar data:', error, horario.data_especial);
            dataFormatada = 'Data inválida';
        }

        return `
        <div class="special-hour-item ${horario.fechado ? 'closed' : ''}">
            <div class="special-hour-info">
                <div class="special-hour-date">
                    <strong>${dataFormatada}</strong>
                    ${horario.motivo ? `<span class="special-hour-reason"> - ${horario.motivo}</span>` : ''}
                </div>
                <div class="special-hour-time">
                    ${horario.fechado ? 
                        '<span class="closed-badge">FECHADO</span>' : 
                        `${horario.horario_abertura || '--:--'} - ${horario.horario_fechamento || '--:--'}`
                    }
                </div>
            </div>
            <div class="special-hour-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteSpecialHour(${horario.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');
}

// Renderizar exceções
function renderExceptions(excecoes) {
    const container = document.getElementById('exceptionsList');
    if (!container) {
        console.error('Container exceptionsList não encontrado!');
        return;
    }

    if (!excecoes || excecoes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-alt"></i>
                <p>Nenhuma exceção configurada</p>
                <button class="btn btn-primary mt-2" onclick="showAddExceptionModal()">
                    <i class="fas fa-plus"></i> Adicionar Primeira Exceção
                </button>
            </div>
        `;
        return;
    }

    const diasMap = {
        'segunda': 'Segunda-feira',
        'terca': 'Terça-feira',
        'quarta': 'Quarta-feira',
        'quinta': 'Quinta-feira',
        'sexta': 'Sexta-feira',
        'sabado': 'Sábado',
        'domingo': 'Domingo'
    };

    container.innerHTML = excecoes.map(excecao => `
        <div class="exception-item">
            <div class="exception-info">
                <div class="exception-day">
                    <strong>${diasMap[excecao.dia_semana] || excecao.dia_semana}</strong>
                    ${excecao.motivo ? `<span class="exception-reason"> - ${excecao.motivo}</span>` : ''}
                </div>
                <div class="exception-time">
                    ${excecao.horario_abertura || '--:--'} - ${excecao.horario_fechamento || '--:--'}
                </div>
                ${excecao.data_inicio || excecao.data_fim ? `
                <div class="exception-period">
                    <small>
                        ${excecao.data_inicio ? `De ${new Date(excecao.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                        ${excecao.data_fim ? ` até ${new Date(excecao.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}` : ''}
                    </small>
                </div>
                ` : ''}
            </div>
            <div class="exception-actions">
                <button class="btn btn-sm btn-danger" onclick="deleteException(${excecao.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Modal para adicionar horário especial
function showAddSpecialHourModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Adicionar Horário Especial</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addSpecialHourForm">
                    <div class="form-group">
                        <label for="specialDate">Data</label>
                        <input type="date" id="specialDate" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="specialReason">Motivo (opcional)</label>
                        <input type="text" id="specialReason" placeholder="Ex: Feriado, Evento especial, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-container">
                            <input type="checkbox" id="specialClosed" onchange="toggleSpecialHourFields()">
                            <span class="checkmark"></span>
                            Oficina fechada neste dia
                        </label>
                    </div>
                    
                    <div id="specialHourFields">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="specialOpen">Horário de Abertura</label>
                                <input type="time" id="specialOpen">
                            </div>
                            <div class="form-group">
                                <label for="specialClose">Horário de Fechamento</label>
                                <input type="time" id="specialClose">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addSpecialHour()">Salvar Horário</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Definir data mínima como hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('specialDate').min = today;
    document.getElementById('specialDate').value = today;
    
    toggleSpecialHourFields();
}

// Modal para adicionar exceção
function showAddExceptionModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>Adicionar Exceção de Dia da Semana</h3>
                <button class="close-modal" onclick="closeModal(this)">&times;</button>
            </div>
            <div class="modal-body">
                <form id="addExceptionForm">
                    <div class="form-group">
                        <label for="exceptionDay">Dia da Semana</label>
                        <select id="exceptionDay" required>
                            <option value="">Selecione o dia</option>
                            <option value="segunda">Segunda-feira</option>
                            <option value="terca">Terça-feira</option>
                            <option value="quarta">Quarta-feira</option>
                            <option value="quinta">Quinta-feira</option>
                            <option value="sexta">Sexta-feira</option>
                            <option value="sabado">Sábado</option>
                            <option value="domingo">Domingo</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="exceptionReason">Motivo (opcional)</label>
                        <input type="text" id="exceptionReason" placeholder="Ex: Horário de verão, Manutenção, etc.">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="exceptionOpen">Horário de Abertura</label>
                            <input type="time" id="exceptionOpen" required value="08:00">
                        </div>
                        <div class="form-group">
                            <label for="exceptionClose">Horário de Fechamento</label>
                            <input type="time" id="exceptionClose" required value="18:00">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" onclick="closeModal(this)">Cancelar</button>
                <button class="btn btn-primary" onclick="addException()">Salvar Exceção</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Alternar campos de horário
function toggleSpecialHourFields() {
    const closed = document.getElementById('specialClosed');
    const hourFields = document.getElementById('specialHourFields');
    
    if (closed && hourFields) {
        hourFields.style.display = closed.checked ? 'none' : 'block';
    }
}

// Adicionar horário especial
async function addSpecialHour() {
    const data = document.getElementById('specialDate').value;
    const motivo = document.getElementById('specialReason').value;
    const fechado = document.getElementById('specialClosed').checked;
    const horarioAbertura = document.getElementById('specialOpen').value;
    const horarioFechamento = document.getElementById('specialClose').value;

    if (!data) {
        showNotification('Data é obrigatória', 'error');
        return;
    }

    const payload = {
        data_especial: data,
        motivo: motivo,
        fechado: fechado
    };

    if (!fechado) {
        if (!horarioAbertura || !horarioFechamento) {
            showNotification('Horários são obrigatórios quando a oficina não está fechada', 'error');
            return;
        }
        payload.horario_abertura = horarioAbertura;
        payload.horario_fechamento = horarioFechamento;
    }

    try {
        const response = await apiCall('/api/admin/horarios-especiais', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Horário especial adicionado com sucesso!', 'success');
            closeModal(document.querySelector('#addSpecialHourForm'));
            loadSpecialHours();
        } else {
            showNotification(data.message || 'Erro ao adicionar horário especial', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar horário especial:', error);
        showNotification('Erro ao adicionar horário especial', 'error');
    }
}

// Adicionar exceção
async function addException() {
    const diaSemana = document.getElementById('exceptionDay').value;
    const motivo = document.getElementById('exceptionReason').value;
    const horarioAbertura = document.getElementById('exceptionOpen').value;
    const horarioFechamento = document.getElementById('exceptionClose').value;

    if (!diaSemana || !horarioAbertura || !horarioFechamento) {
        showNotification('Dia da semana e horários são obrigatórios', 'error');
        return;
    }

    const payload = {
        dia_semana: diaSemana,
        motivo: motivo,
        horario_abertura: horarioAbertura,
        horario_fechamento: horarioFechamento
    };

    try {
        const response = await apiCall('/api/admin/horarios-excecoes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            showNotification('Exceção adicionada com sucesso!', 'success');
            closeModal(document.querySelector('#addExceptionForm'));
            loadExceptions();
        } else {
            showNotification(data.message || 'Erro ao adicionar exceção', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar exceção:', error);
        showNotification('Erro ao adicionar exceção', 'error');
    }
}

// Excluir horário especial
async function deleteSpecialHour(id) {
    if (confirm('Tem certeza que deseja excluir este horário especial?')) {
        try {
            const response = await apiCall(`/api/admin/horarios-especiais/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Horário especial excluído com sucesso!', 'success');
                loadSpecialHours();
            } else {
                showNotification(data.message || 'Erro ao excluir horário especial', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir horário especial:', error);
            showNotification('Erro ao excluir horário especial', 'error');
        }
    }
}

// Excluir exceção
async function deleteException(id) {
    if (confirm('Tem certeza que deseja excluir esta exceção?')) {
        try {
            const response = await apiCall(`/api/admin/horarios-excecoes/${id}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                showNotification('Exceção excluída com sucesso!', 'success');
                loadExceptions();
            } else {
                showNotification(data.message || 'Erro ao excluir exceção', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir exceção:', error);
            showNotification('Erro ao excluir exceção', 'error');
        }
    }
}

// Fechar modal
function closeModal(element) {
    const modal = element.closest('.modal');
    if (modal) {
        modal.remove();
    }
}

// Inicializar horários especiais quando a seção for carregada
function initHorariosEspeciais() {
    console.log('Inicializando horários especiais...');
    loadSpecialHours();
    loadExceptions();
}

// Funções para intervalo entre agendamentos
function calcularCapacidadeAtendimento() {
    const intervaloSelecionado = document.querySelector('input[name="intervaloAgendamento"]:checked').value;
    const intervaloNum = parseInt(intervaloSelecionado);
    
    // Calcular horas de trabalho (considerando 8 horas por padrão)
    const horasTrabalho = 8; // 08:00 às 18:00 = 10 horas, mas considerando 8 horas líquidas
    const minutosTrabalho = horasTrabalho * 60;
    
    // Calcular número máximo de atendimentos
    const maxAtendimentos = Math.floor(minutosTrabalho / intervaloNum);
    
    // Atualizar display
    document.getElementById('intervaloSelecionado').textContent = 
        intervaloNum === 30 ? '30 minutos' : 
        intervaloNum === 45 ? '45 minutos' : 
        intervaloNum === 60 ? '1 hora' : 
        intervaloNum === 90 ? '1 hora e 30 minutos' : '2 horas';
    
    document.getElementById('totalAtendimentos').textContent = maxAtendimentos;
    
    console.log(`Intervalo: ${intervaloNum}min - Capacidade: ${maxAtendimentos} atendimentos`);
}

// Carregar configuração do intervalo
async function loadIntervaloConfig() {
    try {
        const response = await apiCall('/api/admin/configuracoes/intervalo');
        const data = await response.json();
        
        if (data.success && data.intervalo) {
            const radio = document.querySelector(`input[name="intervaloAgendamento"][value="${data.intervalo}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configuração de intervalo:', error);
        // Usar valor padrão de 45 minutos
        const radio = document.querySelector('input[name="intervaloAgendamento"][value="45"]');
        if (radio) radio.checked = true;
    }
    
    calcularCapacidadeAtendimento();
}

// Salvar configuração do intervalo
async function salvarIntervaloConfig() {
    const intervalo = document.querySelector('input[name="intervaloAgendamento"]:checked').value;
    
    try {
        const response = await apiCall('/api/admin/configuracoes/intervalo', {
            method: 'PUT',
            body: JSON.stringify({ intervalo: parseInt(intervalo) })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Intervalo entre agendamentos salvo com sucesso!', 'success');
            calcularCapacidadeAtendimento();
        } else {
            showNotification(data.message || 'Erro ao salvar intervalo', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar intervalo:', error);
        showNotification('Erro ao salvar intervalo entre agendamentos', 'error');
    }
}

// Event listeners para intervalo e capacidade
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para intervalo
    const intervaloRadios = document.querySelectorAll('input[name="intervaloAgendamento"]');
    intervaloRadios.forEach(radio => {
        radio.addEventListener('change', calcularCapacidadeAtendimento);
    });
    
    // Event listener para capacidade
    const capacidadeSelect = document.getElementById('capacidadeAtendimento');
    if (capacidadeSelect) {
        capacidadeSelect.addEventListener('change', atualizarPreviewCapacidade);
    }
    
    // Atualizar função salvarConfiguracoes para incluir intervalo e capacidade
    const originalSalvarConfiguracoes = window.salvarConfiguracoes;
    window.salvarConfiguracoes = async function() {
        await originalSalvarConfiguracoes();
        await salvarIntervaloConfig();
        await salvarCapacidadeConfig();
    };
    
    // Carregar configurações quando a seção for aberta
    const originalShowSection = window.showSection;
    window.showSection = function(sectionId) {
        originalShowSection(sectionId);
        
        if (sectionId === 'configuracoes') {
            setTimeout(() => {
                loadIntervaloConfig();
                loadCapacidadeConfig();
            }, 100);
        }
    };
});