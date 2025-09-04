// main.js - Arquivo JavaScript unificado para o site OilSmart (Adaptado para BD)

document.addEventListener('DOMContentLoaded', function () {

    // =============================================
    // FUNCIONALIDADES GLOBAIS (todas as páginas)
    // =============================================

    // 1. Menu Hamburguer
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', function () {
            nav.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Fecha o menu quando um link é clicado (para mobile)
        const navLinks = document.querySelectorAll('.nav__list a');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 992) {
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        });

        // Fecha o menu ao redimensionar para desktop
        window.addEventListener('resize', function () {
            if (window.innerWidth > 992) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // =============================================
    // CONTROLE DE USUÁRIO E LOGIN
    // =============================================

    // Elementos do DOM
    const userDropdown = document.getElementById('user-dropdown');
    const loginStatus = document.getElementById('login-status');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const userDisplayName = document.getElementById('user-display-name');
    const userEmail = document.getElementById('user-email');
    const loginBtn = document.getElementById('login-btn');

    // Verificar status de login
    async function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = localStorage.getItem('userId');

        if (isLoggedIn && userData && userId) {
            try {
                // Verificar no servidor se o login ainda é válido
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
        loginStatus.textContent = 'Login';
    }

    // Atualizar interface com dados do usuário
    function updateUserInterface(user) {
        // Mostrar nome completo se existir, senão mostra parte do email
        if (user.nome) {
            loginStatus.textContent = user.nome.split(' ')[0]; // Primeiro nome apenas
            if (userDisplayName) {
                userDisplayName.textContent = user.nome;
            }
        } else if (user.email) {
            const username = user.email.split('@')[0];
            loginStatus.textContent = username;
            if (userDisplayName) {
                userDisplayName.textContent = username;
            }
        } else {
            loginStatus.textContent = 'Minha Conta';
        }

        // Mostrar email no dropdown
        if (userEmail && user.email) {
            userEmail.textContent = user.email;
        }
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            try {
                // Chamar API de logout
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
                loginStatus.textContent = 'Login';

                // Fechar dropdown
                dropdownMenu.style.display = 'none';

                // Redirecionar para home após 1 segundo
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);

            } catch (error) {
                console.error('Erro no logout:', error);
                // Logout local mesmo com erro
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('user');
                localStorage.removeItem('userId');
                userDropdown.classList.remove('user-logged-in');
                loginStatus.textContent = 'Login';
                dropdownMenu.style.display = 'none';
                showToast('Desconectado', 'info');
            }
        });
    }

    // Abrir dropdown
    if (userDropdown) {
        userDropdown.addEventListener('click', function (e) {
            e.stopPropagation();

            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

            if (!isLoggedIn) {
                // Se não estiver logado, redirecionar para login
                window.location.href = '/html/login.html';
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
    document.addEventListener('click', function (e) {
        if (dropdownMenu && userDropdown && !userDropdown.contains(e.target)) {
            dropdownMenu.style.display = 'none';
        }
    });

    // Verificar login ao carregar a página
    document.addEventListener('DOMContentLoaded', function () {
        checkLoginStatus();
    });

    // Verificar login também quando a página ganha foco
    window.addEventListener('focus', checkLoginStatus);

    // 3. Modal de Login (comum a todas as páginas)
    const loginModal = document.getElementById('login-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const forgotModal = document.getElementById('forgot-modal');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const backToLoginLink = document.getElementById('back-to-login');
    const registerLink = document.getElementById('register-link');
    const googleLoginBtn = document.getElementById('google-login');
    const loginForm = document.getElementById('login-form') || document.querySelector('.login-form');
    const forgotForm = document.getElementById('forgotForm');

    // Funções auxiliares para modais
    function showModal(modal) {
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal(modal) {
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Abrir modal de login
    if (loginBtn && loginModal) {
        loginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showModal(loginModal);
        });
    }

    // Mostrar modal de recuperação de senha
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            hideModal(loginModal);
            showModal(forgotModal);
        });
    }

    // Voltar para o login
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function (e) {
            e.preventDefault();
            hideModal(forgotModal);
            showModal(loginModal);
        });
    }

    // Fechar modais
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const modal = this.closest('.modal');
                hideModal(modal);
            });
        });
    }

    // Fechar ao clicar fora
    window.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Mostrar/esconder senha
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling || document.getElementById('login-password');
            if (input) {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
            }
        });
    });

    // Validação do formulário de login
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = this.querySelector('#login-email').value.trim();
            const password = this.querySelector('#login-password').value.trim();
            const rememberMe = this.querySelector('#remember-me') ? this.querySelector('#remember-me').checked : false;

            // Reset erros
            resetErrors();

            // Validação
            let isValid = true;

            if (!email) {
                showError('email-error', 'Por favor, insira seu e-mail');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError('email-error', 'Por favor, insira um e-mail válido');
                isValid = false;
            }

            if (!password) {
                showError('password-error', 'Por favor, insira sua senha');
                isValid = false;
            } else if (password.length < 6) {
                showError('password-error', 'A senha deve ter pelo menos 6 caracteres');
                isValid = false;
            }

            if (isValid) {
                await loginWithDatabase(email, password, rememberMe);
            }
        });
    }

    // Validação do formulário de recuperação
    if (forgotForm) {
        forgotForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();

            // Reset erros
            document.getElementById('forgot-email-error').textContent = '';

            // Validação
            if (!email) {
                showError('forgot-email-error', 'Por favor, insira seu e-mail');
            } else if (!validateEmail(email)) {
                showError('forgot-email-error', 'Por favor, insira um e-mail válido');
            } else {
                await resetPasswordWithDatabase(email);
            }
        });
    }

    // Login com Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('Redirecionando para o login com Google...', 'info');
        });
    }

    // Link de registro
    if (registerLink) {
        registerLink.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = '/html/cadastro.html';
        });
    }

    // Funções auxiliares para formulários
    function resetErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
    }

    function showError(id, message) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = message;
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Login com banco de dados
    async function loginWithDatabase(email, password, rememberMe) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Mostrar loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;

        try {
            // Enviar dados para o servidor
            const response = await fetch('/api/auth/login', {
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
                const userName = result.user.nome || email.split('@')[0];

                // Armazenar informações do usuário
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('userId', result.user.id);

                // Lembrar email se solicitado
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                showToast(`Bem-vindo(a), ${userName}!`, 'success');

                // Fechar modal
                hideModal(loginModal);

                // Atualizar status do usuário
                checkLoginStatus();

                // Verificar se é a página de agenda para redirecionar
                if (window.location.pathname.includes('agenda.html')) {
                    // Mostrar modal de confirmação na página de agenda
                    const confirmationModal = document.getElementById('confirmation-modal');
                    if (confirmationModal) {
                        showModal(confirmationModal);
                        setTimeout(() => {
                            window.location.href = 'agenda.html';
                        }, 2000);
                    }
                }
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

    async function resetPasswordWithDatabase(email) {
        const forgotButton = document.getElementById('forgot-button');
        const originalText = forgotButton.innerHTML;

        // Mostrar loading
        forgotButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        forgotButton.disabled = true;

        try {
            // Simular envio de recuperação (implementar API real posteriormente)
            await new Promise(resolve => setTimeout(resolve, 1500));

            showToast(`Link de recuperação enviado para ${email}`, 'success');
            hideModal(forgotModal);
        } catch (error) {
            console.error('Erro ao enviar recuperação:', error);
            showToast('Erro ao enviar email de recuperação', 'error');
        } finally {
            // Restaurar botão
            forgotButton.innerHTML = originalText;
            forgotButton.disabled = false;
        }
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

    // Adicionar estilo para o toast se não existir
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
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
    }

    // Verificar se tem e-mail lembrado
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail && document.getElementById('login-email')) {
        document.getElementById('login-email').value = rememberedEmail;
        if (document.getElementById('remember-me')) {
            document.getElementById('remember-me').checked = true;
        }
    }

    // =============================================
    // FUNCIONALIDADES ESPECÍFICAS POR PÁGINA
    // =============================================

    // 1. PÁGINA DE SERVIÇOS (servicos.html)
    if (window.location.pathname.includes('servicos.html')) {
        // Elementos do DOM específicos da página de serviços
        const brandSelect = document.getElementById('vehicle-brand');
        const modelSelect = document.getElementById('vehicle-model');
        const yearSelect = document.getElementById('vehicle-year');
        const mileageInput = document.getElementById('vehicle-mileage');
        const vehicleForm = document.getElementById('vehicle-form');
        const locationButton = document.getElementById('location-button');
        const locationInput = document.getElementById('location-input');
        const userLocationBtn = document.getElementById('user-location-btn');
        const progressSteps = document.querySelectorAll('.progress-step');
        const scheduleDate = document.getElementById('schedule-date');
        const selectedWorkshopDiv = document.getElementById('selected-workshop');
        const scheduleForm = document.getElementById('schedule-form');

        // Variáveis globais
        let userLocation = null;
        let markers = [];
        let currentStep = 1;
        let selectedWorkshop = null;

        // Inicialização do mapa
        if (document.getElementById('map')) {
            const map = L.map('map').setView([-23.5505, -46.6333], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Carregar marcas do banco de dados
            async function populateBrands() {
                try {
                    const response = await fetch('/api/marcas');
                    const brands = await response.json();

                    brandSelect.innerHTML = '<option value="">Selecione a marca</option>';
                    brands.forEach(brand => {
                        const option = document.createElement('option');
                        option.value = brand.id;
                        option.textContent = brand.nome;
                        brandSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Erro ao carregar marcas:', error);
                    showToast('Erro ao carregar marcas de veículos', 'error');
                }
            }

            // Carregar modelos baseado na marca selecionada
            async function populateModels(brandId) {
                modelSelect.innerHTML = '<option value="">Selecione o modelo</option>';
                modelSelect.disabled = !brandId;
                yearSelect.disabled = true;

                if (brandId) {
                    try {
                        const response = await fetch(`/api/modelos?marca_id=${brandId}`);
                        const models = await response.json();

                        models.forEach(model => {
                            const option = document.createElement('option');
                            option.value = model.id;
                            option.textContent = model.nome;
                            modelSelect.appendChild(option);
                        });
                        modelSelect.disabled = false;
                    } catch (error) {
                        console.error('Erro ao carregar modelos:', error);
                        showToast('Erro ao carregar modelos', 'error');
                    }
                }
            }

            // Carregar anos do modelo selecionado
            async function populateYears(modelId) {
                yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
                yearSelect.disabled = !modelId;

                if (modelId) {
                    try {
                        const response = await fetch(`/api/modelo_anos?modelo_id=${modelId}`);
                        const years = await response.json();

                        years.forEach(yearData => {
                            const option = document.createElement('option');
                            option.value = yearData.ano;
                            option.textContent = yearData.ano;
                            yearSelect.appendChild(option);
                        });
                        yearSelect.disabled = false;
                    } catch (error) {
                        console.error('Erro ao carregar anos:', error);
                        showToast('Erro ao carregar anos do modelo', 'error');
                    }
                }
            }

            // Obter recomendação de óleo do banco
            async function getOilRecommendation(brandId, modelId, year) {
                try {
                    const response = await fetch(`/api/recomendacoes?marca_id=${brandId}&modelo_id=${modelId}&ano=${year}`);
                    const recommendation = await response.json();
                    return recommendation;
                } catch (error) {
                    console.error('Erro ao obter recomendação:', error);
                    return null;
                }
            }

            // Mostrar recomendações de óleo
            async function showRecommendations(brandId, modelId, year) {
                const recommendation = await getOilRecommendation(brandId, modelId, year);

                if (recommendation) {
                    document.getElementById('recommended-oil').innerHTML = `
                        <div class="product-image">
                            <img src="${recommendation.imagem || 'img/oil-default.png'}" alt="${recommendation.marca_oleo}">
                        </div>
                        <h4>${recommendation.marca_oleo} ${recommendation.tipo_oleo}</h4>
                        <p><strong>Tipo:</strong> ${recommendation.tipo_oleo}</p>
                        <p><strong>Especificação:</strong> ${recommendation.especificacao}</p>
                        <p><strong>Capacidade:</strong> ${recommendation.capacidade}</p>
                        <p><strong>Intervalo de troca:</strong> ${recommendation.intervalo_troca}</p>
                        <p class="price">R$ ${recommendation.preco}</p>
                    `;

                    document.getElementById('recommended-filter').innerHTML = `
                        <div class="product-image">
                            <img src="img/oil-filter.png" alt="Filtro de óleo">
                        </div>
                        <h4>Filtros Compatíveis</h4>
                        <ul class="filter-list">
                            ${recommendation.filtros_compatives.map(filter => `<li>${filter}</li>`).join('')}
                        </ul>
                    `;
                } else {
                    // Recomendação padrão se não encontrar
                    document.getElementById('recommended-oil').innerHTML = `
                        <div class="product-image">
                            <img src="img/oil-default.png" alt="Óleo padrão">
                        </div>
                        <h4>Óleo Semissintético 10W-40</h4>
                        <p><strong>Tipo:</strong> Semissintético 10W-40</p>
                        <p><strong>Especificação:</strong> API SL</p>
                        <p><strong>Capacidade:</strong> 4.0L</p>
                        <p><strong>Intervalo de troca:</strong> 8.000 km ou 12 meses</p>
                        <p class="price">R$ 69,90</p>
                    `;
                }
            }

            // Carregar oficinas do banco
            async function loadWorkshops() {
                try {
                    const response = await fetch('/api/oficinas');
                    const workshops = await response.json();
                    displayWorkshops(workshops);
                } catch (error) {
                    console.error('Erro ao carregar oficinas:', error);
                    showToast('Erro ao carregar oficinas', 'error');
                }
            }

            // Adiciona marcadores no mapa e lista de oficinas
            function displayWorkshops(workshopsToShow) {
                const workshopList = document.querySelector('.workshop-list');
                if (workshopList) {
                    workshopList.innerHTML = '';
                }

                // Limpa marcadores anteriores
                markers.forEach(marker => map.removeLayer(marker));
                markers = [];

                // Ícone personalizado
                const customIcon = L.divIcon({
                    className: 'custom-marker',
                    html: '<div style="background: #e63946; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    popupAnchor: [0, -30]
                });

                workshopsToShow.forEach(workshop => {
                    // Cria marcador no mapa
                    const marker = L.marker([workshop.latitude, workshop.longitude], { icon: customIcon }).addTo(map)
                        .bindPopup(`
                            <div style="font-family: 'Poppins', sans-serif; padding: 10px; max-width: 250px;">
                                <h4 style="color: #e63946; margin-bottom: 10px; font-size: 1rem;">${workshop.nome}</h4>
                                <p style="margin: 5px 0; font-size: 0.8rem; color: #555;">
                                    <i class="fas fa-map-marker-alt" style="color: #e63946; width: 15px;"></i> ${workshop.endereco}
                                </p>
                                <button onclick="selectWorkshop(${workshop.id})" style="width: 100%; background: #e63946; color: white; border: none; padding: 8px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                                    Selecionar
                                </button>
                            </div>
                        `);

                    marker.on('click', () => selectWorkshop(workshop.id));
                    markers.push(marker);

                    // Item na lista
                    if (workshopList) {
                        const workshopItem = document.createElement('div');
                        workshopItem.className = 'workshop-item';
                        workshopItem.dataset.id = workshop.id;
                        workshopItem.innerHTML = `
                            <h4>${workshop.nome}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}</p>
                            <p><i class="fas fa-phone"></i> ${workshop.telefone}</p>
                            <p><i class="fas fa-clock"></i> ${workshop.horario_funcionamento}</p>
                            <button class="btn" onclick="selectWorkshop(${workshop.id})">Selecionar</button>
                        `;
                        workshopList.appendChild(workshopItem);
                    }
                });

                // Ajusta o zoom para mostrar todos os marcadores
                if (workshopsToShow.length > 0) {
                    const group = new L.featureGroup(markers);
                    map.fitBounds(group.getBounds().pad(0.2));
                }
            }

            // Mostrar a oficina selecionada no passo 3
            async function showSelectedWorkshop(workshopId) {
                try {
                    const response = await fetch(`/api/oficinas/${workshopId}`);
                    const workshop = await response.json();

                    if (workshop && selectedWorkshopDiv) {
                        selectedWorkshop = workshop;
                        selectedWorkshopDiv.innerHTML = `
                            <h4>${workshop.nome}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}</p>
                            <p><i class="fas fa-phone"></i> ${workshop.telefone}</p>
                            <p><i class="fas fa-clock"></i> ${workshop.horario_funcionamento}</p>
                        `;

                        // Carregar horários disponíveis
                        await loadAvailableSlots(workshopId);
                    }
                } catch (error) {
                    console.error('Erro ao carregar oficina:', error);
                    showToast('Erro ao carregar dados da oficina', 'error');
                }
            }

            // Carregar horários disponíveis
            async function loadAvailableSlots(workshopId) {
                const timeSelect = document.getElementById('schedule-time');
                if (!timeSelect) return;

                try {
                    const response = await fetch(`/api/agendamentos/horarios?oficina_id=${workshopId}&data=${scheduleDate.value}`);
                    const availableSlots = await response.json();

                    timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
                    availableSlots.forEach(slot => {
                        const option = document.createElement('option');
                        option.value = slot;
                        option.textContent = slot;
                        timeSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Erro ao carregar horários:', error);
                    timeSelect.innerHTML = '<option value="">Erro ao carregar horários</option>';
                }
            }

            // Configurar data mínima para agendamento
            function setMinScheduleDate() {
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);

                // Formata para YYYY-MM-DD
                const minDate = tomorrow.toISOString().split('T')[0];
                if (scheduleDate) {
                    scheduleDate.min = minDate;

                    // Define data máxima como 3 meses à frente
                    const maxDate = new Date(today);
                    maxDate.setMonth(today.getMonth() + 3);
                    scheduleDate.max = maxDate.toISOString().split('T')[0];
                }
            }

            // Obtém localização do usuário
            function getUserLocation() {
                if (navigator.geolocation) {
                    showLoading(true);
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };

                            // Adiciona marcador da localização do usuário
                            const userIcon = L.divIcon({
                                className: 'user-marker',
                                html: '<div style="background: #1d3557; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 20]
                            });

                            L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                                .addTo(map)
                                .bindPopup("Sua localização")
                                .openPopup();

                            // Buscar oficinas próximas via API
                            findNearbyWorkshops(userLocation.lat, userLocation.lng);
                            showToast('Localização obtida com sucesso!');
                            showLoading(false);
                        },
                        error => {
                            console.error("Erro ao obter localização:", error);
                            showToast("Não foi possível obter sua localização. Você pode digitar seu endereço manualmente.", 'error');
                            showLoading(false);
                        }
                    );
                } else {
                    showToast("Geolocalização não é suportada por este navegador.", 'error');
                }
            }

            // Buscar oficinas próximas
            async function findNearbyWorkshops(lat, lng) {
                try {
                    const response = await fetch(`/api/oficinas/proximas?lat=${lat}&lng=${lng}`);
                    const nearbyWorkshops = await response.json();
                    displayWorkshops(nearbyWorkshops);
                } catch (error) {
                    console.error('Erro ao buscar oficinas próximas:', error);
                    showToast('Erro ao buscar oficinas próximas', 'error');
                }
            }

            // Busca por endereço ou CEP
            async function searchByAddress() {
                const address = locationInput.value.trim();
                if (address) {
                    showLoading(true);
                    try {
                        // Geocodificar endereço
                        const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
                        const locationData = await response.json();

                        if (locationData.lat && locationData.lng) {
                            userLocation = {
                                lat: locationData.lat,
                                lng: locationData.lng
                            };

                            // Centralizar mapa na localização
                            map.setView([userLocation.lat, userLocation.lng], 13);

                            // Buscar oficinas próximas
                            await findNearbyWorkshops(userLocation.lat, userLocation.lng);
                            showToast(`Oficinas próximas a: ${address}`);
                        } else {
                            showToast('Endereço não encontrado', 'error');
                        }
                    } catch (error) {
                        console.error('Erro na busca por endereço:', error);
                        showToast('Erro ao buscar endereço', 'error');
                    } finally {
                        showLoading(false);
                    }
                } else {
                    showToast('Por favor, digite um endereço ou CEP para buscar.', 'warning');
                }
            }

            // Mostrar loading overlay
            function showLoading(show) {
                const loader = document.getElementById('loading-overlay');
                if (loader) {
                    loader.style.display = show ? 'flex' : 'none';
                }
            }

            // Atualiza a barra de progresso
            function updateProgressSteps(step) {
                progressSteps.forEach((stepElement, index) => {
                    if (index < step - 1) {
                        stepElement.classList.add('completed');
                        stepElement.classList.remove('active');
                    } else if (index === step - 1) {
                        stepElement.classList.add('active');
                        stepElement.classList.remove('completed');
                    } else {
                        stepElement.classList.remove('active', 'completed');
                    }
                });
            }

            // Event Listeners
            if (brandSelect) {
                brandSelect.addEventListener('change', function () {
                    populateModels(this.value);
                });
            }

            if (modelSelect) {
                modelSelect.addEventListener('change', function () {
                    populateYears(this.value);
                });
            }

            if (scheduleDate) {
                scheduleDate.addEventListener('change', function () {
                    if (selectedWorkshop) {
                        loadAvailableSlots(selectedWorkshop.id);
                    }
                });
            }

            // Validação do formulário de veículo
            if (vehicleForm) {
                vehicleForm.addEventListener('submit', async function (e) {
                    e.preventDefault();
                    const brandId = brandSelect.value;
                    const modelId = modelSelect.value;
                    const year = yearSelect.value;
                    const mileage = mileageInput.value.trim();
                    let isValid = true;

                    // Resetar erros
                    resetFormErrors(this);

                    // Validar marca
                    if (!brandId) {
                        showError(this, 'vehicle-brand', 'Por favor, selecione a marca');
                        isValid = false;
                    }

                    // Validar modelo
                    if (!modelId) {
                        showError(this, 'vehicle-model', 'Por favor, selecione o modelo');
                        isValid = false;
                    }

                    // Validar ano
                    if (!year) {
                        showError(this, 'vehicle-year', 'Por favor, selecione o ano');
                        isValid = false;
                    }

                    // Validar quilometragem
                    if (!mileage) {
                        showError(this, 'vehicle-mileage', 'Por favor, informe a quilometragem');
                        isValid = false;
                    } else if (!/^\d+$/.test(mileage)) {
                        showError(this, 'vehicle-mileage', 'Apenas números são permitidos');
                        isValid = false;
                    }

                    // Validar localização
                    if (!userLocation && !locationInput.value.trim()) {
                        showError(this, 'location-input', 'Por favor, informe sua localização');
                        isValid = false;
                    }

                    if (isValid) {
                        // Salvar veículo do usuário se estiver logado
                        const userId = localStorage.getItem('userId');
                        if (userId) {
                            try {
                                await fetch('/api/veiculos', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        usuario_id: userId,
                                        marca_id: brandId,
                                        modelo_id: modelId,
                                        ano: year,
                                        quilometragem: mileage
                                    })
                                });
                            } catch (error) {
                                console.error('Erro ao salvar veículo:', error);
                            }
                        }

                        await showRecommendations(brandId, modelId, year);
                        goToStep(2);
                    }
                });
            }

            if (locationButton) {
                locationButton.addEventListener('click', searchByAddress);
            }

            if (userLocationBtn) {
                userLocationBtn.addEventListener('click', getUserLocation);
            }

            // Máscara para CPF
            const cpfInput = document.getElementById('customer-cpf');
            if (cpfInput) {
                cpfInput.addEventListener('input', function (e) {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d)/, '$1.$2');
                    value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                    e.target.value = value;
                });
            }

            // Máscara para telefone
            const phoneInput = document.getElementById('customer-phone');
            if (phoneInput) {
                phoneInput.addEventListener('input', function (e) {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                    e.target.value = value;
                });
            }

            // Validação do formulário de agendamento
            if (scheduleForm) {
                scheduleForm.addEventListener('submit', async function (e) {
                    e.preventDefault();

                    const date = this.querySelector('#schedule-date').value;
                    const time = this.querySelector('#schedule-time').value;
                    const name = this.querySelector('#customer-name').value.trim();
                    const cpf = this.querySelector('#customer-cpf').value.replace(/\D/g, '');
                    const phone = this.querySelector('#customer-phone').value.replace(/\D/g, '');
                    const email = this.querySelector('#customer-email').value.trim();
                    let isValid = true;

                    // Resetar erros
                    resetFormErrors(this);

                    // Validar data
                    if (!date) {
                        showError(this, 'schedule-date', 'Por favor, selecione uma data');
                        isValid = false;
                    }

                    // Validar horário
                    if (!time) {
                        showError(this, 'schedule-time', 'Por favor, selecione um horário');
                        isValid = false;
                    }

                    // Validar nome
                    if (!name) {
                        showError(this, 'customer-name', 'Por favor, informe seu nome');
                        isValid = false;
                    } else if (name.split(' ').length < 2) {
                        showError(this, 'customer-name', 'Informe seu nome completo');
                        isValid = false;
                    }

                    // Validar CPF
                    if (!cpf) {
                        showError(this, 'customer-cpf', 'Por favor, informe seu CPF');
                        isValid = false;
                    } else if (cpf.length !== 11) {
                        showError(this, 'customer-cpf', 'CPF deve ter 11 dígitos');
                        isValid = false;
                    } else if (!validateCPF(cpf)) {
                        showError(this, 'customer-cpf', 'CPF inválido');
                        isValid = false;
                    }

                    // Validar telefone
                    if (!phone) {
                        showError(this, 'customer-phone', 'Por favor, informe seu telefone');
                        isValid = false;
                    } else if (phone.length < 10 || phone.length > 11) {
                        showError(this, 'customer-phone', 'Telefone inválido');
                        isValid = false;
                    }

                    // Validar email
                    if (!email) {
                        showError(this, 'customer-email', 'Por favor, informe seu e-mail');
                        isValid = false;
                    } else if (!validateEmail(email)) {
                        showError(this, 'customer-email', 'E-mail inválido');
                        isValid = false;
                    }

                    if (isValid) {
                        await createAppointment(date, time, name, cpf, phone, email);
                    }
                });
            }

            // Criar agendamento
            async function createAppointment(date, time, name, cpf, phone, email) {
                const submitBtn = scheduleForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
                submitBtn.disabled = true;

                try {
                    const userId = localStorage.getItem('userId');
                    const response = await fetch('/api/agendamentos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            usuario_id: userId,
                            oficina_id: selectedWorkshop.id,
                            data: date,
                            horario: time,
                            servico: 'Troca de óleo',
                            status: 'pendente',
                            cliente_nome: name,
                            cliente_cpf: cpf,
                            cliente_telefone: phone,
                            cliente_email: email
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        showToast('Agendamento realizado com sucesso!', 'success');
                        goToStep(4);
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Erro ao criar agendamento:', error);
                    showToast('Erro ao realizar agendamento', 'error');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }

            // Inicialização
            populateBrands();
            setMinScheduleDate();
            loadWorkshops();
            updateProgressSteps(1);

            // Funções globais para a página de serviços
            window.goToStep = function (stepNumber) {
                document.querySelector('.service-step.active')?.classList.remove('active');
                const stepElement = document.getElementById(`step${stepNumber}`);
                if (stepElement) {
                    stepElement.classList.add('active');
                }

                // Atualiza as bolinhas de progresso
                updateProgressSteps(stepNumber);

                window.scrollTo({
                    top: stepElement?.offsetTop - 20 || 0,
                    behavior: 'smooth'
                });
            };

            window.selectWorkshop = function (workshopId) {
                document.querySelectorAll('.workshop-item').forEach(item => {
                    item.classList.remove('active');
                });

                const selectedItem = document.querySelector(`.workshop-item[data-id="${workshopId}"]`);
                if (selectedItem) {
                    selectedItem.classList.add('active');
                    showSelectedWorkshop(workshopId);
                    goToStep(3);
                }
            };

            window.confirmSchedule = function () {
                if (scheduleForm) {
                    scheduleForm.dispatchEvent(new Event('submit'));
                }
            };
        }
    }

    // 2. PÁGINA DE AGENDA (agenda.html)
    if (window.location.pathname.includes('agenda.html')) {
        const filterPeriod = document.getElementById('filter-period');
        const closeConfirmationBtn = document.getElementById('close-confirmation');
        const confirmationModal = document.getElementById('confirmation-modal');

        // Carregar agendamentos do usuário
        async function loadUserAppointments() {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                showToast('Faça login para ver seus agendamentos', 'warning');
                return;
            }

            try {
                const response = await fetch(`/api/agendamentos?usuario_id=${userId}`);
                const appointments = await response.json();
                displayAppointments(appointments);
            } catch (error) {
                console.error('Erro ao carregar agendamentos:', error);
                showToast('Erro ao carregar agendamentos', 'error');
            }
        }

        // Exibir agendamentos na página
        function displayAppointments(appointments) {
            const appointmentsContainer = document.querySelector('.appointments-container');
            if (!appointmentsContainer) return;

            if (appointments.length === 0) {
                appointmentsContainer.innerHTML = `
                    <div class="no-appointments">
                        <i class="fas fa-calendar-times"></i>
                        <h3>Nenhum agendamento encontrado</h3>
                        <p>Você ainda não possui agendamentos realizados.</p>
                        <a href="/html/servicos.html" class="btn">Agendar agora</a>
                    </div>
                `;
                return;
            }

            appointmentsContainer.innerHTML = appointments.map(appointment => `
                <div class="appointment-card">
                    <div class="appointment-header">
                        <h3>${appointment.servico}</h3>
                        <span class="status ${appointment.status}">${appointment.status}</span>
                    </div>
                    <div class="appointment-details">
                        <p><strong>Oficina:</strong> ${appointment.oficina_nome}</p>
                        <p><strong>Data:</strong> ${new Date(appointment.data).toLocaleDateString('pt-BR')} às ${appointment.horario}</p>
                        <p><strong>Endereço:</strong> ${appointment.oficina_endereco}</p>
                        <p><strong>Telefone:</strong> ${appointment.oficina_telefone}</p>
                    </div>
                    <div class="appointment-actions">
                        ${appointment.status === 'pendente' ? `
                            <button class="btn btn-cancel" onclick="cancelAppointment(${appointment.id})">Cancelar</button>
                            <button class="btn btn-edit" onclick="editAppointment(${appointment.id})">Editar</button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Fechar modal de confirmação
        if (closeConfirmationBtn && confirmationModal) {
            closeConfirmationBtn.addEventListener('click', function () {
                hideModal(confirmationModal);
            });
        }

        // Filtrar agendamentos por período
        if (filterPeriod) {
            filterPeriod.addEventListener('change', function () {
                const period = this.value;
                // Implementar filtro conforme necessário
            });
        }

        // Carregar agendamentos ao iniciar
        loadUserAppointments();

        // Funções globais para agenda
        window.cancelAppointment = async function (appointmentId) {
            if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
                try {
                    const response = await fetch(`/api/agendamentos/${appointmentId}`, {
                        method: 'DELETE'
                    });

                    const result = await response.json();

                    if (result.success) {
                        showToast('Agendamento cancelado com sucesso', 'success');
                        loadUserAppointments();
                    } else {
                        showToast(result.message, 'error');
                    }
                } catch (error) {
                    console.error('Erro ao cancelar agendamento:', error);
                    showToast('Erro ao cancelar agendamento', 'error');
                }
            }
        };

        window.editAppointment = function (appointmentId) {
            showToast('Funcionalidade de edição em desenvolvimento', 'info');
        };
    }

    // 3. PÁGINA SOBRE (sobre.html)
    if (window.location.pathname.includes('sobre.html')) {
        // Configurar animações para elementos da página
        const setupAnimations = function () {
            const elements = document.querySelectorAll('.milestone, .mv-card, .diferencial-card, .testimonial');

            elements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });

            const animateOnScroll = function () {
                elements.forEach(element => {
                    const elementPosition = element.getBoundingClientRect().top;
                    const screenPosition = window.innerHeight / 1.3;

                    if (elementPosition < screenPosition) {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }
                });
            };

            window.addEventListener('scroll', animateOnScroll);
            animateOnScroll(); // Executa uma vez ao carregar
        };

        setupAnimations();
    }
});

