document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-password').value;

    if (!email || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.usuario));
            window.location.href = 'agenda.html';
        } else {
            alert(data.erro || 'Falha no login');
        }
    } catch (error) {
        console.error('Erro ao realizar login:', error);
        alert('Erro ao tentar fazer login. Tente novamente.');
    }
});