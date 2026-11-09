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

## Sistema administrativo

Painel em `src/admin/` (Tailwind v4 + shadcn/ui, TanStack Table, Recharts). Carregado sob demanda; o CSS do site público fica em uma camada separada (`src/styles/public.css`). Detalhes, decisões, testes e limitações: [docs/admin-redesign-report.md](docs/admin-redesign-report.md).

```bash
npm run check        # lint + typecheck + testes unitários + build
npm run test:e2e     # testes funcionais e de acessibilidade (Playwright, Edge instalado)
npm run screenshots  # capturas em docs/screenshots
```

## Blog

- Público: `/#/blog` (lista) e `/#/blog/<slug>` (artigo). As últimas 3 notícias também aparecem na página inicial.
- Painel: **Blog e notícias** (`/#/painel/blog`). Situações: rascunho → em revisão → publicado (a data de publicação pode ser futura, e o post fica agendado).
- Permissões: administrador e equipe administrativa escrevem e publicam; **voluntários** escrevem, veem só os próprios textos e enviam para revisão.
- Editor visual (TipTap) com negrito, itálico, sublinhado, riscado, código, títulos, listas, citação, bloco de código, linha divisória e links. O texto é salvo como HTML e **filtrado com DOMPurify** antes de salvar e de exibir (só a formatação do editor passa; scripts, estilos e imagens externas não). Posts antigos em texto simples são convertidos ao abrir. A foto de capa é reduzida (1200 px) antes de salvar.
- Como o resto do MVP, os posts ficam no `localStorage` (`asa_blog_v1`): só aparecem no navegador onde foram escritos. Para outras pessoas verem, é preciso um backend (ex.: Supabase).

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

## Landing: scroll storytelling

A landing usa animações vinculadas ao progresso do scroll, sem biblioteca externa (`src/hooks/useMotion.ts`, `src/lib/motion.ts`, componentes em `src/components/story/`).

- Em telas largas (> 900 px) e sem `prefers-reduced-motion: reduce`, hero, atividades e indicadores usam blocos *sticky* curtos.
- Em telas estreitas ou com movimento reduzido, a página é estática e todo o conteúdo aparece direto.
- **Fotos provisórias:** só existem 3 fotografias em `public/images/`. As cenas de atividades estão em `src/components/story/ActivitiesStory.tsx` (`SCENES`): troque `photo` e `alt` pelas fotos reais de cada oficina.
- As imagens são servidas em WebP (`*.webp`); os `.jpg` originais ficam como fonte.
