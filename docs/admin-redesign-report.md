# Redesign do sistema administrativo — Instituto A.S.A.

Branch: `redesign-admin-system` (a partir de `redesign-landing-storytelling`). Nada foi publicado nem feito deploy.

## 1. Resumo

O painel administrativo foi refeito sobre **Tailwind CSS v4 + shadcn/ui (Radix)**, com uma camada própria de componentes de domínio: shell com sidebar recolhível, **DataTable único** (TanStack Table), **biblioteca de gráficos** (Recharts) e **estrutura padrão de relatório** com exportação CSV e PDF. Todas as telas compartilham tokens, componentes e padrões de interação.

Situação real encontrada na auditoria (e mantida):

- Aplicação 100 % front-end (React 19 + Vite + HashRouter). **Não há backend.** Os dados ficam em `localStorage` (`asa_children_v3`, `asa_helpers_v3`, `asa_donations_v3`, `asa_activities_v3`), inicializados com dados **demonstrativos** (`src/data/mock.ts`).
- A autenticação é de demonstração (`src/lib/storage.ts`): qualquer e-mail/senha de 4+ caracteres entra. **Não existe modelo de permissões**; todo usuário é administrador.
- A landing lê os mesmos dados (`src/lib/publicStats.ts`). Chaves e formato de armazenamento **não foram alterados**; nenhuma migração foi necessária (teste `store.test.ts` garante a preservação).
- Não existia suíte de testes. Linha de base: `tsc -b` e `vite build` passavam; lint sem erros.

## 2. Decisões técnicas

| Decisão | Motivo |
|---|---|
| Tailwind v4 **sem preflight global**; reset escopado em `.admin-root` | O preflight alteraria a landing. O reset é aplicado também aos portais (diálogos, menus) via a classe `admin-root` nos conteúdos. |
| CSS do site público movido para `@layer public` (`src/styles/public.css`) | Camada de menor prioridade: regras globais da landing (seletores de elemento) não vazam para o admin. A landing não foi redesenhada. |
| Admin carregado com `React.lazy` | O CSS e o JS do painel só entram ao acessar `/sistema` ou `/painel`. |
| Tokens em `.admin-root`, `@theme inline` | Evita colisões com variáveis `:root` da landing (`--radius`, `--accent`, ...). |
| **TanStack Table v8** (e não a v9 recém-lançada) | A v9 mudou o modelo (features opt‑in). A v8.21 tem API estável e documentada; fixada deliberadamente. |
| Filtro e busca antes do TanStack; ordenação e paginação pelo TanStack | A ordenação é feita **sobre o conjunto filtrado inteiro**, nunca só na página atual (há teste). Não há API paginada neste projeto. |
| PDF com jsPDF + autotable, carregado sob demanda | Gera PDF real (cabeçalho institucional, rodapé, paginação, quebras de página). XLSX **não** foi implementado (ver §10). |
| Dinheiro ≠ estimativa | `valor` de doação financeira é dinheiro; nos demais tipos é **estimativa**. Nunca são somados (`src/admin/data/domain.ts`). |

Paleta (observada no Brasil em Gráficos: número grande + frase de escopo e período, explicação sob cada título, séries com cor semântica fixa):
fundo `#F8F9FA`, superfície `#FFF`, texto `#18212B`, secundário `#5B6778` (ajustado de `#64748B` para contraste AA em `#F8F9FA`), borda `#E5E7EB`, verde `#116B56`, azul `#3978B6`, alerta `#D99626`, erro `#C04D4D` (texto de erro usa `#B3403F`). **Verde = dinheiro/regular; azul = bens e serviços (estimativa); âmbar = atenção; cinza = encerrado/neutro** em todos os gráficos e selos.

## 3. Telas alteradas

- **Login** (`/sistema`), **Dashboard** (`/painel/visao-geral`), **Crianças e adolescentes**, **Rede de apoio** (`/painel/pessoas`), **Doações**, **Relatórios** (central + 5 relatórios), **Configurações** (nova).
- Rotas anteriores mantidas. Novas: `/painel/relatorios/{doacoes,atendimentos,atividades,rede-de-apoio,institucional}` e `/painel/configuracoes`.
- Removidos: `src/pages/dashboard/*`, `Login.tsx`, `Drawer`, `Modal`, `styles/dashboard.css` (substituídos). `components/Charts.tsx` permanece porque a **landing** o usa.

