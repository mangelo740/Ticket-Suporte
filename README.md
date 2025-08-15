# Sistema de Abertura de Chamados - Vanilla JavaScript

Sistema completo de gerenciamento de chamados desenvolvido em HTML, CSS e JavaScript puro com simulação de banco SQLite usando localStorage.

## 🚀 Funcionalidades

### 📋 Sistema de Tickets
- Formulário completo para abertura de chamados
- Upload de múltiplos arquivos (imagens, documentos)
- Preview de imagens
- Validação de campos obrigatórios
- Armazenamento local simulando SQLite

### 🔧 Painel Administrativo
- **Dashboard:** Visão geral com estatísticas em tempo real
- **Gerenciamento:** Lista completa de tickets com filtros
- **Detalhes:** Visualização completa de cada ticket
- **Edição:** Alteração de status e prioridade
- **Notas:** Sistema de acompanhamento
- **Download:** Arquivos anexados
- **Exclusão:** Remoção de tickets

## 📁 Estrutura de Arquivos

```
ticket-system-vanilla/
├── index.html          # Página principal - formulário de tickets
├── admin.html          # Painel administrativo
├── styles.css          # Estilos CSS responsivos
├── script.js           # JavaScript do formulário
├── admin.js            # JavaScript do painel admin
├── database.js         # Simulação SQLite com localStorage
└── README.md           # Documentação
```

## 🛠️ Tecnologias Utilizadas

- **HTML5:** Estrutura semântica
- **CSS3:** Estilos modernos e responsivos
- **JavaScript ES6+:** Funcionalidades interativas
- **LocalStorage:** Simulação de banco SQLite
- **Font Awesome:** Ícones

## 🎯 Como Usar

### 1. Abertura de Chamados
1. Abra `index.html` no navegador
2. Preencha os campos obrigatórios:
   - Nome e Sobrenome
   - Setor
   - Área de Destino
   - Descrição do problema
3. Opcionalmente anexe arquivos
4. Clique em "Enviar Chamado"

### 2. Gerenciamento (Admin)
1. Clique no botão "Painel Admin" ou acesse `admin.html`
2. **Dashboard:** Veja estatísticas gerais
3. **Tickets:** Visualize e filtre todos os chamados
4. **Estatísticas:** Relatórios detalhados

### 3. Funcionalidades do Admin
- **Filtrar por:** Status, Prioridade, Pesquisa
- **Atualizar:** Status e prioridade de tickets
- **Adicionar:** Notas de acompanhamento
- **Download:** Arquivos anexados
- **Deletar:** Tickets completos

## 💾 Banco de Dados

O sistema simula um banco SQLite usando localStorage do navegador com:

### Estrutura de Dados
```javascript
{
  tickets: [
    {
      id: "1",
      ticketNumber: "TK0001",
      firstName: "João",
      lastName: "Silva",
      department: "TI",
      destinationArea: "Suporte Técnico",
      description: "Problema com impressora",
      contact: "(11) 99999-9999",
      files: [...],
      status: "Aberto",
      priority: "Média",
      notes: [...],
      createdAt: "2024-01-01T10:00:00.000Z",
      updatedAt: "2024-01-01T10:00:00.000Z"
    }
  ],
  nextId: 2,
  settings: {...}
}
```

### Operações CRUD
- **CREATE:** Criar novos tickets
- **READ:** Buscar tickets (todos, por ID, status, prioridade)
- **UPDATE:** Atualizar campos, adicionar notas
- **DELETE:** Remover tickets
- **FILTER:** Pesquisa e filtros avançados
- **STATS:** Estatísticas e relatórios

## 🎨 Interface

### Design Responsivo
- Layout adaptativo para desktop e mobile
- Gradientes modernos
- Animações suaves
- Componentes intuitivos

### Componentes
- **Cards:** Exibição de informações
- **Modais:** Detalhes de tickets
- **Filtros:** Pesquisa avançada
- **Badges:** Status e prioridades
- **Toast:** Notificações
- **Tabs:** Navegação do admin

## 📱 Compatibilidade

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Responsive Design

## 🔧 Configuração

Não necessita instalação ou configuração. Apenas:

1. Clone ou baixe os arquivos
2. Abra `index.html` em um navegador web
3. Comece a usar!

## 📊 Funcionalidades Avançadas

### Filtros e Pesquisa
- Pesquisa por número do ticket, nome, departamento
- Filtro por status (Aberto, Em Andamento, Resolvido, Fechado)
- Filtro por prioridade (Crítica, Alta, Média, Baixa)

### Sistema de Arquivos
- Upload múltiplo
- Preview de imagens
- Validação de tipo e tamanho
- Download direto pelo admin

### Notificações
- Toast messages para feedback
- Confirmações de ações
- Alertas de erro

## 🚀 Próximos Passos

Para evolução do sistema:

1. **Backend Real:** Integração com Node.js + SQLite
2. **Autenticação:** Sistema de login
3. **Email:** Notificações automáticas
4. **Relatórios:** Exportação PDF/CSV
5. **API:** Endpoints REST
6. **PWA:** Progressive Web App

## 📝 Licença

Projeto de demonstração - Livre para uso e modificação.