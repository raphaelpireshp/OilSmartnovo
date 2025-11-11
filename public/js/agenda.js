// agenda.js - Arquivo completo e funcional
document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const appointmentsList = document.querySelector('.appointments-list');
    const filterPeriod = document.getElementById('filter-period');
    const filterStatus = document.getElementById('filter-status');
    const filterSort = document.getElementById('filter-sort');
    const clearFiltersBtn = document.getElementById('clear-filters');

    // Estados
    let currentFilter = 'all';
    let currentStatusFilter = 'all';
    let currentSort = 'newest';
    let allAppointments = [];

    // Inicialização
    init();

    function init() {
        if (!checkAuthentication()) {
            return;
        }

        loadAppointments();
        loadLembreteInteligente();
        setupEventListeners();
        verificarStatusPeriodicamente();
    }

    // Verificar se o usuário está logado
    function checkAuthentication() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            showToast('Você precisa fazer login para ver seus agendamentos', 'error');
            setTimeout(() => {
                window.location.href = '/html/login.html?redirect=agenda.html';
            }, 2000);
            return false;
        }
        return true;
    }

    function setupEventListeners() {
        // Filtro por período
        if (filterPeriod) {
            filterPeriod.addEventListener('change', function () {
                currentFilter = this.value;
                filterAppointments();
            });
        }

        // Filtro por status
        if (filterStatus) {
            filterStatus.addEventListener('change', function () {
                currentStatusFilter = this.value;
                filterAppointments();
            });
        }

        // Ordenação
        if (filterSort) {
            filterSort.addEventListener('change', function () {
                currentSort = this.value;
                filterAppointments();
            });
        }

        // Limpar filtros
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function () {
                currentFilter = 'all';
                currentStatusFilter = 'all';
                currentSort = 'newest';

                if (filterPeriod) filterPeriod.value = 'all';
                if (filterStatus) filterStatus.value = 'all';
                if (filterSort) filterSort.value = 'newest';

                filterAppointments();
            });
        }
    }

    // Carregar agendamentos do backend
    async function loadAppointments() {
        showLoading(true);

        try {
            // Obter ID do usuário logado
            const userData = localStorage.getItem('user');
            if (!userData) {
                throw new Error('Usuário não está logado');
            }

            const user = JSON.parse(userData);
            const userId = user.id;

            if (!userId) {
                throw new Error('ID do usuário não encontrado');
            }

            // Buscar agendamentos específicos do usuário
            const response = await fetch(`/api/agendamento_simples/usuario/${userId}`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                allAppointments = result.data || [];
                displayAppointments(allAppointments);
            } else {
                throw new Error(result.message || 'Erro ao carregar agendamentos');
            }

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            showError('Erro ao carregar agendamentos. Verifique se está logado.');

            // Se não estiver logado, redirecionar para login
            if (error.message.includes('não está logado')) {
                setTimeout(() => {
                    window.location.href = '/html/login.html?redirect=agenda.html';
                }, 2000);
            }
        } finally {
            showLoading(false);
        }
    }

    // Buscar lembrete inteligente baseado no status dos agendamentos
    async function loadLembreteInteligente() {
        try {
            const userData = localStorage.getItem('user');
            if (!userData) return;

            const user = JSON.parse(userData);
            const userId = user.id;

            if (!userId) return;

            // Buscar agendamentos do usuário
            const response = await fetch(`/api/agendamento_simples/usuario/${userId}`);

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.data && result.data.length > 0) {
                    const agendamentos = result.data;
                    const agora = new Date();

                    // Buscar PRÓXIMO agendamento futuro (não concluído, não cancelado)
                    const proximoAgendamento = agendamentos.find(ag => {
                        const dataAgendamento = new Date(ag.data_hora);
                        return dataAgendamento > agora &&
                            ag.status !== 'cancelado' &&
                            ag.status !== 'fora_prazo' &&
                            ag.status !== 'concluido';
                    });

                    if (proximoAgendamento) {
                        // Se tem agendamento futuro, mostrar informações dele
                        displayProximoAgendamento(proximoAgendamento);
                    } else {
                        // Se não tem agendamento futuro, mostrar lembrete baseado no último serviço
                        const ultimoConcluido = agendamentos
                            .filter(ag => ag.status === 'concluido')
                            .sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora))[0];

                        if (ultimoConcluido) {
                            displayLembreteAutomatico(ultimoConcluido);
                        } else {
                            displayLembretePadrao();
                        }
                    }
                } else {
                    displayLembretePadrao();
                }
            } else {
                displayLembretePadrao();
            }
        } catch (error) {
            console.error('Erro ao carregar lembrete inteligente:', error);
            displayLembretePadrao();
        }
    }

    // Adicionar esta função para recarregar o lembrete quando necessário
    function recarregarLembrete() {
        if (typeof loadLembreteInteligente === 'function') {
            loadLembreteInteligente();
        }
    }

    // Chamar esta função quando um agendamento for concluído
    window.recarregarLembrete = recarregarLembrete;

    // Exibir informações do próximo agendamento
    function displayProximoAgendamento(agendamento) {
        const reminderSection = document.querySelector('.reminder-section');
        if (!reminderSection) return;

        const dataAgendamento = new Date(agendamento.data_hora);
        const agora = new Date();
        const diffTime = dataAgendamento - agora;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusText = '';
        if (diffDays === 0) {
            statusText = '<span style="color: #28a745;">⚡ É hoje!</span>';
        } else if (diffDays === 1) {
            statusText = '<span style="color: #ffc107;">⚠️ Amanhã!</span>';
        } else if (diffDays <= 7) {
            statusText = `<span style="color: #fd7e14;">📅 Em ${diffDays} dias</span>`;
        } else {
            statusText = `<span style="color: #17a2b8;">📅 Em ${diffDays} dias</span>`;
        }

        reminderSection.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-calendar-check"></i> Próximo Agendamento</h2>
        </div>
        <div class="reminder-card next-appointment">
            <div class="reminder-content">
                <div class="reminder-icon" style="background: #e7f3ff; color: #0066cc;">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="reminder-details">
                    <h3 style="color: #0066cc;">${agendamento.servicos || 'Serviço Agendado'}</h3>
                    <p><strong>Veículo:</strong> ${agendamento.veiculo || 'Veículo não informado'}</p>
                    <p><strong>Data e Horário:</strong> ${dataAgendamento.toLocaleDateString('pt-BR')} às ${dataAgendamento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p><strong>Local:</strong> ${agendamento.oficina_nome || 'Oficina'} - ${agendamento.oficina_endereco || 'Endereço não informado'}</p>
                    <p><strong>Status:</strong> ${statusText}</p>
                    ${agendamento.total_servico ? `<p><strong>Valor:</strong> R$ ${parseFloat(agendamento.total_servico).toFixed(2)}</p>` : ''}
                </div>
            </div>
            <div class="reminder-actions">
                ${diffDays > 1 ? `
                ` : ''}
            </div>
        </div>
    `;
    }

    // Atualize também a função displayLembreteAutomatico para ficar mais clara:
    function displayLembreteAutomatico(ultimoServico) {
        const reminderSection = document.querySelector('.reminder-section');
        if (!reminderSection) return;

        const dataServico = new Date(ultimoServico.data_hora);

        // Calcular próxima troca (6 meses após o serviço)
        const proximaTrocaData = new Date(dataServico);
        proximaTrocaData.setMonth(proximaTrocaData.getMonth() + 6);

        // Verificar se já passou da data recomendada
        const hoje = new Date();
        const estaAtrasado = proximaTrocaData < hoje;

        // Calcular dias de atraso ou até a próxima troca
        const diffTime = Math.abs(proximaTrocaData - hoje);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let statusText = '';
        if (estaAtrasado) {
            statusText = `<span style="color: #dc3545;">⏰ Atrasado há ${diffDays} dias</span>`;
        } else if (diffDays <= 30) {
            statusText = `<span style="color: #fd7e14;">⚠️ Em ${diffDays} dias</span>`;
        } else {
            statusText = `<span style="color: #28a745;">📅 Em ${diffDays} dias</span>`;
        }

        reminderSection.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-bell"></i> Lembrete de Manutenção</h2>
        </div>
        <div class="reminder-card ${estaAtrasado ? 'reminder-urgent' : ''}">
            <div class="reminder-content">
                <div class="reminder-icon ${estaAtrasado ? 'urgent' : ''}">
                    <i class="fas fa-oil-can"></i>
                </div>
                <div class="reminder-details">
                    <h3>${ultimoServico.servicos || 'Troca de Óleo e Filtro'}</h3>
                    <p><strong>Veículo:</strong> ${ultimoServico.veiculo || 'Seu veículo'}</p>
                    <p><strong>Último serviço:</strong> ${dataServico.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Recomendamos que sua próxima troca deve ser feita no dia:</strong> ${proximaTrocaData.toLocaleDateString('pt-BR')}</p>
                    <p><strong>Status:</strong> ${statusText}</p>
                    ${estaAtrasado ?
                '<p style="color: #dc3545; font-weight: bold;">⚠️ Sua troca de óleo está atrasada!</p>' :
                '<p style="color: #28a745;">✅ Sua manutenção está em dia</p>'
            }
                </div>
            </div>
            <div class="reminder-actions">
                <a href="/html/servicos.html" class="btn btn-primary">
                    <i class="fas fa-calendar-plus"></i> Agendar Nova Troca
                </a>
            </div>
        </div>
    `;
    }

    function displayLembretePadrao() {
        const reminderSection = document.querySelector('.reminder-section');
        if (!reminderSection) return;

        reminderSection.innerHTML = `
        <div class="section-header">
            <h2><i class="fas fa-bell"></i> Lembrete de Manutenção</h2>
        </div>
        <div class="reminder-card">
            <div class="reminder-content">
                <div class="reminder-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="reminder-details">
                    <h3>Bem-vindo ao Sistema de Agendamentos</h3>
                    <p>Faça seu primeiro agendamento e acompanhe aqui os lembretes de manutenção do seu veículo.</p>
                </div>
            </div>
            <div class="reminder-actions">
                <a href="/html/servicos.html" class="btn btn-primary">
                    <i class="fas fa-calendar-plus"></i> Fazer Primeiro Agendamento
                </a>
            </div>
        </div>
    `;
    }

    // Função para ver detalhes do agendamento
    function verDetalhesAgendamento(agendamentoId) {
        // Rolar até o card do agendamento
        const card = document.querySelector(`.appointment-card[data-id="${agendamentoId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Efeito visual de destaque
            card.style.animation = 'pulse 2s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 2000);
        }
    }

    // Função para reagendar qualquer serviço
    async function reagendarServico(agendamentoId) {
        try {
            const response = await fetch(`/api/agendamento_simples/${agendamentoId}`);
            const result = await response.json();

            if (result.success) {
                const agendamento = result.data;

                sessionStorage.setItem('ultimoAgendamento', JSON.stringify({
                    veiculo: agendamento.veiculo,
                    servicos: agendamento.servicos,
                    tipo_oleo: agendamento.tipo_oleo,
                    oficina: {
                        nome: agendamento.oficina_nome,
                        endereco: agendamento.oficina_endereco
                    }
                }));

                window.location.href = '/html/servicos.html';
            }
        } catch (error) {
            console.error('Erro ao reagendar:', error);
            showToast('Erro ao carregar dados do serviço', 'error');
        }
    }

    // Filtrar e ordenar agendamentos
    function filterAppointments() {
        let filtered = [...allAppointments];

        // Filtro por período
        if (currentFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.data_hora);

                switch (currentFilter) {
                    case 'today':
                        return isToday(appointmentDate);

                    case 'week':
                        return isThisWeek(appointmentDate);

                    case 'month':
                        return isThisMonth(appointmentDate);

                    case 'last_month':
                        return isLastMonth(appointmentDate);

                    case 'year':
                        return isThisYear(appointmentDate);

                    default:
                        return true;
                }
            });
        }

        // Filtro por status
        if (currentStatusFilter !== 'all') {
            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.data_hora);
                const now = new Date();

                switch (currentStatusFilter) {
                    case 'pendente':
                        return appointment.status === 'pendente' || (appointmentDate > now && (!appointment.status || appointment.status === 'pendente'));

                    case 'agendado':
                        return appointment.status === 'confirmado' || (appointmentDate > now && appointment.status !== 'cancelado');

                    case 'concluido':
                        return appointment.status === 'concluido';

                    case 'cancelado':
                        return appointment.status === 'cancelado';

                    case 'fora_prazo':
                        return appointment.status === 'fora_prazo' || (appointmentDate < now && appointment.status !== 'concluido' && appointment.status !== 'cancelado');

                    default:
                        return true;
                }
            });
        }

        // Ordenação
        filtered.sort((a, b) => {
            const dateA = new Date(a.data_hora);
            const dateB = new Date(b.data_hora);

            switch (currentSort) {
                case 'newest':
                    return dateB - dateA;

                case 'oldest':
                    return dateA - dateB;

                case 'date_asc':
                    return dateA - dateB;

                case 'date_desc':
                    return dateB - dateA;

                default:
                    return dateB - dateA;
            }
        });

        displayAppointments(filtered);
    }

    // FUNÇÃO CORRIGIDA - Exibir agendamentos na página
    function displayAppointments(appointments) {
        if (!appointmentsList) return;

        if (appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Nenhum agendamento encontrado</h3>
                    <p>Não há agendamentos para os filtros selecionados.</p>
                </div>
            `;
            return;
        }

        appointmentsList.innerHTML = appointments.map(appointment => {
            const statusClass = getStatusClass(appointment);
            const statusText = getStatusText(appointment);
            
            // Mostrar quem cancelou, se aplicável
            const cancelInfo = appointment.cancelado_por ? 
                `<small style="display:block; margin-top:5px; color:#666;">Cancelado por: ${appointment.cancelado_por === 'cliente' ? 'Você' : 'Oficina'}</small>` : '';
            
            return `
                <div class="appointment-card ${statusClass}" data-id="${appointment.id}">
                    <div class="appointment-header">
                        <span class="protocol">Protocolo: ${appointment.protocolo || 'N/A'}</span>
                        <span class="status ${statusClass}">
                            ${statusText}
                            ${cancelInfo}
                        </span>
                    </div>
                    <div class="appointment-body">
                        <div class="service-info">
                            <h3>${appointment.servicos || 'Troca de Óleo'}</h3>
                            <p><i class="fas fa-car"></i> ${appointment.veiculo || 'Veículo não informado'}</p>
                            ${appointment.servicos ? `<p><i class="fas fa-oil-can"></i> ${appointment.servicos.replace(/[\[\]"]/g, '')}</p>` : ''}
                        </div>
                        <div class="date-info">
                            <p><i class="far fa-calendar-alt"></i> ${formatDate(appointment.data_hora)}</p>
                            <p><i class="far fa-clock"></i> ${formatTime(appointment.data_hora)}</p>
                        </div>
                        <div class="location-info">
                            <p><i class="fas fa-map-marker-alt"></i> ${appointment.oficina_nome || 'Oficina'}</p>
                            <p>${appointment.oficina_endereco || 'Endereço não informado'}</p>
                        </div>
                        ${appointment.total_servico ? `
                        <div class="price-info">
                            <p><i class="fas fa-tag"></i> Total: R$ ${parseFloat(appointment.total_servico).toFixed(2)}</p>
                        </div>
                        ` : ''}
                        ${appointment.motivo_cancelamento ? `
                        <div class="cancel-info">
                            <p><i class="fas fa-info-circle"></i> Motivo: ${appointment.motivo_cancelamento}</p>
                        </div>
                        ` : ''}
                        ${appointment.divergencia ? `
                        <div class="divergence-info">
                            <p><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> 
                            <strong>Divergência registrada pela oficina:</strong> ${appointment.divergencia}</p>
                        </div>
                        ` : ''}
                    </div>
                    <div class="appointment-footer">
                        ${getAppointmentActions(appointment)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // NOVA FUNÇÃO - Lógica centralizada para ações dos agendamentos
    function getAppointmentActions(appointment) {
        const statusClass = getStatusClass(appointment);
        const isFuture = isFutureAppointment(appointment);
        
        // AGENDAMENTOS CANCELADOS ou EXPIRADOS
        if (statusClass === 'cancelled' || statusClass === 'expired') {
            return `
                <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                    <i class="fas fa-redo"></i> Novo Agendamento
                </button>
                <span class="text-muted">Avaliação indisponível</span>
            `;
        }
        
        // AGENDAMENTOS COM DIVERGÊNCIA - APENAS COMPROVANTE
        if (statusClass === 'divergence') {
            return `
                <span class="text-muted">Avaliação indisponível</span>
            `;
        }
        
        // AGENDAMENTOS FUTUROS (PENDENTES/CONFIRMADOS)
        if (isFuture) {
            return `
                <button class="btn btn-outline btn-cancel" onclick="cancelAppointment(${appointment.id})">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            `;
        }
        
        // AGENDAMENTOS CONCLUÍDOS - PERMITIR AVALIAÇÃO
        if (statusClass === 'completed') {
            return `
                <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                    <i class="fas fa-redo"></i> Repetir Serviço
                </button>
            `;
        }
        
        // PADRÃO (fallback)
        return `
            <span class="text-muted">Ações indisponíveis</span>
        `;
    }

    // FUNÇÃO ATUALIZADA - Para compatibilidade com outras partes do código
    function updateAppointmentFooter(cardElement, appointment) {
        const footer = cardElement.querySelector('.appointment-footer');
        if (!footer) return;
        
        footer.innerHTML = getAppointmentActions(appointment);
    }

    // FUNÇÃO ATUALIZADA - Verificar se é agendamento futuro
    function isFutureAppointment(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        // Só é futuro se: data > agora E não está em estados finais
        return appointmentDate > now && 
               appointment.status !== 'cancelado' && 
               appointment.status !== 'concluido' &&
               appointment.status !== 'fora_prazo' &&
               appointment.status !== 'divergencia';
    }

    // ATUALIZAR função getStatusClass no agenda.js
    function getStatusClass(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();

        // Primeiro verifica o status do banco
        if (appointment.status === 'cancelado') {
            return 'cancelled';
        } else if (appointment.status === 'fora_prazo') {
            return 'expired';
        } else if (appointment.status === 'concluido') {
            return 'completed';
        } else if (appointment.status === 'divergencia') {
            return 'divergence';
        } else if (appointmentDate > now) {
            return 'pending';
        } else {
            return 'expired';
        }
    }

    // ATUALIZAR função getStatusText no agenda.js
    function getStatusText(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();

        // Primeiro verifica o status do banco
        if (appointment.status === 'cancelado') {
            return 'Cancelado';
        } else if (appointment.status === 'fora_prazo') {
            return 'Fora do Prazo';
        } else if (appointment.status === 'concluido') {
            return 'Concluído';
        } else if (appointment.status === 'divergencia') {
            return 'Com Divergência';
        } else if (appointmentDate > now) {
            return 'Agendado';
        } else {
            return 'Fora do Prazo';
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Funções de filtro por data
    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    function isThisWeek(date) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return date >= startOfWeek && date <= endOfWeek;
    }

    function isThisMonth(date) {
        const today = new Date();
        return date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    }

    function isLastMonth(date) {
        const today = new Date();
        const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
        const year = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();

        return date.getMonth() === lastMonth && date.getFullYear() === year;
    }

    function isThisYear(date) {
        const today = new Date();
        return date.getFullYear() === today.getFullYear();
    }

    function showLoading(show) {
        // Implemente um overlay de loading se necessário
        const loadingElement = document.getElementById('loading-agenda');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    function showError(message) {
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Verificar status periodicamente
    function verificarStatusPeriodicamente() {
        // Atualizar status no servidor a cada hora
        setInterval(async () => {
            try {
                await fetch('/api/agendamento_simples/atualizar-status/automatico', {
                    method: 'POST'
                });
            } catch (error) {
                console.error('Erro ao verificar status:', error);
            }
        }, 60 * 60 * 1000); // 1 hora

        // Recarregar agendamentos a cada 5 minutos
        setInterval(() => {
            loadAppointments();
        }, 5 * 60 * 1000);
    }
});

// Funções globais para os botões
async function repeatAppointment(appointmentId) {
    try {
        // Buscar dados do agendamento
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();

        if (result.success) {
            const appointment = result.data;

            // Armazenar dados para usar na página de serviços
            sessionStorage.setItem('lastAppointment', JSON.stringify({
                veiculo: appointment.veiculo,
                servicos: appointment.servicos,
                oficina: {
                    nome: appointment.oficina_nome,
                    endereco: appointment.oficina_endereco
                }
            }));

            // Redirecionar para serviços
            window.location.href = '/html/servicos.html';
        }
    } catch (error) {
        console.error('Erro ao repetir agendamento:', error);
        alert('Erro ao carregar dados do agendamento.');
    }
}

// Função para fechar o modal
function closeDownloadModal() {
    const modal = document.querySelector('.download-modal');
    if (modal) {
        modal.remove();
    }
}

// Adicionar evento de clique fora do modal para fechar
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('download-modal')) {
        closeDownloadModal();
    }
});

// FUNÇÃO ATUALIZADA - Cancelamento com modais bonitos
async function cancelAppointment(appointmentId) {
    console.log('🎯 Iniciando cancelamento do agendamento:', appointmentId);

    // Verificar autenticação
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Você precisa estar logado para cancelar agendamentos', 'error');
        setTimeout(() => {
            window.location.href = '/html/login.html?redirect=agenda.html';
        }, 2000);
        return;
    }

    try {
        // Buscar dados do agendamento
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error('Agendamento não encontrado');
        }

        const appointment = result.data;

        // Verificações de status
        if (appointment.status === 'concluido') {
            showToast('Não é possível cancelar agendamentos já concluídos', 'error');
            return;
        }

        if (appointment.status === 'fora_prazo') {
            showToast('Não é possível cancelar agendamentos fora do prazo', 'error');
            return;
        }

        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();

        if (appointmentDate <= now) {
            showToast('Não é possível cancelar agendamentos passados', 'error');
            return;
        }

        if (appointment.status === 'cancelado') {
            showToast('Este agendamento já está cancelado', 'warning');
            return;
        }

    } catch (error) {
        console.error('Erro ao verificar agendamento:', error);
        showToast('Erro ao verificar agendamento', 'error');
        return;
    }

    // Mostrar modal de cancelamento
    const confirmCancel = await showCancelConfirmationModal(appointmentId);
    
    if (confirmCancel) {
        // Se confirmado, prosseguir com o cancelamento
        const motivo = await showCancelReasonModal();
        
        if (!motivo) {
            showToast('Cancelamento não realizado', 'info');
            return;
        }

        await processCancelamento(appointmentId, motivo, token);
    }
}

// Nova função para mostrar confirmação de cancelamento
function showCancelConfirmationModal(appointmentId) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'cancel-confirmation-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div class="cancel-modal-content" style="
                background: var(--card-bg);
                padding: 30px;
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                text-align: center;
                border: 2px solid var(--border-color);
                animation: modalAppear 0.3s ease;
            ">
                <div class="cancel-icon" style="
                    font-size: 4rem;
                    margin-bottom: 20px;
                    color: #ff6b6b;
                ">
                    ⚠️
                </div>
                
                <h3 style="
                    color: var(--text-color);
                    margin-bottom: 15px;
                    font-size: 1.5rem;
                    font-weight: 600;
                ">Confirmar Cancelamento</h3>
                
                <p style="
                    color: var(--text-light);
                    margin-bottom: 25px;
                    line-height: 1.6;
                    font-size: 1rem;
                ">
                    Tem certeza que deseja cancelar este agendamento?<br>
                    <strong style="color: var(--text-color);">Esta ação não pode ser desfeita.</strong>
                </p>
                
                <div class="modal-buttons" style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button id="cancel-btn" class="btn-cancel-secondary" style="
                        padding: 12px 25px;
                        border: 2px solid var(--border-color);
                        background: transparent;
                        color: var(--text-color);
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        flex: 1;
                        min-width: 120px;
                    ">
                        Voltar
                    </button>
                    <button id="confirm-cancel-btn" class="btn-cancel-primary" style="
                        padding: 12px 25px;
                        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        flex: 1;
                        min-width: 120px;
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                    ">
                        Sim, Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const cancelBtn = modal.querySelector('#cancel-btn');
        const confirmBtn = modal.querySelector('#confirm-cancel-btn');

        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        confirmBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };

        // Fechar modal ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(false);
            }
        };

        // Animação de entrada
        setTimeout(() => {
            modal.querySelector('.cancel-modal-content').style.transform = 'translateY(0)';
        }, 10);
    });
}

