// ===== JAVASCRIPT CONSOLIDADO - OILSMART =====

// State Manager
class StateManager {
    constructor() {
        this.state = {
            oficinas: [],
            mensalidades: [],
            usuarios: [],
            currentUser: null,
            settings: {}
        };
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }

    loadFromStorage() {
        // Carregar dados do localStorage
        this.state.oficinas = JSON.parse(localStorage.getItem('oficinas')) || [];
        this.state.mensalidades = JSON.parse(localStorage.getItem('mensalidades')) || [];
        this.state.usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
        this.state.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.state.settings = JSON.parse(localStorage.getItem('settings')) || {};
    }

    saveToStorage() {
        // Salvar dados no localStorage
        localStorage.setItem('oficinas', JSON.stringify(this.state.oficinas));
        localStorage.setItem('mensalidades', JSON.stringify(this.state.mensalidades));
        localStorage.setItem('usuarios', JSON.stringify(this.state.usuarios));
        localStorage.setItem('currentUser', JSON.stringify(this.state.currentUser));
        localStorage.setItem('settings', JSON.stringify(this.state.settings));
    }

    setupEventListeners() {
        // Event listeners globais
        window.addEventListener('beforeunload', () => this.saveToStorage());
    }

    // Getters
    getOficinas() {
        return this.state.oficinas;
    }

    getMensalidades() {
        return this.state.mensalidades;
    }

    getUsuarios() {
        return this.state.usuarios;
    }

    getCurrentUser() {
        return this.state.currentUser;
    }

    // Setters
    setOficinas(oficinas) {
        this.state.oficinas = oficinas;
        this.saveToStorage();
    }

    setMensalidades(mensalidades) {
        this.state.mensalidades = mensalidades;
        this.saveToStorage();
    }

    setUsuarios(usuarios) {
        this.state.usuarios = usuarios;
        this.saveToStorage();
    }

    setCurrentUser(user) {
        this.state.currentUser = user;
        this.saveToStorage();
    }

    // Métodos específicos
    addOficina(oficina) {
        const newOficina = {
            id: this.generateId(),
            ...oficina,
            dataCadastro: new Date().toISOString(),
            status: oficina.status || 'ativo'
        };
        this.state.oficinas.push(newOficina);
        this.saveToStorage();
        return newOficina;
    }

    updateOficina(id, updates) {
        const index = this.state.oficinas.findIndex(o => o.id === id);
        if (index !== -1) {
            this.state.oficinas[index] = { ...this.state.oficinas[index], ...updates };
            this.saveToStorage();
            return this.state.oficinas[index];
        }
        return null;
    }

    deleteOficina(id) {
        const index = this.state.oficinas.findIndex(o => o.id === id);
        if (index !== -1) {
            this.state.oficinas.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Inicializar State Manager
const stateManager = new StateManager();

// Utils
class Utils {
    static formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    static formatDate(date) {
        return new Date(date).toLocaleDateString('pt-BR');
    }

    static formatDateTime(date) {
        return new Date(date).toLocaleString('pt-BR');
    }

    static formatCNPJ(cnpj) {
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    static formatPhone(phone) {
        return phone.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    static formatCEP(cep) {
        return cep.replace(/^(\d{5})(\d{3})/, '$1-$2');
    }

    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    static validateCNPJ(cnpj) {
        const regex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
        return regex.test(cnpj);
    }

    static validatePhone(phone) {
        const regex = /^\(\d{2}\) \d{5}-\d{4}$/;
        return regex.test(phone);
    }

    static validateCEP(cep) {
        const regex = /^\d{5}-\d{3}$/;
        return regex.test(cep);
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="notification-content">
                <p>${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Fechar notificação
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeNotification);

        if (duration > 0) {
            setTimeout(closeNotification, duration);
        }

        return notification;
    }

    static getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    static createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    static showLoading() {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay hidden';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Carregando...</span>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        overlay.classList.remove('hidden');
    }

    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    static confirm(message, title = 'Confirmar Ação') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button type="button" class="modal-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="confirmCancel">
                            Cancelar
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmOk">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const closeModal = (result) => {
                modal.remove();
                resolve(result);
            };

            modal.querySelector('.modal-close').addEventListener('click', () => closeModal(false));
            modal.querySelector('#confirmCancel').addEventListener('click', () => closeModal(false));
            modal.querySelector('#confirmOk').addEventListener('click', () => closeModal(true));

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(false);
            });
        });
    }
}

// Sidebar Management
class SidebarManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mainContent = document.getElementById('mainContent');
        this.init();
    }

    init() {
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggle());
        }

        // Verificar estado salvo
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            this.collapse();
        }

        // Fechar sidebar em mobile ao clicar em um link
        if (window.innerWidth < 768) {
            const menuLinks = this.sidebar?.querySelectorAll('.menu-item a');
            menuLinks?.forEach(link => {
                link.addEventListener('click', () => this.closeMobile());
            });
        }
    }

    toggle() {
        if (this.sidebar.classList.contains('collapsed')) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    collapse() {
        this.sidebar?.classList.add('collapsed');
        this.mainContent?.classList.add('expanded');
        localStorage.setItem('sidebarCollapsed', 'true');
    }

    expand() {
        this.sidebar?.classList.remove('collapsed');
        this.mainContent?.classList.remove('expanded');
        localStorage.setItem('sidebarCollapsed', 'false');
    }

    openMobile() {
        this.sidebar?.classList.add('mobile-open');
    }

    closeMobile() {
        this.sidebar?.classList.remove('mobile-open');
    }
}

