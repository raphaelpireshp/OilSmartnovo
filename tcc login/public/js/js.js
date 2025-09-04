document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginBtn = document.getElementById('login-btn');
    const modal = document.getElementById('login-modal');
    const closeModal = document.querySelector('.close-modal');
    const loginForm = document.querySelector('.login-form');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('login-password');
    
    // Mostrar/ocultar modal
    loginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        modal.classList.add('show');
    });
    
    closeModal.addEventListener('click', function() {
        modal.classList.remove('show');
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Mostrar/ocultar senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="far fa-eye"></i>' : '<i class="far fa-eye-slash"></i>';
    });
    
    // Validação do formulário
    loginForm.addEventListener('submit', function(e) {
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
        
        // Simular envio do formulário
        simulateLogin(email, password);
    });
    
    // Função para validar e-mail
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // Simular login (apenas para demonstração)
    function simulateLogin(email, password) {
        // Mostrar loading
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        submitBtn.disabled = true;
        
        // Simular requisição assíncrona
        setTimeout(() => {
            // Aqui você faria a requisição real para o servidor
            // Por enquanto, apenas simulamos um login bem-sucedido
            
            // Restaurar botão
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Mostrar mensagem de sucesso
            showToast('Login realizado com sucesso!', 'success');
            
            // Fechar modal após 1 segundo
            setTimeout(() => {
                modal.classList.remove('show');
                
                // Atualizar ícone do usuário
                const userIcon = document.querySelector('.user-icon');
                userIcon.innerHTML = '<i class="fas fa-user-check"></i>';
                userIcon.style.color = 'var(--success-color)';
                
                // Aqui você poderia redirecionar o usuário ou atualizar a UI
            }, 1000);
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
    `;
    document.head.appendChild(style);
});

document.addEventListener('DOMContentLoaded', function() {
    // Menu Hamburguer
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    
    hamburger.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('active');
        
        // Impede a rolagem da página quando o menu está aberto
        if (nav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
    
    // Fecha o menu quando um link é clicado
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
    
    // Fecha o menu ao redimensionar a janela para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
});