// Função para processar o cancelamento
async function processCancelamento(appointmentId, motivo, token) {
    try {
        showCancelLoading(true);

        const response = await fetch(`/api/agendamento_simples/${appointmentId}/cancelar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                motivo: motivo.trim() || 'Cancelado pelo cliente',
                cancelado_por: 'cliente'
            })
        });

        const result = await response.json();

        if (result.success) {
            // Mostrar modal de sucesso
            showSuccessCancelModal();
            
            // Atualizar a interface após um delay
            setTimeout(() => {
                if (typeof loadAppointments === 'function') {
                    loadAppointments();
                }
                if (typeof recarregarLembrete === 'function') {
                    recarregarLembrete();
                }
            }, 2000);
        } else {
            throw new Error(result.message || 'Erro ao cancelar agendamento');
        }

    } catch (error) {
        console.error('❌ Erro ao cancelar agendamento:', error);
        showToast('❌ Erro ao cancelar agendamento: ' + error.message, 'error');
    } finally {
        showCancelLoading(false);
    }
}

// Modal de sucesso após cancelamento
function showSuccessCancelModal() {
    const modal = document.createElement('div');
    modal.className = 'success-cancel-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;

    modal.innerHTML = `
        <div class="success-modal-content" style="
            background: var(--card-bg);
            padding: 40px 30px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            border: 2px solid var(--border-color);
            animation: successAppear 0.5s ease;
        ">
            <div class="success-icon" style="
                font-size: 5rem;
                margin-bottom: 20px;
                animation: bounce 0.6s ease;
            ">
                ✅
            </div>
            
            <h3 style="
                color: var(--text-color);
                margin-bottom: 15px;
                font-size: 1.6rem;
                font-weight: 700;
            ">Cancelado com Sucesso!</h3>
            
            <p style="
                color: var(--text-light);
                margin-bottom: 30px;
                line-height: 1.6;
                font-size: 1.1rem;
            ">
                Seu agendamento foi cancelado com sucesso.<br>
                A oficina foi notificada sobre o cancelamento.
            </p>
            
            <button onclick="closeSuccessModalAndRefresh()" class="btn-success" style="
                background: linear-gradient(135deg, #48bb78, #38a169);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 10px;
                cursor: pointer;
                font-size: 1.1rem;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
                width: 100%;
            ">
                🔄 Atualizar Página
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Adicionar animações CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes modalAppear {
            from {
                opacity: 0;
                transform: translateY(-30px) scale(0.9);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes successAppear {
            0% {
                opacity: 0;
                transform: scale(0.5) rotate(-10deg);
            }
            70% {
                transform: scale(1.1) rotate(5deg);
            }
            100% {
                opacity: 1;
                transform: scale(1) rotate(0);
            }
        }
        
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
                transform: translateY(0);
            }
            40% {
                transform: translateY(-10px);
            }
            60% {
                transform: translateY(-5px);
            }
        }
        
        .btn-cancel-secondary:hover {
            background: var(--border-color);
            transform: translateY(-2px);
        }
        
        .btn-cancel-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
        }
        
        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
        }
    `;
    document.head.appendChild(style);
}

// Modal para inserir motivo do cancelamento (ATUALIZADO COM MODO NOTURNO)
function showCancelReasonModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'cancel-reason-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(5px);
        `;

        modal.innerHTML = `
            <div class="reason-modal-content" style="
                background: var(--card-bg);
                padding: 30px;
                border-radius: 20px;
                width: 90%;
                max-width: 500px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                border: 2px solid var(--border-color);
                animation: modalAppear 0.3s ease;
            ">
                <h3 style="
                    margin-bottom: 15px;
                    color: var(--text-color);
                    font-size: 1.4rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                ">
                    <span style="color: #ff6b6b;">📝</span>
                    Motivo do Cancelamento
                </h3>
                
                <p style="
                    margin-bottom: 20px;
                    color: var(--text-light);
                    line-height: 1.5;
                    font-size: 1rem;
                ">
                    Por favor, informe o motivo do cancelamento para que possamos melhorar nossos serviços:
                </p>
                
                <textarea 
                    id="cancel-reason-input" 
                    placeholder="Ex: Mudança de planos, problema no veículo, horário indisponível, etc."
                    style="
                        width: 100%; 
                        height: 120px; 
                        padding: 15px; 
                        border: 2px solid var(--border-color);
                        border-radius: 12px; 
                        resize: vertical; 
                        font-family: inherit;
                        font-size: 1rem;
                        background: var(--bg-color);
                        color: var(--text-color);
                        transition: all 0.3s ease;
                    "
                ></textarea>
                
                <div class="char-counter" style="
                    text-align: right;
                    margin-top: 8px;
                    font-size: 0.85rem;
                    color: var(--text-light);
                ">
                    <span id="char-count">0</span>/500 caracteres
                </div>
                
                <div style="
                    margin-top: 25px; 
                    display: flex; 
                    gap: 12px; 
                    justify-content: flex-end;
                    flex-wrap: wrap;
                ">
                    <button id="cancel-reason-btn" class="btn-reason-cancel" style="
                        padding: 12px 24px;
                        border: 2px solid var(--border-color);
                        background: transparent;
                        color: var(--text-color);
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        min-width: 120px;
                    ">
                        Cancelar
                    </button>
                    <button id="confirm-reason-btn" class="btn-reason-confirm" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                        color: white;
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        min-width: 120px;
                        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                    ">
                        Confirmar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const input = modal.querySelector('#cancel-reason-input');
        const cancelBtn = modal.querySelector('#cancel-reason-btn');
        const confirmBtn = modal.querySelector('#confirm-reason-btn');
        const charCount = modal.querySelector('#char-count');

        input.focus();

        // Contador de caracteres
        input.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count > 500) {
                charCount.style.color = '#ff6b6b';
                this.style.borderColor = '#ff6b6b';
            } else if (count > 400) {
                charCount.style.color = '#f4a261';
                this.style.borderColor = '#f4a261';
            } else {
                charCount.style.color = 'var(--text-light)';
                this.style.borderColor = 'var(--border-color)';
            }
        });

        // Efeitos de foco
        input.addEventListener('focus', function() {
            this.style.borderColor = '#ff6b6b';
            this.style.boxShadow = '0 0 0 3px rgba(255, 107, 107, 0.1)';
        });

        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });

        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(null);
        };

        confirmBtn.onclick = () => {
            const motivo = input.value.trim();
            
            if (!motivo) {
                showToast('Por favor, informe o motivo do cancelamento', 'warning');
                input.focus();
                return;
            }
            
            if (motivo.length > 500) {
                showToast('O motivo deve ter no máximo 500 caracteres', 'warning');
                input.focus();
                return;
            }
            
            document.body.removeChild(modal);
            resolve(motivo);
        };

        // Fechar modal ao clicar fora
        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(null);
            }
        };

        // Enter para confirmar (Ctrl+Enter)
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                confirmBtn.click();
            }
        };

        // Adicionar estilos de hover
        const style = document.createElement('style');
        style.textContent = `
            .btn-reason-cancel:hover {
                background: var(--border-color);
                transform: translateY(-2px);
            }
            
            .btn-reason-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            }
            
            #cancel-reason-input:focus {
                outline: none;
                border-color: #ff6b6b;
                box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
            }
        `;
        document.head.appendChild(style);
    });
}

// Função para mostrar/ocultar loading
function showCancelLoading(show) {
    let loadingElement = document.getElementById('cancel-loading');

    if (show) {
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'cancel-loading';
            loadingElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10001;
                color: white;
                font-size: 18px;
            `;
            loadingElement.innerHTML = `
                <div style="text-align: center;">
                    <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                    <p>Cancelando agendamento...</p>
                </div>
            `;
            document.body.appendChild(loadingElement);

            // Adicionar animação do spinner
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        if (loadingElement) {
            document.body.removeChild(loadingElement);
        }
    }
}