// Form Validation
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.fields = {};
        this.init();
    }

    init() {
        if (!this.form) return;

        // Encontrar todos os campos com validação
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.hasAttribute('required') || input.getAttribute('type') === 'email') {
                this.fields[input.name] = input;
                
                // Adicionar event listeners para validação em tempo real
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            }
        });

        // Validar formulário no submit
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
            }
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Validações básicas
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Este campo é obrigatório';
        } else if (field.type === 'email' && value && !Utils.validateEmail(value)) {
            isValid = false;
            errorMessage = 'Digite um e-mail válido';
        } else if (field.name === 'cnpj' && value && !Utils.validateCNPJ(value)) {
            isValid = false;
            errorMessage = 'Digite um CNPJ válido';
        } else if (field.name === 'telefone' && value && !Utils.validatePhone(value)) {
            isValid = false;
            errorMessage = 'Digite um telefone válido';
        } else if (field.name === 'cep' && value && !Utils.validateCEP(value)) {
            isValid = false;
            errorMessage = 'Digite um CEP válido';
        }

        if (isValid) {
            this.clearError(field);
        } else {
            this.showError(field, errorMessage);
        }

        return isValid;
    }

    validateForm() {
        let isValid = true;

        for (const fieldName in this.fields) {
            const field = this.fields[fieldName];
            if (!this.validateField(field)) {
                isValid = false;
            }
        }

        return isValid;
    }

    showError(field, message) {
        this.clearError(field);
        
        field.classList.add('error');
        
        let errorElement = field.parentNode.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'form-error';
            field.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    clearError(field) {
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }
        
        return data;
    }
}

// Login Management
class LoginManager {
    constructor() {
        this.form = document.getElementById('form-login');
        this.init();
    }

