# Ignis Cup — Dashboard

Painel de acompanhamento da Ignis Cup: ranking geral, pontuação semana a
semana, detalhamento por universo e peso de cada critério.

## Estrutura

```
.
├── index.html          página principal
├── css/style.css        estilos
├── js/app.js            lógica do painel (lê data/data.json)
├── data/data.json        dados da planilha (Seção, Colaborador, equipe)
├── assets/logo.png       logo exibida no cabeçalho
└── .github/workflows/deploy.yml   publica em GitHub Pages a cada push na main
```
