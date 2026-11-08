# ONG ASA — MVP

Landing institucional + painel interno (cadastros e relatórios) com dados mockados.

**ASA** = Ação Social e Acolhimento

## O que inclui

- Landing page apresentando a organização
- Login demo do painel
- Cadastro de crianças
- Cadastro de quem ajuda (voluntários, doadores, padrinhos, parceiros)
- Registro de doações
- Relatórios com filtro de período, gráficos, exportação CSV e impressão/PDF
- Persistência local no navegador (`localStorage`)

## Demo

- Site: `/`
- Sistema: `/#/sistema`
- Usuário: `admin@ongasa.org.br`
- Senha: `asa2025`

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

A build usa `base: './'` e `HashRouter`, então funciona em qualquer caminho do GitHub Pages.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `ong-asa`)
2. Envie o código:

```bash
git init
git add .
git commit -m "MVP ONG ASA"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/ong-asa.git
git push -u origin main
```

3. No repositório: **Settings → Pages → Build and deployment**
   - Source: **GitHub Actions**
4. O workflow em `.github/workflows/deploy.yml` publica a pasta `dist` automaticamente a cada push na `main`.

Ou, manualmente:

```bash
npm run build
# Faça upload da pasta dist / use action peaceiris/actions-gh-pages
```

Site ficará em: `https://SEU_USUARIO.github.io/ong-asa/`
