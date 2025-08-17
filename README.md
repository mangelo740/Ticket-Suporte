# Sistema de Abertura de Chamados

Um sistema completo de gerenciamento de chamados desenvolvido em HTML, CSS e JavaScript com simulação de banco SQLite usando localStorage.

## ✨ Características

- Formulário completo para abertura de chamados
- Painel administrativo com dashboard
- Gestão de tickets com filtros e pesquisa
- Upload de múltiplos arquivos com preview
- Notas de acompanhamento nos chamados
- Responsivo para desktop e mobile

## 🚀 Como usar

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/sistema-tickets.git
cd sistema-tickets

# Instalar dependências
npm install
```

### Execução

```bash
# Iniciar em modo produção
npm start

# Iniciar em modo desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 📄 Estrutura do projeto

```
sistema-tickets/
├── dist/                   # Arquivos de distribuição (produção)
│   ├── assets/             # Recursos estáticos
│   │   ├── css/            # Folhas de estilo minificadas
│   │   └── js/             # Arquivos JavaScript minificados
│   ├── index.html          # Página de abertura de chamados
│   ├── admin.html          # Painel administrativo
│   ├── 404.html            # Página de erro 404
│   └── server.js           # Servidor Express para produção
├── src/                    # Código fonte (desenvolvimento)
│   ├── styles.css          # Estilos CSS
│   ├── script.js           # JavaScript do formulário
│   ├── admin.js            # JavaScript do painel admin
│   └── database.js         # Simulação SQLite com localStorage
├── package.json            # Configurações do projeto
├── .gitignore              # Arquivos ignorados pelo Git
└── README.md               # Documentação
```

## 🛠️ Tecnologias

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Express.js (para servir em produção)
- **Banco de Dados**: Simulação SQLite com localStorage
- **Segurança**: Helmet para cabeçalhos HTTP seguros
- **Performance**: Compression para compressão gzip

## 📦 Preparar para produção

```bash
# Construir arquivos minificados
npm run build

# Iniciar servidor de produção
npm start
```

## 🧑‍💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento com recarga automática
npm run dev
```

## 🔒 Segurança

O sistema implementa as seguintes medidas de segurança:

- Cabeçalhos HTTP seguros com Helmet
- Content Security Policy para prevenção de XSS
- Validação de dados no cliente

## 📱 Compatibilidade

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Design responsivo para todos os dispositivos