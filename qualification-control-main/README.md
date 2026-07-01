# ⚓ Qualification Control — Offshore

Sistema web de controle de qualificação para embarque offshore.
Protótipo funcional com dados fictícios para validação visual e de usabilidade.

## 🌐 Acesso

Após habilitar o GitHub Pages, o sistema estará disponível em:
```
https://IsabellaPlouvier.github.io/qualification-control/
```

### Como habilitar o GitHub Pages:
1. Vá em **Settings** → **Pages** no repositório
2. Em **Source**, selecione **Deploy from a branch**
3. Escolha **branch: main** e **folder: / (root)**
4. Clique em **Save**
5. Aguarde 1-2 minutos e acesse o link acima

---

## 🖥️ Telas do sistema

### 📋 Visão por Área
- Tabela por grupo (FSE Transacionais, CSA, Overhaul, Engenharia, Projetos, Estrangeiros)
- Células coloridas por status: 🟢 OK / 🟡 Vencendo / 🔴 Vencido / 🟠 Parcial / ⚪ N/A
- Filtros por disciplina e grupo
- Clique no nome do colaborador para abrir o card

### 🪪 Card do Colaborador
- Todos os requisitos organizados por categoria
- Status visual com badges coloridos
- Dropdown para atualizar o status de renovação
- Campo de data para agendamentos

### 🔔 Painel de Alertas
- Lista unificada de tudo que está vencido ou vencendo
- Contadores no topo (vencidos, vencendo, em renovação)
- Filtros por grupo, categoria, status e janela de dias
- Dropdown de renovação editável inline

---

## 📁 Estrutura de arquivos

```
qualification-control/
├── index.html   ← Página principal
├── style.css    ← Todos os estilos
├── app.js       ← Lógica da aplicação
├── data.js      ← Dados dos colaboradores e requisitos
└── README.md    ← Este arquivo
```

---

## ✏️ Como editar os dados

Todos os dados estão no arquivo `data.js`. Para adicionar ou editar:

### Adicionar colaborador:
Localize o array `employees` e adicione um novo objeto seguindo o padrão:
```js
{
  id: 13,
  name: "Nome Completo",
  group: "fse_trans",       // fse_trans | csa | overhaul | engineering | projects | foreign
  discipline: "mec",        // mec | ele
  regime: "offshore",       // offshore | onshore | mixed
  country: "BR",
  requirements: {
    aso_periodico: { status: "ok", expiry: "2027-06-15" },
    nr35: { status: "ok", expiry: "2027-03-10" },
    // ...
  }
}
```

### Status disponíveis:
- `ok` — Em dia
- `expiring` — Vencendo (calculado automaticamente pelo sistema)
- `expired` — Vencido (calculado automaticamente pelo sistema)
- `partial` — Atende Parcial (sem vencimento)
- `missing` — Não tem
- `na` — Não aplicável

### Status de renovação (campo `renewal`):
- `not_requested` — Não solicitado
- `requested_hr` — Solicitado ao RH
- `scheduled` — Agendado
- `waiting_certificate` — Aguardando certificado

---

## 🚀 Próximos passos

- [ ] Autenticação com login (Supabase Auth)
- [ ] Banco de dados real com persistência (Supabase)
- [ ] Cadastro de colaboradores e requisitos pelo sistema (sem editar data.js)
- [ ] Alertas automáticos por e-mail
- [ ] Controle de permissões (admin / visualização)
- [ ] Exportação para Excel/PDF
