document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('login-password');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const closeConfirmationBtn = document.getElementById('close-confirmation');
    const filterPeriod = document.getElementById('filter-period');
    const loginStatus = document.getElementById('login-status');
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const userDisplayName = document.getElementById('user-display-name');
    const userEmail = document.getElementById('user-email');
    const logoutBtn = document.getElementById('logout-btn');

    // Verificar status de login ao carregar
    checkLoginStatus();

    // Abrir modal de login
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loginModal.classList.add('show');
        });
    }

    // Fechar modais
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelector('.modal.show').classList.remove('show');
            });
        });
    }

    if (closeConfirmationBtn) {
        closeConfirmationBtn.addEventListener('click', function() {
            confirmationModal.classList.remove('show');
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            document.querySelector('.modal.show').classList.remove('show');
        }
    });

    // Mostrar/ocultar senha
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
        });
    }

    // Validação do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = this.querySelector('#login-email').value.trim();
            const password = this.querySelector('#login-password').value.trim();
            
            if (!email || !password) {
                showToast('Por favor, preencha todos os campos.', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showToast('Por favor, insira um e-mail válido.', 'error');
                return;
            }
            
            // Login real com a API
            await loginWithDatabase(email, password);
        });
    }

    // Login com banco de dados
    async function loginWithDatabase(email, password) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    senha: password
                })
            });

            const result = await response.json();

            if (result.success) {
                // Login bem-sucedido
                showToast('Login realizado com sucesso!', 'success');
                
                // Armazenar informações do usuário
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('userId', result.user.id);
                
                // Fechar modal de login
                loginModal.classList.remove('show');
                
                // Atualizar interface do usuário
                updateUserInterface(result.user);
                userDropdown.classList.add('user-logged-in');
                
                // Mostrar modal de confirmação
                confirmationModal.classList.add('show');
                
                // Carregar agendamentos do usuário
                loadUserAppointments(result.user.id);
                
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            showToast('Erro ao conectar com o servidor', 'error');
        } finally {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Verificar status de login
    async function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId');

        if (isLoggedIn && userData && userId) {
            try {
                const response = await fetch('http://localhost:3000/api/auth/check-login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ userId: userId })
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.loggedIn) {
                        updateUserInterface(result.user);
                        userDropdown.classList.add('user-logged-in');
                        loadUserAppointments(userId);
                        return;
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar login:', error);
                // Se der erro, usa os dados locais
                if (userData.nome || userData.email) {
                    updateUserInterface(userData);
                    userDropdown.classList.add('user-logged-in');
                    return;
                }
            }
        }

        // Se não estiver logado ou dados inválidos
        userDropdown.classList.remove('user-logged-in');
        if (loginStatus) loginStatus.textContent = 'Login';
    }

    // Atualizar interface com dados do usuário
    function updateUserInterface(user) {
        // Mostrar nome completo se existir, senão mostra parte do email
        if (user.nome) {
            if (loginStatus) loginStatus.textContent = user.nome.split(' ')[0];
            if (userDisplayName) userDisplayName.textContent = user.nome;
        } else if (user.email) {
            const username = user.email.split('@')[0];
            if (loginStatus) loginStatus.textContent = username;
            if (userDisplayName) userDisplayName.textContent = username;
        } else {
            if (loginStatus) loginStatus.textContent = 'Minha Conta';
        }

        // Mostrar email no dropdown
        if (userEmail && user.email) {
            userEmail.textContent = user.email;
        }
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const response = await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Mesmo se a API falhar, faz logout localmente
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                
                showToast('Você foi deslogado com sucesso', 'success');
                
                // Atualizar interface
                userDropdown.classList.remove('user-logged-in');
                if (loginStatus) loginStatus.textContent = 'Login';
                
                // Fechar dropdown
                if (dropdownMenu) dropdownMenu.style.display = 'none';
                
                // Recarregar página para atualizar conteúdo
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
            } catch (error) {
                console.error('Erro no logout:', error);
                // Logout local mesmo com erro
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                userDropdown.classList.remove('user-logged-in');
                if (loginStatus) loginStatus.textContent = 'Login';
                if (dropdownMenu) dropdownMenu.style.display = 'none';
                showToast('Desconectado', 'info');
            }
        });
    }

    // Abrir/fechar dropdown
    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (!isLoggedIn) {
                // Se não estiver logado, abrir modal de login
                loginModal.classList.add('show');
                return;
            }

            // Se estiver logado, abrir/fechar dropdown
            const isVisible = dropdownMenu.style.display === 'block';
            dropdownMenu.style.display = isVisible ? 'none' : 'block';
            
            // Atualizar dados do usuário quando abrir o dropdown
            if (!isVisible) {
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                updateUserInterface(userData);
            }
        });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (dropdownMenu && userDropdown && !userDropdown.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // Carregar agendamentos do usuário
    async function loadUserAppointments(userId) {
        try {
            console.log('Carregando agendamentos para usuário:', userId);
            
            const response = await fetch(`http://localhost:3000/api/agendamentos?usuario_id=${userId}`);
            
            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
            
            const appointments = await response.json();
            console.log('Agendamentos carregados:', appointments);
            
            displayAppointments(appointments);
            
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            showToast('Erro ao carregar agendamentos. Mostrando dados de exemplo.', 'error');
            
            // Mostrar dados de exemplo em caso de erro
            displaySampleAppointments();
        }
    }

    // Exibir agendamentos na página
    function displayAppointments(appointments) {
        const appointmentsContainer = document.querySelector('.appointments-list');
        if (!appointmentsContainer) return;

        if (appointments.length === 0) {
            appointmentsContainer.innerHTML = `
                <div class="no-appointments">
                    <i class="fas fa-calendar-times"></i>
                    <h3>Nenhum agendamento encontrado</h3>
                    <p>Você ainda não possui agendamentos realizados.</p>
                    <a href="/html/servicos.html" class="btn btn-primary">Agendar agora</a>
                </div>
            `;
            return;
        }

        appointmentsContainer.innerHTML = appointments.map(appointment => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <span class="protocol">Protocolo: #${appointment.protocolo || 'OIL' + new Date(appointment.data).toISOString().slice(0,10).replace(/-/g,'')}</span>
                    <span class="status ${appointment.status}">${appointment.status}</span>
                </div>
                <div class="appointment-body">
                    <div class="service-info">
                        <h3>${appointment.servico}</h3>
                        <p><i class="fas fa-car"></i> ${appointment.veiculo_info || 'Veículo'}</p>
                        <p><i class="fas fa-oil-can"></i> ${appointment.produto_info || 'Produto'}</p>
                    </div>
                    <div class="date-info">
                        <p><i class="far fa-calendar-alt"></i> ${new Date(appointment.data).toLocaleDateString('pt-BR')}</p>
                        <p><i class="far fa-clock"></i> ${appointment.horario}</p>
                    </div>
                    <div class="location-info">
                        <p><i class="fas fa-map-marker-alt"></i> ${appointment.oficina_nome}</p>
                        <p>${appointment.oficina_endereco}</p>
                    </div>
                </div>
                <div class="appointment-footer">
                    ${appointment.status === 'pendente' ? `
                        <button class="btn btn-outline" onclick="cancelAppointment(${appointment.id})">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="repeatAppointment(${appointment.id})">
                        <i class="fas fa-redo"></i> Repetir
                    </button>
                    <button class="btn btn-outline">
                        <i class="fas fa-file-invoice"></i> Nota Fiscal
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Mostrar agendamentos de exemplo (fallback)
    function displaySampleAppointments() {
        const appointmentsContainer = document.querySelector('.appointments-list');
        if (!appointmentsContainer) return;

        appointmentsContainer.innerHTML = `
            <!-- Agendamento 1 -->
            <div class="appointment-card">
                <div class="appointment-header">
                    <span class="protocol">Protocolo: #OIL20231015-001</span>
                    <span class="status completed">Concluído</span>
                </div>
                <div class="appointment-body">
                    <div class="service-info">
                        <h3>Troca de Óleo Sintético</h3>
                        <p><i class="fas fa-car"></i> Volkswagen Gol 1.6 2020</p>
                        <p><i class="fas fa-oil-can"></i> Óleo Mobil 1 5W30</p>
                    </div>
                    <div class="date-info">
                        <p><i class="far fa-calendar-alt"></i> 15/10/2023</p>
                        <p><i class="far fa-clock"></i> 14:00 - 15:30</p>
                    </div>
                    <div class="location-info">
                        <p><i class="fas fa-map-marker-alt"></i> OilSmart - Unidade Paulista</p>
                        <p>Av. Paulista, 1000 - São Paulo/SP</p>
                    </div>
                </div>
                <div class="appointment-footer">
                    <button class="btn btn-outline"><i class="fas fa-redo"></i> Repetir Agendamento</button>
                    <button class="btn btn-outline"><i class="fas fa-file-invoice"></i> Nota Fiscal</button>
                    <button class="btn btn-outline"><i class="fas fa-star"></i> Avaliar Serviço</button>
                </div>
            </div>
            
            <!-- Agendamento 2 -->
            <div class="appointment-card">
                <div class="appointment-header">
                    <span class="protocol">Protocolo: #OIL20230822-002</span>
                    <span class="status completed">Concluído</span>
                </div>
                <div class="appointment-body">
                    <div class="service-info">
                        <h3>Revisão Completa</h3>
                        <p><i class="fas fa-car"></i> Volkswagen Gol 1.6 2020</p>
                        <p><i class="fas fa-tools"></i> Troca de óleo, filtros e verificação geral</p>
                    </div>
                    <div class="date-info">
                        <p><i class="far fa-calendar-alt"></i> 22/08/2023</p>
                        <p><i class="far fa-clock"></i> 10:00 - 12:30</p>
                    </div>
                    <div class="location-info">
                        <p><i class="fas fa-map-marker-alt"></i> OilSmart - Unidade Morumbi</p>
                        <p>Av. Morumbi, 2500 - São Paulo/SP</p>
                    </div>
                </div>
                <div class="appointment-footer">
                    <button class="btn btn-outline"><i class="fas fa-redo"></i> Repetir Agendamento</button>
                    <button class="btn btn-outline"><i class="fas fa-file-invoice"></i> Nota Fiscal</button>
                    <button class="btn btn-outline"><i class="fas fa-star"></i> Avaliar Serviço</button>
                </div>
            </div>
        `;
    }

    // Função para validar e-mail
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Mostrar toast notification
    function showToast(message, type = 'success') {
        // Remove toast existente se houver
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
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
    
    // Adicionar estilo para o toast
    const style = document.createElement('style');
    style.textContent = `
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1002;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
        }
        
        .toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(-10px);
        }
        
        .toast.success {
            background-color: var(--success-color);
        }
        
        .toast.error {
            background-color: var(--danger-color);
        }
        
        .toast.warning {
            background-color: var(--warning-color);
        }
        
        .toast.info {
            background-color: var(--info-color);
        }
    `;
    document.head.appendChild(style);

    // Filtrar agendamentos por período
    if (filterPeriod) {
        filterPeriod.addEventListener('change', function() {
            const period = this.value;
            const appointmentCards = document.querySelectorAll('.appointment-card');
            
            appointmentCards.forEach(card => {
                card.style.display = 'block';
                
                if (period === 'month') {
                    // Simular filtro dos últimos 30 dias
                    const protocol = card.querySelector('.protocol').textContent;
                    const dateStr = protocol.match(/#OIL(\d{4})(\d{2})(\d{2})/);
                    
                    if (dateStr) {
                        const appointmentDate = new Date(`${dateStr[1]}-${dateStr[2]}-${dateStr[3]}`);
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        
                        if (appointmentDate < thirtyDaysAgo) {
                            card.style.display = 'none';
                        }
                    }
                } else if (period === 'year') {
                    // Simular filtro do último ano
                    const protocol = card.querySelector('.protocol').textContent;
                    const dateStr = protocol.match(/#OIL(\d{4})(\d{2})(\d{2})/);
                    
                    if (dateStr) {
                        const appointmentDate = new Date(`${dateStr[1]}-${dateStr[2]}-${dateStr[3]}`);
                        const oneYearAgo = new Date();
                        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                        
                        if (appointmentDate < oneYearAgo) {
                            card.style.display = 'none';
                        }
                    }
                }
            });
        });
    }

    // Funções globais para a página de agenda
    window.cancelAppointment = async function(appointmentId) {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            try {
                const response = await fetch(`http://localhost:3000/api/agendamentos/${appointmentId}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast('Agendamento cancelado com sucesso', 'success');
                    // Recarregar agendamentos
                    const userId = localStorage.getItem('userId');
                    if (userId) loadUserAppointments(userId);
                } else {
                    showToast(result.message, 'error');
                }
            } catch (error) {
                console.error('Erro ao cancelar agendamento:', error);
                showToast('Erro ao cancelar agendamento', 'error');
            }
        }
    };

    window.repeatAppointment = function(appointmentId) {
        showToast('Funcionalidade de repetir agendamento em desenvolvimento', 'info');
    };
});