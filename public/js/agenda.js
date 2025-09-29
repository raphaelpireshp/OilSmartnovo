// agenda.js - Arquivo completo e funcional
document.addEventListener('DOMContentLoaded', function() {
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
            filterPeriod.addEventListener('change', function() {
                currentFilter = this.value;
                filterAppointments();
            });
        }

        // Filtro por status
        if (filterStatus) {
            filterStatus.addEventListener('change', function() {
                currentStatusFilter = this.value;
                filterAppointments();
            });
        }

        // Ordenação
        if (filterSort) {
            filterSort.addEventListener('change', function() {
                currentSort = this.value;
                filterAppointments();
            });
        }

        // Limpar filtros
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
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
// agenda.js - Substitua a função loadLembreteAutomatico por esta versão melhorada

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
                
                // Verificar se existe agendamento futuro
                const agora = new Date();
                const agendamentoFuturo = agendamentos.find(ag => {
                    const dataAgendamento = new Date(ag.data_hora);
                    return dataAgendamento > agora && 
                           ag.status !== 'cancelado' && 
                           ag.status !== 'fora_prazo';
                });

                if (agendamentoFuturo) {
                    // Se tem agendamento futuro, mostrar informações dele
                    displayProximoAgendamento(agendamentoFuturo);
                } else {
                    // Se não tem agendamento futuro, mostrar lembrete baseado no último serviço
                    const ultimoConcluido = agendamentos
                        .filter(ag => ag.status === 'concluido' || new Date(ag.data_hora) < agora)
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
                <button class="btn btn-outline" onclick="verDetalhesAgendamento(${agendamento.id})">
                    <i class="fas fa-eye"></i> Ver Detalhes
                </button>
                ${diffDays > 1 ? `
                <button class="btn btn-outline btn-warning" onclick="cancelAppointment(${agendamento.id})">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                ` : ''}
                <button class="btn btn-primary" onclick="reagendarServico(${agendamento.id})">
                    <i class="fas fa-copy"></i> Repetir Este Serviço
                </button>
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
                    <p><strong>Próxima troca recomendada:</strong> ${proximaTrocaData.toLocaleDateString('pt-BR')}</p>
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
                <button class="btn btn-outline" onclick="reagendarUltimoServico(${ultimoServico.id})">
                    <i class="fas fa-redo"></i> Repetir Último Serviço
                </button>
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

// Na função init(), atualize para:
function init() {
    if (!checkAuthentication()) {
        return;
    }
    
    loadAppointments();
    loadLembreteInteligente(); // ← TROQUEI PARA A NOVA FUNÇÃO
    setupEventListeners();
    verificarStatusPeriodicamente();
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

    // Exibir agendamentos na página
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
            
            return `
                <div class="appointment-card ${statusClass}" data-id="${appointment.id}">
                    <div class="appointment-header">
                        <span class="protocol">Protocolo: ${appointment.protocolo || 'N/A'}</span>
                        <span class="status ${statusClass}">${statusText}</span>
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
                    </div>
                    <div class="appointment-footer">
                        ${statusClass !== 'cancelled' && statusClass !== 'expired' ? `
                            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                                <i class="fas fa-redo"></i> Repetir Agendamento
                            </button>
                            <button class="btn btn-outline" onclick="downloadInvoice(${appointment.id})">
                                <i class="fas fa-file-invoice"></i> Comprovante
                            </button>
                            ${isFutureAppointment(appointment) ? `
                            <button class="btn btn-outline btn-cancel" onclick="cancelAppointment(${appointment.id})">
                                <i class="fas fa-times"></i> Cancelar
                            </button>
                            ` : `
                            <button class="btn btn-outline" onclick="rateService(${appointment.id})">
                                <i class="fas fa-star"></i> Avaliar Serviço
                            </button>
                            `}
                        ` : `
                            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                                <i class="fas fa-redo"></i> Novo Agendamento
                            </button>
                            <button class="btn btn-outline" onclick="downloadInvoice(${appointment.id})">
                                <i class="fas fa-file-invoice"></i> Comprovante
                            </button>
                            <span class="text-muted">Ações indisponíveis</span>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Funções auxiliares
    function getStatusClass(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        if (appointment.status === 'cancelado') {
            return 'cancelled';
        } else if (appointment.status === 'fora_prazo') {
            return 'expired';
        } else if (appointmentDate > now) {
            return 'pending';
        } else if (appointment.status === 'concluido') {
            return 'completed';
        } else {
            return 'expired';
        }
    }

    function getStatusText(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        if (appointment.status === 'cancelado') {
            return 'Cancelado';
        } else if (appointment.status === 'fora_prazo') {
            return 'Fora do Prazo';
        } else if (appointmentDate > now) {
            return 'Agendado';
        } else if (appointment.status === 'concluido') {
            return 'Concluído';
        } else {
            return 'Fora do Prazo';
        }
    }

    function isFutureAppointment(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        return appointmentDate > now && appointment.status !== 'cancelado';
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

// Função melhorada para download de comprovante
// Função melhorada para download de comprovante
async function downloadInvoice(appointmentId) {
    try {
        console.log('🎯 Iniciando download do comprovante para agendamento:', appointmentId);
        
        // Mostrar estado de carregamento
        const button = event.target.closest('.btn');
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        button.disabled = true;
        
        // Buscar dados completos do agendamento
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();
        
        if (result.success) {
            // Gerar PDF com dados do agendamento
            await generatePDF(result.data);
            
            // Mostrar confirmação
            showDownloadSuccess();
        } else {
            throw new Error(result.message || 'Erro ao buscar dados do agendamento');
        }
        
    } catch (error) {
        console.error('❌ Erro ao gerar comprovante:', error);
        showToast('❌ Erro ao gerar comprovante: ' + error.message, 'error');
    } finally {
        // Restaurar estado do botão
        const button = event.target.closest('.btn');
        button.innerHTML = '<i class="fas fa-file-invoice"></i> Comprovante';
        button.disabled = false;
    }
}

// Função aprimorada para gerar PDF
async function generatePDF(appointment) {
    return new Promise((resolve, reject) => {
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF();
            
            // Configurações do documento
            pdf.setFont('helvetica');
            pdf.setFontSize(20);
            
            // Cabeçalho
            pdf.setTextColor(33, 63, 87); // Cor primária
            pdf.text('OilSmart - Comprovante de Agendamento', 20, 30);
            
            // Linha decorativa
            pdf.setDrawColor(180, 148, 52); // Cor secundária
            pdf.setLineWidth(1);
            pdf.line(20, 35, 190, 35);
            
            // Informações do protocolo
            pdf.setFontSize(12);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`Protocolo: ${appointment.protocolo || 'N/A'}`, 20, 50);
            pdf.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, 60);
            
            let yPosition = 80;
            
            // Dados do agendamento
            const details = [
                `Data do Serviço: ${new Date(appointment.data_hora).toLocaleDateString('pt-BR')}`,
                `Horário: ${new Date(appointment.data_hora).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                })}`,
                `Oficina: ${appointment.oficina_nome || 'Oficina não informada'}`,
                `Endereço: ${appointment.oficina_endereco || 'Endereço não informado'}`,
                `Veículo: ${appointment.veiculo || 'Veículo não informado'}`,
                `Serviços: ${appointment.servicos || 'Troca de óleo'}`,
                `Status: ${getStatusText(appointment)}`
            ];
            
            // Adicionar detalhes
            pdf.setFontSize(11);
            details.forEach(detail => {
                pdf.text(detail, 20, yPosition);
                yPosition += 8;
            });
            
            // Adicionar preço se disponível
            if (appointment.total_servico) {
                yPosition += 10;
                pdf.setFontSize(12);
                pdf.setFont(undefined, 'bold');
                pdf.text(`Valor Total: R$ ${parseFloat(appointment.total_servico).toFixed(2)}`, 20, yPosition);
                pdf.setFont(undefined, 'normal');
            }
            
            // Adicionar motivo do cancelamento se aplicável
            if (appointment.motivo_cancelamento) {
                yPosition += 15;
                pdf.setFontSize(10);
                pdf.setTextColor(220, 53, 69); // Vermelho
                pdf.text(`Motivo do Cancelamento: ${appointment.motivo_cancelamento}`, 20, yPosition);
                pdf.setTextColor(0, 0, 0);
            }
            
            // Informações de contato
            yPosition += 20;
            pdf.setFontSize(9);
            pdf.setTextColor(100, 100, 100);
            pdf.text('Para dúvidas ou cancelamentos, entre em contato:', 20, yPosition);
            pdf.text('Telefone: (11) 4002-8922 | Email: contato@oilsmart.com.br', 20, yPosition + 5);
            
            // Rodapé
            yPosition = 270;
            pdf.setFontSize(8);
            pdf.setTextColor(128, 128, 128);
            pdf.text('Este é um comprovante gerado automaticamente pelo sistema OilSmart.', 20, yPosition);
            pdf.text(`Comprovante gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition + 5);
            
            // Salvar PDF
            const fileName = `comprovante-${appointment.protocolo || appointment.id}.pdf`;
            pdf.save(fileName);
            
            resolve();
            
        } catch (error) {
            console.error('Erro na geração do PDF:', error);
            reject(error);
        }
    });
}

// Função para mostrar confirmação de download
function showDownloadSuccess() {
    const modal = document.createElement('div');
    modal.className = 'download-modal show';
    modal.innerHTML = `
        <div class="download-modal-content">
            <div class="download-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Download Concluído!</h3>
            <p>O comprovante foi baixado com sucesso. Verifique sua pasta de downloads.</p>
            <div class="download-modal-buttons">
                <button class="btn btn-primary" onclick="closeDownloadModal()">
                    <i class="fas fa-check"></i> OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal após 5 segundos automaticamente
    setTimeout(() => {
        closeDownloadModal();
    }, 5000);
}

// Função para fechar o modal
function closeDownloadModal() {
    const modal = document.querySelector('.download-modal');
    if (modal) {
        modal.remove();
    }
}

// Adicionar evento de clique fora do modal para fechar
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('download-modal')) {
        closeDownloadModal();
    }
});

// Função para mostrar confirmação de download
function showDownloadSuccess() {
    const modal = document.createElement('div');
    modal.className = 'download-modal show';
    modal.innerHTML = `
        <div class="download-modal-content">
            <div class="download-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>Download Concluído!</h3>
            <p>O comprovante foi baixado com sucesso. Verifique sua pasta de downloads.</p>
            <div class="download-modal-buttons">
                <button class="btn btn-primary" onclick="closeDownloadModal()">
                    <i class="fas fa-check"></i> OK
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal após 5 segundos automaticamente
    setTimeout(() => {
        closeDownloadModal();
    }, 5000);
}

// Função para fechar o modal
function closeDownloadModal() {
    const modal = document.querySelector('.download-modal');
    if (modal) {
        modal.remove();
    }
}

// Adicionar evento de clique fora do modal para fechar
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('download-modal')) {
        closeDownloadModal();
    }
});

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
        // Verificar se é um agendamento futuro
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Agendamento não encontrado');
        }
        
        const appointment = result.data;
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        // Verificar se já passou da data
        if (appointmentDate <= now) {
            showToast('Não é possível cancelar agendamentos passados', 'error');
            return;
        }
        
        // Verificar se já está cancelado
        if (appointment.status === 'cancelado') {
            showToast('Este agendamento já está cancelado', 'warning');
            return;
        }
        
    } catch (error) {
        console.error('Erro ao verificar agendamento:', error);
        showToast('Erro ao verificar agendamento', 'error');
        return;
    }
    
    // Pedir motivo do cancelamento com um modal mais amigável
    const motivo = await showCancelReasonModal();
    
    if (!motivo) {
        showToast('Cancelamento não realizado', 'info');
        return;
    }
    
    if (!confirm('Tem certeza que deseja cancelar este agendamento?\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        // Mostrar loading
        showCancelLoading(true);
        
        const response = await fetch(`/api/agendamento_simples/${appointmentId}/cancelar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                motivo: motivo.trim() || 'Cancelado pelo cliente' 
            })
        });
        
        const result = await response.json();
        
