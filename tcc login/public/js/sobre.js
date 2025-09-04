document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginBtn = document.getElementById('login-btn');
    const loginModal = document.getElementById('login-modal');
    const forgotModal = document.getElementById('forgot-modal');
    const closeModals = document.querySelectorAll('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const forgotForm = document.getElementById('forgotForm');
    const forgotPasswordLink = document.getElementById('forgot-password');
    const backToLoginLink = document.getElementById('back-to-login');
    const registerLink = document.getElementById('register-link');
    const googleLoginBtn = document.getElementById('google-login');
    
    // Mostrar modal de login
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showModal(loginModal);
    });
    
    // Mostrar modal de recuperação de senha
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal(loginModal);
        showModal(forgotModal);
    });
    
    // Voltar para o login
    backToLoginLink.addEventListener('click', function(e) {
        e.preventDefault();
        hideModal(forgotModal);
        showModal(loginModal);
    });
    
    // Fechar modais
    closeModals.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            hideModal(modal);
        });
    });
    
    // Fechar ao clicar fora
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            hideModal(e.target);
        }
    });
    
    // Mostrar/esconder senha
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
        });
    });
    
    // Validação do formulário de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const rememberMe = document.getElementById('remember-me').checked;
        
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
            // Simular envio do formulário
            simulateLogin(email, password, rememberMe);
        }
    });
    
    // Validação do formulário de recuperação
    forgotForm.addEventListener('submit', function(e) {
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
            // Simular envio do formulário
            simulatePasswordReset(email);
        }
    });
    
    // Login com Google
    googleLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        showToast('Redirecionando para o login com Google...', 'info');
        // Aqui você implementaria a integração real com o Google
    });
    
    // Link de registro
    registerLink.addEventListener('click', function(e) {
        e.preventDefault();
        showToast('Redirecionando para a página de cadastro...', 'info');
        // Aqui você redirecionaria para a página de cadastro
    });
    
    // Funções auxiliares
    function showModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    function hideModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
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
    
    function simulateLogin(email, password, remember) {
        const loginButton = document.getElementById('login-button');
        
        // Mostrar loading
        loginButton.classList.add('loading');
        
        // Simular requisição assíncrona
        setTimeout(() => {
            // Aqui você faria a requisição real para o servidor
            // Por enquanto, apenas simulamos um login bem-sucedido
            
            // Restaurar botão
            loginButton.classList.remove('loading');
            
            // Mostrar mensagem de sucesso
            showToast('Login realizado com sucesso!', 'success');
            
            // Fechar modal
            hideModal(loginModal);
            
            // Atualizar ícone do usuário
            const userIcon = document.querySelector('.user-icon');
            userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            userIcon.style.color = 'var(--success-color)';
            
            // Se lembrar usuário, salvar no localStorage
            if (remember) {
                localStorage.setItem('rememberedEmail', email);
            }
        }, 1500);
    }
    
    function simulatePasswordReset(email) {
        const forgotButton = document.getElementById('forgot-button');
        
        // Mostrar loading
        forgotButton.classList.add('loading');
        
        // Simular requisição assíncrona
        setTimeout(() => {
            // Restaurar botão
            forgotButton.classList.remove('loading');
            
            // Mostrar mensagem de sucesso
            showToast(`Link de recuperação enviado para ${email}`, 'success');
            
            // Fechar modal
            hideModal(forgotModal);
        }, 1500);
    }
    
    function showToast(message, type = 'success') {
        // Remove toast existente se houver
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Mostrar o toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Esconder após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    // Verificar se tem e-mail lembrado
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('login-email').value = rememberedEmail;
        document.getElementById('remember-me').checked = true;
    }
    
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
});