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

## Publicar no GitHub Pages

1. Suba esta pasta como um repositório no GitHub (pode ser público ou
   privado, desde que o plano permita Pages em repositório privado).
2. Em **Settings → Pages**, em "Build and deployment", escolha a fonte
   **GitHub Actions** (o workflow em `.github/workflows/deploy.yml` já
   está pronto — não precisa mexer em nada).
3. Dê um push para a branch `main`. Em alguns minutos o painel fica
   disponível em `https://<seu-usuário>.github.io/<nome-do-repo>/`.

Se preferir não usar Actions, também funciona apontar Pages direto para
a branch `main` / pasta raiz — o site é só HTML/CSS/JS estático.

## Atualizar os dados

Quando tiver uma nova semana de resultados, gere um novo `data/data.json`
no mesmo formato (chaves `secao`, `colab`, `equipe`) e substitua o
arquivo. Não é preciso alterar `index.html`, `css` ou `js`.

## Trocar logo e título

A logo (`assets/logo.png`) e o título podem ser trocados por quem estiver
vendo o painel, direto pela interface (clique na logo ou no título) — a
escolha fica salva no navegador de cada pessoa. Para mudar o padrão que
todo mundo vê ao abrir pela primeira vez, troque o arquivo
`assets/logo.png` e o texto "Ignis Cup" dentro de `index.html`.
