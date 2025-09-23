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