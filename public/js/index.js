// index.js
document.addEventListener('DOMContentLoaded', function () {
    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add animation to feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    const steps = document.querySelectorAll('.step');

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Initialize animations
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    steps.forEach(step => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(20px)';
        step.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(step);
    });

    // Add hover effect to buttons
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add scroll effect to header
    const header = document.querySelector('.header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.style.padding = '15px 0';
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.padding = '30px 0';
            header.style.boxShadow = 'none';
        }
    });

    // Chatbot functionality
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Toggle chatbot visibility
    chatbotToggle.addEventListener('click', function () {
        chatbotWidget.classList.toggle('active');
        hideNotification();
        
        // Adiciona mensagem de boas-vindas quando abre o chatbot
        if (chatbotWidget.classList.contains('active') && chatbotMessages.children.length === 0) {
            setTimeout(() => {
                addMessage(`Olá! 👋 Sou o assistente virtual da OilSmart. 
                
Posso ajudar você com:<br>
• 📅 Agendamentos<br>
• 💰 Preços e orçamentos<br>
• ⏰ Horários de funcionamento<br>
• 🔧 Serviços disponíveis<br>
• ❓ Outras dúvidas

Como posso ajudar você hoje?`, 'bot');
                
                // Adiciona opções rápidas
                setTimeout(() => {
                    const quickOptions = `
                        <div class="quick-options">
                            <button class="quick-option" data-option="agendamento">📅 Agendar serviço</button>
                            <button class="quick-option" data-option="duvidas">❓ Tirar dúvidas</button>
                        </div>
                    `;
                    addMessage(quickOptions, 'bot');
                }, 500);
            }, 1000);
        }
    });

    chatbotClose.addEventListener('click', function () {
        chatbotWidget.classList.remove('active');
    });

    // Variável para controlar se já está processando um clique
    let isProcessingClick = false;

    // Event delegation para botões dinâmicos - VERSÃO CORRIGIDA
    chatbotMessages.addEventListener('click', function (e) {
        if (isProcessingClick) return;

        let target = e.target;
        let button = null;
        let type = null;

        // Encontra o botão clicado e determina o tipo
        while (target && target !== this) {
            if (target.classList.contains('quick-option')) {
                button = target;
                // Verifica se é do menu principal (data-option) ou FAQ (data-faq)
                if (target.hasAttribute('data-option')) {
                    type = 'quick-option';
                } else if (target.hasAttribute('data-faq')) {
                    type = 'faq-question';
                }
                break;
            }
            else if (target.classList.contains('faq-question')) {
                button = target;
                type = 'faq-question';
                break;
            }
            else if (target.classList.contains('chatbot-back-btn')) {
                button = target;
                type = 'back-btn';
                break;
            }
            target = target.parentElement;
        }

        if (button && type) {
            e.preventDefault();
            e.stopPropagation();
            isProcessingClick = true;

            switch (type) {
                case 'quick-option':
                    handleQuickOptionClick(button);
                    break;
                case 'faq-question':
                    handleFAQClick(button);
                    break;
                case 'back-btn':
                    handleBackClick(button);
                    break;
            }

            // Reseta a flag após um tempo
            setTimeout(() => {
                isProcessingClick = false;
            }, 1000);
        }
    });

    // Funções separadas para cada tipo de clique - VERSÃO CORRIGIDA
    function handleQuickOptionClick(button) {
        const optionText = button.textContent;
        const optionType = button.dataset.option;

        addMessage(optionText, 'user');

        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();
            const response = getQuickOptionResponse(optionType);
            addMessage(response, 'bot');
            scrollToBottom();
        }, 1500);
    }

    function handleFAQClick(button) {
        const faqType = button.dataset.faq;

        // Lista de FAQs que têm resposta
        const faqsComResposta = [
            'agendar-como', 'agendar-online', 'agendar-app', 'horario-oficinas',
            'agendar-tempo', 'agendar-cancelar', 'preco-troca-oleo', 'preco-filtros',
            'preco-formas-pagamento', 'oleo-frequencia', 'oleo-tipo', 'servicos-adicionais'
        ];

        // Só processa se a FAQ tiver resposta
        if (faqType && faqsComResposta.includes(faqType)) {
            addMessage(button.textContent, 'user');
            showTypingIndicator();

            setTimeout(() => {
                hideTypingIndicator();
                selectFAQ(faqType);
            }, 1500);
        }
    }

    function handleBackClick(button) {
        const backTo = button.dataset.backTo;

        addMessage('Voltar', 'user');

        showTypingIndicator();

        setTimeout(() => {
            hideTypingIndicator();
            const response = goBackToMenu(backTo);
            addMessage(response, 'bot');
            scrollToBottom();
        }, 500);
    }

    // Send message function
    function sendMessage() {
        const message = chatbotInput.value.trim();
        if (message) {
            addMessage(message, 'user');
            chatbotInput.value = '';

            showTypingIndicator();

            setTimeout(() => {
                hideTypingIndicator();
                const response = getBotResponse(message);
                addMessage(response, 'bot');
                scrollToBottom();
            }, 1500);
        }
    }

    // Send message on button click
    chatbotSend.addEventListener('click', sendMessage);

    // Send message on Enter key
    chatbotInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        if (sender === 'bot') {
            avatarDiv.innerHTML = '<i class="fas fa-oil-can"></i>';
        } else {
            avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
        }

        // Check if text contains HTML or is plain text
        if (typeof text === 'string' && text.includes('<') && text.includes('>')) {
            contentDiv.innerHTML = text;
        } else {
            const messageText = document.createElement('p');
            messageText.textContent = text;
            contentDiv.appendChild(messageText);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatbotMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chatbot-message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = '<i class="fas fa-oil-can"></i>';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
            <p>Digitando</p>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        typingDiv.appendChild(avatarDiv);
        typingDiv.appendChild(contentDiv);
        chatbotMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Scroll to bottom of chat
    function scrollToBottom() {
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Get response for quick options - FUNÇÃO ÚNICA E CORRIGIDA
    function getQuickOptionResponse(option) {
        let response;

        switch (option) {
            case 'agendamento':
                response = `Para agendar um serviço, você precisa:
            
            <div class="faq-questions">
                <div class="question-category">📅 Processo de Agendamento</div>
                <button class="faq-question" data-faq="agendar-como"><i class="fas fa-play-circle"></i> Como fazer o agendamento?</button>
                <button class="faq-question" data-faq="agendar-online"><i class="fas fa-globe"></i> Posso agendar online?</button>
                <button class="faq-question" data-faq="agendar-app"><i class="fas fa-mobile-alt"></i> Pelo aplicativo?</button>
                
                <div class="question-category">⏰ Horários</div>
                <button class="faq-question" data-faq="horario-oficinas"><i class="fas fa-clock"></i> Horário das oficinas</button>
                <button class="faq-question" data-faq="agendar-tempo"><i class="fas fa-hourglass"></i> Quanto tempo leva?</button>
                
                <div class="question-category">❓ Dúvidas Comuns</div>
                <button class="faq-question" data-faq="agendar-cancelar"><i class="fas fa-times"></i> Como cancelar?</button>
            </div>`;
                break;

            case 'duvidas':
                response = `Escolha uma categoria de dúvidas:
            
            <div class="faq-questions">
                <div class="question-category">💰 Preços e Pagamento</div>
                <button class="faq-question" data-faq="preco-troca-oleo"><i class="fas fa-oil-can"></i> Preço da troca de óleo</button>
                <button class="faq-question" data-faq="preco-filtros"><i class="fas fa-filter"></i> Preço dos filtros</button>
                <button class="faq-question" data-faq="preco-formas-pagamento"><i class="fas fa-credit-card"></i> Formas de pagamento</button>
                
                <div class="question-category">🔧 Serviços</div>
                <button class="faq-question" data-faq="oleo-frequencia"><i class="fas fa-sync-alt"></i> Frequência da troca</button>
                <button class="faq-question" data-faq="oleo-tipo"><i class="fas fa-vial"></i> Tipo de óleo ideal</button>
                <button class="faq-question" data-faq="servicos-adicionais"><i class="fas fa-tools"></i> Serviços adicionais</button>
            </div>`;
                break;

            default:
                // Menu principal - SEM botão voltar
                response = `Olá! Sou o assistente virtual da OilSmart. Como posso ajudá-lo hoje?
            
            <div class="quick-options">
                <button class="quick-option" data-option="agendamento">📅 Agendar serviço</button>
                <button class="quick-option" data-option="duvidas">❓ Tirar dúvidas</button>
            </div>`;
                return response;
        }

        // Para submenus, adiciona o botão voltar UMA VEZ
        const backButton = addBackButton('main');
        return response + backButton.outerHTML;
    }

    // Get bot response based on user input - VERSÃO MELHORADA
    function getBotResponse(input) {
        const lowerInput = input.toLowerCase().trim();
        
        // Remove acentos para melhor reconhecimento
        const normalizedInput = lowerInput.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        
        // Palavras-chave expandidas para melhor reconhecimento
        const keywords = {
            'agendamento': ['agendar', 'marcar', 'agendamento', 'marcacao', 'consulta', 'horario', 'data', 'reserva'],
            'horarios': ['horario', 'funcionamento', 'hora', 'aberto', 'fecha', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'],
            'precos': ['preco', 'valor', 'custo', 'quanto', 'custa', 'preço', 'valores', 'dinheiro', 'pagamento'],
            'oleo': ['oleo', 'óleo', 'lubrificante', 'troca', 'trocar', 'motor', 'visco'],
            'servicos': ['servico', 'serviço', 'manutencao', 'manutenção', 'revisao', 'revisão', 'filtro', 'pneu', 'freio'],
            'cancelar': ['cancelar', 'desmarcar', 'cancelamento', 'desistir'],
            'contato': ['contato', 'telefone', 'email', 'endereco', 'endereço', 'localizacao', 'localização'],
            'app': ['aplicativo', 'app', 'celular', 'mobile', 'download', 'instalar'],
            'duvidas': ['duvida', 'dúvida', 'pergunta', 'ajuda', 'como funciona', 'informacao', 'informação']
        };

        // Verifica correspondências por palavra-chave
        let matchedCategory = null;
        let maxMatches = 0;

        for (const [category, words] of Object.entries(keywords)) {
            const matches = words.filter(word => normalizedInput.includes(word)).length;
            if (matches > maxMatches) {
                maxMatches = matches;
                matchedCategory = category;
            }
        }

        // Respostas baseadas na categoria detectada
        switch (matchedCategory) {
            case 'agendamento':
                return `Entendi que você quer saber sobre agendamentos! 📅
                
                <div class="quick-options-grid">
                    <button class="quick-option" data-faq="agendar-como"><i class="fas fa-question-circle"></i> Como agendar?</button>
                    <button class="quick-option" data-faq="agendar-tempo"><i class="fas fa-clock"></i> Tempo de serviço</button>
                    <button class="quick-option" data-faq="agendar-cancelar"><i class="fas fa-times-circle"></i> Como cancelar?</button>
                    <button class="quick-option" data-faq="horario-oficinas"><i class="fas fa-store"></i> Horários</button>
                </div>`;

            case 'horarios':
                return `Sobre horários e funcionamento: ⏰
                
                <div class="quick-options-grid">
                    <button class="quick-option" data-faq="horario-oficinas"><i class="fas fa-store"></i> Horário das oficinas</button>
                    <button class="quick-option" data-faq="agendar-tempo"><i class="fas fa-clock"></i> Tempo do serviço</button>
                </div>`;

            case 'precos':
                return `Informações sobre preços: 💰
                
                <div class="quick-options-grid">
                    <button class="quick-option" data-faq="preco-troca-oleo"><i class="fas fa-oil-can"></i> Troca de óleo</button>
                    <button class="quick-option" data-faq="preco-filtros"><i class="fas fa-filter"></i> Troca de filtros</button>
                    <button class="quick-option" data-faq="preco-formas-pagamento"><i class="fas fa-credit-card"></i> Formas de pagamento</button>
                </div>`;

            case 'oleo':
                return `Sobre troca de óleo: 🛢️
                
                <div class="faq-questions">
                    <button class="faq-question" data-faq="oleo-frequencia"><i class="fas fa-sync-alt"></i> Com que frequência trocar?</button>
                    <button class="faq-question" data-faq="oleo-tipo"><i class="fas fa-vial"></i> Qual tipo de óleo usar?</button>
                    <button class="faq-question" data-faq="preco-troca-oleo"><i class="fas fa-dollar-sign"></i> Preço da troca</button>
                    <button class="faq-question" data-faq="servicos-adicionais"><i class="fas fa-tools"></i> Serviços adicionais</button>
                </div>`;

            case 'servicos':
                return `Nossos serviços: 🔧
                
                <div class="faq-questions">
                    <button class="faq-question" data-faq="servicos-adicionais"><i class="fas fa-tools"></i> Serviços adicionais</button>
                    <button class="faq-question" data-faq="preco-troca-oleo"><i class="fas fa-oil-can"></i> Troca de óleo</button>
                    <button class="faq-question" data-faq="preco-filtros"><i class="fas fa-filter"></i> Troca de filtros</button>
                    <button class="faq-question" data-faq="agendar-tempo"><i class="fas fa-clock"></i> Tempo dos serviços</button>
                </div>`;

            case 'cancelar':
                return `Para cancelar um agendamento: ❌
                
                <div class="quick-options-grid">
                    <button class="quick-option" data-faq="agendar-cancelar"><i class="fas fa-times-circle"></i> Como cancelar?</button>
                    <button class="quick-option" data-option="agendamento"><i class="fas fa-calendar"></i> Ver agendamentos</button>
                </div>`;

            case 'app':
                return `Sobre nosso aplicativo: 📱
                
                <div class="quick-options-grid">
                    <button class="quick-option" data-faq="agendar-app"><i class="fas fa-mobile-alt"></i> Sobre o app</button>
                    <button class="quick-option" data-faq="agendar-online"><i class="fas fa-globe"></i> Agendar online</button>
                </div>`;

            case 'contato':
                return `Para entrar em contato conosco: 📞
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 10px 0;">
                    <strong>📞 Telefone:</strong> (11) 9999-9999<br>
                    <strong>📧 Email:</strong> contato@oilsmart.com.br<br>
                    <strong>📍 Endereço:</strong> Rua Exemplo, 123 - São Paulo/SP<br><br>
                    <strong>Horário de atendimento:</strong><br>
                    Segunda a Sexta: 8h às 18h<br>
                    Sábado: 8h às 12h
                </div>`;

            default:
                // Se não reconhecer, faz uma busca mais ampla
                if (normalizedInput.includes('oi') || normalizedInput.includes('ola') || normalizedInput.includes('olá') || normalizedInput.includes('iniciar')) {
                    return `Olá! 😊 Sou o assistente virtual da OilSmart. Como posso ajudá-lo hoje?
                    
                    <div class="quick-options">
                        <button class="quick-option" data-option="agendamento">📅 Agendar serviço</button>
                        <button class="quick-option" data-option="duvidas">❓ Tirar dúvidas</button>
                    </div>`;
                }
                else if (normalizedInput.includes('obrigado') || normalizedInput.includes('obrigada') || normalizedInput.includes('valeu') || normalizedInput.includes('agradeco')) {
                    return 'De nada! Fico feliz em ajudar. 😊 Se tiver mais alguma dúvida, é só perguntar!';
                }
                else if (normalizedInput.includes('tchau') || normalizedInput.includes('ate logo') || normalizedInput.includes('ate mais') || normalizedInput.includes('bye')) {
                    return 'Até logo! 👋 Espero ter ajudado. Volte sempre que precisar!';
                }
                else {
                    return `Desculpe, não entendi completamente. 😅 Poderia reformular ou escolher uma das opções abaixo?
                    
                    <div class="quick-options">
                        <button class="quick-option" data-option="agendamento">📅 Agendamentos</button>
                        <button class="quick-option" data-option="duvidas">❓ Outras dúvidas</button>
                        <button class="quick-option" data-faq="preco-troca-oleo">💰 Preços</button>
                        <button class="quick-option" data-faq="horario-oficinas">⏰ Horários</button>
                    </div>`;
                }
        }
    }

    // Function to handle FAQ selection - CORRIGIDA (SEM VOLTAR AUTOMATICAMENTE)
    function selectFAQ(faqType) {
        const faqResponses = {
            'agendar-como': 'Para agendar: <br><br>1) Acesse nosso site/app <br><br>2) Escolha o serviço <br><br>3) Selecione data/horário <br><br>4) Confirme o agendamento. <br><br>Todo o processo leva menos de 2 minutos!',
            'agendar-online': 'Sim! Você pode agendar totalmente online pelo nosso site ou aplicativo. É rápido, fácil e seguro.',
            'agendar-app': 'Nosso aplicativo está disponível na App Store e Google Play. <br><br>Nele você agenda, acompanha e recebe lembretes dos serviços.',
            'horario-oficinas': 'As oficinas funcionam geralmente de Segunda a Sexta das 8h às 18h, e Sábados das 8h às 12h. <br><br>Porém, cada oficina tem o seu próprio horário.',
            'agendar-tempo': 'Uma troca de óleo leva em média 30-45 minutos. <br><br>Serviços completos podem levar até 1h30min.',
            'agendar-cancelar': 'Para cancelar: <br><br>Acesse "Meus Agendamentos" no site/app e clique em "Cancelar". <br><br>Você pode cancelar até 2h antes do horário.',
            'preco-troca-oleo': '💰 <strong>Preço da Troca de Óleo</strong><br><br>A troca de óleo simples varia de R$ 80 a R$ 200, dependendo do tipo de óleo e veículo. <br><br>Inclui mão de obra e descarte correto do óleo usado.',
            'preco-filtros': '💰 <strong>Preço dos Filtros</strong><br><br>Filtros de óleo custam entre R$ 15 e R$ 50. <br><br>Recomendamos trocar o filtro a cada troca de óleo para garantir o melhor desempenho do motor.<br><br>💳 <strong>Formas de Pagamento:</strong><br>Geralmente as oficinas aceitam PIX e cartão de crédito/débito, mas cada oficina tem seu próprio método de pagamento. <br><br>Sugerimos que você confirme diretamente com a oficina usando o número de contato fornecido no agendamento.<br><br>Se o número não funcionar, entre em contato conosco através da nossa aba de contato!',
            'preco-formas-pagamento': '💳 <strong>Formas de Pagamento</strong><br><br>Geralmente as oficinas aceitam PIX e cartão de crédito/débito, mas cada oficina tem seu próprio método de pagamento. <br><br>Sugerimos que você confirme diretamente com a oficina usando o número de contato fornecido no agendamento.<br><br>Se o número não funcionar, entre em contato conosco através da nossa aba de contato!',
            'oleo-frequencia': '🔄 <strong>Frequência da Troca de Óleo</strong><br><br>Recomendamos trocar o óleo a cada 10.000 km ou 6 meses (o que ocorrer primeiro). <br><br>Para uso intenso ou veículos mais antigos, recomendamos a cada 5.000 km.',
            'oleo-tipo': '⚗️ <strong>Tipo de Óleo Ideal</strong><br><br>O tipo ideal depende do seu veículo. <br><br>No agendamento, nosso sistema recomenda automaticamente o melhor óleo baseado na marca, modelo e ano do seu carro.',
            'servicos-adicionais': '🔧 <strong>Serviços Adicionais</strong><br><br>Oferecemos: <br><br>• Troca de filtro de ar<br>• Limpeza de bicos<br>• Verificação de fluidos<br>• Check-up completo do veículo<br>• Diagnóstico computadorizado'
        };

        // Verifica se existe resposta para esta FAQ
        if (!faqResponses[faqType]) {
            return;
        }

        const response = faqResponses[faqType];
        const category = getFAQCategory(faqType);

        // MOSTRA APENAS A RESPOSTA COM BOTÃO VOLTAR - SEM MOSTRAR MENU AUTOMATICAMENTE
        const backButton = addBackButton(category);
        const fullResponse = response + backButton.outerHTML;

        addMessage(fullResponse, 'bot');
        scrollToBottom();
    }

    // Função para determinar a categoria do FAQ
    function getFAQCategory(faqType) {
        const categories = {
            'agendar-como': 'agendamento',
            'agendar-online': 'agendamento',
            'agendar-app': 'agendamento',
            'horario-oficinas': 'agendamento',
            'agendar-tempo': 'agendamento',
            'agendar-cancelar': 'agendamento',
            'preco-troca-oleo': 'duvidas',
            'preco-filtros': 'duvidas',
            'preco-formas-pagamento': 'duvidas',
            'oleo-frequencia': 'duvidas',
            'oleo-tipo': 'duvidas',
            'servicos-adicionais': 'duvidas'
        };

        return categories[faqType] || 'main';
    }

    // Função para criar botão voltar
    function addBackButton(backTo = 'main') {
        const backButton = document.createElement('button');
        backButton.className = 'chatbot-back-btn';
        backButton.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        backButton.dataset.backTo = backTo;

        return backButton;
    }

    // Função para voltar ao menu
    function goBackToMenu(backTo) {
        // Se for para voltar ao menu principal, retorna direto sem botão voltar
        if (backTo === 'main') {
            return `Olá! Sou o assistente virtual da OilSmart. Como posso ajudá-lo hoje?
        
        <div class="quick-options">
            <button class="quick-option" data-option="agendamento">📅 Agendar serviço</button>
            <button class="quick-option" data-option="duvidas">❓ Tirar dúvidas</button>
        </div>`;
        }

        // Para outras categorias, retorna para a mesma categoria usando getQuickOptionResponse
        return getQuickOptionResponse(backTo);
    }

    // Show notification
    function showNotification() {
        const notification = document.querySelector('.chatbot-notification');
        notification.style.display = 'block';
    }

    function hideNotification() {
        const notification = document.querySelector('.chatbot-notification');
        notification.style.display = 'none';
    }

    // Auto-open chatbot after 30 seconds
    setTimeout(() => {
        if (!chatbotWidget.classList.contains('active')) {
            showNotification();
        }
    }, 30000);

    // Add loading animation to page
    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
    });
});