if (result.success) {
    if (confirm('✅ Agendamento cancelado com sucesso!\n\nDeseja atualizar a página agora?')) {
        location.reload();
    }
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

// Modal para inserir motivo do cancelamento
function showCancelReasonModal() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; width: 90%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                <h3 style="margin-bottom: 15px; color: #333;">Motivo do Cancelamento</h3>
                <p style="margin-bottom: 15px; color: #666;">Por favor, informe o motivo do cancelamento:</p>
                <textarea 
                    id="cancel-reason-input" 
                    placeholder="Ex: Mudança de planos, problema no veículo, etc."
                    style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; resize: vertical; font-family: inherit;"
                ></textarea>
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="cancel-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; cursor: pointer;">Cancelar</button>
                    <button id="confirm-btn" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">Confirmar Cancelamento</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const input = modal.querySelector('#cancel-reason-input');
        const cancelBtn = modal.querySelector('#cancel-btn');
        const confirmBtn = modal.querySelector('#confirm-btn');
        
        input.focus();
        
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
        
        // Enter para confirmar
        input.onkeydown = (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                confirmBtn.click();
            }
        };
    });
    
}
function showSuccessModal() {
    const modal = document.createElement('div');
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
    `;
    
    modal.innerHTML = `
        <div style="
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            text-align: center;
            max-width: 400px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        ">
            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
            <h3 style="margin-bottom: 15px; color: #28a745;">Cancelado com Sucesso!</h3>
            <p style="margin-bottom: 20px; color: #666;">
                Seu agendamento foi cancelado.<br>
                Atualize a página para ver as alterações.
            </p>
            <button onclick="location.reload()" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            ">
                🔄 Atualizar Página
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar modal ao clicar fora (opcional)
    modal.onclick = function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
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
                await loadAppointments();
            }
        }
    } catch (error) {
        console.error('Erro ao atualizar interface:', error);
        // Em caso de erro, recarregar tudo
        await loadAppointments();
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

// Função para atualizar os botões do footer baseado no status
function updateAppointmentFooter(cardElement, appointment) {
    const footer = cardElement.querySelector('.appointment-footer');
    if (!footer) return;
    
    const statusClass = getStatusClass(appointment);
    
    if (statusClass === 'cancelled' || statusClass === 'expired') {
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                <i class="fas fa-redo"></i> Novo Agendamento
            </button>
            <button class="btn btn-outline" onclick="downloadInvoice(${appointment.id})">
                <i class="fas fa-file-invoice"></i> Comprovante
            </button>
            <span class="text-muted">Ações indisponíveis</span>
        `;
    } else if (isFutureAppointment(appointment)) {
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                <i class="fas fa-redo"></i> Repetir Agendamento
            </button>
            <button class="btn btn-outline" onclick="downloadInvoice(${appointment.id})">
                <i class="fas fa-file-invoice"></i> Comprovante
            </button>
            <button class="btn btn-outline btn-cancel" onclick="cancelAppointment(${appointment.id})">
                <i class="fas fa-times"></i> Cancelar
            </button>
        `;
    } else {
        footer.innerHTML = `
            <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                <i class="fas fa-redo"></i> Repetir Agendamento
            </button>
            <button class="btn btn-outline" onclick="downloadInvoice(${appointment.id})">
                <i class="fas fa-file-invoice"></i> Comprovante
            </button>
            <button class="btn btn-outline" onclick="rateService(${appointment.id})">
                <i class="fas fa-star"></i> Avaliar Serviço
            </button>
        `;
    }
}

function rateService(appointmentId) {
    alert('Sistema de avaliação em desenvolvimento!');
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