// Função para atualizar a interface do agendamento cancelado
async function updateAppointmentUI(appointmentId) {
    try {
        // Buscar dados atualizados do agendamento
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();

        if (result.success) {
            const updatedAppointment = result.data;

            // Encontrar o card do agendamento no DOM
            const appointmentCard = document.querySelector(`.appointment-card[data-id="${appointmentId}"]`);

            if (appointmentCard) {
                // Atualizar o card com os novos dados
                updateAppointmentCard(appointmentCard, updatedAppointment);
            } else {
                // Se não encontrar, recarregar a lista
                console.log('Card não encontrado, recarregando lista...');
                if (typeof loadAppointments === 'function') {
                    await loadAppointments();
                }
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar interface:', error);
        // Em caso de erro, recarregar tudo
        if (typeof loadAppointments === 'function') {
            await loadAppointments();
        }
    }
}

// Função para atualizar um card específico
function updateAppointmentCard(cardElement, appointment) {
    const statusClass = getStatusClass(appointment);
    const statusText = getStatusText(appointment);

    // Atualizar o status no header
    const statusElement = cardElement.querySelector('.status');
    if (statusElement) {
        statusElement.className = `status ${statusClass}`;
        statusElement.textContent = statusText;
    }

    // Atualizar a classe principal do card
    cardElement.className = `appointment-card ${statusClass}`;
    cardElement.setAttribute('data-id', appointment.id);

    // Atualizar o protocolo se necessário
    const protocolElement = cardElement.querySelector('.protocol');
    if (protocolElement && appointment.protocolo) {
        protocolElement.textContent = `Protocolo: ${appointment.protocolo}`;
    }

    // Adicionar/atualizar informações de cancelamento
    let cancelInfo = cardElement.querySelector('.cancel-info');
    if (appointment.motivo_cancelamento) {
        if (!cancelInfo) {
            cancelInfo = document.createElement('div');
            cancelInfo.className = 'cancel-info';
            cardElement.querySelector('.appointment-body').appendChild(cancelInfo);
        }
        cancelInfo.innerHTML = `<p><i class="fas fa-info-circle"></i> Motivo: ${appointment.motivo_cancelamento}</p>`;
    } else if (cancelInfo) {
        cancelInfo.remove();
    }

    // Atualizar os botões do footer
    updateAppointmentFooter(cardElement, appointment);

    // Adicionar efeito visual de atualização
    cardElement.style.animation = 'pulse 0.5s ease-in-out';
    setTimeout(() => {
        cardElement.style.animation = '';
    }, 500);
}

function updateAppointmentFooter(cardElement, appointment) {
    const footer = cardElement.querySelector('.appointment-footer');
    if (!footer) return;

    const statusClass = getStatusClass(appointment);

    // VERIFICAÇÃO CORRIGIDA - Não mostrar cancelar para concluídos/fora do prazo
    const canCancel = isFutureAppointment(appointment) &&
        statusClass !== 'completed' &&
        statusClass !== 'expired';

    if (statusClass === 'cancelled' || statusClass === 'expired') {
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                <i class="fas fa-redo"></i> Novo Agendamento
            </button>
            <span class="text-muted">Ações indisponíveis</span>
        `;
    } else if (canCancel) {
        // Só mostra cancelar se for futuro E não concluído
        footer.innerHTML = `
            <button class="btn btn-outline btn-cancel" onclick="cancelAppointment(${appointment.id})">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    } else {
        // Para agendamentos concluídos ou passados - sem opção de cancelar
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                <i class="fas fa-redo"></i> Repetir Serviço
            </button>
        `;
    }
}

function rateService(appointmentId) {
    alert('Sistema de avaliação em desenvolvimento!');
}

// Função para fechar modal de sucesso
function closeSuccessModal() {
    const modal = document.querySelector('.success-cancel-modal');
    if (modal) {
        modal.remove();
    }
}

// Função global para atualizar a página
function closeSuccessModalAndRefresh() {
    const modal = document.querySelector('.success-cancel-modal');
    if (modal) {
        modal.remove();
    }
    // Recarregar os agendamentos
    if (typeof loadAppointments === 'function') {
        loadAppointments();
    }
    if (typeof recarregarLembrete === 'function') {
        recarregarLembrete();
    }
}

// Função auxiliar para mostrar toast (caso não exista no main.js)
function showToast(message, type = 'info') {
    // Se a função showToast não existir, criar uma simples
    if (typeof window.showToast !== 'function') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
            word-wrap: break-word;
        `;

        switch (type) {
            case 'success':
                toast.style.backgroundColor = '#28a745';
                break;
            case 'error':
                toast.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                toast.style.backgroundColor = '#ffc107';
                toast.style.color = '#212529';
                break;
            default:
                toast.style.backgroundColor = '#17a2b8';
        }

        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            document.body.removeChild(toast);
        }, 5000);
    } else {
        window.showToast(message, type);
    }
}

