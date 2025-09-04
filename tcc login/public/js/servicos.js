document.addEventListener("DOMContentLoaded", function() {
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
    const scheduleDate = document.getElementById("schedule-date");
    
    // Elementos do modal de login
    const loginBtn = document.getElementById("login-btn");
    const modal = document.getElementById("login-modal");
    const closeModal = document.querySelector(".close-modal");
    const loginForm = document.querySelector(".login-form");
    const togglePassword = document.querySelector(".toggle-password");
    const passwordInput = document.getElementById("login-password");

    // ==================== VARIÁVEIS GLOBAIS ====================
    let userLocation = null;
    let markers = [];
    let currentStep = 1;
    let selectedWorkshop = null;
    let userVehicle = null;
    let map = null;

    // ==================== INICIALIZAÇÃO DO MAPA ====================
    function initMap() {
        map = L.map("map").setView([-23.5505, -46.6333], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }

    // ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

    // Carrega as marcas de veículos
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

    // Carrega os modelos baseado na marca selecionada
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

    // Carrega os anos baseado no modelo selecionado
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

    // Obtém recomendação de óleo e filtro
    async function getOilRecommendation(modeloAnoId) {
        showLoading(true);
        try {
            const response = await fetch(`/api/recomendacoes?modelo_ano_id=${modeloAnoId}`);
            if (!response.ok) throw new Error("Falha ao obter recomendações");
            return await response.json();
        } catch (error) {
            console.error("Erro ao obter recomendação:", error);
            showToast("Erro ao obter recomendação para este veículo.", "error");
            return null;
        } finally {
            showLoading(false);
        }
    }

    // Exibe as recomendações na tela
    function showRecommendations(recommendation) {
        const oilContainer = document.getElementById("recommended-oil");
        const filterContainer = document.getElementById("recommended-filter");

        // Limpa containers
        oilContainer.innerHTML = "<h3>Óleo Recomendado</h3>";
        filterContainer.innerHTML = "<h3>Filtro Recomendado</h3>";

        if (!recommendation) {
            oilContainer.innerHTML += "<p>Não foi possível obter recomendação</p>";
            filterContainer.innerHTML += "<p>Não foi possível obter recomendação</p>";
            return;
        }

        // Exibe recomendação de óleo
        if (recommendation.oleo) {
            const oil = recommendation.oleo;
            oilContainer.innerHTML += `
                <div class="product-image">
                    <img src="../img/oil-default.png" alt="${oil.nome}">
                </div>
                <div class="product-details">
                    <h4>${oil.nome}</h4>
                    <p><strong>Tipo:</strong> ${oil.tipo || 'N/A'}</p>
                    <p><strong>Viscosidade:</strong> ${oil.viscosidade || 'N/A'}</p>
                    <p><strong>Especificação:</strong> ${oil.especificacao || 'N/A'}</p>
                    <p><strong>Marca:</strong> ${oil.marca || 'N/A'}</p>
                    ${oil.preco ? `<p class="price"><strong>Preço:</strong> R$ ${oil.preco.toFixed(2)}</p>` : ''}
                </div>
            `;
        } else {
            oilContainer.innerHTML += "<p>Nenhuma recomendação disponível</p>";
        }

        // Exibe recomendação de filtro
        if (recommendation.filtro) {
            const filter = recommendation.filtro;
            filterContainer.innerHTML += `
                <div class="product-image">
                    <img src="../img/oil-filter.png" alt="Filtro de óleo">
                </div>
                <div class="product-details">
                    <h4>${filter.nome}</h4>
                    <p><strong>Tipo:</strong> ${filter.tipo || 'N/A'}</p>
                    <p><strong>Compatibilidade:</strong> ${filter.compatibilidade_modelo || 'N/A'}</p>
                    <p><strong>Marca:</strong> ${filter.marca || 'N/A'}</p>
                    ${filter.preco ? `<p class="price"><strong>Preço:</strong> R$ ${filter.preco.toFixed(2)}</p>` : ''}
                </div>
            `;
        } else {
            filterContainer.innerHTML += "<p>Nenhuma recomendação disponível</p>";
        }
    }

    // ==================== FUNÇÕES DE LOCALIZAÇÃO E OFICINAS ====================

    // Obtém localização do usuário via GPS
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

            // Adiciona marcador no mapa
            addUserMarker(userLocation.lat, userLocation.lng, "Sua localização");
            
            // Centraliza o mapa
            map.setView([userLocation.lat, userLocation.lng], 14);
            
            // Busca oficinas próximas
            await searchNearbyWorkshops(userLocation.lat, userLocation.lng);
            
            showToast("Localização obtida com sucesso!");
        } catch (error) {
            console.error("Erro ao obter localização:", error);
            showToast("Não foi possível obter sua localização", "error");
        } finally {
            showLoading(false);
        }
    }

    // Busca por endereço com autocomplete
    async function searchAddress(query) {
        if (!query || query.length < 3) return [];
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`);
            if (!response.ok) throw new Error("Erro ao buscar endereços");
            return await response.json();
        } catch (error) {
            console.error("Erro na busca de endereços:", error);
            return [];
        }
    }

    // Exibe sugestões de endereço
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
                searchByAddress();
            });
            
            resultsContainer.appendChild(item);
        });
        
        resultsContainer.classList.add("active");
    }

    // Busca por endereço usando Nominatim
    async function searchByAddress() {
        const address = locationInput.value.trim();
        if (!address) {
            showToast("Digite um endereço válido", "warning");
            return;
        }

        showLoading(true);
        try {
            // Geocodificação do endereço usando Nominatim
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=br&limit=1`);
            if (!response.ok) throw new Error("Erro ao buscar endereço");
            
            const data = await response.json();

            if (!data || data.length === 0) {
                throw new Error("Endereço não encontrado");
            }

            const location = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
            userLocation = location;

            // Adiciona marcador no mapa
            addUserMarker(location.lat, location.lng, data[0].display_name);
            
            // Centraliza o mapa
            map.setView([location.lat, location.lng], 14);
            
            // Busca oficinas próximas
            await searchNearbyWorkshops(location.lat, location.lng);
            
            showToast(`Oficinas próximas a: ${data[0].display_name}`);
        } catch (error) {
            console.error("Erro na busca por endereço:", error);
            showToast(error.message, "error");
        } finally {
            showLoading(false);
        }
    }

    // Adiciona marcador da localização do usuário
    function addUserMarker(lat, lng, popupText) {
        // Remove marcadores antigos
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

    // Busca oficinas próximas
    async function searchNearbyWorkshops(lat, lng) {
        showLoading(true);
        try {
            const response = await fetch(`/api/oficinas/oficinas?lat=${lat}&lng=${lng}`);
            if (!response.ok) throw new Error("Erro ao buscar oficinas");
            
            const data = await response.json();
            
            if (!data.success || !data.data || data.data.length === 0) {
                throw new Error("Nenhuma oficina encontrada próxima");
            }

            displayWorkshops(data.data);
        } catch (error) {
            console.error("Erro ao buscar oficinas:", error);
            displayWorkshops([]);
            showToast(error.message, "warning");
        } finally {
            showLoading(false);
        }
    }

    // Exibe oficinas no mapa e na lista
    function displayWorkshops(workshops) {
        const mapContainer = document.querySelector(".map-container");
        
        // Cria ou atualiza o container de lista de oficinas
        let listContainer = document.querySelector(".workshop-list-container");
        if (!listContainer) {
            listContainer = document.createElement("div");
            listContainer.className = "workshop-list-container";
            mapContainer.parentNode.insertBefore(listContainer, mapContainer.nextSibling);
        }
        
        listContainer.innerHTML = "";

        // Limpa marcadores antigos (exceto o do usuário)
        markers.filter(m => m.options.icon?.options?.className !== "user-marker")
               .forEach(m => map.removeLayer(m));
        
        markers = markers.filter(m => m.options.icon?.options?.className === "user-marker");

        if (!workshops || workshops.length === 0) {
            listContainer.innerHTML = "<p class='no-workshops'>Nenhuma oficina encontrada</p>";
            return;
        }

        // Ícone das oficinas
        const workshopIcon = L.divIcon({
            className: "workshop-marker",
            html: '<div style="background: #e63946; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -30]
        });

        // Adiciona cada oficina no mapa e na lista
        workshops.forEach(workshop => {
            // Marcador no mapa
            const marker = L.marker([workshop.lat, workshop.lng], { icon: workshopIcon })
                .addTo(map)
                .bindPopup(`
                    <div class="workshop-popup">
                        <h4>${workshop.nome}</h4>
                        <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                        <p><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                        <button onclick="selectWorkshop(${workshop.id})" class="select-workshop-btn">
                            Selecionar
                        </button>
                    </div>
                `);

            markers.push(marker);

            // Item na lista
            const workshopItem = document.createElement("div");
            workshopItem.className = "workshop-item";
            workshopItem.dataset.id = workshop.id;
            workshopItem.innerHTML = `
                <div class="workshop-info">
                    <h4>${workshop.nome}</h4>
                    <p class="address"><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                    <p class="phone"><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                    <p class="hours"><i class="fas fa-clock"></i> ${workshop.horario_abertura} - ${workshop.horario_fechamento}</p>
                </div>
                <button class="btn select-btn" onclick="selectWorkshop(${workshop.id})">Selecionar</button>
            `;
            listContainer.appendChild(workshopItem);
        });

        // Ajusta o zoom para mostrar todos os marcadores
        const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
        map.fitBounds(bounds.pad(0.2));
    }

    // Seleciona uma oficina
    window.selectWorkshop = async function(workshopId) {
        showLoading(true);
        try {
            const response = await fetch(`/api/oficinas/${workshopId}`);
            if (!response.ok) throw new Error("Erro ao carregar oficina");
            
            const workshop = await response.json();
            selectedWorkshop = workshop;

            // Destaca a oficina selecionada na lista
            document.querySelectorAll(".workshop-item").forEach(item => {
                item.classList.remove("selected");
                if (item.dataset.id == workshopId) {
                    item.classList.add("selected");
                }
            });

            showToast(`Oficina ${workshop.nome} selecionada!`);
            return true;
        } catch (error) {
            console.error("Erro ao selecionar oficina:", error);
            showToast(error.message, "error");
            return false;
        } finally {
            showLoading(false);
        }
    };

    // Mostra detalhes da oficina selecionada
    function showSelectedWorkshop(workshop) {
        selectedWorkshopDiv.innerHTML = `
            <div class="selected-workshop-card">
                <h3>${workshop.nome}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                <p><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                <p><i class="fas fa-clock"></i> ${workshop.horario_abertura} - ${workshop.horario_fechamento}</p>
                <p>${workshop.dias_funcionamento}</p>
            </div>
        `;

        updateAvailableTimeSlots(workshop);
    }

    // Atualiza os horários disponíveis para agendamento
    function updateAvailableTimeSlots(workshop) {
        const timeSelect = document.getElementById("schedule-time");
        timeSelect.innerHTML = '<option value="" disabled selected>Selecione um horário</option>';

        // Gera horários disponíveis (simulação)
        const slots = generateTimeSlots(
            workshop.horario_abertura || "08:00", 
            workshop.horario_fechamento || "18:00", 
            30
        );

        slots.forEach(time => {
            const option = document.createElement("option");
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }

    // Gera intervalos de tempo entre abertura e fechamento
    function generateTimeSlots(start, end, interval) {
        const slots = [];
        const [startHour, startMinute] = start.split(":").map(Number);
        const [endHour, endMinute] = end.split(":").map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (currentHour < endHour || (currentHour === endHour && currentMinute <= endMinute)) {
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

    // ==================== FUNÇÕES DE AGENDAMENTO ====================

    // Processa o agendamento
    async function processScheduling() {
        const scheduleDateValue = document.getElementById("schedule-date").value;
        const scheduleTime = document.getElementById("schedule-time").value;
        const customerName = document.getElementById("customer-name").value.trim();
        const customerCpf = document.getElementById("customer-cpf").value.trim();
        const customerPhone = document.getElementById("customer-phone").value.trim();
        const customerEmail = document.getElementById("customer-email").value.trim();

        // Validação dos campos
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

        // Simula o sucesso do agendamento
        const confirmationDetails = document.querySelector(".confirmation-details");
        confirmationDetails.innerHTML = `
            <p><strong>Protocolo:</strong> #OIL${new Date().getTime().toString().slice(-6)}</p>
            <p><strong>Serviço:</strong> Troca de Óleo</p>
            <p><strong>Data:</strong> ${scheduleDateValue} às ${scheduleTime}</p>
            <p><strong>Oficina:</strong> ${selectedWorkshop.nome}</p>
            <p><strong>Endereço:</strong> ${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}</p>
            <p><strong>Cliente:</strong> ${customerName}</p>
            <p><strong>CPF:</strong> ${customerCpf}</p>
            <p><strong>Contato:</strong> ${customerPhone}</p>
        `;

        return true;
    }

    // ==================== FUNÇÕES DE NAVEGAÇÃO ====================

    // Navega entre os passos do formulário
    window.goToStep = async function(step) {
        // Validações antes de avançar
        if (step > currentStep) {
            if (step === 2 && !validateStep1()) return;
            if (step === 3 && !await validateStep2()) return;
            if (step === 4 && !await validateStep3()) return;
        }

        // Oculta todos os passos
        document.querySelectorAll(".service-step").forEach(s => s.classList.remove("active"));
        
        // Mostra o passo atual
        document.getElementById(`step${step}`).classList.add("active");
        
        // Atualiza a barra de progresso
        progressSteps.forEach((p, index) => {
            p.classList.toggle("active", index < step);
        });
        
        currentStep = step;

        // Ações específicas para cada passo
        if (step === 3 && selectedWorkshop) {
            showSelectedWorkshop(selectedWorkshop);
        }
    };

    // Validação do passo 1 (Dados do veículo)
    function validateStep1() {
        const isValid = brandSelect.value && modelSelect.value && yearSelect.value && mileageInput.value.trim();
        
        if (!isValid) {
            showToast("Preencha todos os campos do veículo", "error");
            return false;
        }

        if (isNaN(mileageInput.value) || mileageInput.value < 0) {
            showToast("Quilometragem inválida", "error");
            return false;
        }

        return true;
    }

    // Validação do passo 2 (Seleção de oficina)
    async function validateStep2() {
        if (!selectedWorkshop) {
            showToast("Selecione uma oficina para continuar", "error");
            return false;
        }
        
        // Carrega os detalhes completos da oficina selecionada
        try {
            const response = await fetch(`/api/oficinas/${selectedWorkshop.id}`);
            if (!response.ok) throw new Error("Erro ao carregar oficina");
            
            selectedWorkshop = await response.json();
            return true;
        } catch (error) {
            console.error("Erro ao validar oficina:", error);
            showToast("Erro ao carregar dados da oficina", "error");
            return false;
        }
    }

    // Validação do passo 3 (Dados do agendamento)
    async function validateStep3() {
        const scheduleDateValue = document.getElementById("schedule-date").value;
        const scheduleTime = document.getElementById("schedule-time").value;
        const customerName = document.getElementById("customer-name").value.trim();
        const customerCpf = document.getElementById("customer-cpf").value.trim();
        const customerPhone = document.getElementById("customer-phone").value.trim();
        const customerEmail = document.getElementById("customer-email").value.trim();

        if (!scheduleDateValue || !scheduleTime || !customerName || !customerCpf || !customerPhone || !customerEmail) {
            showToast("Preencha todos os campos obrigatórios", "error");
            return false;
        }

        // Simula o sucesso do agendamento
        const confirmationDetails = document.querySelector(".confirmation-details");
        confirmationDetails.innerHTML = `
            <p><strong>Protocolo:</strong> #OIL${new Date().getTime().toString().slice(-6)}</p>
            <p><strong>Serviço:</strong> Troca de Óleo</p>
            <p><strong>Data:</strong> ${scheduleDateValue} às ${scheduleTime}</p>
            <p><strong>Oficina:</strong> ${selectedWorkshop.nome}</p>
            <p><strong>Endereço:</strong> ${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}</p>
            <p><strong>Cliente:</strong> ${customerName}</p>
            <p><strong>CPF:</strong> ${customerCpf}</p>
            <p><strong>Contato:</strong> ${customerPhone}</p>
        `;

        return true;
    }

    // ==================== FUNÇÕES AUXILIARES ====================

    // Validação de CPF (simplificada)
    function validateCPF(cpf) {
        cpf = cpf.replace(/\D/g, '');
        return cpf.length === 11;
    }

    // Validação de e-mail
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Formata CPF para exibição
    function formatCPF(cpf) {
        if (!cpf) return '';
        cpf = cpf.replace(/\D/g, '');
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Formata telefone para exibição
    function formatPhone(phone) {
        if (!phone) return '';
        phone = phone.replace(/\D/g, '');
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    // Mostra/oculta o loading
    function showLoading(show) {
        document.getElementById("loading-overlay").style.display = show ? "flex" : "none";
    }

    // Exibe mensagens toast
    function showToast(message, type = "success") {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // Configura data mínima para agendamento
    function setMinScheduleDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        scheduleDate.min = tomorrow.toISOString().split("T")[0];
        scheduleDate.max = new Date(today.setMonth(today.getMonth() + 3)).toISOString().split("T")[0];
    }

    // ==================== EVENT LISTENERS ====================

    // Seleção de marca -> carrega modelos
    brandSelect.addEventListener("change", () => populateModels(brandSelect.value));

    // Seleção de modelo -> carrega anos
    modelSelect.addEventListener("change", () => populateYears(modelSelect.value));

    // Formulário do veículo
    vehicleForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        if (!validateStep1()) return;

        showLoading(true);
        try {
            // Armazena os dados do veículo localmente (já que o endpoint não está funcionando)
            userVehicle = {
                modelo_ano_id: yearSelect.value,
                quilometragem: mileageInput.value.trim(),
                marca: brandSelect.options[brandSelect.selectedIndex].text,
                modelo: modelSelect.options[modelSelect.selectedIndex].text,
                ano: yearSelect.options[yearSelect.selectedIndex].text
            };

            // Obtém recomendações
            const recommendation = await getOilRecommendation(yearSelect.value);
            showRecommendations(recommendation);
            
            // Avança para o próximo passo
            goToStep(2);
        } catch (error) {
            console.error("Erro:", error);
            showToast("Erro ao processar veículo", "error");
        } finally {
            showLoading(false);
        }
    });

    // Busca por endereço
    locationButton.addEventListener("click", searchByAddress);

    // Usar localização atual
    userLocationBtn.addEventListener("click", getUserLocation);

    // Máscara para CPF
    document.getElementById("customer-cpf").addEventListener("input", function(e) {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 9) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1.$2.$3");
        } else if (value.length > 3) {
            value = value.replace(/^(\d{3})(\d{3})$/, "$1.$2");
        }
        e.target.value = value;
    });

    // Máscara para telefone
    document.getElementById("customer-phone").addEventListener("input", function(e) {
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
    loginBtn.addEventListener("click", () => modal.style.display = "block");
    closeModal.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // Mostrar/esconder senha
    togglePassword.addEventListener("click", function() {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        this.querySelector("i").classList.toggle("fa-eye");
        this.querySelector("i").classList.toggle("fa-eye-slash");
    });

    // Formulário de login (simulação)
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast("Login realizado com sucesso!", "success");
        modal.style.display = "none";
    });

    // Autocomplete para busca de endereço
    locationInput.addEventListener("input", async function(e) {
        const query = e.target.value.trim();
        if (query.length >= 3) {
            const addresses = await searchAddress(query);
            showAddressSuggestions(addresses);
        } else {
            document.getElementById("autocomplete-results").classList.remove("active");
        }
    });

    // Feche o autocomplete ao clicar fora
    document.addEventListener("click", function(e) {
        if (e.target !== locationInput) {
            document.getElementById("autocomplete-results").classList.remove("active");
        }
    });

    // ==================== INICIALIZAÇÃO ====================

    function init() {
        initMap();
        populateBrands();
        setMinScheduleDate();
        goToStep(1);
    }

    init();
});