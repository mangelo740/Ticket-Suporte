// login.js
// Script para autenticação simples na tela de login

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const loginText = document.getElementById('loginText');
    const loginLoader = document.getElementById('loginLoader');
    const loginToast = document.getElementById('loginToast');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        loginText.style.display = 'none';
        loginLoader.style.display = 'inline-block';

        // Usuário sempre em caixa alta
        const username = document.getElementById('username').value.trim().toUpperCase();
        const password = document.getElementById('password').value.trim();

        try {
            // Buscar usuário no banco
            const users = await window.ticketDB.getAllUsers();
            const user = users.find(u => u.name === username);
            if (!user) {
                loginToast.textContent = 'Usuário ou senha inválidos.';
                loginToast.style.background = '#dc3545';
                loginToast.style.display = 'block';
                alert('Usuário ou senha inválidos.');
                loginText.style.display = 'inline';
                loginLoader.style.display = 'none';
                return;
            }
            // Senha é hash SHA256 no backend
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            if (user.password !== hashHex) {
                loginToast.textContent = 'Usuário ou senha inválidos.';
                loginToast.style.background = '#dc3545';
                loginToast.style.display = 'block';
                alert('Usuário ou senha inválidos.');
                loginText.style.display = 'inline';
                loginLoader.style.display = 'none';
                return;
            }
            // Login OK
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loggedUser', user.name);
            localStorage.setItem('loggedUserArea', user.area);
            loginToast.textContent = 'Login realizado com sucesso!';
            loginToast.style.background = '#28a745';
            loginToast.style.display = 'block';
            setTimeout(function () {
                window.location.href = 'index.html';
            }, 800);
        } catch (err) {
            loginToast.textContent = 'Erro ao autenticar.';
            loginToast.style.background = '#dc3545';
            loginToast.style.display = 'block';
            loginText.style.display = 'inline';
            loginLoader.style.display = 'none';
        }
    });
});
