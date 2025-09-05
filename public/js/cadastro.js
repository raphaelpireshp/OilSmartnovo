document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const senha = document.getElementById('register-password').value;
    const tipo = document.getElementById('register-type').value;

    if (!nome || !email || !senha || !tipo) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nome, email, senha, tipo })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Cadastro realizado com sucesso! Agora faça login.');
            window.location.href = 'login.html';
        } else {
            alert(data.erro || 'Falha no cadastro');
        }
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        alert('Erro ao tentar cadastrar. Tente novamente.');
    }
});