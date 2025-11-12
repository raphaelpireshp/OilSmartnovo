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
        console.log('Atualizando interface com dados:', user); // Debug
        
        // Atualizar o status de login no header
        if (loginStatus) {
            if (user.nome) {
                loginStatus.textContent = user.nome.split(' ')[0]; // Primeiro nome apenas
            } else if (user.email) {
                const username = user.email.split('@')[0];
                loginStatus.textContent = username;
            } else {
                loginStatus.textContent = 'Minha Conta';
            }
        }

        // Atualizar nome no dropdown
        if (userDisplayName) {
            if (user.nome) {
                userDisplayName.textContent = user.nome;
            } else if (user.email) {
                userDisplayName.textContent = user.email.split('@')[0];
            } else {
                userDisplayName.textContent = 'Usuário';
            }
        }

        // Atualizar email no dropdown
        if (userEmail) {
            if (user.email) {
                userEmail.textContent = user.email;
            } else {
                userEmail.textContent = 'email@exemplo.com';
            }
        }

        // Marcar como logado
        if (userDropdown) {
            userDropdown.classList.add('user-logged-in');
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
            const userData = JSON.parse(localStorage.getItem('userData') || localStorage.getItem('user') || '{}');

            if (!isLoggedIn || !userData.email) {
                // Se não estiver logado, abrir modal de login em vez de redirecionar
                if (loginModal) {
                    showModal(loginModal);
                } else {
                    window.location.href = '/html/login.html';
                }
                return;
            }

            // Se estiver logado, abrir/fechar dropdown
            const isVisible = dropdownMenu.classList.contains('show') || dropdownMenu.style.display === 'block';
            
            if (isVisible) {
                dropdownMenu.classList.remove('show');
                dropdownMenu.style.display = 'none';
            } else {
                // Atualizar dados do usuário antes de mostrar o dropdown
                updateUserInterface(userData);
                dropdownMenu.classList.add('show');
                dropdownMenu.style.display = 'block';
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
    checkLoginStatus();

    // Verificar login também quando a página ganha foco
    window.addEventListener('focus', checkLoginStatus);
    
    // Verificar login periodicamente (a cada 30 segundos)
    setInterval(checkLoginStatus, 30000);

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
    // CHATBOT FUNCTIONALITY
    // =============================================

    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotMessages = document.getElementById('chatbot-messages');

    // Verificar se os elementos do chatbot existem
    if (chatbotToggle && chatbotWidget) {
        // Toggle chatbot visibility
        chatbotToggle.addEventListener('click', function () {
            chatbotWidget.classList.toggle('active');
            hideNotification();
            
            // Adiciona mensagem de boas-vindas quando abre o chatbot
            if (chatbotWidget.classList.contains('active') && chatbotMessages && chatbotMessages.children.length === 0) {
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

        if (chatbotClose) {
            chatbotClose.addEventListener('click', function () {
                chatbotWidget.classList.remove('active');
            });
        }

        // Variável para controlar se já está processando um clique
        let isProcessingClick = false;

        // Event delegation para botões dinâmicos - VERSÃO CORRIGIDA
        if (chatbotMessages) {
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
        }

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
        if (chatbotSend) {
            chatbotSend.addEventListener('click', sendMessage);
        }

        // Send message on Enter key
        if (chatbotInput) {
            chatbotInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }

        // Add message to chat
        function addMessage(text, sender) {
            if (!chatbotMessages) return;
            
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
            if (!chatbotMessages) return;
            
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
            if (chatbotMessages) {
                chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
            }
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

        // Function to handle FAQ selection - VERSÃO MELHORADA
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
            if (notification) {
                notification.style.display = 'block';
            }
        }

        function hideNotification() {
            const notification = document.querySelector('.chatbot-notification');
            if (notification) {
                notification.style.display = 'none';
            }
        }

        // Auto-open chatbot after 30 seconds
        setTimeout(() => {
            if (chatbotWidget && !chatbotWidget.classList.contains('active')) {
                showNotification();
            }
        }, 30000);
    }

    // =============================================
    // FUNCIONALIDADES ESPECÍFICAS DE PÁGINAS
    // =============================================

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