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

async function downloadInvoice(appointmentId) {
    try {
        const response = await fetch(`/api/agendamento_simples/${appointmentId}`);
        const result = await response.json();
        
        if (result.success) {
            generatePDF(result.data);
        }
    } catch (error) {
        console.error('Erro ao gerar comprovante:', error);
        alert('Erro ao gerar comprovante.');
    }
}

function generatePDF(appointment) {
    // Usar a mesma lógica do servicos.js para gerar PDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    pdf.setFontSize(20);
    pdf.text('Comprovante de Agendamento - OilSmart', 20, 30);
    
    pdf.setFontSize(12);
    let yPosition = 50;
    
    // Dados do agendamento
    const details = [
        `Protocolo: ${appointment.protocolo}`,
        `Data: ${new Date(appointment.data_hora).toLocaleDateString('pt-BR')}`,
        `Hora: ${new Date(appointment.data_hora).toLocaleTimeString('pt-BR')}`,
        `Oficina: ${appointment.oficina_nome}`,
        `Endereço: ${appointment.oficina_endereco}`,
        `Veículo: ${appointment.veiculo || 'Não informado'}`,
        `Serviços: ${appointment.servicos || 'Troca de óleo'}`,
        `Total: R$ ${parseFloat(appointment.total_servico || 0).toFixed(2)}`
    ];
    
    details.forEach(detail => {
        pdf.text(detail, 20, yPosition);
        yPosition += 10;
    });
    
    pdf.save(`comprovante-${appointment.protocolo}.pdf`);
}

async function cancelAppointment(appointmentId) {
    console.log('🎯 Iniciando cancelamento do agendamento:', appointmentId);
    
    // Verificar se é um agendamento futuro
    try {
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
    
    // Pedir motivo do cancelamento
    const motivo = prompt('Por favor, informe o motivo do cancelamento:');
    
    if (motivo === null) {
        showToast('Cancelamento não realizado', 'info');
        return; // Usuário clicou em cancelar
    }
    
    if (!confirm('Tem certeza que deseja cancelar este agendamento?\nEsta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        showLoading(true);
        
        const response = await fetch(`/api/agendamento_simples/${appointmentId}/cancelar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                motivo: motivo.trim() || 'Cancelado pelo cliente' 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✅ Agendamento cancelado com sucesso!', 'success');
            // Recarregar a lista após 1 segundo
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error(result.message || 'Erro ao cancelar agendamento');
        }
        
    } catch (error) {
        console.error('❌ Erro ao cancelar agendamento:', error);
        showToast('❌ Erro ao cancelar agendamento: ' + error.message, 'error');
    } finally {
        showLoading(false);
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
`;

// Adicione o CSS ao documento
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);