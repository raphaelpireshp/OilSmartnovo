document.addEventListener('DOMContentLoaded', function() {
    // Simulação de dados de agendamentos
    const appointments = [
        {
            id: 1,
            customer: "João da Silva",
            vehicle: "Volkswagen Gol 1.6 2020",
            date: "2023-11-15",
            time: "14:00",
            services: "Troca de óleo e filtro",
            oil: "Motul 8100 X-clean 5W-30",
            value: "R$ 189,90",
            location: "AutoCenter Performance Motul",
            code: "OIL20231115-001",
            employee: "",
            status: "pending",
            validated: false
        },
        {
            id: 2,
            customer: "Maria Souza",
            vehicle: "Fiat Argo 1.3 2021",
            date: "2023-11-16",
            time: "10:00",
            services: "Troca de óleo",
            oil: "Motul 8100 Eco-nergy 10W-40",
            value: "R$ 149,90",
            location: "Mecânica Express Motul",
            code: "OIL20231116-002",
            employee: "João Silva",
            status: "confirmed",
            validated: true
        },
        {
            id: 3,
            customer: "Carlos Oliveira",
            vehicle: "Chevrolet Onix 1.0 2019",
            date: "2023-11-10",
            time: "09:00",
            services: "Troca de óleo e filtro",
            oil: "Motul 8100 X-clean 5W-30",
            value: "R$ 199,90",
            location: "Oficina Master Motul",
            code: "OIL20231110-003",
            employee: "Maria Souza",
            status: "completed",
            validated: true
        }
    ];

    // Elementos do DOM
    const loginForm = document.getElementById('admin-login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const appointmentsList = document.getElementById('appointments-list');
    const filterDate = document.getElementById('filter-date');
    const filterStatus = document.getElementById('filter-status');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const issueModal = document.getElementById('issue-modal');
    const issueForm = document.getElementById('issue-form');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    // Variáveis globais
    let currentAppointment = null;

    // Função para renderizar os agendamentos
    function renderAppointments(filteredAppointments = appointments) {
        appointmentsList.innerHTML = '';
        
        filteredAppointments.forEach(appointment => {
            const appointmentItem = document.createElement('div');
            appointmentItem.className = 'appointment-item';
            
            // Status class
            const statusClass = `status-${appointment.status}`;
            
            // Actions buttons
            let actionsHTML = '';
            if (appointment.status === 'pending') {
                actionsHTML = `
                    <div class="appointment-actions">
                        <button class="action-btn edit" onclick="openEditModal(${appointment.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn issue" onclick="openIssueModal(${appointment.id})">
                            <i class="fas fa-exclamation-triangle"></i>
                        </button>
                    </div>
                `;
            } else if (appointment.status === 'confirmed') {
                actionsHTML = `
                    <div class="appointment-actions">
                        <button class="action-btn complete" onclick="completeAppointment(${appointment.id})">
                            <i class="fas fa-check"></i> Realizar
                        </button>
                    </div>
                `;
            } else {
                actionsHTML = `
                    <div class="appointment-actions">
                        <span class="status ${statusClass}">${appointment.status === 'completed' ? 'Realizado' : 'Cancelado'}</span>
                    </div>
                `;
            }
            
            // Code validation
            let codeValidationHTML = '';
            if (!appointment.validated && appointment.status !== 'completed') {
                codeValidationHTML = `
                    <div class="code-validation">
                        <input type="text" class="code-input" placeholder="Código">
                        <button class="validate-btn" onclick="validateCode(${appointment.id}, this.previousElementSibling.value)">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `;
            }
            
appointmentItem.innerHTML = `
    <div>${appointment.customer}</div>
    <div>${appointment.vehicle}</div>
    <div>${formatDate(appointment.date)} ${appointment.time}</div>
    <div>${appointment.services}</div>
    <div>${appointment.oil}</div>
    <div>${appointment.value} ${codeValidationHTML}</div>
    <div>${appointment.employee || 'Não atribuído'}</div>
    ${actionsHTML}
`;
            
            appointmentsList.appendChild(appointmentItem);
        });
    }

    // Função para formatar data
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    // Função para filtrar agendamentos
    function filterAppointments() {
        const dateFilter = filterDate.value;
        const statusFilter = filterStatus.value;
        
        let filtered = [...appointments];
        
        if (dateFilter) {
            filtered = filtered.filter(app => app.date === dateFilter);
        }
        
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => app.status === statusFilter);
        }
        
        renderAppointments(filtered);
    }

    // Funções globais (expostas para uso nos eventos inline)
    window.openEditModal = function(id) {
        currentAppointment = appointments.find(app => app.id === id);
        
        if (currentAppointment) {
            document.getElementById('edit-date').value = currentAppointment.date;
            document.getElementById('edit-time').value = currentAppointment.time;
            document.getElementById('edit-employee').value = currentAppointment.employee || '';
            
            editModal.classList.add('show');
        }
    };

    window.openIssueModal = function(id) {
        currentAppointment = appointments.find(app => app.id === id);
        
        if (currentAppointment) {
            issueModal.classList.add('show');
        }
    };

    window.validateCode = function(id, code) {
        const appointment = appointments.find(app => app.id === id);
        
        if (appointment && code === appointment.code) {
            appointment.validated = true;
            showToast('Código validado com sucesso!', 'success');
            renderAppointments();
        } else {
            showToast('Código inválido!', 'error');
        }
    };

    window.completeAppointment = function(id) {
        const appointment = appointments.find(app => app.id === id);
        
        if (appointment && appointment.validated && appointment.employee) {
            appointment.status = 'completed';
            showToast('Serviço marcado como realizado!', 'success');
            renderAppointments();
        } else if (!appointment.validated) {
            showToast('Valide o código do cliente primeiro!', 'error');
        } else if (!appointment.employee) {
            showToast('Selecione um funcionário responsável!', 'error');
        }
    };

    // Event Listeners
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simular login
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            
            if (email && password) {
                // Redirecionar para a página de agendamentos após 1 segundo (simulação)
                setTimeout(() => {
                    window.location.href = 'agenda.html';
                }, 1000);
            } else {
                showToast('Preencha todos os campos!', 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Redirecionar para a página de login
            window.location.href = 'index.html';
        });
    }

    if (filterDate) {
        filterDate.addEventListener('change', filterAppointments);
    }

    if (filterStatus) {
        filterStatus.addEventListener('change', filterAppointments);
    }

    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newDate = document.getElementById('edit-date').value;
            const newTime = document.getElementById('edit-time').value;
            const employee = document.getElementById('edit-employee').value;
            
            if (newDate && newTime && employee) {
                // Simular verificação de disponibilidade
                const isAvailable = Math.random() > 0.3; // 70% de chance de estar disponível
                
                if (isAvailable) {
                    currentAppointment.date = newDate;
                    currentAppointment.time = newTime;
                    currentAppointment.employee = employee;
                    currentAppointment.status = 'confirmed';
                    
                    showToast('Agendamento atualizado com sucesso!', 'success');
                    editModal.classList.remove('show');
                    renderAppointments();
                } else {
                    showToast('Horário indisponível! Escolha outro horário.', 'error');
                }
            } else {
                showToast('Preencha todos os campos!', 'error');
            }
        });
    }

    if (issueForm) {
        issueForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const reason = document.getElementById('issue-reason').value;
            
            if (reason) {
                currentAppointment.status = 'canceled';
                showToast('Divergência registrada com sucesso!', 'success');
                issueModal.classList.remove('show');
                renderAppointments();
            } else {
                showToast('Descreva o motivo da divergência!', 'error');
            }
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.modal.show').classList.remove('show');
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            document.querySelector('.modal.show').classList.remove('show');
        }
    });

    // Função para mostrar notificações
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Inicialização
    if (appointmentsList) {
        renderAppointments();
    }
});