// Funções globais que podem ser chamadas de qualquer lugar
function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false;
    }
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
        resto = 0;
    }
    return resto === parseInt(cpf.charAt(10));
}

// Carrossel do Hero Banner
function initHeroCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentSlide = 0;
    let autoSlideInterval;
    const slideIntervalTime = 5000; // 5 segundos

    // Iniciar carrossel automático
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            nextSlide();
        }, slideIntervalTime);
    }

    // Parar carrossel automático
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Mostrar slide
    function showSlide(n) {
        slides[currentSlide].classList.remove('active');
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    // Slide anterior
    function prevSlide() {
        showSlide(currentSlide - 1);
        stopAutoSlide();
        startAutoSlide();
    }

    // Próximo slide
    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    // Event listeners
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', prevSlide);
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide();
        });

        // Iniciar
        showSlide(0);
        startAutoSlide();

        // Pausar quando o mouse estiver sobre o carrossel
        const heroBanner = document.querySelector('.hero-banner');
        if (heroBanner) {
            heroBanner.addEventListener('mouseenter', stopAutoSlide);
            heroBanner.addEventListener('mouseleave', startAutoSlide);
        }
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initHeroCarousel);

// Funções auxiliares para formulários (usadas na página de serviços)
function resetFormErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

function showError(form, fieldId, message) {
    const errorElement = form.querySelector(`#${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(form, fieldId) {
    const errorElement = form.querySelector(`#${fieldId}-error`);
    if (errorElement) {
        errorElement.textContent = '';
    }
}