// Adicionar ao objeto window para acesso global
window.cancelAppointment = cancelAppointment;
window.showCancelReasonModal = showCancelReasonModal;
window.closeSuccessModalAndRefresh = closeSuccessModalAndRefresh;
window.closeSuccessModal = closeSuccessModal;
window.repeatAppointment = repeatAppointment;
window.rateService = rateService;

// CSS adicional para estilização
const additionalCSS = `
/* Status dos agendamentos */
.status.pending {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status.completed {
    background: #d1edff;
    color: #0c5460;
    border: 1px solid #b3e0ff;
}

.status.expired {
    background: #f8f9fa;
    color: #6c757d;
    border: 1px solid #dee2e6;
    text-decoration: line-through;
}

.status.cancelled {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.status.divergence {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
    font-weight: bold;
}

/* Faixa de cancelado */
.appointment-card.cancelled::before {
    content: "CANCELADO";
    position: absolute;
    top: 10px;
    right: -30px;
    background: #dc3545;
    color: white;
    padding: 5px 40px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(45deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
}

.appointment-card.expired::before {
    content: "FORA DO PRAZO";
    position: absolute;
    top: 10px;
    right: -35px;
    background: #6c757d;
    color: white;
    padding: 5px 40px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(45deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
}

.appointment-card.divergence {
    border-left: 4px solid #ffc107;
}

.appointment-card.divergence::before {
    content: "DIVERGÊNCIA";
    position: absolute;
    top: 10px;
    right: -30px;
    background: #ffc107;
    color: #212529;
    padding: 5px 40px;
    font-size: 12px;
    font-weight: bold;
    transform: rotate(45deg);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 10;
}

.appointment-card {
    position: relative;
    overflow: hidden;
}

/* Desabilitar botões para agendamentos cancelados/vencidos */
.appointment-card.cancelled .btn,
.appointment-card.expired .btn {
    opacity: 0.6;
    cursor: not-allowed;
}

.appointment-card.cancelled .btn:hover,
.appointment-card.expired .btn:hover {
    transform: none;
    box-shadow: none;
}

/* Estilo para quando não há agendamentos */
.no-appointments {
    text-align: center;
    padding: 60px 20px;
    color: #6c757d;
}

.no-appointments i {
    font-size: 64px;
    margin-bottom: 20px;
    color: #dee2e6;
}

.no-appointments h3 {
    margin-bottom: 10px;
    color: #495057;
}

.no-appointments p {
    font-size: 16px;
}

/* Botão de cancelar específico */
.btn-cancel {
    background: #dc3545 !important;
    color: white !important;
    border-color: #dc3545 !important;
}

.btn-cancel:hover {
    background: #c82333 !important;
    border-color: #bd2130 !important;
}

/* Informações de cancelamento */
.cancel-info {
    background: #f8f9fa;
    padding: 10px;
    border-radius: 5px;
    margin-top: 10px;
    border-left: 4px solid #dc3545;
}

.cancel-info p {
    margin: 0;
    color: #721c24;
    font-size: 14px;
}

/* Filtros */
.filter-controls {
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 20px;
}

.filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: white;
    font-size: 14px;
}

.btn-small {
    padding: 6px 12px;
    font-size: 13px;
}

/* Animação para feedback visual */
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.appointment-card {
    transition: all 0.3s ease;
}

/* Estilo para texto desabilitado */
.text-muted {
    color: #6c757d !important;
    font-style: italic;
    padding: 8px 12px;
}

/* Garantir que os botões desabilitados tenham aparência correta */
.appointment-card.cancelled .btn,
.appointment-card.expired .btn {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.appointment-card.cancelled .btn:hover,
.appointment-card.expired .btn:hover {
    transform: none;
    box-shadow: none;
}
`;

// Adicione o CSS ao documento
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);