## 4. Novos componentes (`src/admin/`)

- `components/ui/`: button, input/textarea, label, badge, card, table, skeleton, alert, separator, checkbox, switch, tooltip, tabs, segmented, dialog + alert-dialog, sheet, dropdown-menu, select, popover, calendar (react-day-picker, pt-BR), command (combobox), sonner, breadcrumb, form (React Hook Form).
- `components/layout/`: `AdminLayout` (sidebar agrupada e recolhível, mobile em Sheet, menu do usuário, link para o site), `PageHeader` (breadcrumb, título, descrição, ações, selo “Dados de demonstração”), `nav.ts`.
- `components/data-table/`: `DataTable`, `SortableHeader`, comparadores (`textSort` pt-BR, `numberSort`, `dateSort`, `enumSort`).
- `components/filters/`: filtros select, combobox pesquisável e intervalo de datas.
- `components/charts/`: `ChartCard` (título, explicação, unidade, período, origem, estado sem dados, “Ver dados em tabela”), `TimeSeriesChart` (linha/área/barras), `HorizontalBarChart`, `CompositionBar`, `Kpi`, `StatStrip`, paleta semântica.
- `components/forms/`: `FormSheet` (RHF + Zod, proteção contra duplo envio, aviso ao descartar), campos padronizados.
- `components/reports/report-shell.tsx`: estrutura única dos relatórios + seletor de período + exportação.
- `components/feedback/`: `ConfirmDialog`, selos de situação.
- `data/`: `store.ts` (hooks reativos e CRUD sobre o armazenamento existente), `domain.ts` (regras de cálculo, períodos, séries).
- `lib/`: formatadores pt-BR, exportações (CSV/PDF), preferências visuais (`asa_ui_*`, separadas dos dados).

## 5. Funcionalidades

- **Dashboard**: período (presets relativos à data de hoje), 4 indicadores (dinheiro recebido, bens/serviços estimados, crianças ativas, rede ativa) com rótulo “No período” × “Situação atual”, evolução das doações (mensal/anual), destinação (dinheiro/estimativa), situação das crianças + bairros, ações por ano, pendências reais (doações pendentes, cadastros em acompanhamento) com atalho para a lista já filtrada, atividade recente e ações rápidas. **Removidos os números “editoriais” fixos** que antes se misturavam aos dados do sistema.
- **Crianças**: tabela padronizada, busca, filtros (situação, faixa etária, bairro, escola), ordenação, mudança rápida de situação, detalhe (idade, tempo no programa), formulário por grupos, remoção com confirmação. **Exportação anonimizada** (sem nome, responsável, telefone ou observações).
- **Rede de apoio**: tabela única, filtros (participação, situação, cidade), contribuição por pessoa (derivada de `doadorId`), detalhe com **histórico real de doações**, ativar/desativar, aviso ao remover quem tem doações. Exportação sem e-mail/telefone.
- **Doações**: filtros por período, doador (combobox), tipo, destinação e situação; indicadores que acompanham os filtros; confirmar/cancelar/remover; detalhe; exportação CSV/PDF do conjunto filtrado com escopo descrito no arquivo.
- **Relatórios**: Doações, Atendimentos (agregado), Atividades, Rede de apoio, Resumo institucional — todos com cabeçalho (período, data de geração, filtros), resumo, gráficos com alternativa em tabela, tabela detalhada, **metodologia** (origem, definições, observações, aviso de dados demonstrativos) e exportação CSV/PDF.
- **Configurações**: backup JSON dos dados, restaurar preferências de exibição, restaurar dados de demonstração (com confirmação; antes era um botão solto no relatório).
- **Atalhos**: `?novo=1` abre o cadastro de cada módulo; filtros e busca da tabela persistem na sessão ao navegar; colunas visíveis e tamanho da página persistem por navegador.

## 6. Tabelas

