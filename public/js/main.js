// main.js - Arquivo JavaScript unificado para o site OilSmart

document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // FUNCIONALIDADES GLOBAIS (todas as páginas)
    // =============================================

    // 1. Menu Hamburguer
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            nav.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : 'auto';
        });

        // Fecha o menu quando um link é clicado (para mobile)
        const navLinks = document.querySelectorAll('.nav__list a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 992) {
                    hamburger.classList.remove('active');
                    nav.classList.remove('active');
                    document.body.style.overflow = 'auto';
                }
            });
        });

        // Fecha o menu ao redimensionar para desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 992) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // 2. Modal de Login (comum a todas as páginas)
    const loginBtn = document.getElementById('login-btn');
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
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal(loginModal);
        });
    }

    // Mostrar modal de recuperação de senha
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal(loginModal);
            showModal(forgotModal);
        });
    }

    // Voltar para o login
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal(forgotModal);
            showModal(loginModal);
        });
    }

    // Fechar modais
    if (closeModalBtns) {
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                hideModal(modal);
            });
        });
    }

    // Fechar ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });

    // Mostrar/esconder senha
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
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
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('#login-email').value.trim();
            const password = this.querySelector('#login-password').value.trim();
            let isValid = true;

            // Resetar erros
            resetFormErrors(this);

            // Validar email
            if (!email) {
                showError(this, 'login-email', 'Por favor, insira seu e-mail');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(this, 'login-email', 'Por favor, insira um e-mail válido');
                isValid = false;
            }

            // Validar senha
            if (!password) {
                showError(this, 'login-password', 'Por favor, insira sua senha');
                isValid = false;
            } else if (password.length < 6) {
                showError(this, 'login-password', 'A senha deve ter pelo menos 6 caracteres');
                isValid = false;
            }

            if (isValid) {
                simulateLogin(email, password);
            }
        });

        // Validação em tempo real
        loginForm.querySelector('#login-email').addEventListener('blur', function() {
            const email = this.value.trim();
            if (!email) {
                showError(loginForm, 'login-email', 'Por favor, insira seu e-mail');
            } else if (!validateEmail(email)) {
                showError(loginForm, 'login-email', 'Por favor, insira um e-mail válido');
            } else {
                clearError(loginForm, 'login-email');
            }
        });

        loginForm.querySelector('#login-password').addEventListener('blur', function() {
            const password = this.value.trim();
            if (!password) {
                showError(loginForm, 'login-password', 'Por favor, insira sua senha');
            } else if (password.length < 6) {
                showError(loginForm, 'login-password', 'A senha deve ter pelo menos 6 caracteres');
            } else {
                clearError(loginForm, 'login-password');
            }
        });
    }

    // Validação do formulário de recuperação
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value.trim();
            let isValid = true;

            // Resetar erros
            resetFormErrors(this);

            if (!email) {
                showError(this, 'forgot-email', 'Por favor, insira seu e-mail');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(this, 'forgot-email', 'Por favor, insira um e-mail válido');
                isValid = false;
            }

            if (isValid) {
                simulatePasswordReset(email);
            }
        });

        // Validação em tempo real
        forgotForm.querySelector('#forgot-email').addEventListener('blur', function() {
            const email = this.value.trim();
            if (!email) {
                showError(forgotForm, 'forgot-email', 'Por favor, insira seu e-mail');
            } else if (!validateEmail(email)) {
                showError(forgotForm, 'forgot-email', 'Por favor, insira um e-mail válido');
            } else {
                clearError(forgotForm, 'forgot-email');
            }
        });
    }

    // Login com Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('Redirecionando para o login com Google...', 'info');
        });
    }

    // Link de registro
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('Redirecionando para a página de cadastro...', 'info');
        });
    }

    // Funções auxiliares para formulários
    function resetFormErrors(form) {
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    }

    function showError(form, fieldId, message) {
        clearError(form, fieldId);
        
        const field = form.querySelector(`#${fieldId}`);
        if (field) {
            field.classList.add('invalid');
            
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
    }

    function clearError(form, fieldId) {
        const field = form.querySelector(`#${fieldId}`);
        if (field) {
            field.classList.remove('invalid');
            const errorElement = field.nextElementSibling;
            if (errorElement && errorElement.className === 'error-message') {
                errorElement.remove();
            }
        }
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Simular login (apenas para demonstração)
    function simulateLogin(email, password) {
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Mostrar loading
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;
        
        // Simular requisição assíncrona
        setTimeout(() => {
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Mostrar mensagem de sucesso
            showToast('Login realizado com sucesso!', 'success');
            
            // Fechar modal
            hideModal(loginModal);
            
            // Atualizar ícone do usuário
            const userIcon = document.querySelector('.user-icon');
            if (userIcon) {
                userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
                userIcon.style.color = 'var(--success-color)';
            }
            
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
        }, 1500);
    }

    function simulatePasswordReset(email) {
        const forgotButton = document.getElementById('forgot-button');
        const originalText = forgotButton.innerHTML;
        
        // Mostrar loading
        forgotButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        forgotButton.disabled = true;
        
        // Simular requisição assíncrona
        setTimeout(() => {
            // Restaurar botão
            forgotButton.innerHTML = originalText;
            forgotButton.disabled = false;
            
            // Mostrar mensagem de sucesso
            showToast(`Link de recuperação enviado para ${email}`, 'success');
            
            // Fechar modal
            hideModal(forgotModal);
        }, 1500);
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

        // Dados simulados
        const database = {
            brands: [
                { id: 1, name: "Fiat" },
                { id: 2, name: "Ford" },
                { id: 3, name: "Chevrolet" },
                { id: 4, name: "Volkswagen" },
                { id: 5, name: "Toyota" },
                { id: 6, name: "Honda" },
                { id: 7, name: "Hyundai" },
                { id: 8, name: "Renault" },
                { id: 9, name: "Peugeot" },
                { id: 10, name: "Nissan" },
                { id: 11, name: "Jeep" }
            ],
            models: {
                1: ["Palio", "Uno", "Strada", "Toro", "Mobi", "Argo", "Cronos", "Siena"],
                2: ["Ka", "Fiesta", "EcoSport", "Focus", "Ranger", "Fusion"],
                3: ["Onix", "Cruze", "Tracker", "S10", "Spin", "Prisma", "Celta"],
                4: ["Gol", "Voyage", "Virtus", "T-Cross", "Polo", "Jetta", "Amarok"],
                5: ["Corolla", "Hilux", "Etios", "Yaris", "SW4", "RAV4"],
                6: ["Civic", "Fit", "HR-V", "CR-V", "City", "WR-V"],
                7: ["HB20", "Creta", "Tucson", "Santa Fe", "i30", "Elantra"],
                8: ["Kwid", "Sandero", "Duster", "Logan", "Captur", "Oroch"],
                9: ["208", "2008", "3008", "Partner", "Boxer"],
                10: ["March", "Versa", "Kicks", "Sentra", "Frontier"],
                11: ["Renegade", "Compass", "Commander", "Wrangler"]
            },
            oilRecommendations: {
                "3-Onix-2015": {
                    oilType: "Sintético 5W-30",
                    oilBrand: "Motul 8100 X-clean",
                    apiSpec: "API SP",
                    capacity: "4.2L",
                    changeInterval: "10.000 km ou 12 meses",
                    compatibleFilters: ["Motul OF013", "Fram PH3614"],
                    price: "R$ 89,90",
                    image: "img/oil-motul-xclean.png"
                },
                "4-Gol-2018": {
                    oilType: "Sintético 5W-40",
                    oilBrand: "Motul 8100 X-cess",
                    apiSpec: "API SN",
                    capacity: "3.8L",
                    changeInterval: "15.000 km ou 12 meses",
                    compatibleFilters: ["Motul OF025", "Bosch F026407005"],
                    price: "R$ 99,90",
                    image: "img/oil-motul-xcess.png"
                },
                "default": {
                    oilType: "Semissintético 10W-40",
                    oilBrand: "Motul 8100 Eco-nergy",
                    apiSpec: "API SL",
                    capacity: "4.0L",
                    changeInterval: "8.000 km ou 12 meses",
                    compatibleFilters: ["Motul OF Universal"],
                    price: "R$ 69,90",
                    image: "img/oil-motul-ecoenergy.png"
                }
            }
        };

        // Oficinas parceiras
        const workshops = [
            {
                id: 1,
                name: "AutoCenter Performance Motul",
                address: "Av. Paulista, 1000, São Paulo/SP",
                phone: "(11) 9999-9999",
                lat: -23.5615,
                lng: -46.6560,
                hours: "Seg-Sex: 08:00-18:00",
                services: ["Troca de óleo", "Alinhamento", "Balanceamento"],
                inventory: ["Motul 8100 X-clean 5W-30", "Motul 8100 X-cess 5W-40"],
                availableSlots: ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00"]
            },
            {
                id: 2,
                name: "Mecânica Express Motul",
                address: "R. Augusta, 500, São Paulo/SP",
                phone: "(11) 8888-8888",
                lat: -23.5550,
                lng: -46.6500,
                hours: "Seg-Sex: 09:00-17:00 | Sáb: 09:00-13:00",
                services: ["Troca de óleo", "Revisão preventiva"],
                inventory: ["Motul 8100 Eco-nergy 10W-40", "Motul Specific 5W-30"],
                availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"]
            },
            {
                id: 3,
                name: "Oficina Master Motul",
                address: "R. da Consolação, 2000, São Paulo/SP",
                phone: "(11) 7777-7777",
                lat: -23.5470,
                lng: -46.6450,
                hours: "Seg-Sex: 08:30-17:30",
                services: ["Troca de óleo", "Diagnóstico eletrônico"],
                inventory: ["Motul 8100 X-clean 5W-30", "Motul 8100 Eco-nergy 10W-40"],
                availableSlots: ["08:30", "10:00", "11:30", "14:00", "15:30"]
            }
        ];

        // Inicialização do mapa
        if (document.getElementById('map')) {
            const map = L.map('map').setView([-23.5505, -46.6333], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Popula as marcas no select
            function populateBrands() {
                brandSelect.innerHTML = '<option value="">Selecione a marca</option>';
                database.brands.forEach(brand => {
                    const option = document.createElement('option');
                    option.value = brand.id;
                    option.textContent = brand.name;
                    brandSelect.appendChild(option);
                });
            }

            // Popula os modelos baseado na marca selecionada
            function populateModels(brandId) {
                modelSelect.innerHTML = '<option value="">Selecione o modelo</option>';
                modelSelect.disabled = !brandId;
                yearSelect.disabled = true;

                if (brandId && database.models[brandId]) {
                    database.models[brandId].forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        modelSelect.appendChild(option);
                    });
                    modelSelect.disabled = false;
                }
            }

            // Popula os anos do veículo
            function populateYears() {
                yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
                const currentYear = new Date().getFullYear();

                for (let year = currentYear + 1; year >= 1980; year--) {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                }
            }

            // Ativa o campo de ano quando modelo é selecionado
            function enableYearSelect() {
                yearSelect.disabled = !modelSelect.value;
                if (!yearSelect.disabled && yearSelect.options.length === 1) {
                    populateYears();
                }
            }

            // Obtém a recomendação de óleo baseado no veículo
            function getOilRecommendation(brandId, model, year) {
                const key = `${brandId}-${model}-${year}`;
                return database.oilRecommendations[key] || database.oilRecommendations.default;
            }

            // Mostra as recomendações de óleo
            function showRecommendations(brandId, model, year) {
                const recommendation = getOilRecommendation(brandId, model, year);

                document.getElementById('recommended-oil').innerHTML = `
                    <div class="product-image">
                        <img src="${recommendation.image || 'img/oil-default.png'}" alt="${recommendation.oilBrand}">
                    </div>
                    <h4>${recommendation.oilBrand} ${recommendation.oilType}</h4>
                    <p><strong>Tipo:</strong> ${recommendation.oilType}</p>
                    <p><strong>Especificação:</strong> ${recommendation.apiSpec}</p>
                    <p><strong>Capacidade:</strong> ${recommendation.capacity}</p>
                    <p><strong>Intervalo de troca:</strong> ${recommendation.changeInterval}</p>
                    <p class="price">${recommendation.price}</p>
                `;

                document.getElementById('recommended-filter').innerHTML = `
                    <div class="product-image">
                        <img src="img/oil-filter.png" alt="Filtro de óleo">
                    </div>
                    <h4>Filtros Compatíveis</h4>
                    <ul class="filter-list">
                        ${recommendation.compatibleFilters.map(filter => `<li>${filter}</li>`).join('')}
                    </ul>
                `;
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
                    const marker = L.marker([workshop.lat, workshop.lng], { icon: customIcon }).addTo(map)
                        .bindPopup(`
                            <div style="font-family: 'Poppins', sans-serif; padding: 10px; max-width: 250px;">
                                <h4 style="color: #e63946; margin-bottom: 10px; font-size: 1rem;">${workshop.name}</h4>
                                <p style="margin: 5px 0; font-size: 0.8rem; color: #555;">
                                    <i class="fas fa-map-marker-alt" style="color: #e63946; width: 15px;"></i> ${workshop.address}
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
                            <h4>${workshop.name}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${workshop.address}</p>
                            <p><i class="fas fa-phone"></i> ${workshop.phone}</p>
                            <p><i class="fas fa-clock"></i> ${workshop.hours}</p>
                            <p><i class="fas fa-oil-can"></i> <strong>Estoque:</strong> ${workshop.inventory.join(', ')}</p>
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

            // Mostra a oficina selecionada no passo 3
            function showSelectedWorkshop(workshopId) {
                const workshop = workshops.find(w => w.id == workshopId);
                if (workshop && selectedWorkshopDiv) {
                    selectedWorkshop = workshop;
                    selectedWorkshopDiv.innerHTML = `
                        <h4>${workshop.name}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${workshop.address}</p>
                        <p><i class="fas fa-phone"></i> ${workshop.phone}</p>
                        <p><i class="fas fa-clock"></i> ${workshop.hours}</p>
                        <p><i class="fas fa-oil-can"></i> <strong>Estoque:</strong> ${workshop.inventory.join(', ')}</p>
                    `;

                    // Atualiza os horários disponíveis
                    const timeSelect = document.getElementById('schedule-time');
                    if (timeSelect) {
                        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
                        workshop.availableSlots.forEach(time => {
                            const option = document.createElement('option');
                            option.value = time;
                            option.textContent = time;
                            timeSelect.appendChild(option);
                        });
                    }
                }
            }

            // Configura data mínima para agendamento
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

                            // Filtra oficinas próximas (simulação)
                            const nearbyWorkshops = workshops.filter(() => Math.random() > 0.3);
                            displayWorkshops(nearbyWorkshops.length > 0 ? nearbyWorkshops : workshops);

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

            // Busca por endereço ou CEP
            function searchByAddress() {
                if (locationInput.value.trim()) {
                    showLoading(true);
                    // Simula busca por endereço
                    setTimeout(() => {
                        // Centraliza o mapa em uma localização aleatória (simulação)
                        const baseLat = -23.5505 + (Math.random() * 0.02 - 0.01);
                        const baseLng = -46.6333 + (Math.random() * 0.02 - 0.01);
                        userLocation = { lat: baseLat, lng: baseLng };

                        // Filtra oficinas próximas (simulação)
                        const nearbyWorkshops = workshops.filter(() => Math.random() > 0.3);
                        displayWorkshops(nearbyWorkshops.length > 0 ? nearbyWorkshops : workshops);

                        showToast(`Buscando oficinas próximas a: ${locationInput.value}`);
                        showLoading(false);
                    }, 1000);
                } else {
                    showToast('Por favor, digite um endereço ou CEP para buscar.', 'warning');
                }
            }

            // Mostra loading overlay
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
                brandSelect.addEventListener('change', function() {
                    populateModels(this.value);
                });
            }

            if (modelSelect) {
                modelSelect.addEventListener('change', enableYearSelect);
            }

            // Validação do formulário de veículo
            if (vehicleForm) {
                vehicleForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const brandId = brandSelect.value;
                    const model = modelSelect.value;
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
                    if (!model) {
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
                        showRecommendations(brandId, model, year);
                        goToStep(2);
                    }
                });

                // Validação em tempo real
                brandSelect.addEventListener('change', function() {
                    if (this.value) {
                        clearError(vehicleForm, 'vehicle-brand');
                    }
                });

                modelSelect.addEventListener('change', function() {
                    if (this.value) {
                        clearError(vehicleForm, 'vehicle-model');
                    }
                });

                yearSelect.addEventListener('change', function() {
                    if (this.value) {
                        clearError(vehicleForm, 'vehicle-year');
                    }
                });

                mileageInput.addEventListener('blur', function() {
                    const value = this.value.trim();
                    if (!value) {
                        showError(vehicleForm, 'vehicle-mileage', 'Por favor, informe a quilometragem');
                    } else if (!/^\d+$/.test(value)) {
                        showError(vehicleForm, 'vehicle-mileage', 'Apenas números são permitidos');
                    } else {
                        clearError(vehicleForm, 'vehicle-mileage');
                    }
                });

                locationInput.addEventListener('blur', function() {
                    if (!this.value.trim() && !userLocation) {
                        showError(vehicleForm, 'location-input', 'Por favor, informe sua localização');
                    } else {
                        clearError(vehicleForm, 'location-input');
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
                cpfInput.addEventListener('input', function(e) {
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
                phoneInput.addEventListener('input', function(e) {
                    let value = e.target.value.replace(/\D/g, '');
                    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                    value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                    e.target.value = value;
                });
            }

            // Validação do formulário de agendamento
            if (scheduleForm) {
                scheduleForm.addEventListener('submit', function(e) {
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
                        goToStep(4);
                    }
                });

                // Validação em tempo real
                scheduleDate.addEventListener('change', function() {
                    if (this.value) {
                        clearError(scheduleForm, 'schedule-date');
                    }
                });

                const timeSelect = document.getElementById('schedule-time');
                if (timeSelect) {
                    timeSelect.addEventListener('change', function() {
                        if (this.value) {
                            clearError(scheduleForm, 'schedule-time');
                        }
                    });
                }

                const nameInput = document.getElementById('customer-name');
                if (nameInput) {
                    nameInput.addEventListener('blur', function() {
                        const value = this.value.trim();
                        if (!value) {
                            showError(scheduleForm, 'customer-name', 'Por favor, informe seu nome');
                        } else if (value.split(' ').length < 2) {
                            showError(scheduleForm, 'customer-name', 'Informe seu nome completo');
                        } else {
                            clearError(scheduleForm, 'customer-name');
                        }
                    });
                }

                if (cpfInput) {
                    cpfInput.addEventListener('blur', function() {
                        const value = this.value.replace(/\D/g, '');
                        if (!value) {
                            showError(scheduleForm, 'customer-cpf', 'Por favor, informe seu CPF');
                        } else if (value.length !== 11) {
                            showError(scheduleForm, 'customer-cpf', 'CPF deve ter 11 dígitos');
                        } else if (!validateCPF(value)) {
                            showError(scheduleForm, 'customer-cpf', 'CPF inválido');
                        } else {
                            clearError(scheduleForm, 'customer-cpf');
                        }
                    });
                }

                if (phoneInput) {
                    phoneInput.addEventListener('blur', function() {
                        const value = this.value.replace(/\D/g, '');
                        if (!value) {
                            showError(scheduleForm, 'customer-phone', 'Por favor, informe seu telefone');
                        } else if (value.length < 10 || value.length > 11) {
                            showError(scheduleForm, 'customer-phone', 'Telefone inválido');
                        } else {
                            clearError(scheduleForm, 'customer-phone');
                        }
                    });
                }

                const emailInput = document.getElementById('customer-email');
                if (emailInput) {
                    emailInput.addEventListener('blur', function() {
                        const value = this.value.trim();
                        if (!value) {
                            showError(scheduleForm, 'customer-email', 'Por favor, informe seu e-mail');
                        } else if (!validateEmail(value)) {
                            showError(scheduleForm, 'customer-email', 'E-mail inválido');
                        } else {
                            clearError(scheduleForm, 'customer-email');
                        }
                    });
                }
            }

            // Inicialização
            populateBrands();
            setMinScheduleDate();
            displayWorkshops(workshops);
            updateProgressSteps(1);

            // Funções globais para a página de serviços
            window.goToStep = function(stepNumber) {
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

            window.selectWorkshop = function(workshopId) {
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

            window.confirmSchedule = function() {
                const dateInput = document.getElementById('schedule-date');
                const timeInput = document.getElementById('schedule-time');
                const nameInput = document.getElementById('customer-name');
                const cpfInput = document.getElementById('customer-cpf');
                const phoneInput = document.getElementById('customer-phone');
                const emailInput = document.getElementById('customer-email');

                if (!dateInput.value || !timeInput.value || !nameInput.value || !cpfInput.value || !phoneInput.value || !emailInput.value) {
                    showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
                    return;
                }

                // Validação simples de CPF
                if (!validateCPF(cpfInput.value.replace(/\D/g, ''))) {
                    showToast('CPF inválido. Por favor, insira um CPF válido.', 'error');
                    return;
                }

                // Validação simples de e-mail
                if (!validateEmail(emailInput.value)) {
                    showToast('E-mail inválido. Por favor, insira um e-mail válido.', 'error');
                    return;
                }

                // Se tudo estiver válido, vai para o passo 4
                goToStep(4);
            };

            // Validação de CPF
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
        }
    }

    // 2. PÁGINA DE AGENDA (agenda.html)
    if (window.location.pathname.includes('agenda.html')) {
        const filterPeriod = document.getElementById('filter-period');
        const closeConfirmationBtn = document.getElementById('close-confirmation');
        const confirmationModal = document.getElementById('confirmation-modal');

        // Fechar modal de confirmação
        if (closeConfirmationBtn && confirmationModal) {
            closeConfirmationBtn.addEventListener('click', function() {
                hideModal(confirmationModal);
            });
        }

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
    }

    // 3. PÁGINA SOBRE (sobre.html)
    if (window.location.pathname.includes('sobre.html')) {
        // Configurar animações para elementos da página
        const setupAnimations = function() {
            const elements = document.querySelectorAll('.milestone, .mv-card, .diferencial-card, .testimonial');
            
            elements.forEach(element => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            });
            
            const animateOnScroll = function() {
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
    heroBanner.addEventListener('mouseenter', stopAutoSlide);
    heroBanner.addEventListener('mouseleave', startAutoSlide);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initHeroCarousel);

document.getElementById('download-pdf').addEventListener('click', function() {
    // Simulação de download - em produção, isso se conectaria a um backend
    showToast('Preparando seu comprovante em PDF...', 'success');
    
    // Simular um delay de download
    setTimeout(function() {
        showToast('Download do comprovante iniciado!', 'success');
        
        // Em um cenário real, aqui viria a lógica para gerar/download do PDF
        // window.open('/gerar-pdf?agendamento=123', '_blank');
    }, 1500);
});











// Função para enviar o formulário para o backend
async function submitContactForm(formData) {
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (data.success) {
            return { success: true, message: data.message };
        } else {
            return { success: false, message: data.message };
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        return { 
            success: false, 
            message: 'Erro de conexão. Tente novamente mais tarde.' 
        };
    }
}

// Modifique o evento de submit do formulário na página de contato
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Coletar dados do formulário
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value.trim();
            
            // Validação (mantenha sua validação existente)
            let isValid = true;
            // ... seu código de validação existente ...
            
            // Se válido, enviar para o backend
            if (isValid) {
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                // Mostrar loading
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                submitBtn.disabled = true;
                
                // Enviar para o backend
                const result = await submitContactForm({
                    name, email, phone, subject, message
                });
                
                // Restaurar botão
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                
                // Mostrar resultado
                if (result.success) {
                    showToast(result.message, 'success');
                    contactForm.reset();
                } else {
                    showToast(result.message, 'error');
                }
            }
        });
    }
});


// ===== PÁGINA DE CONTATO =====
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        // Validação do formulário de contato
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value.trim();
            
            let isValid = true;
            
            // Resetar erros
            resetFormErrors(this);
            
            // Validar nome
            if (!name) {
                showError(this, 'contact-name', 'Por favor, informe seu nome');
                isValid = false;
            } else if (name.split(' ').length < 2) {
                showError(this, 'contact-name', 'Informe seu nome completo');
                isValid = false;
            }
            
            // Validar email
            if (!email) {
                showError(this, 'contact-email', 'Por favor, informe seu e-mail');
                isValid = false;
            } else if (!validateEmail(email)) {
                showError(this, 'contact-email', 'Por favor, informe um e-mail válido');
                isValid = false;
            }
            
            // Validar assunto
            if (!subject) {
                showError(this, 'contact-subject', 'Por favor, selecione um assunto');
                isValid = false;
            }
            
            // Validar mensagem
            if (!message) {
                showError(this, 'contact-message', 'Por favor, escreva sua mensagem');
                isValid = false;
            } else if (message.length < 10) {
                showError(this, 'contact-message', 'A mensagem deve ter pelo menos 10 caracteres');
                isValid = false;
            }
            
            if (isValid) {
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;
                
                // Mostrar loading
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
                submitBtn.disabled = true;
                
                try {
                    // Enviar para o backend
                    const response = await fetch('/api/contact', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name, email, phone, subject, message })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast(data.message, 'success');
                        contactForm.reset();
                    } else {
                        showToast(data.message, 'error');
                    }
                } catch (error) {
                    console.error('Erro ao enviar formulário:', error);
                    showToast('Erro de conexão. Tente novamente mais tarde.', 'error');
                } finally {
                    // Restaurar botão
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        });
        
        // Validação em tempo real
        const nameInput = document.getElementById('contact-name');
        if (nameInput) {
            nameInput.addEventListener('blur', function() {
                const value = this.value.trim();
                if (!value) {
                    showError(contactForm, 'contact-name', 'Por favor, informe seu nome');
                } else if (value.split(' ').length < 2) {
                    showError(contactForm, 'contact-name', 'Informe seu nome completo');
                } else {
                    clearError(contactForm, 'contact-name');
                }
            });
        }
        
        const emailInput = document.getElementById('contact-email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                const value = this.value.trim();
                if (!value) {
                    showError(contactForm, 'contact-email', 'Por favor, informe seu e-mail');
                } else if (!validateEmail(value)) {
                    showError(contactForm, 'contact-email', 'Por favor, informe um e-mail válido');
                } else {
                    clearError(contactForm, 'contact-email');
                }
            });
        }
        
        const subjectSelect = document.getElementById('contact-subject');
        if (subjectSelect) {
            subjectSelect.addEventListener('change', function() {
                if (this.value) {
                    clearError(contactForm, 'contact-subject');
                }
            });
        }
        
        const messageTextarea = document.getElementById('contact-message');
        if (messageTextarea) {
            messageTextarea.addEventListener('blur', function() {
                const value = this.value.trim();
                if (!value) {
                    showError(contactForm, 'contact-message', 'Por favor, escreva sua mensagem');
                } else if (value.length < 10) {
                    showError(contactForm, 'contact-message', 'A mensagem deve ter pelo menos 10 caracteres');
                } else {
                    clearError(contactForm, 'contact-message');
                }
            });
        }
        
        // Máscara para telefone
        const phoneInput = document.getElementById('contact-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
                value = value.replace(/(\d)(\d{4})$/, '$1-$2');
                e.target.value = value;
            });
        }
    }
    
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            // Fecha outros itens abertos
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Abre/fecha o item atual
            item.classList.toggle('active');
        });
    });
});