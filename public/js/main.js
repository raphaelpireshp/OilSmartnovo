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


// main.js - Arquivo JavaScript unificado para o site OilSmart

document.addEventListener('DOMContentLoaded', function() {
    // =============================================
    // FUNCIONALIDADES GLOBAIS (todas as páginas)
    // =============================================

    // ... (todo o código que você já tinha aqui permanece igual) ...
    // Não mexi em nada da parte de login, modais, mapa, etc.

    // =============================================
    // FORMULÁRIO DE CONTATO (contato.html)
    // =============================================
    if (document.getElementById('contact-form')) {
        const contactForm = document.getElementById('contact-form');

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const phone = document.getElementById('contact-phone').value.trim();
            const subject = document.getElementById('contact-subject').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, subject, message })
                });

                const data = await res.json();

                if (data.success) {
                    alert("✅ Mensagem enviada com sucesso!");
                    contactForm.reset();
                } else {
                    alert("⚠️ Erro: " + data.message);
                }
            } catch (error) {
                console.error("Erro ao enviar formulário:", error);
                alert("❌ Erro no envio. Tente novamente.");
            }
        });
    }
});





   // ===== DROPDOWN DO USUÁRIO - VERSÃO SIMPLIFICADA =====
document.addEventListener('DOMContentLoaded', function() {
    const userDropdown = document.getElementById('user-dropdown');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const loginStatus = document.getElementById('login-status');
    
    if (userDropdown && dropdownMenu) {
        // Verificar se está logado
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            userDropdown.classList.add('user-logged-in');
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            if (userData.nome) {
                loginStatus.textContent = userData.nome.split(' ')[0];
            } else if (userData.email) {
                loginStatus.textContent = userData.email.split('@')[0];
            }
        }
        
        // Abrir/fechar dropdown
        userDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            
            if (!isLoggedIn) {
                window.location.href = '/html/login.html';
                return;
            }
            
            const isVisible = dropdownMenu.style.display === 'block';
            dropdownMenu.style.display = isVisible ? 'none' : 'block';
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userDropdown.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });
    }
    
    // Logout simples
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            window.location.href = '/html/index.html';
        });
    }
});