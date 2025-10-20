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
          const hashHex = await sha256Hex(password);
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
            console.debug('Login OK para usuário:', user.name);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('loggedUser', user.name);
            localStorage.setItem('loggedUserArea', user.area);
            console.debug('LocalStorage after login:', {
                isLoggedIn: localStorage.getItem('isLoggedIn'),
                loggedUser: localStorage.getItem('loggedUser'),
                loggedUserArea: localStorage.getItem('loggedUserArea')
            });
            loginToast.textContent = 'Login realizado com sucesso!';
            loginToast.style.background = '#28a745';
            loginToast.style.display = 'block';
            setTimeout(function () {
          console.debug('Redirecionando para /public/index.html?user=' + encodeURIComponent(username));
          window.location.href = `/public/index.html?user=${encodeURIComponent(username)}`;
            }, 800);
        } catch (err) {
            console.error('Erro ao autenticar:', err);
            // Mostra a mensagem de erro no toast para diagnóstico (curta)
            loginToast.textContent = 'Erro ao autenticar. ' + (err && err.message ? err.message : '');
            loginToast.style.background = '#dc3545';
            loginToast.style.display = 'block';
            loginText.style.display = 'inline';
            loginLoader.style.display = 'none';
        }
    });
});

// Calcula SHA-256 em hex; usa Web Crypto API quando disponível, senão fallback JS
async function sha256Hex(message) {
  // WebCrypto disponível e seguro
  if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: implementação simples de SHA-256 em JS (pequeno trecho)
  // Fonte: adaptado de implementações leves públicas
  function rightRotate(n, x) { return (x >>> n) | (x << (32 - n)); }
  function toHex(i) { return ('00000000' + i.toString(16)).slice(-8); }
  const msg = unescape(encodeURIComponent(message));
  const msgLen = msg.length;
  const words = [];
  for (let i = 0; i < msgLen; i++) words[i >> 2] |= msg.charCodeAt(i) << (24 - (i % 4) * 8);
  words[msgLen >> 2] |= 0x80 << (24 - (msgLen % 4) * 8);
  words[(((msgLen + 8) >> 6) + 1) * 16 - 1] = msgLen * 8;
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  let H0=0x6a09e667,H1=0xbb67ae85,H2=0x3c6ef372,H3=0xa54ff53a,H4=0x510e527f,H5=0x9b05688c,H6=0x1f83d9ab,H7=0x5be0cd19;
  for (let i=0;i<words.length;i+=16) {
    const W = new Array(64);
    for (let t=0;t<16;t++) W[t]=words[i+t] >>> 0;
    for (let t=16;t<64;t++) {
      const s0 = (rightRotate(7, W[t-15]) ^ rightRotate(18, W[t-15]) ^ (W[t-15]>>>3)) >>> 0;
      const s1 = (rightRotate(17, W[t-2]) ^ rightRotate(19, W[t-2]) ^ (W[t-2]>>>10)) >>> 0;
      W[t] = (W[t-16] + s0 + W[t-7] + s1) >>> 0;
    }
    let a=H0,b=H1,c=H2,d=H3,e=H4,f=H5,g=H6,h=H7;
    for (let t=0;t<64;t++) {
      const S1 = (rightRotate(6,e) ^ rightRotate(11,e) ^ rightRotate(25,e)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
      const S0 = (rightRotate(2,a) ^ rightRotate(13,a) ^ rightRotate(22,a)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    H0 = (H0 + a) >>> 0; H1 = (H1 + b) >>> 0; H2 = (H2 + c) >>> 0; H3 = (H3 + d) >>> 0;
    H4 = (H4 + e) >>> 0; H5 = (H5 + f) >>> 0; H6 = (H6 + g) >>> 0; H7 = (H7 + h) >>> 0;
  }
  return toHex(H0)+toHex(H1)+toHex(H2)+toHex(H3)+toHex(H4)+toHex(H5)+toHex(H6)+toHex(H7);
}

(async () => {
  try {
    console.log('ORIGEM:', location.origin, 'URL:', location.href);
    console.log('LocalStorage antes:', {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      loggedUser: localStorage.getItem('loggedUser'),
      loggedUserArea: localStorage.getItem('loggedUserArea')
    }); 
    const res = await fetch(`http://${localip}:3001/api/users`, { method: 'GET' });
    console.log('/api/users status:', res.status, res.statusText);
    let text;
    try {
      text = await res.text();
      try { 
        console.log('/api/users json:', JSON.parse(text)); 
      } catch(e) { 
        console.log('/api/users text (non-json):', text); 
      }
    } catch(e) {
      console.error('Erro lendo corpo de /api/users:', e);
    }
  } catch (err) {
    console.error('Erro no fetch /api/users:', err);
  } finally {
    console.log('LocalStorage depois:', {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      loggedUser: localStorage.getItem('loggedUser'),
      loggedUserArea: localStorage.getItem('loggedUserArea')
    });
  }
})();