Ordenação (indicador visível, `aria-sort`, comparadores por tipo), busca sem acentos, filtros em barra única, “Limpar filtros”, paginação com 10/25/50/100 por página e contagem “1–10 de 30 (filtrado de 32)”, colunas configuráveis, estados vazio / sem resultado / carregando / erro, ações por linha em menu, exportação CSV e PDF do conjunto filtrado e ordenado. Em telas < 768 px a tabela vira **lista de cartões com todos os campos visíveis** (nada é ocultado silenciosamente).

## 7. Gráficos

Recharts com componentes próprios. Todo gráfico traz título, explicação, unidade, período, origem dos dados, tooltip padronizado pt-BR, legenda quando necessário, estado sem dados, `role="img"` com resumo textual e tabela alternativa (“Ver dados em tabela”). Sem gráficos de pizza; composição usa barra empilhada. Nenhuma variação percentual ou tendência é inventada.

## 8. Relatórios — padronização

Mesma estrutura em todos (`ReportShell`). PDFs têm cabeçalho institucional, período, filtros, data de geração, resumo, tabela com quebras de página e cabeçalho repetido, rodapé com “Página X de Y”. Exportações respeitam os filtros ativos e o escopo vai no próprio arquivo (CSV com BOM, separador `;`, proteção contra injeção de fórmulas).

## 9. Resultados da validação (executados em 09/11/2026)

| Verificação | Resultado |
|---|---|
| `tsc -b` (typecheck) | sem erros |
| `vite build` | OK (chunk do painel ≈ 976 kB / 281 kB gzip, carregado sob demanda) |
| Testes unitários/componente (`vitest`) | **39 / 39 passaram** (domínio, exportação, comparadores, preservação de dados, validações, DataTable) |
| Funcionais (Playwright + Edge instalado) | **10 / 10 passaram** (login, navegação, CRUD de crianças, exportações CSV/PDF, filtros, relatórios, histórico da rede, mobile, teclado, landing isolada) |
| Acessibilidade (axe, WCAG 2.0/2.1/2.2 A+AA) | **11 rotas sem violações** (depois de corrigir listas de definição, nome acessível e `aria-controls`) |
| `oxlint` | 0 erros; 16 avisos (regras do React Compiler sobre `Date` em render, `setState` em efeitos de atalho `?novo=1`, reexport em arquivos de UI) |
| Capturas de tela | `docs/screenshots/{390,768,1366,1440,1920}/` (login, dashboard, crianças, rede, doações, relatórios, formulário) |

Inspeção visual feita nas larguras 390, 1366, 1440 e 1920 px (768 px apenas capturado, não revisado quadro a quadro). A landing foi conferida visualmente e por teste (fundo e ausência do CSS do admin).

**Não verificado:** impressão do PDF em papel; leitores de tela reais (NVDA/VoiceOver); Safari/Firefox (testado em Edge/Chromium); contraste em modo escuro (não existe tema escuro).

## 10. Limitações e pendências

- **Sem backend**: dados só no navegador; apagar os dados do navegador apaga tudo (use o backup em Configurações).
- **Sem permissões reais**: a autenticação é de demonstração. Privacidade foi tratada por desenho (exportações e relatórios sem dados pessoais), mas não substitui autorização no servidor.
- **XLSX** não implementado (CSV com separador `;` e BOM abre corretamente no Excel pt-BR). PDFs não incluem os gráficos, apenas resumo e tabela.
- Atividades só são lidas (não há cadastro de atividades no sistema); por isso não existe menu “Atividades”, apenas o relatório.
- Importação de backup não foi implementada (apenas exportação).
- Campos `dataEntrada`/`desde` e `destinacao` passaram a ser **obrigatórios** nos formulários (antes aceitavam vazio); nome, e-mail, idade 0–18 e responsável seguem as regras originais. O padrão de cidade no novo apoiador mudou de “São Paulo” (resíduo do mock) para “Condor”.
- Chunk do painel acima de 500 kB (Recharts + Radix); pode ser dividido por rota se for necessário.

## 11. Como testar localmente

```bash
cd ong-asa
npm install
npm run dev                    # http://localhost:5173/#/sistema  (admin@asa-condor.org.br / asa2025)
npm run check                  # lint + typecheck + vitest + build
npm run build && npm run test:e2e   # Playwright (usa Edge; PW_CHANNEL=chrome para Chrome)
npm run screenshots            # regenera docs/screenshots
```
