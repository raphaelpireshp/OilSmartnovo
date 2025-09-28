// agenda.js - Adicione no início do arquivo

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

// Modificar a função init
function init() {
    if (!checkAuthentication()) {
        return;
    }
    
    loadAppointments();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const appointmentsList = document.querySelector('.appointments-list');
    const filterPeriod = document.getElementById('filter-period');
    const statusFilter = document.getElementById('filter-status'); // Você precisará adicionar este filtro no HTML
    
    // Estados
    let currentFilter = 'all';
    let currentStatusFilter = 'all';
    let allAppointments = [];

    // Inicialização
    init();

    function init() {
        loadAppointments();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Filtro por período
        if (filterPeriod) {
            filterPeriod.addEventListener('change', function() {
                currentFilter = this.value;
                filterAppointments();
            });
        }

        // Filtro por status (você precisará adicionar este select no HTML)
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                currentStatusFilter = this.value;
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

    // Filtrar agendamentos
    function filterAppointments() {
        let filtered = [...allAppointments];

        // Filtro por período
        if (currentFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.data_hora);
                
                switch (currentFilter) {
                    case 'month':
                        const monthAgo = new Date(now);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return appointmentDate >= monthAgo;
                    
                    case 'year':
                        const yearAgo = new Date(now);
                        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                        return appointmentDate >= yearAgo;
                    
                    default:
                        return true;
                }
            });
        }

        // Filtro por status (baseado na data/hora)
        if (currentStatusFilter !== 'all') {
            filtered = filtered.filter(appointment => {
                const appointmentDate = new Date(appointment.data_hora);
                const now = new Date();
                
                switch (currentStatusFilter) {
                    case 'pendentes':
                        return appointmentDate > now;
                    
                    case 'concluidas':
                        return appointmentDate <= now;
                    
                    case 'canceladas':
                        // Você precisaria adicionar um campo "status" na sua tabela para isso
                        return false;
                    
                    default:
                        return true;
                }
            });
        }

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

        // Ordenar por data (mais recentes primeiro)
        appointments.sort((a, b) => new Date(b.data_hora) - new Date(a.data_hora));

        appointmentsList.innerHTML = appointments.map(appointment => `
            <div class="appointment-card" data-id="${appointment.id}">
                <div class="appointment-header">
                    <span class="protocol">Protocolo: ${appointment.protocolo || 'N/A'}</span>
                    <span class="status ${getStatusClass(appointment)}">${getStatusText(appointment)}</span>
                </div>
                <div class="appointment-body">
                    <div class="service-info">
                        <h3>${appointment.servicos || 'Troca de Óleo'}</h3>
                        <p><i class="fas fa-car"></i> ${appointment.veiculo || 'Veículo não informado'}</p>
${appointment.servicos ? `<p><i class="fas fa-oil-can"></i> ${appointment.servicos.replace(/[\[\]"]/g, '')}</p>` : ''}                    </div>
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
                </div>
                <div class="appointment-footer">
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
                </div>
            </div>
        `).join('');
    }

    // Funções auxiliares
    function getStatusClass(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        if (appointmentDate > now) {
            return 'pending';
        } else {
            return 'completed';
        }
    }

    function getStatusText(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        
        if (appointmentDate > now) {
            return 'Agendado';
        } else {
            return 'Concluído';
        }
    }

    function isFutureAppointment(appointment) {
        const appointmentDate = new Date(appointment.data_hora);
        const now = new Date();
        return appointmentDate > now;
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

    function showLoading(show) {
        // Implemente um overlay de loading se necessário
        const loadingElement = document.getElementById('loading-agenda');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    function showError(message) {
        // Você pode usar o mesmo sistema de toast do main.js
        if (typeof showToast === 'function') {
            showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Atualizar a cada 5 minutos para ver novos agendamentos
    setInterval(() => {
        loadAppointments();
    }, 5 * 60 * 1000);
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
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        // Como sua tabela não tem campo de status, você pode:
        // 1. Deletar o agendamento (mais radical)
        // 2. Adicionar um campo "cancelado" na tabela (recomendado)
        
        // Por enquanto, vou mostrar uma mensagem
        alert('Funcionalidade de cancelamento em desenvolvimento. Entre em contato com a oficina.');
        
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        alert('Erro ao cancelar agendamento.');
    }
}

function rateService(appointmentId) {
    alert('Sistema de avaliação em desenvolvimento!');
}

// Adicione este CSS no seu arquivo CSS existente:
const additionalCSS = `
/* Status dos agendamentos */
.status.pending {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status.completed {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}

.status.cancelled {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

/* Loading */
#loading-agenda {
    display: none;
    text-align: center;
    padding: 20px;
}

/* Filtros adicionais */
.filter-container {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
}

.filter-group label {
    margin-bottom: 5px;
    font-weight: 500;
}

/* Responsividade */
@media (max-width: 768px) {
    .appointment-footer {
        flex-direction: column;
        gap: 10px;
    }
    
    .appointment-footer .btn {
        width: 100%;
        justify-content: center;
    }
    
    .filter-container {
        flex-direction: column;
    }
}
`;

// Adicione o CSS ao documento
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);