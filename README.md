# Instituto A.S.A. — Associação Semeando o Amanhã

Landing institucional e painel interno para o Instituto A.S.A., em Condor/RS. O MVP traz dados de demonstração e persiste os cadastros no navegador (`localStorage`).

## O que inclui

- Landing com a história da organização, indicadores e evolução anual
- Números da landing calculados a partir dos cadastros do painel
- Login de demonstração
- Cadastro de crianças
- Cadastro de quem ajuda (voluntários, doadores, padrinhos, parceiros)
- Registro de doações
- Relatórios com filtro de período, gráficos, exportação CSV e impressão

## Demo

- Site: `/`
- Sistema: `/#/sistema`
- Usuário: `admin@asa-condor.org.br`
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

A build usa `base: './'` e `HashRouter`, então funciona no caminho do GitHub Pages (`https://igorpaslauski.github.io/ong-asa/`).

O workflow em `.github/workflows/deploy.yml` publica a pasta `dist` a cada push na `main`. Em **Settings → Pages → Build and deployment**, a origem precisa ser **GitHub Actions**.
