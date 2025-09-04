// auth.js - Funções de autenticação

function handleRegistration(formData) {
    // Extrair dados do formulário
    const fullName = formData.get('fullname');
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Validar dados
    if (!fullName || !email || !password) {
        throw new Error('Todos os campos são obrigatórios');
    }
    
    if (password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
    }
    
    // Armazenar no localStorage (em produção, use backend)
    localStorage.setItem('userFullName', fullName);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userPassword', password);
    
    return {
        success: true,
        message: 'Conta criada com sucesso!',
        user: { fullName, email }
    };
}

// Função para verificar se email já existe
function checkEmailExists(email) {
    const storedEmail = localStorage.getItem('userEmail');
    return storedEmail === email;
}

// Função de login
function handleLogin(email, password) {
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');
    const storedName = localStorage.getItem('userFullName');
    
    if (email === storedEmail && password === storedPassword) {
        localStorage.setItem('isLoggedIn', 'true');
        return {
            success: true,
            user: { name: storedName, email: storedEmail }
        };
    } else {
        return {
            success: false,
            message: 'E-mail ou senha incorretos'
        };
    }
}