    init() {
        if (!this.form) return;

        // Verificar se já está logado
        this.checkAuthentication();

        // Configurar formulário de login
        this.form.addEventListener('submit', (e) => this.handleLogin(e));

        // Toggle de senha
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => this.togglePasswordVisibility());
        }

        // Recuperação de senha
        const esqueciSenha = document.getElementById('esqueci-senha');
        if (esqueciSenha) {
            esqueciSenha.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRecoveryModal();
            });
        }
    }

    checkAuthentication() {
        const currentUser = stateManager.getCurrentUser();
        const isLoginPage = window.location.pathname.includes('login.html');
        
        if (currentUser && isLoginPage) {
            window.location.href = 'dashboard.html';
        } else if (!currentUser && !isLoginPage && !window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const usuario = document.getElementById('usuario').value.trim();
        const senha = document.getElementById('senha').value.trim();
        const btnLogin = document.getElementById('btnLogin');
        const msgErro = document.getElementById('msg-erro');
        const msgSucesso = document.getElementById('msg-sucesso');

        // Reset mensagens
        if (msgErro) msgErro.style.display = 'none';
        if (msgSucesso) msgSucesso.style.display = 'none';

        // Validação básica
        if (!usuario || !senha) {
            this.showError('Preencha todos os campos');
            return;
        }

        // Simular loading
        if (btnLogin) {
            btnLogin.classList.add('loading');
            btnLogin.disabled = true;
        }

        try {
            // Simular delay de rede
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verificar credenciais
            const usuarios = stateManager.getUsuarios();
            const user = usuarios.find(u => 
                (u.login === usuario || u.email === usuario) && u.senha === senha
            );

            if (user) {
                stateManager.setCurrentUser(user);
                this.showSuccess('Login realizado com sucesso!');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showError('Usuário ou senha incorretos');
            }
        } catch (error) {
            this.showError('Erro ao realizar login. Tente novamente.');
        } finally {
            if (btnLogin) {
                btnLogin.classList.remove('loading');
                btnLogin.disabled = false;
            }
        }
    }

    togglePasswordVisibility() {
        const senhaInput = document.getElementById('senha');
        const toggleIcon = document.getElementById('togglePassword').querySelector('i');
        
        if (senhaInput.type === 'password') {
            senhaInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            senhaInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    showError(message) {
        const msgErro = document.getElementById('msg-erro');
        if (msgErro) {
            msgErro.textContent = message;
            msgErro.style.display = 'block';
        }
    }

    showSuccess(message) {
        const msgSucesso = document.getElementById('msg-sucesso');
        if (msgSucesso) {
            msgSucesso.textContent = message;
            msgSucesso.style.display = 'block';
        }
    }

    showRecoveryModal() {
        // Implementação da modal de recuperação de senha
        Utils.showNotification('Funcionalidade em desenvolvimento', 'info');
    }

    logout() {
        stateManager.setCurrentUser(null);
        window.location.href = 'login.html';
    }
}

// Oficinas Management
class OficinasManager {
    constructor() {
        this.oficinas = stateManager.getOficinas();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadOficinas();
        this.updateStats();
    }

    setupEventListeners() {
        // Busca
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce(() => this.filterOficinas(), 300)
            );
        }

        // Filtros
        const filterStatus = document.getElementById('filterStatus');
        const filterCidade = document.getElementById('filterCidade');
        if (filterStatus) {
            filterStatus.addEventListener('change', () => this.filterOficinas());
        }
        if (filterCidade) {
            filterCidade.addEventListener('change', () => this.filterOficinas());
        }

        // Botões de ação
        const btnNovaOficina = document.getElementById('btnNovaOficina');
        if (btnNovaOficina) {
            btnNovaOficina.addEventListener('click', () => {
                window.location.href = 'cadastrar-oficina.html';
            });
        }

        const btnRefresh = document.getElementById('btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.loadOficinas());
        }

        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', () => this.clearFilters());
        }
    }

    loadOficinas() {
        const container = document.getElementById('tabela-oficinas');
        if (!container) return;

        if (this.oficinas.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-wrench"></i>
                        <h3>Nenhuma oficina cadastrada</h3>
                        <p>Comece cadastrando sua primeira oficina parceira.</p>
                        <a href="cadastrar-oficina.html" class="btn btn-primary">
                            <i class="fas fa-plus"></i>
                            Cadastrar Primeira Oficina
                        </a>
                    </td>
                </tr>
            `;
            return;
        }

        const filteredOficinas = this.getFilteredOficinas();
        
        container.innerHTML = filteredOficinas.map(oficina => `
            <tr class="fade-in">
                <td>
                    <div class="cell-content">
                        <strong>${oficina.nome}</strong>
                        <div class="cell-subtitle">${oficina.cidade} - ${oficina.estado}</div>
                    </div>
                </td>
                <td>${Utils.formatCNPJ(oficina.cnpj)}</td>
                <td>${oficina.cidade}</td>
                <td>${oficina.responsavel}</td>
                <td>${Utils.formatPhone(oficina.telefone)}</td>
                <td>
                    <span class="status-badge status-${oficina.status}">
                        ${oficina.status === 'ativo' ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-action view" onclick="oficinasManager.viewOficina('${oficina.id}')" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" onclick="oficinasManager.editOficina('${oficina.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="oficinasManager.deleteOficina('${oficina.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.updateTableInfo(filteredOficinas.length);
    }

    getFilteredOficinas() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const cidadeFilter = document.getElementById('filterCidade')?.value || '';

        return this.oficinas.filter(oficina => {
            const matchesSearch = !searchTerm || 
                oficina.nome.toLowerCase().includes(searchTerm) ||
                oficina.cnpj.includes(searchTerm) ||
                oficina.cidade.toLowerCase().includes(searchTerm) ||
                oficina.responsavel.toLowerCase().includes(searchTerm);

            const matchesStatus = !statusFilter || oficina.status === statusFilter;
            const matchesCidade = !cidadeFilter || oficina.cidade === cidadeFilter;

            return matchesSearch && matchesStatus && matchesCidade;
        });
    }

    filterOficinas() {
        this.loadOficinas();
        this.updateCidadeFilter();
    }

    updateCidadeFilter() {
        const filterCidade = document.getElementById('filterCidade');
        if (!filterCidade) return;

        const cidades = [...new Set(this.oficinas.map(o => o.cidade))].sort();
        const currentValue = filterCidade.value;

        filterCidade.innerHTML = `
            <option value="">Todas as cidades</option>
            ${cidades.map(cidade => 
                `<option value="${cidade}" ${cidade === currentValue ? 'selected' : ''}>${cidade}</option>`
            ).join('')}
        `;
    }

    clearFilters() {
        const searchInput = document.getElementById('searchInput');
        const filterStatus = document.getElementById('filterStatus');
        const filterCidade = document.getElementById('filterCidade');

        if (searchInput) searchInput.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterCidade) filterCidade.value = '';

        this.loadOficinas();
    }

    updateStats() {
        const totalOficinas = document.getElementById('totalOficinas');
        const oficinasAtivas = document.getElementById('oficinasAtivas');
        const totalCidades = document.getElementById('totalCidades');
        const capacidadeTotal = document.getElementById('capacidadeTotal');

        if (totalOficinas) {
            totalOficinas.textContent = this.oficinas.length;
        }

        if (oficinasAtivas) {
            const ativas = this.oficinas.filter(o => o.status === 'ativo').length;
            oficinasAtivas.textContent = ativas;
        }

        if (totalCidades) {
            const cidades = new Set(this.oficinas.map(o => o.cidade)).size;
            totalCidades.textContent = cidades;
        }

        if (capacidadeTotal) {
            const capacidade = this.oficinas.reduce((sum, o) => sum + (parseInt(o.capacidade) || 0), 0);
            capacidadeTotal.textContent = capacidade;
        }
    }

    updateTableInfo(displayedCount) {
        const tableInfo = document.getElementById('tableInfo');
        if (tableInfo) {
            tableInfo.textContent = `Mostrando ${displayedCount} de ${this.oficinas.length} oficinas`;
        }
    }

    viewOficina(id) {
        const oficina = this.oficinas.find(o => o.id === id);
        if (!oficina) return;

        // Preencher modal de detalhes
        document.getElementById('detalheNome').textContent = oficina.nome;
        document.getElementById('detalheCnpj').textContent = Utils.formatCNPJ(oficina.cnpj);
        document.getElementById('detalheResponsavel').textContent = oficina.responsavel;
        document.getElementById('detalheTelefone').textContent = Utils.formatPhone(oficina.telefone);
        document.getElementById('detalheEmail').textContent = oficina.email;
        document.getElementById('detalheStatus').textContent = oficina.status === 'ativo' ? 'Ativa' : 'Inativa';
        document.getElementById('detalheCapacidade').textContent = oficina.capacidade;
        
        // Serviços
        const servicosContainer = document.getElementById('detalheServicos');
        if (servicosContainer && oficina.servicos) {
            servicosContainer.innerHTML = oficina.servicos.map(servico => 
                `<span class="service-tag">${servico}</span>`
            ).join('');
        }

        // Endereço
        const endereco = `${oficina.logradouro}, ${oficina.numero}${oficina.complemento ? ' - ' + oficina.complemento : ''}, ${oficina.bairro}, ${oficina.cidade} - ${oficina.estado}, ${Utils.formatCEP(oficina.cep)}`;
        document.getElementById('detalheEndereco').textContent = endereco;

        // Mostrar modal
        const modal = document.getElementById('detalhesModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    editOficina(id) {
        window.location.href = `editar-oficina.html?id=${id}`;
    }

    async deleteOficina(id) {
        const oficina = this.oficinas.find(o => o.id === id);
        if (!oficina) return;

        const confirmed = await Utils.confirm(
            `Tem certeza que deseja excluir a oficina "${oficina.nome}"? Esta ação não pode ser desfeita.`,
            'Confirmar Exclusão'
        );

        if (confirmed) {
            const success = stateManager.deleteOficina(id);
            if (success) {
                this.oficinas = stateManager.getOficinas();
                this.loadOficinas();
                this.updateStats();
                Utils.showNotification('Oficina excluída com sucesso', 'success');
            } else {
                Utils.showNotification('Erro ao excluir oficina', 'error');
            }
        }
    }
}

// Mensalidades Management
class MensalidadesManager {
    constructor() {
        this.mensalidades = stateManager.getMensalidades();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMensalidades();
        this.updateStats();
    }

    setupEventListeners() {
        // Busca e filtros
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', 
                Utils.debounce(() => this.filterMensalidades(), 300)
            );
        }

        const filterStatus = document.getElementById('filterStatus');
        const filterMes = document.getElementById('filterMes');
        const filterMetodo = document.getElementById('filterMetodo');
        
        if (filterStatus) filterStatus.addEventListener('change', () => this.filterMensalidades());
        if (filterMes) filterMes.addEventListener('change', () => this.filterMensalidades());
        if (filterMetodo) filterMetodo.addEventListener('change', () => this.filterMensalidades());

        // Botões de ação
        const btnNovaCobranca = document.getElementById('btnNovaCobranca');
        if (btnNovaCobranca) {
            btnNovaCobranca.addEventListener('click', () => this.showNovaCobrancaModal());
        }

        const btnConfigurarPlanos = document.getElementById('btnConfigurarPlanos');
        if (btnConfigurarPlanos) {
            btnConfigurarPlanos.addEventListener('click', () => this.showPlanosModal());
        }

        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', () => this.clearFilters());
        }
    }

    loadMensalidades() {
        const container = document.getElementById('mensalidadesGrid');
        if (!container) return;

        // Dados de exemplo (substituir pelos dados reais)
        const mensalidadesExemplo = [
            {
                id: '1',
                oficina: 'AutoCenter São Paulo',
                codigo: 'CB202411001',
                valor: 650.00,
                vencimento: '2024-11-15',
                status: 'pago',
                metodo: 'pix',
                dataPagamento: '2024-11-10',
                plano: 'premium'
            }
            // ... outros dados
        ];

        if (mensalidadesExemplo.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>Nenhuma cobrança encontrada</h3>
                    <p>Comece criando sua primeira cobrança.</p>
                    <button class="btn btn-primary" onclick="mensalidadesManager.showNovaCobrancaModal()">
                        <i class="fas fa-plus"></i>
                        Nova Cobrança
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = mensalidadesExemplo.map(mensalidade => `
            <div class="mensalidade-card fade-in">
                <div class="mensalidade-header">
                    <div class="mensalidade-info">
                        <h3 class="oficina-name">${mensalidade.oficina}</h3>
                        <span class="codigo-cobranca">#${mensalidade.codigo}</span>
                    </div>
                    <span class="status-badge status-${mensalidade.status}">
                        ${this.getStatusText(mensalidade.status)}
                    </span>
                </div>
                <div class="mensalidade-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>Vencimento: ${Utils.formatDate(mensalidade.vencimento)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Valor: ${Utils.formatCurrency(mensalidade.valor)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-credit-card"></i>
                        <span>${this.getMetodoText(mensalidade.metodo)} • ${Utils.formatDate(mensalidade.dataPagamento)}</span>
                    </div>
                </div>
                <div class="plano-info">
                    <div class="plano-label">Plano Contratado:</div>
                    <div class="plano-tags">
                        <span class="plano-tag ${mensalidade.plano}">${this.getPlanoText(mensalidade.plano)}</span>
                        <span class="plano-valor">${Utils.formatCurrency(mensalidade.valor)}/mês</span>
                    </div>
                </div>
                <div class="mensalidade-actions">
                    <button class="btn-action view" title="Ver Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action invoice" title="Emitir Nota">
                        <i class="fas fa-file-invoice"></i>
                    </button>
                    <button class="btn-action resend" title="Reenviar Cobrança">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `).join('');

        this.updateMensalidadesInfo(mensalidadesExemplo.length);
    }

    getStatusText(status) {
        const statusMap = {
            pago: 'Pago',
            pendente: 'Pendente',
            atrasado: 'Atrasado',
            cancelado: 'Cancelado'
        };
        return statusMap[status] || status;
    }

    getMetodoText(metodo) {
        const metodoMap = {
            pix: 'PIX',
            cartao: 'Cartão',
            boleto: 'Boleto',
            transferencia: 'Transferência'
        };
        return metodoMap[metodo] || metodo;
    }

    getPlanoText(plano) {
        const planoMap = {
            basic: 'Básico',
            professional: 'Professional',
            premium: 'Premium',
            enterprise: 'Enterprise'
        };
        return planoMap[plano] || plano;
    }

    filterMensalidades() {
        this.loadMensalidades();
    }

    clearFilters() {
        const searchInput = document.getElementById('searchInput');
        const filterStatus = document.getElementById('filterStatus');
        const filterMes = document.getElementById('filterMes');
        const filterMetodo = document.getElementById('filterMetodo');

        if (searchInput) searchInput.value = '';
        if (filterStatus) filterStatus.value = '';
        if (filterMes) filterMes.value = '';
        if (filterMetodo) filterMetodo.value = '';

        this.loadMensalidades();
    }

    updateStats() {
        // Atualizar estatísticas do dashboard de mensalidades
        const receitaTotal = document.getElementById('receitaTotal');
        const pagamentosDia = document.getElementById('pagamentosDia');
        const pagamentosAtrasados = document.getElementById('pagamentosAtrasados');
        const taxaAdimplencia = document.getElementById('taxaAdimplencia');

        if (receitaTotal) receitaTotal.textContent = 'R$ 4.850,00';
        if (pagamentosDia) pagamentosDia.textContent = '6';
        if (pagamentosAtrasados) pagamentosAtrasados.textContent = '2';
        if (taxaAdimplencia) taxaAdimplencia.textContent = '75%';
    }

    updateMensalidadesInfo(displayedCount) {
        const mensalidadesInfo = document.getElementById('mensalidadesInfo');
        if (mensalidadesInfo) {
            mensalidadesInfo.textContent = `Mostrando ${displayedCount} de ${displayedCount} cobranças`;
        }
    }

    showNovaCobrancaModal() {
        const modal = document.getElementById('modalNovaCobranca');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showPlanosModal() {
        const modal = document.getElementById('modalPlanos');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }
}

// Dashboard Management
class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.initCharts();
    }

    setupEventListeners() {
        // Botões de ação
        const btnRefresh = document.getElementById('btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => this.refreshDashboard());
        }

        const btnNotifications = document.getElementById('btnNotifications');
        if (btnNotifications) {
            btnNotifications.addEventListener('click', () => this.showNotifications());
        }

        const btnFullscreen = document.getElementById('btnFullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
        }

        // Logout
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
    }

    loadDashboardData() {
        this.updateStats();
        this.loadRecentOficinas();
        this.loadMensalidadesDestaque();
    }

    updateStats() {
        const oficinas = stateManager.getOficinas();
        
        const totalOficinas = document.getElementById('totalOficinas');
        const oficinasAtivas = document.getElementById('oficinasAtivas');
        const totalCidades = document.getElementById('totalCidades');
        const capacidadeTotal = document.getElementById('capacidadeTotal');

        if (totalOficinas) totalOficinas.textContent = oficinas.length;
        if (oficinasAtivas) {
            const ativas = oficinas.filter(o => o.status === 'ativo').length;
            oficinasAtivas.textContent = ativas;
        }
        if (totalCidades) {
            const cidades = new Set(oficinas.map(o => o.cidade)).size;
            totalCidades.textContent = cidades;
        }
        if (capacidadeTotal) {
            const capacidade = oficinas.reduce((sum, o) => sum + (parseInt(o.capacidade) || 0), 0);
            capacidadeTotal.textContent = capacidade;
        }
    }

    loadRecentOficinas() {
        const container = document.getElementById('oficinasGrid');
        if (!container) return;

        const oficinas = stateManager.getOficinas().slice(0, 6); // Últimas 6 oficinas

        if (oficinas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wrench"></i>
                    <h3>Nenhuma oficina cadastrada</h3>
                    <p>Comece cadastrando sua primeira oficina parceira.</p>
                    <a href="cadastrar-oficina.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Cadastrar Primeira Oficina
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = oficinas.map(oficina => `
            <div class="oficina-card fade-in">
                <div class="oficina-header">
                    <div class="oficina-info">
                        <h4>${oficina.nome}</h4>
                        <div class="oficina-cidade">
                            <i class="fas fa-map-marker-alt"></i>
                            ${oficina.cidade} - ${oficina.estado}
                        </div>
                    </div>
                    <span class="status-badge status-${oficina.status}">
                        ${oficina.status === 'ativo' ? 'Ativa' : 'Inativa'}
                    </span>
                </div>
                <div class="oficina-details">
                    <div class="detail-row">
                        <div class="detail-label">
                            <i class="fas fa-user"></i>
                            Responsável
                        </div>
                        <div class="detail-value">${oficina.responsavel}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">
                            <i class="fas fa-phone"></i>
                            Contato
                        </div>
                        <div class="detail-value">${Utils.formatPhone(oficina.telefone)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">
                            <i class="fas fa-car"></i>
                            Capacidade
                        </div>
                        <div class="detail-value capacidade">${oficina.capacidade}</div>
                    </div>
                </div>
                <div class="oficina-actions">
                    <button class="btn btn-sm btn-secondary" onclick="oficinasManager.viewOficina('${oficina.id}')">
                        <i class="fas fa-eye"></i>
                        Ver
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="oficinasManager.editOficina('${oficina.id}')">
                        <i class="fas fa-edit"></i>
                        Editar
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadMensalidadesDestaque() {
        const container = document.getElementById('mensalidadesGrid');
        if (!container) return;

        // Dados de exemplo para mensalidades em destaque
        const mensalidadesDestaque = [
            {
                id: '1',
                oficina: 'AutoCenter São Paulo',
                valor: 650.00,
                vencimento: '2024-11-15',
                status: 'pago',
                plano: 'premium'
            }
            // ... outros dados
        ];

        if (mensalidadesDestaque.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-money-bill-wave"></i>
                    <h3>Nenhuma mensalidade em destaque</h3>
                    <p>Não há mensalidades recentes ou pendentes.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = mensalidadesDestaque.map(mensalidade => `
            <div class="mensalidade-card fade-in">
                <div class="mensalidade-header">
                    <div class="mensalidade-info">
                        <h4>${mensalidade.oficina}</h4>
                        <div class="mensalidade-oficina">
                            <i class="fas fa-building"></i>
                            Mensalidade ${Utils.formatDate(mensalidade.vencimento)}
                        </div>
                    </div>
                    <span class="status-badge status-${mensalidade.status}">
                        ${mensalidade.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                </div>
                <div class="mensalidade-details">
                    <div class="mensalidade-row">
                        <div class="mensalidade-label">
                            <i class="fas fa-money-bill-wave"></i>
                            Valor
                        </div>
                        <div class="mensalidade-value valor">${Utils.formatCurrency(mensalidade.valor)}</div>
                    </div>
                    <div class="mensalidade-row">
                        <div class="mensalidade-label">
                            <i class="fas fa-calendar"></i>
                            Vencimento
                        </div>
                        <div class="mensalidade-value">${Utils.formatDate(mensalidade.vencimento)}</div>
                    </div>
                </div>
                <div class="mensalidade-actions">
                    <button class="btn btn-sm btn-secondary">
                        <i class="fas fa-eye"></i>
                        Detalhes
                    </button>
                    <button class="btn btn-sm btn-primary">
                        <i class="fas fa-receipt"></i>
                        Nota Fiscal
                    </button>
                </div>
            </div>
        `).join('');
    }

    initCharts() {
        this.initMensalidadesChart();
        this.initStatusPagamentosChart();
        this.initReceitaCidadeChart();
    }

    initMensalidadesChart() {
        const ctx = document.getElementById('mensalidadesChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov'],
                datasets: [{
                    label: 'Receita Mensal',
                    data: [3200, 3800, 4200, 4500, 4800, 4850],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    initStatusPagamentosChart() {
        const ctx = document.getElementById('statusPagamentosChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pagos', 'Pendentes', 'Atrasados'],
                datasets: [{
                    data: [6, 2, 2],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444'
                    ],
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

    initReceitaCidadeChart() {
        const ctx = document.getElementById('receitaCidadeChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Brasília'],
                datasets: [{
                    label: 'Receita por Cidade',
                    data: [1850, 1200, 800, 600, 400],
                    backgroundColor: '#8b5cf6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    refreshDashboard() {
        Utils.showLoading();
        setTimeout(() => {
            this.loadDashboardData();
            Utils.hideLoading();
            Utils.showNotification('Dashboard atualizado', 'success');
        }, 1000);
    }

    showNotifications() {
        Utils.showNotification('Sistema de notificações em desenvolvimento', 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    logout() {
        const loginManager = new LoginManager();
        loginManager.logout();
    }
}
// Produtos Management
class ProdutosManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProdutos();
    }

    setupEventListeners() {
        const btnNovoProduto = document.getElementById('btnNovoProduto');
        if (btnNovoProduto) {
            btnNovoProduto.addEventListener('click', () => this.showNovoProdutoModal());
        }

        const btnNovoOleo = document.getElementById('btnNovoOleo');
        if (btnNovoOleo) {
            btnNovoOleo.addEventListener('click', () => this.showNovoOleoModal());
        }

        const btnNovoFiltro = document.getElementById('btnNovoFiltro');
        if (btnNovoFiltro) {
            btnNovoFiltro.addEventListener('click', () => this.showNovoFiltroModal());
        }
    }

    async loadProdutos() {
        try {
            // Carregar óleos
            const responseOleos = await fetch('/api/produtos/oleos');
            const oleos = await responseOleos.json();
            
            // Carregar filtros
            const responseFiltros = await fetch('/api/produtos/filtros');
            const filtros = await responseFiltros.json();
            
            this.renderProdutos(oleos, filtros);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            Utils.showNotification('Erro ao carregar produtos', 'error');
        }
    }

    renderProdutos(oleos, filtros) {
        this.renderOleos(oleos);
        this.renderFiltros(filtros);
    }

    renderOleos(oleos) {
        const container = document.getElementById('oleosGrid');
        if (!container) return;

        if (oleos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-oil-can"></i>
                    <h3>Nenhum óleo cadastrado</h3>
                    <p>Comece cadastrando seu primeiro produto.</p>
                    <button class="btn btn-primary" onclick="produtosManager.showNovoOleoModal()">
                        <i class="fas fa-plus"></i>
                        Novo Óleo
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = oleos.map(oleo => `
            <div class="produto-card fade-in">
                <div class="produto-header">
                    <div class="produto-info">
                        <h4>${oleo.nome}</h4>
                        <div class="produto-details">
                            <span class="produto-marca">${oleo.marca}</span>
                            <span class="produto-viscosidade">${oleo.viscosidade}</span>
                        </div>
                    </div>
                    <span class="produto-tipo">${oleo.tipo === 'carro' ? 'Carro' : 'Moto'}</span>
                </div>
                <div class="produto-body">
                    <div class="produto-spec">
                        <span class="spec-label">Especificação:</span>
                        <span class="spec-value">${oleo.especificacao}</span>
                    </div>
                    <div class="produto-price">
                        <span class="price">${Utils.formatCurrency(oleo.preco)}</span>
                    </div>
                </div>
                <div class="produto-actions">
                    <button class="btn-action edit" onclick="produtosManager.editOleo(${oleo.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="produtosManager.deleteOleo(${oleo.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderFiltros(filtros) {
        const container = document.getElementById('filtrosGrid');
        if (!container) return;

        if (filtros.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>Nenhum filtro cadastrado</h3>
                    <p>Comece cadastrando seu primeiro filtro.</p>
                    <button class="btn btn-primary" onclick="produtosManager.showNovoFiltroModal()">
                        <i class="fas fa-plus"></i>
                        Novo Filtro
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filtros.map(filtro => `
            <div class="produto-card fade-in">
                <div class="produto-header">
                    <div class="produto-info">
                        <h4>${filtro.nome}</h4>
                        <div class="produto-details">
                            <span class="produto-tipo">${filtro.tipo === 'carro' ? 'Carro' : 'Moto'}</span>
                        </div>
                    </div>
                    <span class="produto-compatibilidade">Compatível</span>
                </div>
                <div class="produto-body">
                    <div class="produto-spec">
                        <span class="spec-label">Compatibilidade:</span>
                        <span class="spec-value">${filtro.compatibilidade_modelo}</span>
                    </div>
                    <div class="produto-price">
                        <span class="price">${Utils.formatCurrency(filtro.preco)}</span>
                    </div>
                </div>
                <div class="produto-actions">
                    <button class="btn-action edit" onclick="produtosManager.editFiltro(${filtro.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="produtosManager.deleteFiltro(${filtro.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    showNovoProdutoModal() {
        const modal = document.getElementById('modalNovoProduto');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    showNovoOleoModal() {
        const modal = document.getElementById('modalNovoOleo');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetOleoForm();
        }
    }

    showNovoFiltroModal() {
        const modal = document.getElementById('modalNovoFiltro');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetFiltroForm();
        }
    }

    resetOleoForm() {
        const form = document.getElementById('formNovoOleo');
        if (form) {
            form.reset();
            document.getElementById('oleoId').value = '';
        }
    }

    resetFiltroForm() {
        const form = document.getElementById('formNovoFiltro');
        if (form) {
            form.reset();
            document.getElementById('filtroId').value = '';
        }
    }

    async saveOleo(formData) {
        try {
            const oleoId = document.getElementById('oleoId').value;
            const url = oleoId ? `/api/produtos/oleos/${oleoId}` : '/api/produtos/oleos';
            const method = oleoId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                Utils.showNotification('Óleo salvo com sucesso!', 'success');
                this.loadProdutos();
                this.closeModal('modalNovoOleo');
            } else {
                throw new Error('Erro ao salvar óleo');
            }
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao salvar óleo', 'error');
        }
    }

    async saveFiltro(formData) {
        try {
            const filtroId = document.getElementById('filtroId').value;
            const url = filtroId ? `/api/produtos/filtros/${filtroId}` : '/api/produtos/filtros';
            const method = filtroId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                Utils.showNotification('Filtro salvo com sucesso!', 'success');
                this.loadProdutos();
                this.closeModal('modalNovoFiltro');
            } else {
                throw new Error('Erro ao salvar filtro');
            }
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao salvar filtro', 'error');
        }
    }

    async editOleo(id) {
        try {
            const response = await fetch(`/api/produtos/oleos/${id}`);
            const oleo = await response.json();

            document.getElementById('oleoId').value = oleo.id;
            document.getElementById('nomeOleo').value = oleo.nome;
            document.getElementById('tipoOleo').value = oleo.tipo;
            document.getElementById('viscosidadeOleo').value = oleo.viscosidade;
            document.getElementById('especificacaoOleo').value = oleo.especificacao;
            document.getElementById('marcaOleo').value = oleo.marca;
            document.getElementById('precoOleo').value = oleo.preco;

            this.showNovoOleoModal();
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao carregar óleo', 'error');
        }
    }

    async editFiltro(id) {
        try {
            const response = await fetch(`/api/produtos/filtros/${id}`);
            const filtro = await response.json();

            document.getElementById('filtroId').value = filtro.id;
            document.getElementById('nomeFiltro').value = filtro.nome;
            document.getElementById('tipoFiltro').value = filtro.tipo;
            document.getElementById('compatibilidadeFiltro').value = filtro.compatibilidade_modelo;
            document.getElementById('precoFiltro').value = filtro.preco;

            this.showNovoFiltroModal();
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao carregar filtro', 'error');
        }
    }

    async deleteOleo(id) {
        const confirmed = await Utils.confirm(
            'Tem certeza que deseja excluir este óleo?',
            'Confirmar Exclusão'
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/produtos/oleos/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Utils.showNotification('Óleo excluído com sucesso!', 'success');
                    this.loadProdutos();
                } else {
                    throw new Error('Erro ao excluir óleo');
                }
            } catch (error) {
                console.error('Erro:', error);
                Utils.showNotification('Erro ao excluir óleo', 'error');
            }
        }
    }

    async deleteFiltro(id) {
        const confirmed = await Utils.confirm(
            'Tem certeza que deseja excluir este filtro?',
            'Confirmar Exclusão'
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/produtos/filtros/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Utils.showNotification('Filtro excluído com sucesso!', 'success');
                    this.loadProdutos();
                } else {
                    throw new Error('Erro ao excluir filtro');
                }
            } catch (error) {
                console.error('Erro:', error);
                Utils.showNotification('Erro ao excluir filtro', 'error');
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}

// Oficinas Admin Management
class OficinasAdminManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadOficinas();
    }

    setupEventListeners() {
        const btnNovaOficinaAdmin = document.getElementById('btnNovaOficinaAdmin');
        if (btnNovaOficinaAdmin) {
            btnNovaOficinaAdmin.addEventListener('click', () => this.showNovaOficinaModal());
        }

        // Form submit handlers
        const formNovaOficina = document.getElementById('formNovaOficina');
        if (formNovaOficina) {
            formNovaOficina.addEventListener('submit', (e) => this.handleSaveOficina(e));
        }
    }

    async loadOficinas() {
        try {
            const response = await fetch('/api/oficinas');
            const oficinas = await response.json();
            this.renderOficinas(oficinas);
        } catch (error) {
            console.error('Erro ao carregar oficinas:', error);
            Utils.showNotification('Erro ao carregar oficinas', 'error');
        }
    }

    renderOficinas(oficinas) {
        const container = document.getElementById('oficinasAdminGrid');
        if (!container) return;

        if (oficinas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wrench"></i>
                    <h3>Nenhuma oficina cadastrada</h3>
                    <p>Comece cadastrando a primeira oficina.</p>
                    <button class="btn btn-primary" onclick="oficinasAdminManager.showNovaOficinaModal()">
                        <i class="fas fa-plus"></i>
                        Nova Oficina
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = oficinas.map(oficina => `
            <div class="oficina-admin-card fade-in">
                <div class="oficina-admin-header">
                    <div class="oficina-admin-info">
                        <h4>${oficina.nome}</h4>
                        <div class="oficina-admin-details">
                            <span class="oficina-endereco">
                                <i class="fas fa-map-marker-alt"></i>
                                ${oficina.cidade} - ${oficina.estado}
                            </span>
                            <span class="oficina-contato">
                                <i class="fas fa-phone"></i>
                                ${oficina.telefone}
                            </span>
                        </div>
                    </div>
                    <span class="status-badge status-ativo">Ativa</span>
                </div>
                <div class="oficina-admin-body">
                    <div class="oficina-admin-horario">
                        <span class="horario-label">Horário:</span>
                        <span class="horario-value">${oficina.horario_abertura} às ${oficina.horario_fechamento}</span>
                    </div>
                    <div class="oficina-admin-dias">
                        <span class="dias-label">Dias:</span>
                        <span class="dias-value">${oficina.dias_funcionamento}</span>
                    </div>
                </div>
                <div class="oficina-admin-actions">
                    <button class="btn-action edit" onclick="oficinasAdminManager.editOficina(${oficina.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="oficinasAdminManager.deleteOficina(${oficina.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    showNovaOficinaModal() {
        const modal = document.getElementById('modalNovaOficina');
        if (modal) {
            modal.classList.remove('hidden');
            this.resetOficinaForm();
        }
    }

    resetOficinaForm() {
        const form = document.getElementById('formNovaOficina');
        if (form) {
            form.reset();
            document.getElementById('oficinaId').value = '';
            // Set default values
            document.getElementById('horarioAbertura').value = '08:00';
            document.getElementById('horarioFechamento').value = '18:00';
        }
    }

    async handleSaveOficina(e) {
        e.preventDefault();
        
        const formData = {
            nome: document.getElementById('nomeOficina').value,
            email: document.getElementById('emailOficina').value,
            senha: document.getElementById('senhaOficina').value,
            telefone: document.getElementById('telefoneOficina').value,
            cnpj: document.getElementById('cnpjOficina').value,
            cep: document.getElementById('cepOficina').value,
            endereco: document.getElementById('enderecoOficina').value,
            cidade: document.getElementById('cidadeOficina').value,
            estado: document.getElementById('estadoOficina').value,
            horario_abertura: document.getElementById('horarioAbertura').value,
            horario_fechamento: document.getElementById('horarioFechamento').value,
            dias_funcionamento: Array.from(document.querySelectorAll('input[name="diasFuncionamento"]:checked'))
                .map(checkbox => checkbox.value).join(','),
            lat: document.getElementById('latOficina').value || null,
            lng: document.getElementById('lngOficina').value || null
        };

        await this.saveOficina(formData);
    }

    async saveOficina(formData) {
        try {
            const oficinaId = document.getElementById('oficinaId').value;
            const url = oficinaId ? `/api/oficinas/${oficinaId}` : '/api/oficinas';
            const method = oficinaId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                Utils.showNotification('Oficina salva com sucesso!', 'success');
                this.loadOficinas();
                this.closeModal('modalNovaOficina');
            } else {
                throw new Error('Erro ao salvar oficina');
            }
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao salvar oficina', 'error');
        }
    }

    async editOficina(id) {
        try {
            const response = await fetch(`/api/oficinas/${id}`);
            const oficina = await response.json();

            // Preencher formulário
            document.getElementById('oficinaId').value = oficina.id;
            document.getElementById('nomeOficina').value = oficina.nome;
            document.getElementById('emailOficina').value = oficina.email;
            document.getElementById('telefoneOficina').value = oficina.telefone;
            document.getElementById('cnpjOficina').value = oficina.cnpj;
            document.getElementById('cepOficina').value = oficina.cep;
            document.getElementById('enderecoOficina').value = oficina.endereco;
            document.getElementById('cidadeOficina').value = oficina.cidade;
            document.getElementById('estadoOficina').value = oficina.estado;
            document.getElementById('horarioAbertura').value = oficina.horario_abertura;
            document.getElementById('horarioFechamento').value = oficina.horario_fechamento;
            
            // Preencher dias de funcionamento
            const dias = oficina.dias_funcionamento.split(',');
            document.querySelectorAll('input[name="diasFuncionamento"]').forEach(checkbox => {
                checkbox.checked = dias.includes(checkbox.value);
            });

            if (oficina.lat) document.getElementById('latOficina').value = oficina.lat;
            if (oficina.lng) document.getElementById('lngOficina').value = oficina.lng;

            this.showNovaOficinaModal();
        } catch (error) {
            console.error('Erro:', error);
            Utils.showNotification('Erro ao carregar oficina', 'error');
        }
    }

    async deleteOficina(id) {
        const confirmed = await Utils.confirm(
            'Tem certeza que deseja excluir esta oficina?',
            'Confirmar Exclusão'
        );

        if (confirmed) {
            try {
                const response = await fetch(`/api/oficinas/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    Utils.showNotification('Oficina excluída com sucesso!', 'success');
                    this.loadOficinas();
                } else {
                    throw new Error('Erro ao excluir oficina');
                }
            } catch (error) {
                console.error('Erro:', error);
                Utils.showNotification('Erro ao excluir oficina', 'error');
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
        }
    }
}
// Inicialização global
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar managers baseado na página atual
    const path = window.location.pathname;
    
    // Sidebar (presente em todas as páginas exceto login)
    if (!path.includes('login.html') && !path.includes('cadastroUsuario.html')) {
        new SidebarManager();
    }

    // Managers específicos por página
    if (path.includes('dashboard.html')) {
        new DashboardManager();
    } else if (path.includes('oficinas.html')) {
        window.oficinasManager = new OficinasManager();
    } else if (path.includes('mensalidades.html')) {
        window.mensalidadesManager = new MensalidadesManager();
    } else if (path.includes('login.html')) {
        new LoginManager();
    }

    // Logout global
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            const loginManager = new LoginManager();
            loginManager.logout();
        });
    }

    // Fechar modais
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close') || e.target.classList.contains('close-btn')) {
            e.target.closest('.modal').classList.add('hidden');
        }
    });

    // Prevenir envio de formulários com validação
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    let errorElement = field.parentNode.querySelector('.form-error');
                    if (!errorElement) {
                        errorElement = document.createElement('div');
                        errorElement.className = 'form-error';
                        field.parentNode.appendChild(errorElement);
                    }
                    errorElement.textContent = 'Este campo é obrigatório';
                }
            });

            if (!isValid) {
                e.preventDefault();
                Utils.showNotification('Preencha todos os campos obrigatórios', 'error');
            }
        });
    });

    // Máscaras de input
    const cnpjInputs = document.querySelectorAll('input[name="cnpj"]');
    cnpjInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 14) {
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });
    });

    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 11) {
                value = value.replace(/^(\d{2})(\d)/, '($1) $2');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });
    });

    const cepInputs = document.querySelectorAll('input[name="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                value = value.replace(/^(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            }
        });

        // Buscar CEP
        input.addEventListener('blur', function(e) {
            const cep = e.target.value.replace(/\D/g, '');
            if (cep.length === 8) {
                this.buscarCEP(cep);
            }
        });
    });
    
    if (path.includes('produtos.html')) {
        window.produtosManager = new ProdutosManager();
    } else if (path.includes('oficinas-admin.html')) {
        window.oficinasAdminManager = new OficinasAdminManager();
    }
});

// Função para buscar CEP
function buscarCEP(cep) {
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (!data.erro) {
                const logradouro = document.querySelector('input[name="logradouro"]');
                const bairro = document.querySelector('input[name="bairro"]');
                const cidade = document.querySelector('input[name="cidade"]');
                const estado = document.querySelector('select[name="estado"]');

                if (logradouro) logradouro.value = data.logradouro;
                if (bairro) bairro.value = data.bairro;
                if (cidade) cidade.value = data.localidade;
                if (estado) estado.value = data.uf;
            } else {
                Utils.showNotification('CEP não encontrado', 'error');
            }
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            Utils.showNotification('Erro ao buscar CEP', 'error');
        });
}

// Exportar para uso global
window.stateManager = stateManager;
window.Utils = Utils;