
document.addEventListener("DOMContentLoaded", function () {
    // ==================== ELEMENTOS DO DOM ====================
    const brandSelect = document.getElementById("vehicle-brand");
    const modelSelect = document.getElementById("vehicle-model");
    const yearSelect = document.getElementById("vehicle-year");
    const mileageInput = document.getElementById("vehicle-mileage");
    const vehicleForm = document.getElementById("vehicle-form");
    const locationInput = document.getElementById("location-input");
    const locationButton = document.getElementById("location-button");
    const userLocationBtn = document.getElementById("user-location-btn");
    const progressSteps = document.querySelectorAll(".progress-step");
    const selectedWorkshopDiv = document.getElementById("selected-workshop");
    const scheduleDateInput = document.getElementById("schedule-date");
    const scheduleTimeSelect = document.getElementById("schedule-time");

    // Elementos do modal de login
    const loginBtn = document.getElementById("login-btn");
    const modal = document.getElementById("login-modal");
    const closeModal = document.querySelector(".close-modal");
    const loginForm = document.querySelector(".login-form");
    const togglePassword = document.querySelector(".toggle-password");
    const passwordInput = document.getElementById("login-password");
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const mobileNav = document.getElementById("nav");

    // ==================== VARIÁVEIS GLOBAIS ====================
    let userLocation = null;
    let markers = [];
    let currentStep = 1;
    let selectedWorkshop = null;
    let userVehicle = null;
    let map = null;
    let addressSearchTimeout = null;
    let cachedAddresses = {};
    let locationHistory = [];
    let selectedProducts = {
        oil: true,
        filter: true
    };
    let currentWorkshopId = null;
    let specialHoursCache = {};

    // ==================== FUNÇÕES PARA HORÁRIOS ESPECIAIS ====================

    // Verificar se há horário especial para uma data
    async function verificarHorarioEspecial(oficinaId, data) {
        try {
            console.log('🔍 Verificando horário especial para:', data, 'Oficina:', oficinaId);

            const response = await fetch(`/api/oficina/${oficinaId}/horario-especial/${data}`);

            if (!response.ok) {
                console.log('ℹ️  Nenhum horário especial encontrado, usando horário padrão');
                return null;
            }

            const dataResponse = await response.json();

            if (dataResponse.success && dataResponse.horario_especial) {
                console.log('🎯 Horário especial encontrado:', dataResponse.horario_especial);
                return dataResponse.horario_especial;
            }

            return null;
        } catch (error) {
            console.error('❌ Erro ao verificar horário especial:', error);
            return null;
        }
    }

    // Aplicar horário especial na interface
    function aplicarHorarioEspecial(horarioEspecial) {
        const specialHoursAlert = document.getElementById('specialHoursAlert');
        const closedDayAlert = document.getElementById('closedDayAlert');

        // Resetar alerts
        if (specialHoursAlert) specialHoursAlert.style.display = 'none';
        if (closedDayAlert) closedDayAlert.style.display = 'none';

        if (!horarioEspecial) return;

        // Se a oficina está fechada
        if (horarioEspecial.fechado) {
            if (closedDayAlert) {
                closedDayAlert.style.display = 'block';
                document.getElementById('closedDayMessage').textContent =
                    horarioEspecial.motivo ?
                        `A oficina está fechada: ${horarioEspecial.motivo}` :
                        'A oficina não funciona nesta data. Por favor, selecione outra data.';
            }
            return;
        }

        // Se tem horário especial
        if (horarioEspecial.horario_abertura && horarioEspecial.horario_fechamento) {
            if (specialHoursAlert) {
                specialHoursAlert.style.display = 'block';
                const message = horarioEspecial.motivo ?
                    `Horário especial: ${horarioEspecial.horario_abertura} - ${horarioEspecial.horario_fechamento} (${horarioEspecial.motivo})` :
                    `Horário especial: ${horarioEspecial.horario_abertura} - ${horarioEspecial.horario_fechamento}`;

                document.getElementById('specialHoursMessage').textContent = message;
            }
        }
    }

    // Verificar e aplicar horários especiais quando a data muda
    async function verificarHorariosAoMudarData() {
        const dataInput = document.getElementById('schedule-date');
        const oficinaId = currentWorkshopId;

        if (!dataInput || !dataInput.value || !oficinaId) return;

        const horarioEspecial = await verificarHorarioEspecial(oficinaId, dataInput.value);
        aplicarHorarioEspecial(horarioEspecial);
    }

    // ==================== FUNÇÕES AUXILIARES GERAIS ====================

    async function getWorkshopInterval(workshopId) {
        try {
            console.log('🔄 Buscando intervalo para oficina:', workshopId);

            // CORREÇÃO: Mudar para a rota correta do adminRoutes.js
            const response = await fetch(`/api/admin/oficina/${workshopId}/intervalo`);

            if (!response.ok) {
                console.warn('⚠️ Erro HTTP ao buscar intervalo, usando padrão de 45min');
                return 45;
            }

            const data = await response.json();
            console.log('📦 Dados recebidos da API de intervalo:', data);

            if (data.success) {
                const intervalo = parseInt(data.intervalo || data.intervalo_agendamento);

                if (!isNaN(intervalo) && intervalo > 0) {
                    console.log('✅ Intervalo encontrado:', intervalo, 'minutos');
                    return intervalo;
                }
            }

            console.warn('⚠️ Intervalo não encontrado ou inválido, usando padrão de 45min');
            return 45;

        } catch (error) {
            console.error('❌ Erro ao buscar intervalo:', error);
            return 45;
        }
    }

    let intervaloAgendamento = 45; // valor padrão caso não venha nada do servidor

    // Função para carregar intervalo e capacidade da oficina
    let capacidadeSimultanea = 1; // Valor padrão caso não venha nada do servidor

    async function carregarConfigOficina(oficinaId) {
        try {
            // Carregar intervalo de agendamento
            const resIntervalo = await fetch(`/api/oficina/${oficinaId}/intervalo`);
            const dataIntervalo = await resIntervalo.json();
            intervaloAgendamento = dataIntervalo.intervalo || 45;
            console.log("⏱ Intervalo da oficina:", intervaloAgendamento);

            // Carregar capacidade simultânea
            const resCapacidade = await fetch(`/api/oficina/${oficinaId}/capacidade`);
            const dataCapacidade = await resCapacidade.json();
            capacidadeSimultanea = dataCapacidade.capacidade || 1;
            console.log("🔄 Capacidade simultânea da oficina:", capacidadeSimultanea);
        } catch (err) {
            console.error("Erro ao carregar configuração da oficina:", err);
            // Usar padrões em caso de erro
            intervaloAgendamento = 45;
            capacidadeSimultanea = 1;
        }
    }
    // Função para atualizar informações de capacidade na interface - VERSÃO MELHORADA
    function atualizarInfoCapacidade(capacidade, horariosOcupados, slotsDisponiveis) {
        const infoElement = document.getElementById('info-capacidade');
        const textoElement = document.getElementById('info-capacidade-texto');

        if (!infoElement || !textoElement) {
            console.log('❌ Elementos de info capacidade não encontrados');
            return;
        }

        // Calcular estatísticas
        const totalOcupados = Object.values(horariosOcupados).reduce((sum, count) => sum + count, 0);
        const totalSlots = Object.keys(horariosOcupados).length;

        // Texto informativo baseado na capacidade
        let textoInfo = '';

        if (capacidade === 1) {
            textoInfo = `Atendimento individual | ${slotsDisponiveis} horários disponíveis`;
        } else if (capacidade <= 3) {
            textoInfo = `Até ${capacidade} atendimentos simultâneos | ${slotsDisponiveis} horários disponíveis`;
        } else {
            textoInfo = `Até ${capacidade} atendimentos por horário | ${slotsDisponiveis} horários disponíveis`;
        }

        // Adicionar informação sobre ocupação se houver agendamentos
        if (totalOcupados > 0) {
            textoInfo += ` | ${totalOcupados} agendamentos confirmados`;
        }

        // Mostrar sempre, mesmo com capacidade 1
        infoElement.style.display = 'block';
        textoElement.innerHTML = textoInfo;

        console.log(`📊 Info capacidade: ${capacidade} simultâneos, ${slotsDisponiveis} disponíveis, ${totalOcupados} ocupados`);
    }
    // Mostra/oculta o loading
    function showLoading(show) {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? "flex" : "none";
        }
    }

    // Exibe mensagens toast
    function showToast(message, type = "success") {
        const toast = document.getElementById("toast");
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        if (window.innerWidth <= 768) {
            toast.style.width = "90%";
            toast.style.left = "5%";
            toast.style.transform = "none";
        } else {
            toast.style.width = "auto";
            toast.style.left = "50%";
            toast.style.transform = "translateX(-50%)";
        }

        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // Validação de CPF
    function validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, "");
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        let sum = 0, remainder;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
        remainder = 11 - (sum % 11);
        let digit1 = remainder >= 10 ? 0 : remainder;
        if (digit1 !== parseInt(cpf.charAt(9))) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
        remainder = 11 - (sum % 11);
        let digit2 = remainder >= 10 ? 0 : remainder;
        if (digit2 !== parseInt(cpf.charAt(10))) return false;
        return true;
    }

    // Validação de e-mail
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validação de telefone
    function validatePhone(phone) {
        const phoneClean = phone.replace(/\D/g, "");
        return phoneClean.length >= 10 && phoneClean.length <= 11;
    }

    // Formata CPF para exibição
    function formatCPF(cpf) {
        if (!cpf) return "";
        cpf = cpf.replace(/\D/g, "");
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    // Formata telefone para exibição
    function formatPhone(phone) {
        if (!phone) return "";
        phone = phone.replace(/\D/g, "");
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    // Função para calcular distância usando fórmula de Haversine
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        const R = 6371; // Raio da Terra em km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distancia = R * c; // Distância em km

        return distancia;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    // Função para determinar cor baseada na distância
    function getDistanceColor(distancia) {
        if (distancia < 2) return '#2a9d8f';     // Muito perto - VERDE
        if (distancia < 5) return '#3a86ff';     // Perto - AZUL
        if (distancia < 10) return '#f4a261';    // Moderado - LARANJA
        return '#e63946';                        // Longe - VERMELHO
    }

    // Função para retornar a classe CSS baseada na distância
    function getDistanceColorClass(distancia) {
        if (distancia < 2) return 'distance-very-close';
        if (distancia < 5) return 'distance-close';
        if (distancia < 10) return 'distance-medium';
        return 'distance-far';
    }

    // Formata dias de funcionamento
    function formatDiasFuncionamento(dias) {
        if (!dias) return 'Segunda a Sábado';

        const diasMap = {
            'segunda': 'Seg',
            'terca': 'Ter',
            'quarta': 'Qua',
            'quinta': 'Qui',
            'sexta': 'Sex',
            'sabado': 'Sáb',
            'domingo': 'Dom'
        };

        const diasArray = dias.split(',').map(dia => dia.trim().toLowerCase());

        if (diasArray.includes('segunda') && diasArray.includes('terca') &&
            diasArray.includes('quarta') && diasArray.includes('quinta') &&
            diasArray.includes('sexta') && !diasArray.includes('sabado') && !diasArray.includes('domingo')) {
            return 'Segunda a Sexta';
        }

        return diasArray.map(dia => diasMap[dia] || dia).join(', ');
    }

    // Formata horário para exibição
    function formatHorarioFuncionamento(abertura, fechamento) {
        if (!abertura || !fechamento) return 'Não informado';
        return `${abertura.substring(0, 5)} - ${fechamento.substring(0, 5)}`;
    }

    // Formata data para exibição
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // ==================== FUNÇÕES DE AUTENTICAÇÃO ====================

    // Função para verificar se o usuário está logado
    function checkUserLoggedIn() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            // showToast("Você precisa fazer login para agendar um serviço", "error");
            // setTimeout(() => {
            //     window.location.href = 'login.html?redirect=servicos.html';
            // }, 2000);
            return false;
        }
        return true;
    }

    // ==================== FUNÇÕES DE HISTÓRICO DE LOCALIZAÇÃO ====================

    // Carrega o histórico de localizações do localStorage
    function loadLocationHistory() {
        try {
            const savedHistory = localStorage.getItem('oilSmartLocationHistory');
            if (savedHistory) {
                locationHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error("Erro ao carregar histórico de localizações:", error);
            locationHistory = [];
        }
    }

    // Salva uma nova localização no histórico
    function saveToLocationHistory(locationData) {
        const exists = locationHistory.some(item =>
            item.display_name === locationData.display_name
        );

        if (!exists) {
            locationHistory.unshift(locationData);
            locationHistory = locationHistory.slice(0, 5);

            try {
                localStorage.setItem('oilSmartLocationHistory', JSON.stringify(locationHistory));
            } catch (error) {
                console.error("Erro ao salvar histórico de localizações:", error);
            }
        }
    }

    // Exibe sugestões de localização baseadas no histórico
    function showLocationSuggestions() {
        const suggestionsContainer = document.getElementById("location-suggestions");
        if (!suggestionsContainer || locationHistory.length === 0) return;

        suggestionsContainer.innerHTML = '<h4>Localizações recentes:</h4>';

        locationHistory.forEach(location => {
            const suggestionItem = document.createElement("div");
            suggestionItem.className = "location-suggestion";
            suggestionItem.innerHTML = `
                <i class="fas fa-history"></i>
                <span>${location.display_name.split(',')[0]}</span>
                <small>${location.display_name.split(',').slice(1, 3).join(',').trim()}</small>
            `;

            suggestionItem.addEventListener("click", () => {
                locationInput.value = location.display_name;
                suggestionsContainer.style.display = "none";
                searchByAddress(location);
            });

            suggestionsContainer.appendChild(suggestionItem);
        });

        suggestionsContainer.style.display = "block";
    }

    // ==================== FUNÇÕES DE RESPONSIVIDADE ====================

    // Ajusta o layout para diferentes tamanhos de tela
    function handleResponsiveLayout() {
        if (window.innerWidth <= 992) {
            if (hamburgerMenu && mobileNav) {
                hamburgerMenu.style.display = "block";
                mobileNav.style.display = "none";
            }
        } else {
            if (hamburgerMenu && mobileNav) {
                hamburgerMenu.style.display = "none";
                mobileNav.style.display = "flex";
            }
        }

        const mapContainer = document.getElementById("map");
        if (mapContainer) {
            if (window.innerWidth <= 768) {
                mapContainer.style.height = "300px";
            } else {
                mapContainer.style.height = "400px";
            }
            if (map) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        }

        const recommendationContainer = document.querySelector(".recommendation-container");
        if (recommendationContainer) {
            if (window.innerWidth <= 768) {
                recommendationContainer.style.flexDirection = "column";
            } else {
                recommendationContainer.style.flexDirection = "row";
            }
        }

        const workshopItems = document.querySelectorAll(".workshop-item");
        workshopItems.forEach(item => {
            if (window.innerWidth <= 768) {
                item.style.flexDirection = "column";
                const btn = item.querySelector(".btn");
                if (btn) { btn.style.width = "100%"; btn.style.marginTop = "10px"; }
            } else {
                item.style.flexDirection = "row";
                const btn = item.querySelector(".btn");
                if (btn) { btn.style.width = "auto"; btn.style.marginTop = "0"; }
            }
        });

        const scheduleForm = document.getElementById("schedule-form");
        if (scheduleForm) {
            if (window.innerWidth <= 768) {
                scheduleForm.style.padding = "15px";
            } else {
                scheduleForm.style.padding = "20px";
            }
        }
    }

    // ==================== INICIALIZAÇÃO DO MAPA ====================
    function initMap() {
        const mapContainer = document.getElementById("map");
        const mapHeight = window.innerWidth <= 768 ? "300px" : "400px";
        mapContainer.style.height = mapHeight;

        map = L.map("map").setView([-23.5505, -46.6333], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        window.addEventListener("resize", function () {
            const newHeight = window.innerWidth <= 768 ? "300px" : "400px";
            mapContainer.style.height = newHeight;
            setTimeout(() => map.invalidateSize(), 100);
        });
    }

    // ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

    async function populateBrands() {
        showLoading(true);
        brandSelect.innerHTML = '<option value="">Selecione a marca</option>';

        try {
            const response = await fetch("/api/marcas");
            if (!response.ok) throw new Error("Falha ao carregar marcas");

            const brands = await response.json();
            brands.forEach(brand => {
                const option = document.createElement("option");
                option.value = brand.id;
                option.textContent = brand.nome;
                brandSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar marcas:", error);
            showToast("Erro ao carregar marcas. Tente recarregar a página.", "error");
        } finally {
            showLoading(false);
        }
    }

    async function populateModels(brandId) {
        showLoading(true);
        modelSelect.innerHTML = '<option value="">Selecione o modelo</option>';
        modelSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        yearSelect.disabled = true;

        if (brandId) {
            try {
                const response = await fetch(`/api/modelos?marca_id=${brandId}`);
                if (!response.ok) throw new Error("Falha ao carregar modelos");

                const models = await response.json();
                models.forEach(model => {
                    const option = document.createElement("option");
                    option.value = model.id;
                    option.textContent = model.nome;
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
            } catch (error) {
                console.error("Erro ao carregar modelos:", error);
                showToast("Erro ao carregar modelos para esta marca.", "error");
            } finally {
                showLoading(false);
            }
        }
    }

    async function populateYears(modelId) {
        showLoading(true);
        yearSelect.innerHTML = '<option value="">Selecione o ano</option>';
        yearSelect.disabled = true;

        if (modelId) {
            try {
                const response = await fetch(`/api/modelo_anos?modelo_id=${modelId}`);
                if (!response.ok) throw new Error("Falha ao carregar anos");

                const years = await response.json();
                years.forEach(year => {
                    const option = document.createElement("option");
                    option.value = year.id;
                    option.textContent = year.ano;
                    yearSelect.appendChild(option);
                });
                yearSelect.disabled = false;
            } catch (error) {
                console.error("Erro ao carregar anos:", error);
                showToast("Erro ao carregar anos para este modelo.", "error");
            } finally {
                showLoading(false);
            }
        }
    }

    // ==================== FUNÇÕES DE RECOMENDAÇÃO ====================

    async function getOilRecommendation(modeloAnoId) {
        showLoading(true);
        try {
            const response = await fetch(`/api/recomendacoes?modelo_ano_id=${modeloAnoId}`);
            const result = await response.json();

            if (!result.success) {
                showToast(result.message, "error");
                return null;
            }

            sessionStorage.setItem('oilRecommendation', JSON.stringify(result.data));

            return result.data;

        } catch (error) {
            console.error("Erro ao obter recomendação:", error);
            showToast("Erro de comunicação ao obter recomendação.", "error");
            return null;
        } finally {
            showLoading(false);
        }
    }

    function showRecommendations(recommendation) {
        const oilContainer = document.getElementById("recommended-oil");
        const filterContainer = document.getElementById("recommended-filter");

        oilContainer.innerHTML = '';
        filterContainer.innerHTML = '';

        if (!recommendation) {
            oilContainer.innerHTML = `
                <div class="no-recommendation">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nenhuma recomendação de óleo disponível</p>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-oil" disabled>
                        <span class="checkmark"></span>
                        Incluir óleo no serviço
                    </label>
                </div>
            `;

            filterContainer.innerHTML = `
                <div class="no-recommendation">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nenhuma recomendação de filtro disponível</p>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-filter" disabled>
                        <span class="checkmark"></span>
                        Incluir filtro no serviço
                    </label>
                </div>
            `;
            return;
        }

        if (recommendation.oleo) {
            const oil = recommendation.oleo;
            oilContainer.innerHTML = `
                <div class="product-card-content">
                    <div class="product-image">
                        <img src="../img/oil-default.jpg" alt="${oil.nome}" loading="lazy">
                    </div>
                    <div class="product-details">
                        <h4>${oil.nome}</h4>
                        <div class="product-specs">
                            <p><strong>Tipo:</strong> ${oil.tipo || 'N/A'}</p>
                            <p><strong>Viscosidade:</strong> ${oil.viscosidade || 'N/A'}</p>
                            <p><strong>Especificação:</strong> ${oil.especificacao || 'N/A'}</p>
                        </div>
                        ${oil.preco ? `
                        <div class="product-price">
                            <strong>Preço estimado:</strong> 
                            <span class="price">R$ ${(oil.preco || 0).toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-oil" ${selectedProducts.oil ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Incluir óleo no serviço
                    </label>
                </div>
            `;
        } else {
            oilContainer.innerHTML = `
                <div class="no-recommendation">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nenhuma recomendação de óleo disponível</p>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-oil" disabled>
                        <span class="checkmark"></span>
                        Incluir óleo no serviço
                    </label>
                </div>
            `;
        }

        if (recommendation.filtro) {
            const filter = recommendation.filtro;
            filterContainer.innerHTML = `
                <div class="product-card-content">
                    <div class="product-image">
                        <img src="../img/filter-default.jpg" alt="${filter.nome}" loading="lazy">
                    </div>
                    <div class="product-details">
                        <h4>${filter.nome}</h4>
                        <div class="product-specs">
                            <p><strong>Tipo:</strong> ${filter.tipo || 'N/A'}</p>
                            <p><strong>Marca:</strong> ${filter.marca || 'N/A'}</p>
                        </div>
                        ${filter.preco ? `
                        <div class="product-price">
                            <strong>Preço estimado:</strong> 
                            <span class="price">R$ ${(filter.preco || 0).toFixed(2)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-filter" ${selectedProducts.filter ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        Incluir filtro no serviço
                    </label>
                </div>
            `;
        } else {
            filterContainer.innerHTML = `
                <div class="no-recommendation">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Nenhuma recomendação de filtro disponível</p>
                </div>
                <div class="product-selection">
                    <label class="checkbox-container">
                        <input type="checkbox" id="select-filter" disabled>
                        <span class="checkmark"></span>
                        Incluir filtro no serviço
                    </label>
                </div>
            `;
        }

        const oilCheckbox = document.getElementById("select-oil");
        const filterCheckbox = document.getElementById("select-filter");

        if (oilCheckbox) oilCheckbox.addEventListener("change", updateProductSelection);
        if (filterCheckbox) filterCheckbox.addEventListener("change", updateProductSelection);

        updateProductSelection();
    }

    // ==================== FUNÇÕES DE SELEÇÃO DE PRODUTOS ====================

    function updateProductSelection() {
        const oilCheckbox = document.getElementById("select-oil");
        const filterCheckbox = document.getElementById("select-filter");

        selectedProducts.oil = oilCheckbox ? oilCheckbox.checked : false;
        selectedProducts.filter = filterCheckbox ? filterCheckbox.checked : false;

        sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));

        updateSelectionSummary();
    }

    function updateSelectionSummary() {
        const summaryElement = document.getElementById("selected-items");
        const summaryContainer = document.querySelector(".selection-summary");
        const selections = [];

        if (selectedProducts.oil) {
            selections.push("Óleo");
        }
        if (selectedProducts.filter) {
            selections.push("Filtro");
        }

        if (selections.length === 0) {
            summaryElement.textContent = "Nenhum produto selecionado";
            summaryElement.style.color = "#e63946";
            if (summaryContainer) summaryContainer.classList.add("empty");
            if (summaryContainer) summaryContainer.classList.remove("highlight");
        } else {
            summaryElement.textContent = selections.join(" + ");
            summaryElement.style.color = "#2a9d8f";
            if (summaryContainer) summaryContainer.classList.remove("empty");
            if (summaryContainer) summaryContainer.classList.add("highlight");

            if (summaryContainer) {
                setTimeout(() => {
                    summaryContainer.classList.remove("highlight");
                }, 500);
            }
        }
    }

    function initSelectionSummary() {
        const selectionContainer = document.createElement("div");
        selectionContainer.className = "selection-summary";
        selectionContainer.innerHTML = `
            <h4>Resumo da Seleção</h4>
            <p id="selected-items">Carregando...</p>
        `;

        const recommendationContainer = document.querySelector(".recommendation-container");
        if (recommendationContainer) {
            recommendationContainer.parentNode.insertBefore(selectionContainer, recommendationContainer.nextSibling);
        }

        updateSelectionSummary();
    }

    function getSelectedProducts() {
        const saved = sessionStorage.getItem('selectedProducts');
        return saved ? JSON.parse(saved) : { oil: true, filter: true };
    }

    // ==================== FUNÇÕES DE LOCALIZAÇÃO E OFICINAS ====================

    async function getUserLocation() {
        if (!navigator.geolocation) {
            showToast("Seu navegador não suporta geolocalização", "error");
            return;
        }

        showLoading(true);
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            addUserMarker(userLocation.lat, userLocation.lng, "Sua localização");
            map.setView([userLocation.lat, userLocation.lng], 14);

            await searchNearbyWorkshops(userLocation.lat, userLocation.lng);

            showToast("Localização obtida com sucesso!");
        } catch (error) {
            console.error("Erro ao obter localização:", error);
            showToast("Não foi possível obter sua localização", "error");
        } finally {
            showLoading(false);
        }
    }

    async function searchAddress(query) {
        if (!query || query.length < 3) return [];

        if (cachedAddresses[query]) {
            return cachedAddresses[query];
        }

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5&addressdetails=1`);
            if (!response.ok) throw new Error("Erro ao buscar endereços");

            const data = await response.json();
            cachedAddresses[query] = data;

            return data;
        } catch (error) {
            console.error("Erro na busca de endereços:", error);
            return [];
        }
    }

    function showAddressSuggestions(addresses) {
        const resultsContainer = document.getElementById("autocomplete-results");
        resultsContainer.innerHTML = '';

        if (!addresses || addresses.length === 0) {
            resultsContainer.classList.remove("active");
            return;
        }

        addresses.forEach(address => {
            const item = document.createElement("div");
            item.className = "autocomplete-item";
            item.innerHTML = `
                <div class="main-text">${address.display_name.split(',')[0]}</div>
                <div class="secondary-text">${address.display_name.split(',').slice(1).join(',').trim()}</div>
            `;

            item.addEventListener("click", () => {
                locationInput.value = address.display_name;
                resultsContainer.classList.remove("active");
                searchByAddress(address);
            });

            resultsContainer.appendChild(item);
        });

        resultsContainer.classList.add("active");
    }

    async function searchByAddress(locationData = null) {
        const address = locationInput.value.trim();
        if (!address && !locationData) {
            showToast("Digite um endereço válido", "warning");
            return;
        }

        showLoading(true);
        try {
            let finalLocationData = locationData;

            if (!finalLocationData) {
                if (cachedAddresses[address] && cachedAddresses[address].length > 0) {
                    finalLocationData = cachedAddresses[address][0];
                } else {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=br&limit=1&addressdetails=1`);
                    if (!response.ok) throw new Error("Erro ao buscar endereço");

                    const data = await response.json();
                    if (!data || data.length === 0) {
                        throw new Error("Endereço não encontrado");
                    }
                    finalLocationData = data[0];
                }
            }

            const location = {
                lat: parseFloat(finalLocationData.lat),
                lng: parseFloat(finalLocationData.lon)
            };
            userLocation = location;

            addUserMarker(location.lat, location.lng, finalLocationData.display_name);
            map.setView([location.lat, location.lng], 14);

            await searchNearbyWorkshops(location.lat, location.lng);
            saveToLocationHistory(finalLocationData);

            showToast(`Oficinas próximas a: ${finalLocationData.display_name}`);
        } catch (error) {
            console.error("Erro na busca por endereço:", error);
            showToast(error.message, "error");
        } finally {
            showLoading(false);
        }
    }

    function addUserMarker(lat, lng, popupText) {
        markers.filter(m => m.options.icon?.options?.className === "user-marker")
            .forEach(m => map.removeLayer(m));

        const userIcon = L.divIcon({
            className: "user-marker",
            html: '<div style="background: #1d3557; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 20]
        });

        const marker = L.marker([lat, lng], { icon: userIcon })
            .addTo(map)
            .bindPopup(popupText)
            .openPopup();

        markers.push(marker);
    }

    async function searchNearbyWorkshops(lat, lng) {
        showLoading(true);
        try {
            const response = await fetch(`/api/oficina`);

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success || !data.data || data.data.length === 0) {
                showToast("Nenhuma oficina encontrada", "info");
                displayWorkshops([]);
                return;
            }

            const oficinasValidas = data.data.filter(workshop => {
                const latNum = parseFloat(workshop.lat);
                const lngNum = parseFloat(workshop.lng);
                return !isNaN(latNum) && !isNaN(lngNum);
            });

            if (oficinasValidas.length === 0) {
                showToast("Oficinas encontradas, mas sem coordenadas válidas", "warning");
                displayWorkshops([]);
                return;
            }

            const oficinasComDistancia = oficinasValidas.map(workshop => {
                const workshopLat = parseFloat(workshop.lat);
                const workshopLng = parseFloat(workshop.lng);

                const distancia = calcularDistancia(lat, lng, workshopLat, workshopLng);

                return {
                    ...workshop,
                    distancia: distancia
                };
            });

            oficinasComDistancia.sort((a, b) => a.distancia - b.distancia);
            displayWorkshops(oficinasComDistancia);

        } catch (error) {
            console.error("Erro ao buscar oficinas:", error);
            showToast("Erro ao carregar oficinas. Tente novamente.", "error");
        } finally {
            showLoading(false);
        }
    }

    function displayWorkshops(workshops) {
        const mapContainer = document.querySelector(".map-container");
        let listContainer = document.querySelector(".workshop-list-container");
        if (!listContainer) {
            listContainer = document.createElement("div");
            listContainer.className = "workshop-list-container";
            mapContainer.parentNode.insertBefore(listContainer, mapContainer.nextSibling);
        }

        listContainer.innerHTML = "";

        markers.filter(m => m.options.icon?.options?.className !== "user-marker")
            .forEach(m => map.removeLayer(m));

        markers = markers.filter(m => m.options.icon?.options?.className === "user-marker");

        if (!workshops || workshops.length === 0) {
            listContainer.innerHTML = "<p class='no-workshops'>Nenhuma oficina encontrada</p>";
            return;
        }

        const workshopIcon = L.divIcon({
            className: "workshop-marker",
            html: '<div style="background: #e63946; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });

        workshops.forEach(workshop => {
            const lat = parseFloat(workshop.lat);
            const lng = parseFloat(workshop.lng);

            if (isNaN(lat) || isNaN(lng)) {
                console.warn('Coordenadas inválidas para oficina:', workshop);
                return;
            }

            const distanciaFormatada = workshop.distancia < 1
                ? `${(workshop.distancia * 1000).toFixed(0)} m`
                : `${workshop.distancia.toFixed(1)} km`;

            const diasFormatados = formatDiasFuncionamento(workshop.dias_funcionamento);
            const horarioFormatado = formatHorarioFuncionamento(
                workshop.horario_abertura,
                workshop.horario_fechamento
            );

            const marker = L.marker([lat, lng], { icon: workshopIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="workshop-popup">
                        <h4>${workshop.nome}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                        <p><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                        <p><i class="fas fa-clock"></i> ${horarioFormatado}</p>
                        <p><i class="fas fa-calendar"></i> ${diasFormatados}</p>
                        <p><i class="fas fa-route"></i> ${distanciaFormatada}</p>
                        <button onclick="selectWorkshop(${workshop.id})" class="select-workshop-btn">
                            Selecionar
                        </button>
                    </div>
                `);

            markers.push(marker);

            const workshopItem = document.createElement("div");
            workshopItem.className = "workshop-item";
            workshopItem.dataset.id = workshop.id;
            workshopItem.innerHTML = `
                <div class="workshop-info">
                    <h4>${workshop.nome}</h4>
                    <p class="distance">
                        <i class="fas fa-route"></i> ${distanciaFormatada}
                    </p>
                    <p class="address"><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                    <p class="phone"><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                    <p class="hours"><i class="fas fa-clock"></i> ${horarioFormatado}</p>
                    <p class="days"><i class="fas fa-calendar"></i> ${diasFormatados}</p>
                </div>
                <button class="btn select-btn" onclick="selectWorkshop(${workshop.id})">Selecionar</button>
            `;
            listContainer.appendChild(workshopItem);
        });

        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
            map.fitBounds(bounds.pad(0.2));
        }
    }

    // Função global para ser chamada pelos botões do mapa
    window.selectWorkshop = async function (workshopId) {
        showLoading(true);
        try {
            const response = await fetch(`/api/oficina/${workshopId}`);
            if (!response.ok) throw new Error("Oficina não encontrada");

            const workshopData = await response.json();
            selectedWorkshop = workshopData;
            currentWorkshopId = workshopId;
            clearSpecialHoursCache();

            showSelectedWorkshop(selectedWorkshop);
            setMinScheduleDate();
            scheduleDateInput.value = "";
            scheduleTimeSelect.innerHTML = '<option value="" disabled selected>Selecione um horário</option>';

            showToast(`Oficina "${selectedWorkshop.nome}" selecionada!`);
            goToStep(3);
            return true;
        } catch (error) {
            console.error("Erro ao selecionar oficina:", error);
            showToast("Erro ao selecionar a oficina", "error");
            return false;
        } finally {
            showLoading(false);
        }
    };

    async function showSelectedWorkshop(workshop) {
        try {
            const response = await fetch(`/api/oficina/${workshop.id}/detalhes`);
            if (!response.ok) throw new Error("Erro ao carregar dados da oficina");

            const workshopData = await response.json();
            const updatedWorkshop = workshopData.oficina;

            selectedWorkshop = updatedWorkshop;

            const diasFormatados = formatDiasFuncionamento(updatedWorkshop.dias_funcionamento);
            const horarioFormatado = formatHorarioFuncionamento(
                updatedWorkshop.horario_abertura,
                updatedWorkshop.horario_fechamento
            );

            selectedWorkshopDiv.innerHTML = `
                <div class="selected-workshop-card">
                    <h3>${updatedWorkshop.nome}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${updatedWorkshop.endereco}, ${updatedWorkshop.cidade}/${updatedWorkshop.estado}</p>
                    <p><i class="fas fa-phone"></i> ${updatedWorkshop.telefone || 'Não informado'}</p>
                    <p><i class="fas fa-clock"></i> ${horarioFormatado}</p>
                    <p><i class="fas fa-calendar"></i> ${diasFormatados}</p>
                </div>
            `;

            if (scheduleDateInput.value) {
                const selectedDate = new Date(scheduleDateInput.value);
                await generateAvailableTimeSlots(updatedWorkshop, selectedDate);
            }

        } catch (error) {
            console.error('❌ Erro ao carregar detalhes da oficina:', error);
            selectedWorkshopDiv.innerHTML = `
                <div class="selected-workshop-card">
                    <h3>${workshop.nome}</h3>
                    <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                    <p><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                    <p><i class="fas fa-calendar"></i> ${formatDiasFuncionamento(workshop.dias_funcionamento)}</p>
                    <p style="color: #e63946;"><i class="fas fa-exclamation-triangle"></i> Horários podem estar desatualizados</p>
                </div>
            `;
        }
    }

    // ==================== FUNÇÕES DE AGENDAMENTO DE HORÁRIOS ====================

    // Verifica se o dia da semana é válido para a oficina
    function isValidDayForWorkshop(date, workshop) {
        const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
        const dayIndex = date.getDay();
        const diaSemana = dayNames[dayIndex];

        if (!workshop.dias_funcionamento || workshop.dias_funcionamento.trim() === '') {
            return dayOfWeek !== 0; // Assume segunda a sábado se não especificado
        }

        const diasArray = workshop.dias_funcionamento.toLowerCase()
            .split(',')
            .map(dia => dia.trim())
            .filter(dia => dia.length > 0);

        return diasArray.includes(diaSemana);
    }

    // Gera slots de tempo baseado no intervalo configurado
    function generateTimeSlots(start, end, interval) {
        const slots = [];
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);

        let currentHour = startHour;
        let currentMinute = startMinute;

        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            slots.push(time);

            currentMinute += interval;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
        }
        return slots;
    }

    // Buscar horários ocupados considerando a capacidade - VERSÃO MAIS ROBUSTA
    async function getHorariosOcupados(workshopId, data) {
        try {
            console.log(`🔍 Buscando ocupação para oficina ${workshopId} na data ${data}`);

            // BUSCAR CAPACIDADE COM TRATAMENTO DE ERRO MELHORADO
            let capacidade = await getWorkshopCapacity(workshopId);
            console.log(`🏢 Capacidade final: ${capacidade}`);

            // Buscar agendamentos
            const response = await fetch(`/api/oficina/${workshopId}/horarios-ocupados/${data}`);

            if (!response.ok) {
                console.warn('⚠️ Erro ao buscar horários ocupados, retornando vazio');
                return { ocupacao: {}, capacidade: capacidade };
            }

            const result = await response.json();
            const horariosOcupados = result.data || [];

            console.log(`📅 Horários ocupados encontrados:`, horariosOcupados);

            // Agrupa horários por slot
            const ocupacaoPorHorario = {};
            horariosOcupados.forEach(horario => {
                const horaFormatada = horario.substring(0, 5);
                ocupacaoPorHorario[horaFormatada] = (ocupacaoPorHorario[horaFormatada] || 0) + 1;
            });

            console.log(`📊 Ocupação por horário:`, ocupacaoPorHorario);

            return {
                ocupacao: ocupacaoPorHorario,
                capacidade: capacidade
            };
        } catch (error) {
            console.error('❌ Erro geral ao buscar horários ocupados:', error);
            return { ocupacao: {}, capacidade: 1 }; // Sempre retorna um fallback
        }
    }


    // Função para buscar capacidade da oficina
    // Função para buscar capacidade da oficina - VERSÃO CORRIGIDA
    async function getWorkshopCapacity(workshopId) {
        try {
            console.log('🔍 Buscando capacidade para oficina:', workshopId);

            const response = await fetch(`/api/oficina/${workshopId}/capacidade`);

            if (!response.ok) {
                console.warn('⚠️ Erro HTTP ao buscar capacidade:', response.status);
                return 1; // Retorna padrão em caso de erro
            }

            const data = await response.json();
            console.log('📦 Dados recebidos da capacidade:', data);

            if (data.success && data.capacidade !== undefined) {
                const capacidade = parseInt(data.capacidade);
                console.log(`✅ Capacidade encontrada: ${capacidade}`);
                return capacidade;
            } else {
                console.warn('⚠️ Resposta da API não contém capacidade válida, usando padrão 1');
                return 1;
            }
        } catch (error) {
            console.error('❌ Erro ao buscar capacidade:', error);
            return 1; // Sempre retorna um valor padrão em caso de erro
        }
    }

    // Verifica horários especiais
    async function checkSpecialHours(workshopId, date) {
        try {
            const response = await fetch(`/api/oficina/${workshopId}/horario-especial/${date}`);

            if (response.ok) {
                const data = await response.json();
                return data.horario_especial || null;
            }
            return null;
        } catch (error) {
            console.warn('Erro ao verificar horários especiais:', error);
            return null;
        }
    }

    // Limpa cache de horários especiais
    function clearSpecialHoursCache() {
        specialHoursCache = {};
    }

    // Gera horários disponíveis (com intervalo configurado) - VERSÃO COM DEBUG
    // Gera horários disponíveis (com intervalo configurado) - VERSÃO CORRIGIDA
    async function generateAvailableTimeSlots(workshop, selectedDate) {
        scheduleTimeSelect.innerHTML = '<option value="" disabled selected>Carregando horários...</option>';
        const continueButton = document.querySelector('button[onclick="goToStep(4)"]');
        if (continueButton) continueButton.disabled = true;

        try {
            const dataFormatada = selectedDate.toISOString().split('T')[0];
            console.log('📅 Gerando horários para:', dataFormatada, 'Oficina:', workshop.id);

            if (!isValidDayForWorkshop(selectedDate, workshop)) {
                const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                const dayOfWeek = dayNames[selectedDate.getDay()];

                scheduleTimeSelect.innerHTML = '';
                const option = document.createElement("option");
                option.value = "";
                option.textContent = `Oficina não funciona aos ${dayOfWeek}s`;
                option.disabled = true;
                scheduleTimeSelect.appendChild(option);
                return;
            }

            // BUSCAR INTERVALO CONFIGURADO DA OFICINA - CORREÇÃO AQUI
            const intervalo = await getWorkshopInterval(workshop.id);
            console.log(`⏰ Intervalo configurado: ${intervalo} minutos`);
            console.log(`🏢 ID da Oficina: ${workshop.id}`);
            console.log(`📋 Nome da Oficina: ${workshop.nome}`);

            const horarioEspecial = await checkSpecialHours(workshop.id, dataFormatada);
            let startTime, endTime;
            let specialMessage = '';

            if (horarioEspecial) {
                if (horarioEspecial.fechado) {
                    scheduleTimeSelect.innerHTML = '<option value="" disabled selected>Oficina fechada neste dia</option>';
                    if (horarioEspecial.motivo) {
                        const motivoOption = document.createElement('option');
                        motivoOption.textContent = `Motivo: ${horarioEspecial.motivo}`;
                        motivoOption.disabled = true;
                        scheduleTimeSelect.appendChild(motivoOption);
                    }
                    return;
                } else {
                    startTime = horarioEspecial.horario_abertura;
                    endTime = horarioEspecial.horario_fechamento;
                    specialMessage = ` (Horário especial: ${formatHorarioFuncionamento(startTime, endTime)})`;
                }
            } else {
                startTime = workshop.horario_abertura || "08:00";
                endTime = workshop.horario_fechamento || "18:00";
            }

            console.log(`🕒 Horário de funcionamento: ${startTime} - ${endTime}`);

            // USAR INTERVALO CONFIGURADO - GARANTIR QUE ESTÁ SENDO USADO
            const slots = generateTimeSlots(startTime, endTime, intervalo);
            console.log(`📋 Slots gerados (${slots.length}) com intervalo de ${intervalo}min:`, slots);

            // NOVO (colocar no lugar):
            const ocupacaoData = await getHorariosOcupados(workshop.id, dataFormatada);
            const horariosOcupados = ocupacaoData.ocupacao;
            const capacidade = ocupacaoData.capacidade;

            console.log(`🎯 Capacidade: ${capacidade}, Horários ocupados:`, horariosOcupados);

            const now = new Date();
            const isToday = selectedDate.toDateString() === now.toDateString();
            console.log(`📆 É hoje? ${isToday}, Hora atual: ${now.toLocaleTimeString()}`);

            let availableSlotsCount = 0;
            scheduleTimeSelect.innerHTML = '';

            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = `Selecione um horário${specialMessage} (Intervalo: ${intervalo}min)`;
            defaultOption.disabled = true;
            defaultOption.selected = true;
            scheduleTimeSelect.appendChild(defaultOption);

            slots.forEach(time => {
                if (isToday) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const slotTime = new Date();
                    slotTime.setHours(hours, minutes, 0, 0);
                    if (slotTime <= now) {
                        console.log(`⏩ Pulando horário passado: ${time}`);
                        return;
                    }
                }

                const ocupacaoAtual = horariosOcupados[time] || 0;
                const vagasDisponiveis = capacidade - ocupacaoAtual;
                const estaDisponivel = vagasDisponiveis > 0;

                console.log(`⏱️ ${time} - Ocupação: ${ocupacaoAtual}/${capacidade}, Vagas: ${vagasDisponiveis}`);

                const option = document.createElement("option");
                option.value = time;

                if (!estaDisponivel) {
                    option.textContent = `${time} (Lotado)`;
                    option.disabled = true;
                    option.style.color = '#6c757d'; // Cinza para lotado
                    option.style.fontWeight = 'normal';
                } else {
                    // SISTEMA DE CORES PARA ATÉ 5 VAGAS
                    let textoVaga = '';

                    if (vagasDisponiveis === 1) {
                        textoVaga = ' (Última vaga!)';
                        option.style.color = '#e63946'; // Vermelho - urgente
                        option.style.fontWeight = 'bold';
                    } else if (vagasDisponiveis === 2) {
                        textoVaga = ` (${vagasDisponiveis} vagas)`;
                        option.style.color = '#f4a261'; // Laranja - atenção
                        option.style.fontWeight = 'bold';
                    } else if (vagasDisponiveis === 3) {
                        textoVaga = ` (${vagasDisponiveis} vagas)`;
                        option.style.color = '#3a86ff'; // Azul - bom
                        option.style.fontWeight = 'normal';
                    } else if (vagasDisponiveis >= 4) {
                        textoVaga = ` (${vagasDisponiveis} vagas)`;
                        option.style.color = '#2a9d8f'; // Verde - ótimo
                        option.style.fontWeight = 'normal';
                    }

                    option.textContent = `${time}${textoVaga}`;
                    availableSlotsCount++;
                }
                scheduleTimeSelect.appendChild(option);
            });

            console.log(`✅ Horários disponíveis: ${availableSlotsCount}`);

            if (availableSlotsCount === 0) {
                scheduleTimeSelect.innerHTML = '';
                const noSlotsOption = document.createElement("option");
                noSlotsOption.value = "";
                noSlotsOption.textContent = "Nenhum horário disponível para esta data";
                noSlotsOption.disabled = true;
                scheduleTimeSelect.appendChild(noSlotsOption);
            }

            if (continueButton) continueButton.disabled = availableSlotsCount === 0;


            // Atualizar informações de capacidade na interface
            atualizarInfoCapacidade(capacidade, horariosOcupados, availableSlotsCount);
        } catch (error) {
            console.error('❌ Erro ao carregar horários:', error);
            scheduleTimeSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar horários disponíveis</option>';
        }
    }

    // Configura data mínima para agendamento
    function setMinScheduleDate() {
        const today = new Date();

        let nextValidDate = new Date(today);
        nextValidDate.setDate(nextValidDate.getDate() + 1);

        const dayOfWeek = nextValidDate.getDay();
        if (dayOfWeek === 0) { // Domingo
            nextValidDate.setDate(nextValidDate.getDate() + 1);
        } else if (dayOfWeek === 6) { // Sábado
            nextValidDate.setDate(nextValidDate.getDate() + 2);
        }

        const maxDate = new Date(today);
        maxDate.setMonth(maxDate.getMonth() + 3);

        scheduleDateInput.min = nextValidDate.toISOString().split("T")[0];
        scheduleDateInput.max = maxDate.toISOString().split("T")[0];
    }

    // ==================== FUNÇÕES DE AGENDAMENTO ====================

    async function processScheduling() {
        const userData = localStorage.getItem('user');
        if (!userData) {
            showToast("Você precisa fazer login para agendar um serviço", "error");
            setTimeout(() => {
                window.location.href = 'login.html?redirect=servicos.html';
            }, 2000);
            return false;
        }

        const user = JSON.parse(userData);
        const usuario_id = user.id;

        if (!usuario_id) {
            showToast("Erro: ID do usuário não encontrado", "error");
            return false;
        }

        const scheduleDateValue = scheduleDateInput.value;
        const scheduleTime = scheduleTimeSelect.value;
        const customerName = document.getElementById("customer-name").value.trim();
        const customerCpf = document.getElementById("customer-cpf").value.trim();
        const customerPhone = document.getElementById("customer-phone").value.trim();
        const customerEmail = document.getElementById("customer-email").value.trim();

        if (!scheduleDateValue || !scheduleTime || !customerName || !customerCpf || !customerPhone || !customerEmail) {
            showToast("Preencha todos os campos obrigatórios", "error");
            return false;
        }

        if (!validateCPF(customerCpf)) {
            showToast("CPF inválido", "error");
            return false;
        }

        if (!validateEmail(customerEmail)) {
            showToast("E-mail inválido", "error");
            return false;
        }

        if (!selectedWorkshop) {
            showToast("Selecione uma oficina", "error");
            return false;
        }

        const userVehicleData = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
        if (!userVehicleData.modelo_ano_id) {
            showToast("Dados do veículo não encontrados. Por favor, volte ao passo 1.", "error");
            return false;
        }

        showLoading(true);

        try {
            const selectedProducts = getSelectedProducts();
            const oilRecommendation = JSON.parse(sessionStorage.getItem('oilRecommendation') || '{}');

            let totalOil = 0;
            let totalFilter = 0;

            if (selectedProducts.oil && oilRecommendation.oleo && oilRecommendation.oleo.preco) {
                totalOil = parseFloat(oilRecommendation.oleo.preco) || 0;
            }

            if (selectedProducts.filter && oilRecommendation.filtro && oilRecommendation.filtro.preco) {
                totalFilter = parseFloat(oilRecommendation.filtro.preco) || 0;
            }

            const totalService = totalOil + totalFilter;

            const servicosArray = [];
            if (selectedProducts.oil && oilRecommendation.oleo) {
                servicosArray.push(`Troca de Óleo: ${oilRecommendation.oleo.nome} - R$ ${totalOil.toFixed(2)}`);
            }
            if (selectedProducts.filter && oilRecommendation.filtro) {
                servicosArray.push(`Troca de Filtro: ${oilRecommendation.filtro.nome} - R$ ${totalFilter.toFixed(2)}`);
            }

            const dataHora = `${scheduleDateValue} ${scheduleTime}:00`;
            const protocolo = `OIL${Date.now().toString().slice(-8)}`;

            const agendamentoData = {
                protocolo: protocolo,
                data_hora: dataHora,
                oficina_nome: selectedWorkshop.nome,
                oficina_endereco: `${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}`,
                oficina_telefone: selectedWorkshop.telefone || 'Não informado',
                oficina_id: selectedWorkshop.id,
                veiculo: `${userVehicleData.marca || ''} ${userVehicleData.modelo || ''} ${userVehicleData.ano || ''}`.trim(),
                servicos: servicosArray.join(' | '),
                total_servico: totalService,
                cliente_nome: customerName,
                cliente_cpf: customerCpf.replace(/\D/g, ''),
                cliente_telefone: customerPhone,
                cliente_email: customerEmail,
                usuario_id: usuario_id
            };

            const result = await salvarAgendamentoNoBanco(agendamentoData);

            if (result.success) {
                sessionStorage.setItem('codigoConfirmacao', result.codigo_confirmacao || protocolo);
                sessionStorage.setItem('agendamentoId', result.agendamento_id);

                const customerData = {
                    name: customerName,
                    cpf: customerCpf,
                    phone: customerPhone,
                    email: customerEmail
                };
                sessionStorage.setItem('customerData', JSON.stringify(customerData));

                sessionStorage.setItem('selectedWorkshop', JSON.stringify(selectedWorkshop));

                const serviceData = {
                    servicos: servicosArray,
                    total: totalService,
                    data: dataHora
                };
                sessionStorage.setItem('serviceData', JSON.stringify(serviceData));

                showToast('Agendamento salvo com sucesso!', 'success');
                return true;
            } else {
                throw new Error(result.message || 'Erro ao salvar agendamento');
            }
        } catch (error) {
            console.error('Erro no agendamento:', error);
            showToast(error.message || 'Erro ao processar agendamento', 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }

    async function salvarAgendamentoNoBanco(agendamentoData) {
        try {
            const response = await fetch('/api/agendamento_simples', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(agendamentoData)
            });

            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`Resposta inválida do servidor: ${responseText}`);
            }

            if (!response.ok) {
                throw new Error(result.message || `Erro HTTP ${response.status}`);
            }

            if (!result.success) {
                throw new Error(result.message || 'Erro ao salvar agendamento');
            }

            return result;

        } catch (error) {
            console.error('❌ Erro ao salvar agendamento no banco:', error);
            throw error;
        }
    }

    function showConfirmationDetails() {
        const codigoConfirmacao = sessionStorage.getItem('codigoConfirmacao') || `OS${Date.now().toString().slice(-8)}`;
        const customerData = JSON.parse(sessionStorage.getItem('customerData') || '{}');
        const userVehicleData = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
        const selectedWorkshopData = JSON.parse(sessionStorage.getItem('selectedWorkshop') || '{}');
        const serviceData = JSON.parse(sessionStorage.getItem('serviceData') || '{}');

        let dataFormatada = '';
        if (serviceData.data) {
            const data = new Date(serviceData.data);
            dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }

        const confirmationDetails = document.querySelector(".confirmation-details");

        let html = `
            <div class="confirmation-section">
                <h4>📋 Informações do Agendamento</h4>
                <p><strong>Protocolo:</strong> ${codigoConfirmacao}</p>
                <p><strong>Data e Horário:</strong> ${dataFormatada}</p>
            </div>
            
            <div class="confirmation-section">
                <h4>🏢 Oficina</h4>
                <p><strong>Nome:</strong> ${selectedWorkshopData.nome || 'Não informado'}</p>
                <p><strong>Endereço:</strong> ${selectedWorkshopData.endereco || 'Não informado'}, ${selectedWorkshopData.cidade || ''}/${selectedWorkshopData.estado || ''}</p>
                <p><strong>Telefone:</strong> ${selectedWorkshopData.telefone || 'Não informado'}</p>
            </div>
        `;

        if (userVehicleData.marca || userVehicleData.modelo || userVehicleData.ano) {
            html += `
                <div class="confirmation-section">
                    <h4>🚗 Veículo</h4>
                    <p><strong>Modelo:</strong> ${userVehicleData.marca || ''} ${userVehicleData.modelo || ''} ${userVehicleData.ano || ''}</p>
                    ${userVehicleData.quilometragem ? `<p><strong>Quilometragem:</strong> ${userVehicleData.quilometragem} km</p>` : ''}
                </div>
            `;
        }

        if (serviceData.servicos && serviceData.servicos.length > 0) {
            html += `
                <div class="confirmation-section">
                    <h4>🛠️ Serviços</h4>
                    ${serviceData.servicos.map(s => `<p>• ${s}</p>`).join('')}
                    <p><strong>Total Estimado:</strong> R$ ${serviceData.total ? serviceData.total.toFixed(2) : '0.00'}</p>
                </div>
            `;
        }

        html += `
            <div class="confirmation-section">
                <h4>👤 Dados do Cliente</h4>
                <p><strong>Nome:</strong> ${customerData.name || 'Não informado'}</p>
                <p><strong>CPF:</strong> ${formatCPF(customerData.cpf) || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${formatPhone(customerData.phone) || 'Não informado'}</p>
                <p><strong>E-mail:</strong> ${customerData.email || 'Não informado'}</p>
            </div>
        `;

        confirmationDetails.innerHTML = html;
    }

    // ==================== FUNÇÕES DE NAVEGAÇÃO E VALIDAÇÃO DE PASSOS ====================

    // Atualiza a barra de progresso
    function updateProgressBar(step) {
        progressSteps.forEach((stepElement, index) => {
            const stepNumber = index + 1;
            if (stepNumber < step) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            } else if (stepNumber === step) {
                stepElement.classList.add('active');
                stepElement.classList.remove('completed');
            } else {
                stepElement.classList.remove('active', 'completed');
            }
        });
    }

    window.goToStep = async function (step) {
        if (step > currentStep) {
            if (step === 2 && !validateStep1()) return;
            if (step === 3 && !await validateStep2()) return;
            if (step === 4) {
                const success = await processScheduling();
                if (!success) return;
                showConfirmationDetails();
            }
        }

        document.querySelectorAll(".service-step").forEach(s => s.classList.remove("active"));
        document.getElementById(`step${step}`).classList.add("active");

        updateProgressBar(step);
        currentStep = step;

        document.getElementById(`step${step}`).scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    };

    function validateStep1() {
        const isValid = brandSelect.value && modelSelect.value && yearSelect.value;

        if (!isValid) {
            showToast("Selecione marca, modelo e ano do veículo", "error");
            return false;
        }

        if (mileageInput.value.trim() !== "") {
            if (isNaN(mileageInput.value) || mileageInput.value < 0) {
                showToast("Quilometragem inválida", "error");
                return false;
            }
        }

        userVehicle = {
            marca_id: brandSelect.value,
            marca: brandSelect.options[brandSelect.selectedIndex].textContent,
            modelo_id: modelSelect.value,
            modelo: modelSelect.options[modelSelect.selectedIndex].textContent,
            modelo_ano_id: yearSelect.value,
            ano: yearSelect.options[yearSelect.selectedIndex].textContent,
            quilometragem: mileageInput.value.trim()
        };
        sessionStorage.setItem('userVehicle', JSON.stringify(userVehicle));

        return true;
    }

    async function validateStep2() {
        const currentSelectedProducts = getSelectedProducts();

        if (!currentSelectedProducts.oil && !currentSelectedProducts.filter) {
            showToast("Selecione pelo menos um produto (óleo ou filtro) para continuar", "error");
            const oilCard = document.getElementById("recommended-oil");
            const filterCard = document.getElementById("recommended-filter");
            if (oilCard) { oilCard.style.animation = "shake 0.5s ease"; setTimeout(() => { oilCard.style.animation = ""; }, 500); }
            if (filterCard) { filterCard.style.animation = "shake 0.5s ease"; setTimeout(() => { filterCard.style.animation = ""; }, 500); }
            return false;
        }

        if (!selectedWorkshop) {
            showToast("Selecione uma oficina para continuar", "error");
            const workshopList = document.querySelector(".workshop-list-container");
            if (workshopList) { workshopList.style.animation = "shake 0.5s ease"; setTimeout(() => { workshopList.style.animation = ""; }, 500); }
            return false;
        }

        try {
            const response = await fetch(`/api/oficina/${selectedWorkshop.id}`);
            if (!response.ok) throw new Error("Oficina não disponível");
            selectedWorkshop = await response.json(); // Atualiza os dados da oficina
            return true;
        } catch (error) {
            console.error("Erro ao validar oficina:", error);
            showToast("A oficina selecionada não está mais disponível. Por favor, selecione outra.", "error");
            selectedWorkshop = null;
            return false;
        }
    }

    async function validateStep3() {
        const scheduleDateValue = scheduleDateInput.value;
        const scheduleTime = scheduleTimeSelect.value;
        const customerName = document.getElementById("customer-name").value.trim();
        const customerCpf = document.getElementById("customer-cpf").value.trim();
        const customerPhone = document.getElementById("customer-phone").value.trim();
        const customerEmail = document.getElementById("customer-email").value.trim();

        if (!scheduleDateValue || !scheduleTime || !customerName || !customerCpf || !customerPhone || !customerEmail) {
            showToast("Preencha todos os campos obrigatórios", "error");
            return false;
        }

        if (!validateCPF(customerCpf)) {
            showToast("CPF inválido", "error");
            return false;
        }

        if (!validateEmail(customerEmail)) {
            showToast("E-mail inválido", "error");
            return false;
        }

        if (!validatePhone(customerPhone)) {
            showToast("Telefone inválido", "error");
            return false;
        }

        const customerData = {
            name: customerName,
            cpf: customerCpf,
            phone: customerPhone,
            email: customerEmail
        };
        sessionStorage.setItem('customerData', JSON.stringify(customerData));

        return true;
    }

    // ==================== EVENT LISTENERS ====================

    brandSelect.addEventListener("change", () => populateModels(brandSelect.value));
    modelSelect.addEventListener("change", () => populateYears(modelSelect.value));

    vehicleForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        if (validateStep1()) {
            showLoading(true);
            try {
                const recommendation = await getOilRecommendation(userVehicle.modelo_ano_id);
                if (recommendation) {
                    showRecommendations(recommendation);
                    goToStep(2);
                }
            } catch (error) {
                console.error("Erro ao obter recomendação após validação do veículo:", error);
                showToast("Erro ao carregar recomendações. Tente novamente.", "error");
            } finally {
                showLoading(false);
            }
        }
    });

scheduleDateInput.addEventListener('change', async function () {
    if (this.value && selectedWorkshop) {
        const selectedDate = new Date(this.value + 'T00:00:00');
        
        // ✅ Verificar horários especiais
        await verificarHorariosAoMudarData();
        
        // ✅ Gerar horários disponíveis
        await generateAvailableTimeSlots(selectedWorkshop, selectedDate);
    }
});

    if (locationInput) {
        locationInput.addEventListener("input", function (e) {
            const query = e.target.value.trim();
            const resultsContainer = document.getElementById("autocomplete-results");

            if (addressSearchTimeout) {
                clearTimeout(addressSearchTimeout);
            }

            if (query.length < 3) {
                resultsContainer.classList.remove("active");
                return;
            }

            addressSearchTimeout = setTimeout(async () => {
                const addresses = await searchAddress(query);
                showAddressSuggestions(addresses);
            }, 300);
        });

        document.addEventListener("click", function (e) {
            if (e.target !== locationInput) {
                const resultsContainer = document.getElementById("autocomplete-results");
                if (resultsContainer) resultsContainer.classList.remove("active");
            }
        });
    }

    if (locationButton) {
        locationButton.addEventListener("click", () => searchByAddress());
    }

    if (userLocationBtn) {
        userLocationBtn.addEventListener("click", getUserLocation);
    }

    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener("click", function () {
            mobileNav.classList.toggle("active");
            document.body.style.overflow = mobileNav.classList.contains("active") ? "hidden" : "auto";
        });

        const navLinks = mobileNav.querySelectorAll("a");
        navLinks.forEach(link => {
            link.addEventListener("click", function () {
                if (window.innerWidth <= 992) {
                    mobileNav.classList.remove("active");
                    document.body.style.overflow = "auto";
                }
            });
        });
    }

    // Máscaras de input
    document.getElementById("customer-cpf").addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3}).*/, "$1.$2.$3");
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{3}).*/, "$1.$2");
        }
        e.target.value = value;
    });

    document.getElementById("customer-phone").addEventListener("input", function (e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 10) {
            value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
        } else if (value.length > 5) {
            value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
        } else {
            value = value.replace(/^(\d*)/, "($1");
        }
        e.target.value = value;
    });

    // Modal de login
    if (loginBtn && modal) {
        loginBtn.addEventListener("click", function (e) {
            e.preventDefault();
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        });

        closeModal.addEventListener("click", function () {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        });

        window.addEventListener("click", function (e) {
            if (e.target === modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });

        const modalContent = document.querySelector(".modal-content");
        if (modalContent) {
            if (window.innerWidth <= 768) {
                modalContent.style.width = "90%";
                modalContent.style.padding = "20px";
            } else {
                modalContent.style.width = "400px";
                modalContent.style.padding = "30px";
            }
        }
    }

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.querySelector("i").classList.toggle("fa-eye");
            this.querySelector("i").classList.toggle("fa-eye-slash");
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const email = this.querySelector("#login-email").value.trim();
            const password = this.querySelector("#login-password").value.trim();

            if (!email || !password) {
                showToast("Preencha todos os campos", "error");
                return;
            }

            if (!validateEmail(email)) {
                showToast("E-mail inválido", "error");
                return;
            }

            showToast("Login realizado com sucesso!", "success");
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        });
        
    } 

    // ==================== INICIALIZAÇÃO ====================

    function init() {
        // if (!checkUserLoggedIn()) {
        //     return; 
        // }
        initMap();
        populateBrands();
        setMinScheduleDate();
        handleResponsiveLayout();
        loadLocationHistory();
        initSelectionSummary();
        window.addEventListener("resize", handleResponsiveLayout);
    }

    init();
    
});

