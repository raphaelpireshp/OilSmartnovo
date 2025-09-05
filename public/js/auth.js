// auth.js - Sistema unificado de autenticação
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkLoginStatus();
        this.setupEventListeners();
    }

    checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = localStorage.getItem('userData');
        
        this.updateUI(isLoggedIn, userData ? JSON.parse(userData) : null);
    }

    updateUI(isLoggedIn, userData = null) {
        const loginStatus = document.getElementById('login-status');
        const userDisplayName = document.getElementById('user-display-name');
        const userEmail = document.getElementById('user-email');
        const dropdownMenu = document.getElementById('dropdown-menu');
        const userDropdown = document.getElementById('user-dropdown');

        if (loginStatus) {
            if (isLoggedIn && userData) {
                loginStatus.textContent = userData.nome || userData.email.split('@')[0];
                if (userDisplayName) userDisplayName.textContent = userData.nome || 'Usuário';
                if (userEmail) userEmail.textContent = userData.email;
                if (userDropdown) userDropdown.classList.add('logged-in');
            } else {
                loginStatus.textContent = 'Login';
                if (userDropdown) userDropdown.classList.remove('logged-in');
            }
        }
    }

    setupEventListeners() {
        // Login modal
        const loginBtn = document.getElementById('login-btn');
        const loginModal = document.getElementById('login-modal');
        const closeModal = document.querySelector('.close-modal');
        const loginForm = document.getElementById('loginForm');

        if (loginBtn && loginModal) {
            loginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showModal(loginModal);
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                this.hideModal(loginModal);
            });
        }

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(loginForm);
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (loginModal && e.target === loginModal) {
                this.hideModal(loginModal);
            }
        });
    }

    showModal(modal) {
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    async handleLogin(form) {
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;
        const rememberMe = form.querySelector('#remember-me')?.checked;

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, senha: password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userData', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                this.updateUI(true, data.user);
                this.hideModal(document.getElementById('login-modal'));
                
                // Show success message
                this.showToast('Login realizado com sucesso!', 'success');
                
                // Redirect or reload if needed
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showToast(data.message || 'Erro no login', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Erro ao conectar com o servidor', 'error');
        }
    }

    handleLogout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');
        localStorage.removeItem('token');
        
        this.updateUI(false);
        this.showToast('Logout realizado com sucesso', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    showToast(message, type = 'info') {
        // Create toast element if it doesn't exist
        let toast = document.getElementById('auth-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'auth-toast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                z-index: 10000;
                transition: all 0.3s ease;
                transform: translateX(100%);
            `;
            document.body.appendChild(toast);
        }

        // Set style based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        
        toast.style.backgroundColor = colors[type] || colors.info;
        toast.textContent = message;

        // Show toast
        toast.style.transform = 'translateX(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
        }, 3000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});