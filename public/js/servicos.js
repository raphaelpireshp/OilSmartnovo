
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

    // ==================== FUNÇÕES DE HISTÓRICO DE LOCALIZAÇÃO ====================
function checkUserLoggedIn() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    
    if (!token || !userData) {
        window.location.href = 'login.html?redirect=servicos.html';
        return false;
    }
    return true;
}
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
        // Evita duplicatas
        const exists = locationHistory.some(item => 
            item.display_name === locationData.display_name
        );
        
        if (!exists) {
            locationHistory.unshift(locationData);
            // Mantém apenas as 5 localizações mais recentes
            locationHistory = locationHistory.slice(0, 5);
            
            // Salva no localStorage
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
        // Menu hamburguer para mobile
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

        // Ajuste do mapa para mobile
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

        // Ajuste dos cards de recomendação
        const recommendationContainer = document.querySelector(".recommendation-container");
        if (recommendationContainer) {
            if (window.innerWidth <= 768) {
                recommendationContainer.style.flexDirection = "column";
            } else {
                recommendationContainer.style.flexDirection = "row";
            }
        }

        // Ajuste dos cards de oficina
        const workshopItems = document.querySelectorAll(".workshop-item");
        workshopItems.forEach(item => {
            if (window.innerWidth <= 768) {
                item.style.flexDirection = "column";
                item.querySelector(".btn").style.width = "100%";
                item.querySelector(".btn").style.marginTop = "10px";
            } else {
                item.style.flexDirection = "row";
                item.querySelector(".btn").style.width = "auto";
                item.querySelector(".btn").style.marginTop = "0";
            }
        });

        // Ajuste do formulário de agendamento
        const scheduleForm = document.getElementById("schedule-form");
        if (scheduleForm) {
            if (window.innerWidth <= 768) {
                scheduleForm.style.padding = "15px";
            } else {
                scheduleForm.style.padding = "20px";
            }
        }
    }

    // Menu hamburguer para mobile
    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener("click", function() {
            mobileNav.style.display = mobileNav.style.display === "block" ? "none" : "block";
            document.body.style.overflow = mobileNav.style.display === "block" ? "hidden" : "auto";
        });

        // Fecha o menu ao clicar em um link
        const navLinks = mobileNav.querySelectorAll("a");
        navLinks.forEach(link => {
            link.addEventListener("click", function() {
                if (window.innerWidth <= 992) {
                    mobileNav.style.display = "none";
                    document.body.style.overflow = "auto";
                }
            });
        });
    }

    // ==================== INICIALIZAÇÃO DO MAPA (RESPONSIVA) ====================
    function initMap() {
        const mapContainer = document.getElementById("map");
        const mapHeight = window.innerWidth <= 768 ? "300px" : "400px";
        mapContainer.style.height = mapHeight;
        
        map = L.map("map").setView([-23.5505, -46.6333], 13);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
// Função para buscar as oficinas do seu backend e adicionar marcadores no mapa
async function fetchAndDisplayWorkshops() {
    try {
        const response = await fetch('/api/oficina');
        const data = await response.json();

        if (data.success && data.data) {
            data.data.forEach(oficina => {
                const lat = oficina.lat;
                const lng = oficina.lng;

                // Certifica-se de que a latitude e longitude são válidas
                if (lat && lng) {
                    const marker = L.marker([lat, lng]).addTo(map);

                    // Adiciona um popup com o nome e endereço da oficina
                    marker.bindPopup(`
                        <b>${oficina.nome}</b><br>
                        ${oficina.endereco}, ${oficina.cidade} - ${oficina.estado}
                    `);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao buscar as oficinas:', error);
    }
}
        // Redimensiona o mapa quando a janela é redimensionada
        window.addEventListener("resize", function() {
            const newHeight = window.innerWidth <= 768 ? "300px" : "400px";
            mapContainer.style.height = newHeight;
            setTimeout(() => map.invalidateSize(), 100);
        });
    }

    // ==================== FUNÇÕES DE CARREGAMENTO DE DADOS ====================

    // Carrega as marcas de veículos (versão responsiva)
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
// Obtém recomendação de óleo e filtro
async function getOilRecommendation(modeloAnoId) {
    showLoading(true);
    try {
        const response = await fetch(`/api/recomendacoes?modelo_ano_id=${modeloAnoId}`);
        const result = await response.json();

        if (!result.success) {
            showToast(result.message, "error");
            return null;
        }
        
        // Armazena os dados da recomendação para uso posterior
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

    // LIMPEZA COMPLETA dos containers
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

    // Exibe recomendação de óleo
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
                    <input type="checkbox" id="select-oil" checked>
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

// Exibe recomendação de filtro (CÓDIGO CORRIGIDO)
// Exibe recomendação de filtro (VERSÃO FINAL CORRIGIDA)
if (recommendation.filtro) {
    const filter = recommendation.filtro;
    const precoFiltro = filter.preco || 0;
    const precoFormatado = precoFiltro > 0 ? `R$ ${parseFloat(precoFiltro).toFixed(2)}` : 'Preço não disponível';
    
    filterContainer.innerHTML = `
        <div class="product-card-content">
            <div class="product-image">
                <img src="../img/oil-filter.jpg" alt="${filter.nome}" loading="lazy">
            </div>
            <div class="product-details">
                <h4>${filter.nome}</h4>
                <div class="product-specs">
                    <p><strong>Tipo:</strong> ${filter.tipo || 'N/A'}</p>
                    <p><strong>Compatibilidade:</strong> ${filter.compatibilidade_modelo || 'N/A'}</p>
                    <p><strong>Marca:</strong> ${filter.marca || 'N/A'}</p>
                </div>
                <div class="product-price">
                    <strong>Preço estimado:</strong> 
                    <span class="price">${precoFormatado}</span>
                </div>
            </div>
        </div>
        <div class="product-selection">
            <label class="checkbox-container">
                <input type="checkbox" id="select-filter" checked>
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

    // Adiciona event listeners aos checkboxes
    const oilCheckbox = document.getElementById("select-oil");
    const filterCheckbox = document.getElementById("select-filter");
    
    if (oilCheckbox) {
        oilCheckbox.addEventListener("change", updateProductSelection);
    }
    
    if (filterCheckbox) {
        filterCheckbox.addEventListener("change", updateProductSelection);
    }
    
    // Inicializa a seleção
    updateProductSelection();
}

    // ==================== FUNÇÕES DE SELEÇÃO DE PRODUTOS ====================

    // Atualiza a seleção de produtos
// Atualiza a seleção de produtos
function updateProductSelection() {
    const oilCheckbox = document.getElementById("select-oil");
    const filterCheckbox = document.getElementById("select-filter");
    
    selectedProducts.oil = oilCheckbox ? oilCheckbox.checked : false;
    selectedProducts.filter = filterCheckbox ? filterCheckbox.checked : false;
    
    // Salva no sessionStorage
    sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    
    updateSelectionSummary();
}

    // Atualiza o resumo da seleção
    function updateSelectionSummary() {
        const summaryElement = document.getElementById("selected-items");
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
        } else {
            summaryElement.textContent = selections.join(" + ");
            summaryElement.style.color = "#2a9d8f";
        }
    }

    // Valida a seleção antes de avançar
    function validateSelection() {
        if (!selectedProducts.oil && !selectedProducts.filter) {
            showToast("Selecione pelo menos um produto para continuar", "error");
            return;
        }
        
        // Armazena a seleção para uso posterior
        sessionStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
        
        goToStep(3);
    }

// Recupera a seleção de produtos do sessionStorage
function getSelectedProducts() {
    const saved = sessionStorage.getItem('selectedProducts');
    return saved ? JSON.parse(saved) : { oil: true, filter: true };
}

    // ==================== FUNÇÕES DE LOCALIZAÇÃO E OFICINAS ====================

    // Obtém localização do usuário via GPS (versão responsiva)
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

    // Busca por endereço com autocomplete (OTIMIZADO)
    async function searchAddress(query) {
        if (!query || query.length < 3) return [];
        
        // Verifica se já temos resultados em cache
        if (cachedAddresses[query]) {
            return cachedAddresses[query];
        }
        
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5&addressdetails=1`);
            if (!response.ok) throw new Error("Erro ao buscar endereços");
            
            const data = await response.json();
            
            // Armazena no cache
            cachedAddresses[query] = data;
            
            return data;
        } catch (error) {
            console.error("Erro na busca de endereços:", error);
            return [];
        }
    }

    // Exibe sugestões de endereço (versão responsiva)
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

    // Busca por endereço usando Nominatim (OTIMIZADO)
    async function searchByAddress() {
        const address = locationInput.value.trim();
        if (!address) {
            showToast("Digite um endereço válido", "warning");
            return;
        }

        showLoading(true);
        try {
            // Verifica se já temos esse endereço em cache
            let locationData;
            
            if (cachedAddresses[address] && cachedAddresses[address].length > 0) {
                locationData = cachedAddresses[address][0];
            } else {
                // Busca o endereço usando Nominatim
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=br&limit=1&addressdetails=1`);
                if (!response.ok) throw new Error("Erro ao buscar endereço");
                
                const data = await response.json();
                if (!data || data.length === 0) {
                    throw new Error("Endereço não encontrado");
                }
                locationData = data[0];
            }

            const location = {
                lat: parseFloat(locationData.lat),
                lng: parseFloat(locationData.lon)
            };
            userLocation = location;

            // Adiciona marcador no mapa
            addUserMarker(location.lat, location.lng, locationData.display_name);
            
            // Centraliza o mapa
            map.setView([location.lat, location.lng], 14);
            
            // Busca oficinas próximas
            await searchNearbyWorkshops(location.lat, location.lng);
            
            showToast(`Oficinas próximas a: ${locationData.display_name}`);
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
// Busca oficinas próximas e calcula distâncias
async function searchNearbyWorkshops(lat, lng) {
    showLoading(true);
    try {
        console.log('Buscando oficinas do banco de dados...');
        
        const response = await fetch(`/api/oficina`);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Oficinas encontradas:', data);
        
        if (!data.success || !data.data || data.data.length === 0) {
            showToast("Nenhuma oficina encontrada", "info");
            displayWorkshops([]);
            return;
        }

        // Filtra apenas oficinas com coordenadas válidas
        const oficinasValidas = data.data.filter(workshop => {
            const latNum = parseFloat(workshop.lat);
            const lngNum = parseFloat(workshop.lng);
            return !isNaN(latNum) && !isNaN(lngNum);
        });

        if (oficinasValidas.length === 0) {
            showToast("Oficinas encontradas, mas sem coordenadas válidas", "warning");
            return;
        }

        // Calcula distância para cada oficina
        const oficinasComDistancia = oficinasValidas.map(workshop => {
            const workshopLat = parseFloat(workshop.lat);
            const workshopLng = parseFloat(workshop.lng);
            
            // Calcula distância usando fórmula de Haversine
            const distancia = calcularDistancia(lat, lng, workshopLat, workshopLng);
            
            return {
                ...workshop,
                distancia: distancia
            };
        });

        // Ordena por distância (mais próximo primeiro)
        oficinasComDistancia.sort((a, b) => a.distancia - b.distancia);

        console.log('Oficinas ordenadas por distância:', oficinasComDistancia);
        displayWorkshops(oficinasComDistancia);
        
    } catch (error) {
        console.error("Erro ao buscar oficinas:", error);
        showToast("Erro ao carregar oficinas. Tente novamente.", "error");
    } finally {
        showLoading(false);
    }
}

// Função para calcular distância usando fórmula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distancia = R * c; // Distância em km
    
    return distancia;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Exibe oficinas no mapa e na lista (versão responsiva)
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
        const lat = parseFloat(workshop.lat);
        const lng = parseFloat(workshop.lng);
        
        // Verifica se as coordenadas são válidas
        if (isNaN(lat) || isNaN(lng)) {
            console.warn('Coordenadas inválidas para oficina:', workshop);
            return;
        }

        // Formata a distância
        const distanciaFormatada = workshop.distancia < 1 
            ? `${(workshop.distancia * 1000).toFixed(0)} m` 
            : `${workshop.distancia.toFixed(1)} km`;

        // Marcador no mapa
        const marker = L.marker([lat, lng], { icon: workshopIcon })
            .addTo(map)
            .bindPopup(`
                <div class="workshop-popup">
                    <h4>${workshop.nome}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                    <p><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                    <p><i class="fas fa-route"></i> ${distanciaFormatada}</p>
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
                <p class="distance"><i class="fas fa-route"></i> ${distanciaFormatada}</p>
                <p class="address"><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
                <p class="phone"><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
                <p class="hours"><i class="fas fa-clock"></i> ${workshop.horario_abertura} - ${workshop.horario_fechamento}</p>
            </div>
            <button class="btn select-btn" onclick="selectWorkshop(${workshop.id})">Selecionar</button>
        `;
        listContainer.appendChild(workshopItem);
    });

    // Ajusta o zoom para mostrar todos os marcadores
    if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
        map.fitBounds(bounds.pad(0.2));
    }
}

    // ==================== FUNÇÕES DE OFICINAS ====================

// Seleciona uma oficina
window.selectWorkshop = async function(workshopId) {
    showLoading(true);
    try {
        // Busca os detalhes completos da oficina
        const response = await fetch(`/api/oficina/${workshopId}`);
        if (!response.ok) throw new Error("Erro ao carregar oficina");
        
        const workshopData = await response.json();
        selectedWorkshop = workshopData;

        // CONVERTE COORDENADAS PARA NÚMERO
        if (selectedWorkshop.lat) selectedWorkshop.lat = parseFloat(selectedWorkshop.lat);
        if (selectedWorkshop.lng) selectedWorkshop.lng = parseFloat(selectedWorkshop.lng);

        // Destaca a oficina selecionada
        document.querySelectorAll(".workshop-item").forEach(item => {
            item.classList.remove("selected");
            if (parseInt(item.dataset.id) === parseInt(workshopId)) {
                item.classList.add("selected");
                item.style.animation = "pulse 0.5s ease";
                setTimeout(() => {
                    item.style.animation = "";
                }, 500);
            }
        });

        // Centraliza o mapa na oficina selecionada
        if (selectedWorkshop.lat && selectedWorkshop.lng) {
            map.setView([selectedWorkshop.lat, selectedWorkshop.lng], 15);
        }

        showToast(`Oficina "${workshopData.nome}" selecionada!`);
        return true;
    } catch (error) {
        console.error("Erro ao selecionar oficina:", error);
        showToast("Erro ao selecionar a oficina", "error");
        return false;
    } finally {
        showLoading(false);
    }
};

// Mostra detalhes da oficina selecionada (versão responsiva)
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

// Processa o agendamento e salva no banco - VERSÃO ATUALIZADA COM OFICINA_ID
async function processScheduling() {
    console.log('Iniciando processScheduling...');
    
    // Verificar se o usuário está logado
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

    // Obter dados do formulário
    const scheduleDateValue = document.getElementById("schedule-date").value;
    const scheduleTime = document.getElementById("schedule-time").value;
    const customerName = document.getElementById("customer-name").value.trim();
    const customerCpf = document.getElementById("customer-cpf").value.trim();
    const customerPhone = document.getElementById("customer-phone").value.trim();
    const customerEmail = document.getElementById("customer-email").value.trim();

    // Validação básica dos campos obrigatórios
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

    // Verificar se há dados do veículo
    const userVehicle = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
    if (!userVehicle.modelo_ano_id) {
        showToast("Dados do veículo não encontrados. Por favor, volte ao passo 1.", "error");
        return false;
    }

    showLoading(true);
    
    try {
        // Obter produtos selecionados
        const selectedProducts = getSelectedProducts();
        const oilRecommendation = JSON.parse(sessionStorage.getItem('oilRecommendation') || '{}');
        
        // Calcular total do serviço
        let totalOil = 0;
        let totalFilter = 0;
        
        if (selectedProducts.oil && oilRecommendation.oleo && oilRecommendation.oleo.preco) {
            totalOil = parseFloat(oilRecommendation.oleo.preco) || 0;
        }
        
        if (selectedProducts.filter && oilRecommendation.filtro && oilRecommendation.filtro.preco) {
            totalFilter = parseFloat(oilRecommendation.filtro.preco) || 0;
        }
        
        const totalService = totalOil + totalFilter;
        
        // Preparar descrição dos serviços
        const servicosArray = [];
        if (selectedProducts.oil && oilRecommendation.oleo) {
            servicosArray.push(`Troca de Óleo: ${oilRecommendation.oleo.nome} - R$ ${totalOil.toFixed(2)}`);
        }
        if (selectedProducts.filter && oilRecommendation.filtro) {
            servicosArray.push(`Troca de Filtro: ${oilRecommendation.filtro.nome} - R$ ${totalFilter.toFixed(2)}`);
        }

        // Formatar data e hora para o formato do banco
        const dataHora = `${scheduleDateValue} ${scheduleTime}:00`;

        // Gerar protocolo único
        const protocolo = `OIL${Date.now().toString().slice(-8)}`;

// No processScheduling(), atualize o agendamentoData:
const agendamentoData = {
    protocolo: protocolo,
    data_hora: dataHora,
    oficina_nome: selectedWorkshop.nome,
    oficina_endereco: `${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}`,
    oficina_telefone: selectedWorkshop.telefone || 'Não informado',
    oficina_id: selectedWorkshop.id, // ← JÁ EXISTE, CONFIRMAR QUE ESTÁ SENDO ENVIADO
    veiculo: `${userVehicle.marca || ''} ${userVehicle.modelo || ''} ${userVehicle.ano || ''}`.trim(),
    servicos: servicosArray.join(' | '),
    total_servico: totalService,
    cliente_nome: customerName,
    cliente_cpf: customerCpf.replace(/\D/g, ''),
    cliente_telefone: customerPhone,
    cliente_email: customerEmail,
    usuario_id: usuario_id
};

console.log('Dados do agendamento para salvar:', agendamentoData);

        // Salvar no banco
        const result = await salvarAgendamentoNoBanco(agendamentoData);
        
        if (result.success) {
            // Armazenar dados para exibição na confirmação
            sessionStorage.setItem('codigoConfirmacao', result.codigo_confirmacao || protocolo);
            sessionStorage.setItem('agendamentoId', result.agendamento_id);
            
            // Salvar dados do cliente para exibição
            const customerData = {
                name: customerName,
                cpf: customerCpf,
                phone: customerPhone,
                email: customerEmail
            };
            sessionStorage.setItem('customerData', JSON.stringify(customerData));
            
            // Salvar dados da oficina
            sessionStorage.setItem('selectedWorkshop', JSON.stringify(selectedWorkshop));
            
            // Salvar dados do serviço
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

// Função para salvar agendamento no banco - VERSÃO CORRIGIDA
async function salvarAgendamentoNoBanco(agendamentoData) {
    console.log('🔄 Tentando salvar agendamento no banco...');
    console.log('Dados enviados:', JSON.stringify(agendamentoData, null, 2));
    
    try {
        const response = await fetch('/api/agendamento_simples', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(agendamentoData)
        });
        
        console.log('Status da resposta:', response.status);
        
        // Tentar ler a resposta mesmo em caso de erro
        const responseText = await response.text();
        console.log('Resposta do servidor:', responseText);
        
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
        
        console.log('✅ Agendamento salvo com sucesso!', result);
        return result;
        
    } catch (error) {
        console.error('❌ Erro ao salvar agendamento no banco:', error);
        throw error;
    }
}

// Função auxiliar para verificar se o usuário está logado
function checkUserLoggedIn() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
        showToast("Você precisa fazer login para agendar um serviço", "error");
        setTimeout(() => {
            window.location.href = 'login.html?redirect=servicos.html';
        }, 2000);
        return false;
    }
    return true;
}

// Função para mostrar detalhes da confirmação (atualizada)
function showConfirmationDetails() {
    const codigoConfirmacao = sessionStorage.getItem('codigoConfirmacao') || `OS${Date.now().toString().slice(-8)}`;
    const customerData = JSON.parse(sessionStorage.getItem('customerData') || '{}');
    const userVehicle = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
    const selectedWorkshop = JSON.parse(sessionStorage.getItem('selectedWorkshop') || '{}');
    const serviceData = JSON.parse(sessionStorage.getItem('serviceData') || '{}');
    
    // Formatar data para exibição
    let dataFormatada = '';
    if (serviceData.data) {
        const data = new Date(serviceData.data);
        dataFormatada = data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
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
            <p><strong>Nome:</strong> ${selectedWorkshop.nome || 'Não informado'}</p>
            <p><strong>Endereço:</strong> ${selectedWorkshop.endereco || 'Não informado'}, ${selectedWorkshop.cidade || ''}/${selectedWorkshop.estado || ''}</p>
            <p><strong>Telefone:</strong> ${selectedWorkshop.telefone || 'Não informado'}</p>
        </div>
    `;
    
    // Informações do veículo
    if (userVehicle.marca || userVehicle.modelo || userVehicle.ano) {
        html += `
            <div class="confirmation-section">
                <h4>🚗 Veículo</h4>
                <p><strong>Modelo:</strong> ${userVehicle.marca || ''} ${userVehicle.modelo || ''} ${userVehicle.ano || ''}</p>
                ${userVehicle.quilometragem ? `<p><strong>Quilometragem:</strong> ${userVehicle.quilometragem} km</p>` : ''}
            </div>
        `;
    }
    
    // Serviços selecionados
    if (serviceData.servicos && serviceData.servicos.length > 0) {
        html += `
            <div class="confirmation-section">
                <h4>🔧 Serviços</h4>
                ${Array.isArray(serviceData.servicos) ? 
                  serviceData.servicos.map(servico => `<p>• ${servico}</p>`).join('') : 
                  `<p>• ${serviceData.servicos}</p>`}
                ${serviceData.total ? `<p><strong>Total:</strong> R$ ${serviceData.total.toFixed(2)}</p>` : ''}
            </div>
        `;
    }
    
    // Informações do cliente
    html += `
        <div class="confirmation-section">
            <h4>👤 Cliente</h4>
            <p><strong>Nome:</strong> ${customerData.name || 'Não informado'}</p>
            <p><strong>CPF:</strong> ${customerData.cpf || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${customerData.phone || 'Não informado'}</p>
            <p><strong>E-mail:</strong> ${customerData.email || 'Não informado'}</p>
        </div>
    `;
    
    confirmationDetails.innerHTML = html;
}

// Função para validar o passo 3 (atualizada)
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

    // Verificar se a data é válida (não pode ser no passado)
    const selectedDate = new Date(scheduleDateValue + 'T' + scheduleTime);
    const now = new Date();
    if (selectedDate < now) {
        showToast("Selecione uma data e horário futuros", "error");
        return false;
    }

    return true;
}
// Mostra detalhes do agendamento confirmado
function showConfirmationDetails() {
    const codigoConfirmacao = sessionStorage.getItem('codigoConfirmacao') || `OS${Date.now().toString().slice(-8)}`;
    const customerData = JSON.parse(sessionStorage.getItem('customerData') || '{}');
    const userVehicle = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
    const selectedProducts = getSelectedProducts();
    const oilRecommendation = JSON.parse(sessionStorage.getItem('oilRecommendation') || '{}');
    
    const scheduleDateValue = document.getElementById("schedule-date").value;
    const scheduleTime = document.getElementById("schedule-time").value;
    
    const formattedDate = formatDateForDisplay(scheduleDateValue);
    
    // Cálculo dos totais
    let totalOil = 0;
    let totalFilter = 0;
    
    if (selectedProducts.oil && oilRecommendation.oleo && oilRecommendation.oleo.preco) {
        totalOil = parseFloat(oilRecommendation.oleo.preco) || 0;
    }
    
    if (selectedProducts.filter && oilRecommendation.filtro && oilRecommendation.filtro.preco) {
        totalFilter = parseFloat(oilRecommendation.filtro.preco) || 0;
    }
    
    const totalService = totalOil + totalFilter;
    
    const confirmationDetails = document.querySelector(".confirmation-details");
    
    let html = `
        <p><strong>Protocolo:</strong> ${codigoConfirmacao}</p>
        <p><strong>Data:</strong> ${formattedDate} às ${scheduleTime}</p>
        <p><strong>Oficina:</strong> ${selectedWorkshop.nome}</p>
        <p><strong>Endereço:</strong> ${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}</p>
        <p><strong>Telefone:</strong> ${selectedWorkshop.telefone || 'Não informado'}</p>
    `;
    
    // Adiciona informações do veículo
    if (userVehicle.marca && userVehicle.modelo && userVehicle.ano) {
        html += `<p><strong>Veículo:</strong> ${userVehicle.marca} ${userVehicle.modelo} ${userVehicle.ano}</p>`;
    }
    
    if (userVehicle.quilometragem) {
        html += `<p><strong>Quilometragem:</strong> ${userVehicle.quilometragem} km</p>`;
    }
    
    // Adiciona serviços selecionados
    html += `<p><strong>Serviços selecionados:</strong></p>`;
    
    if (selectedProducts.oil && oilRecommendation.oleo) {
        html += `<p>• Troca de óleo: ${oilRecommendation.oleo.nome} - R$ ${totalOil.toFixed(2)}</p>`;
    }
    
    if (selectedProducts.filter && oilRecommendation.filtro) {
        html += `<p>• Troca de filtro: ${oilRecommendation.filtro.nome} - R$ ${totalFilter.toFixed(2)}</p>`;
    }
    
    // Adiciona total
    html += `<p><strong>Total do serviço:</strong> R$ ${totalService.toFixed(2)}</p>`;
    
    // Adiciona informações do cliente
    html += `
        <p><strong>Cliente:</strong> ${customerData.name || 'Não informado'}</p>
        <p><strong>CPF:</strong> ${customerData.cpf || 'Não informado'}</p>
        <p><strong>Contato:</strong> ${customerData.phone || 'Não informado'}</p>
        <p><strong>E-mail:</strong> ${customerData.email || 'Não informado'}</p>
    `;
    
    confirmationDetails.innerHTML = html;
}
// ==================== FUNÇÕES DE NAVEGAÇÃO ====================

// Navega entre os passos do formulário - VERSÃO ATUALIZADA
window.goToStep = async function(step) {
    if (step > currentStep) {
        // Validação antes de avançar
        if (step === 2 && !validateStep1()) return;
        if (step === 3 && !await validateStep2()) return;
        if (step === 4) {
            // No passo 4, processar e salvar o agendamento
            const success = await processScheduling();
            if (!success) return;
            showConfirmationDetails();
        }
    }

    // Atualiza a interface
    document.querySelectorAll(".service-step").forEach(s => s.classList.remove("active"));
    document.getElementById(`step${step}`).classList.add("active");
    
    progressSteps.forEach((p, index) => {
        p.classList.toggle("active", index < step);
    });
    
    currentStep = step;

    // Rolagem suave para o passo atual
    document.getElementById(`step${step}`).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
};

// Validação do passo 1 (Dados do veículo)
function validateStep1() {
    const isValid = brandSelect.value && modelSelect.value && yearSelect.value;
    
    if (!isValid) {
        showToast("Selecione marca, modelo e ano do veículo", "error");
        return false;
    }

    // Valida quilometragem apenas se preenchida
    if (mileageInput.value.trim() !== "") {
        if (isNaN(mileageInput.value) || mileageInput.value < 0) {
            showToast("Quilometragem inválida", "error");
            return false;
        }
    }

    return true;
}


// Validação do passo 2 (Seleção de oficina) - CORRIGIDA
// Validação do passo 2 (Seleção de produtos)
async function validateStep2() {
    const selectedProducts = getSelectedProducts();
    
    // Verifica se pelo menos um produto foi selecionado
    if (!selectedProducts.oil && !selectedProducts.filter) {
        showToast("Selecione pelo menos um produto (óleo ou filtro) para continuar", "error");
        
        // Adiciona animação para chamar atenção nos cards
        const oilCard = document.getElementById("recommended-oil");
        const filterCard = document.getElementById("recommended-filter");
        
        if (oilCard) {
            oilCard.style.animation = "shake 0.5s ease";
            setTimeout(() => { oilCard.style.animation = ""; }, 500);
        }
        
        if (filterCard) {
            filterCard.style.animation = "shake 0.5s ease";
            setTimeout(() => { filterCard.style.animation = ""; }, 500);
        }
        
        return false;
    }
    
    // Verifica se a oficina foi selecionada
    if (!selectedWorkshop) {
        showToast("Selecione uma oficina para continuar", "error");
        
        const workshopList = document.querySelector(".workshop-list-container");
        if (workshopList) {
            workshopList.style.animation = "shake 0.5s ease";
            setTimeout(() => {
                workshopList.style.animation = "";
            }, 500);
        }
        
        return false;
    }
    
    // Verifica se a oficina selecionada ainda está válida
    try {
        const response = await fetch(`/api/oficina/${selectedWorkshop.id}`);
        if (!response.ok) throw new Error("Oficina não disponível");
        
        // Atualiza os dados da oficina
        selectedWorkshop = await response.json();
        return true;
    } catch (error) {
        console.error("Erro ao validar oficina:", error);
        showToast("A oficina selecionada não está mais disponível. Por favor, selecione outra.", "error");
        selectedWorkshop = null;
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

    if (!validateCPF(customerCpf)) {
        showToast("CPF inválido", "error");
        return false;
    }

    if (!validateEmail(customerEmail)) {
        showToast("E-mail inválido", "error");
        return false;
    }

    // SALVAR DADOS DO CLIENTE ANTES DE AVANÇAR
    const customerData = {
        name: customerName,
        cpf: customerCpf,
        phone: customerPhone,
        email: customerEmail
    };
    
    sessionStorage.setItem('customerData', JSON.stringify(customerData));
    
    // Mostrar os detalhes da confirmação
    showConfirmationDetails();
    
    return true;
}









// Função para debug detalhado antes do salvamento
function debugAgendamentoCompleto() {
    const userVehicle = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
    const selectedProducts = getSelectedProducts();
    const oilRecommendation = JSON.parse(sessionStorage.getItem('oilRecommendation') || '{}');
    const customerData = JSON.parse(sessionStorage.getItem('customerData') || '{}');
    
    console.log('=== DEBUG COMPLETO DO AGENDAMENTO ===');
    console.log('1. VEÍCULO:', userVehicle);
    console.log('2. PRODUTOS SELECIONADOS:', selectedProducts);
    console.log('3. RECOMENDAÇÃO:', oilRecommendation);
    console.log('4. OFICINA SELECIONADA:', selectedWorkshop);
    console.log('5. DADOS DO CLIENTE:', customerData);
    console.log('6. DADOS DO FORMULÁRIO:');
    console.log('   - Data:', document.getElementById("schedule-date").value);
    console.log('   - Hora:', document.getElementById("schedule-time").value);
    console.log('   - Nome:', document.getElementById("customer-name").value);
    console.log('   - CPF:', document.getElementById("customer-cpf").value);
    console.log('   - Telefone:', document.getElementById("customer-phone").value);
    console.log('   - Email:', document.getElementById("customer-email").value);
    console.log('=====================================');
    
    // Retorna os dados formatados para envio
    return {
        protocolo: `OIL${Date.now().toString().slice(-8)}`,
        data_hora: `${document.getElementById("schedule-date").value} ${document.getElementById("schedule-time").value}:00`,
        oficina_nome: selectedWorkshop?.nome || 'Oficina não selecionada',
        oficina_endereco: selectedWorkshop ? `${selectedWorkshop.endereco}, ${selectedWorkshop.cidade}/${selectedWorkshop.estado}` : 'Endereço não informado',
        oficina_telefone: selectedWorkshop?.telefone || 'Telefone não informado',
        veiculo: userVehicle.marca && userVehicle.modelo && userVehicle.ano ? 
            `${userVehicle.marca} ${userVehicle.modelo} ${userVehicle.ano}` : 'Veículo não informado',
        servicos: getServicosFormatados(selectedProducts, oilRecommendation),
        total_servico: calcularTotalServico(selectedProducts, oilRecommendation),
        cliente_nome: customerData.name || document.getElementById("customer-name").value,
        cliente_cpf: customerData.cpf || document.getElementById("customer-cpf").value,
        cliente_telefone: customerData.phone || document.getElementById("customer-phone").value,
        cliente_email: customerData.email || document.getElementById("customer-email").value
    };
}

// Funções auxiliares para formatação
function getServicosFormatados(selectedProducts, oilRecommendation) {
    const servicos = [];
    
    if (selectedProducts.oil && oilRecommendation.oleo) {
        servicos.push(`Óleo: ${oilRecommendation.oleo.nome}`);
    }
    
    if (selectedProducts.filter && oilRecommendation.filtro) {
        servicos.push(`Filtro: ${oilRecommendation.filtro.nome}`);
    }
    
    return servicos.length > 0 ? servicos.join(' | ') : 'Serviços não especificados';
}

function calcularTotalServico(selectedProducts, oilRecommendation) {
    let total = 0;
    
    if (selectedProducts.oil && oilRecommendation.oleo && oilRecommendation.oleo.preco) {
        total += parseFloat(oilRecommendation.oleo.preco) || 0;
    }
    
    if (selectedProducts.filter && oilRecommendation.filtro && oilRecommendation.filtro.preco) {
        total += parseFloat(oilRecommendation.filtro.preco) || 0;
    }
    
    return total;
}

// Função para debug - verificar o que está no sessionStorage
function checkSessionStorage() {
    console.log('=== DEBUG SESSION STORAGE ===');
    console.log('customerData:', sessionStorage.getItem('customerData'));
    console.log('userVehicle:', sessionStorage.getItem('userVehicle'));
    console.log('oilRecommendation:', sessionStorage.getItem('oilRecommendation'));
    console.log('selectedProducts:', sessionStorage.getItem('selectedProducts'));
    console.log('=============================');
}


// Função auxiliar para formatar data
function formatDateForDisplay(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}


// ==================== FUNÇÕES AUXILIARES ====================
// Mostra/oculta o loading
function showLoading(show) {
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? "flex" : "none";
    }
}

// Exibe mensagens toast (versão responsiva)
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    // Ajuste de estilo para mobile
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

// Exibe mensagens toast (versão responsiva)
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    // Ajuste de estilo para mobile
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
        // Armazena os dados do veículo
        userVehicle = {
            modelo_ano_id: yearSelect.value,
            quilometragem: mileageInput.value.trim(),
            marca: brandSelect.options[brandSelect.selectedIndex].text,
            modelo: modelSelect.options[modelSelect.selectedIndex].text,
            ano: yearSelect.options[yearSelect.selectedIndex].text
        };

        // Salva no sessionStorage para uso posterior
        sessionStorage.setItem('userVehicle', JSON.stringify(userVehicle));

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

    // Modal de login (versão responsiva)
    if (loginBtn && modal) {
        loginBtn.addEventListener("click", function(e) {
            e.preventDefault();
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
        });

        closeModal.addEventListener("click", function() {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        });

        window.addEventListener("click", function(e) {
            if (e.target === modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        });

        // Ajuste do modal para mobile
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

    // Mostrar/esconder senha
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function() {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.querySelector("i").classList.toggle("fa-eye");
            this.querySelector("i").classList.toggle("fa-eye-slash");
        });
    }

    // Formulário de login (simulação)
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
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

    // Autocomplete para busca de endereço (OTIMIZADO)
    if (locationInput) {
        locationInput.addEventListener("input", function(e) {
            const query = e.target.value.trim();
            const resultsContainer = document.getElementById("autocomplete-results");
            
            // Limpa timeout anterior
            if (addressSearchTimeout) {
                clearTimeout(addressSearchTimeout);
            }
            
            if (query.length < 3) {
                resultsContainer.classList.remove("active");
                return;
            }
            
            // Adiciona debounce para evitar muitas requisições
            addressSearchTimeout = setTimeout(async () => {
                const addresses = await searchAddress(query);
                showAddressSuggestions(addresses);
            }, 300); // Reduzido de 500ms para 300ms
        });

        // Feche o autocomplete ao clicar fora
        document.addEventListener("click", function(e) {
            if (e.target !== locationInput) {
                document.getElementById("autocomplete-results").classList.remove("active");
            }
        });
    }

    // ==================== INICIALIZAÇÃO ====================

function init() {
    initMap();
    populateBrands();
    setMinScheduleDate();
    handleResponsiveLayout();
    

        // Adiciona listener para redimensionamento da janela
        window.addEventListener("resize", handleResponsiveLayout);
    }

    init();
});


async function getOilRecommendation(modeloAnoId) {
    showLoading(true);
    try {
        const response = await fetch(`/api/recomendacoes?modelo_ano_id=${modeloAnoId}`);
        const result = await response.json();
        
        console.log("DEBUG - Resposta completa da API:", result); // ADICIONE ESTA LINHA
        
        if (!result.success) {
            showToast(result.message, "error");
            return null;
        }
        
        // DEBUG: Verificar especificamente os preços
        if (result.data.oleo) {
            console.log("DEBUG - Preço do óleo:", result.data.oleo.preco);
        }
        if (result.data.filtro) {
            console.log("DEBUG - Preço do filtro:", result.data.filtro.preco);
        }
        
        // Armazena os dados da recomendação para uso posterior
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
// Atualiza a barra de progresso
function updateProgressBar(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Atualiza as classes dos passos
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


// Na função displayWorkshops, você pode adicionar cores diferentes baseadas na distância:
function getDistanceColor(distancia) {
    if (distancia < 0.5) return '#2a9d8f';     // Super perto
    if (distancia < 1) return '#3a86ff';       // Muito perto
    if (distancia < 3) return '#f4a261';       // Perto
    if (distancia < 8) return '#ff9f1c';       // Moderado
    if (distancia < 15) return '#ff6b6b';      // Um pouco longe
    return '#e63946';                          // Muito longe
}

// E modifique o item da lista para usar cores diferentes:
workshopItem.innerHTML = `
    <div class="workshop-info">
        <h4>${workshop.nome}</h4>
        <p class="distance" style="color: ${getDistanceColor(workshop.distancia)};">
            <i class="fas fa-route"></i> ${distanciaFormatada}
        </p>
        <p class="address"><i class="fas fa-map-marker-alt"></i> ${workshop.endereco}, ${workshop.cidade}/${workshop.estado}</p>
        <p class="phone"><i class="fas fa-phone"></i> ${workshop.telefone || 'Não informado'}</p>
        <p class="hours"><i class="fas fa-clock"></i> ${workshop.horario_abertura} - ${workshop.horario_fechamento}</p>
    </div>
    <button class="btn select-btn" onclick="selectWorkshop(${workshop.id})">Selecionar</button>
`;



// Atualiza o resumo da seleção
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
        summaryContainer.classList.add("empty");
        summaryContainer.classList.remove("highlight");
    } else {
        summaryElement.textContent = selections.join(" + ");
        summaryElement.style.color = "#2a9d8f";
        summaryContainer.classList.remove("empty");
        summaryContainer.classList.add("highlight");
        
        // Remove a classe de destaque após a animação
        setTimeout(() => {
            summaryContainer.classList.remove("highlight");
        }, 500);
    }
}

// Adicione esta função para inicializar o summary
function initSelectionSummary() {
    const selectionContainer = document.createElement("div");
    selectionContainer.className = "selection-summary";
    selectionContainer.innerHTML = `
        <h4>Resumo da Seleção</h4>
        <p id="selected-items">Carregando...</p>
    `;
    
    // Insere o summary após os cards de recomendação
    const recommendationContainer = document.querySelector(".recommendation-container");
    if (recommendationContainer) {
        recommendationContainer.parentNode.insertBefore(selectionContainer, recommendationContainer.nextSibling);
    }
    
    // Inicializa o summary
    updateSelectionSummary();
}
// Função para debug - verificar dados antes do salvamento
function debugAgendamentoData() {
    const userVehicle = JSON.parse(sessionStorage.getItem('userVehicle') || '{}');
    const selectedProducts = getSelectedProducts();
    const oilRecommendation = JSON.parse(sessionStorage.getItem('oilRecommendation') || '{}');
    
    console.log('=== DEBUG AGENDAMENTO ===');
    console.log('Veículo:', userVehicle);
    console.log('Produtos selecionados:', selectedProducts);
    console.log('Recomendação:', oilRecommendation);
    console.log('Oficina selecionada:', selectedWorkshop);
    console.log('Dados do formulário:');
    console.log('- Data:', document.getElementById("schedule-date").value);
    console.log('- Hora:', document.getElementById("schedule-time").value);
    console.log('- Nome:', document.getElementById("customer-name").value);
    console.log('- CPF:', document.getElementById("customer-cpf").value);
    console.log('- Telefone:', document.getElementById("customer-phone").value);
    console.log('- Email:', document.getElementById("customer-email").value);
    console.log('=========================');
}

// Chame esta função antes de salvar
// debugAgendamentoData();

// Chame esta função antes de salvar para verificar os dados
// Chame initSelectionSummary() quando a página carregar
document.addEventListener("DOMContentLoaded", function() {
    // === VERIFICAÇÃO DE LOGIN ===
    // Verifica se o usuário tem token e dados no localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Se não estiver logado, redireciona para login
    if (!token || !userData) {
        alert('Você precisa fazer login para agendar um serviço!');
        window.location.href = 'login.html';
        return; // Isso para a execução do código aqui
    }    initSelectionSummary();
});

// Função para melhorar a experiência do input de data
function enhanceDateInput() {
    const dateInput = document.querySelector('input[type="date"]');
    
    if (dateInput) {
        // Adicionar um label dinâmico
        const today = new Date();
        const minDate = new Date();
        minDate.setDate(today.getDate() + 1);
        
        // Formatar a data mínima para o formato YYYY-MM-DD
        const minDateString = minDate.toISOString().split('T')[0];
        
        // Definir atributos min e max
        dateInput.min = minDateString;
        
        const maxDate = new Date();
        maxDate.setMonth(today.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        // Adicionar placeholder personalizado
        dateInput.addEventListener('focus', function() {
            this.classList.add('focused');
        });
        
        dateInput.addEventListener('blur', function() {
            this.classList.remove('focused');
        });
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    enhanceDateInput();
});






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

    if (!validateCPF(customerCpf)) {
        showToast("CPF inválido", "error");
        return false;
    }

    if (!validateEmail(customerEmail)) {
        showToast("E-mail inválido", "error");
        return false;
    }

    // SALVAR DADOS DO CLIENTE ANTES DE AVANÇAR
    const customerData = {
        name: customerName,
        cpf: customerCpf,
        phone: customerPhone,
        email: customerEmail
    };
    
    sessionStorage.setItem('customerData', JSON.stringify(customerData));
    
    return true;
}

// Mover ícone de login para dentro do menu hamburger em mobile - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
    const actionIcons = document.querySelector('.action-icons');
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('hamburger');
    const navbar = document.querySelector('.navbar');
    
    // Cria uma cópia do action-icons para o mobile
    let mobileActionIcons = null;
    
    function handleMobileMenu() {
        if (window.innerWidth <= 768) {
            // Mobile - cria cópia dentro do nav se não existir
            if (actionIcons && nav && !mobileActionIcons) {
                mobileActionIcons = actionIcons.cloneNode(true);
                mobileActionIcons.classList.add('mobile-actions');
                nav.appendChild(mobileActionIcons);
                
                // Adiciona eventos aos elementos clonados
                setupClonedActionIcons(mobileActionIcons);
            }
            
            // Controla visibilidade baseado no menu
            if (mobileActionIcons) {
                mobileActionIcons.style.display = nav.classList.contains('active') ? 'flex' : 'none';
            }
            
            // Esconde o original no mobile
            if (actionIcons) {
                actionIcons.style.display = 'none';
            }
        } else {
            // Desktop - mostra o original e remove a cópia do mobile
            if (actionIcons) {
                actionIcons.style.display = 'flex';
            }
            
            if (mobileActionIcons) {
                mobileActionIcons.remove();
                mobileActionIcons = null;
            }
        }
    }
    
    // Configura eventos para os elementos clonados
    function setupClonedActionIcons(clonedIcons) {
        const dropdown = clonedIcons.querySelector('.user-dropdown');
        const loginBtn = clonedIcons.querySelector('#login-btn');
        
        if (dropdown) {
            dropdown.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdownMenu = this.querySelector('.dropdown-menu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
                }
            });
        }
    }
    
    // Controla visibilidade quando hamburger é clicado
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            setTimeout(() => {
                if (window.innerWidth <= 768 && mobileActionIcons) {
                    mobileActionIcons.style.display = nav.classList.contains('active') ? 'flex' : 'none';
                }
            }, 10);
        });
    }
    
    // Fecha dropdown ao clicar fora (para versão mobile também)
    document.addEventListener('click', function(e) {
        if (mobileActionIcons) {
            const dropdownMenu = mobileActionIcons.querySelector('.dropdown-menu');
            const userDropdown = mobileActionIcons.querySelector('.user-dropdown');
            
            if (dropdownMenu && userDropdown && !userDropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        }
    });
    
    // Executa inicialmente e no resize
    handleMobileMenu();
    window.addEventListener('resize', handleMobileMenu);
});

