import type { BlogPost } from '../lib/blog'

/**
 * Posts ilustrativos do blog (dados de demonstração, como as demais coleções do MVP).
 * Aparecem enquanto nada foi cadastrado no painel; ao criar, editar ou remover qualquer post,
 * a lista passa a ser a do navegador. Nenhum nome ou fato aqui é real.
 */
export const INITIAL_POSTS: BlogPost[] = [
  {
    id: 'pm1',
    slug: 'feira-de-talentos-reuniu-familias-na-sede',
    titulo: 'Feira de Talentos reuniu famílias na sede do Instituto',
    resumo: 'Trabalhos das oficinas de artesanato, música e informática foram apresentados em uma tarde de sábado cheia de gente.',
    corpo:
      '<p>No último sábado, a sede do Instituto A.S.A. abriu as portas para a <strong>Feira de Talentos</strong>, que mostrou o que as crianças e adolescentes aprenderam ao longo do semestre.</p>' +
      '<h2>O que teve na programação</h2>' +
      '<ul><li><p>Apresentação do grupo de violão e flauta</p></li><li><p>Exposição de artesanato e pinturas</p></li><li><p>Demonstração de projetos feitos no laboratório de informática</p></li><li><p>Lanche coletivo preparado com doações da comunidade</p></li></ul>' +
      '<blockquote><p>Ver as famílias reunidas, orgulhosas do que os filhos produziram, é o que dá sentido ao trabalho.</p></blockquote>' +
      '<h3>Obrigado, voluntários</h3>' +
      '<p>A feira só aconteceu graças a quem montou as bancadas, organizou a fila do lanche e conduziu as apresentações. <em>Se você quer participar das próximas ações</em>, procure a equipe pelo WhatsApp.</p>',
    capa: './images/hero-grupo.webp',
    capaAlt: 'Grupo de crianças e voluntários reunidos na sede do Instituto',
    autor: 'Equipe A.S.A.',
    autorId: 'u-adm',
    categoria: 'Eventos',
    status: 'publicado',
    publicadoEm: '2026-11-04',
    criadoEm: '2026-11-03',
  },
  {
    id: 'pm2',
    slug: 'campanha-do-agasalho-chega-ao-ultimo-mes',
    titulo: 'Campanha do Agasalho chega ao último mês de arrecadação',
    resumo: 'Já foram recebidas centenas de peças. Veja o que ainda falta e onde deixar a sua doação.',
    corpo:
      '<p>A <strong>Campanha do Agasalho</strong> entra no último mês e ainda precisa de ajuda para garantir roupas de frio para todas as famílias atendidas.</p>' +
      '<h2>O que ainda precisamos</h2>' +
      '<ol><li><p>Casacos e moletons infantis (tamanhos 4 a 14)</p></li><li><p>Cobertores e mantas</p></li><li><p>Meias, gorros e luvas</p></li></ol>' +
      '<h2>Onde entregar</h2>' +
      '<p>Na sede do Instituto, de segunda a sexta, no horário comercial. As peças precisam estar limpas e em bom estado. Dúvidas? Escreva para <a href="mailto:contato@asa-condor.org.br">contato@asa-condor.org.br</a>.</p>',
    capa: './images/impact.webp',
    capaAlt: '',
    autor: 'Camila Ferreira',
    autorId: 'u-vol',
    categoria: 'Doações',
    status: 'publicado',
    publicadoEm: '2026-10-22',
    criadoEm: '2026-10-20',
  },
  {
    id: 'pm3',
    slug: 'oficina-de-informatica-ensina-criar-curriculo',
    titulo: 'Oficina de informática ensina adolescentes a criar currículo',
    resumo: 'Na trilha de preparação para o trabalho, a turma montou o primeiro currículo e aprendeu a usar e-mail profissional.',
    corpo:
      '<p>Dentro do projeto de preparação para o trabalho, os adolescentes da oficina de informática construíram, passo a passo, o <strong>primeiro currículo</strong>.</p>' +
      '<p>Além do documento, a turma praticou habilidades que valem em qualquer emprego: <em>escrever com clareza</em>, organizar arquivos e se apresentar com segurança.</p>' +
      '<h3>Um exemplo do que aprenderam</h3>' +
      '<p>Para manter os arquivos organizados, combinaram um padrão de nome:</p>' +
      '<pre><code>curriculo-nome-sobrenome-2026.pdf</code></pre>' +
      '<p>Parece detalhe, mas faz diferença quando o recrutador abre dezenas de arquivos por dia.</p>',
    capa: './images/about.webp',
    capaAlt: 'Adolescentes durante a oficina de informática',
    autor: 'Equipe A.S.A.',
    autorId: 'u-adm',
    categoria: 'Atividades',
    status: 'publicado',
    publicadoEm: '2026-10-08',
    criadoEm: '2026-10-07',
  },
  {
    id: 'pm4',
    slug: 'prestacao-de-contas-do-terceiro-trimestre',
    titulo: 'Prestação de contas do terceiro trimestre',
    resumo: 'Resumo de como as doações e os recursos foram usados entre julho e setembro.',
    corpo:
      '<p>Transparência é parte do nosso compromisso com quem ajuda. Neste resumo mostramos, de forma simples, <strong>como os recursos foram aplicados</strong> no terceiro trimestre.</p>' +
      '<h2>Para onde foram as doações</h2>' +
      '<ul><li><p>Alimentação das oficinas e cestas para as famílias</p></li><li><p>Material escolar e de artesanato</p></li><li><p>Manutenção da sede e contas básicas</p></li></ul>' +
      '<p>Os valores detalhados estão disponíveis na sede para quem quiser conferir. Valores deste exemplo são ilustrativos.</p>',
    capa: '',
    capaAlt: '',
    autor: 'Equipe A.S.A.',
    autorId: 'u-adm',
    categoria: 'Transparência',
    status: 'publicado',
    publicadoEm: '2026-10-01',
    criadoEm: '2026-09-30',
  },
  {
    id: 'pm5',
    slug: 'por-que-me-tornei-voluntaria',
    titulo: 'Por que me tornei voluntária no Instituto',
    resumo: 'Um relato em primeira pessoa sobre o que a gente aprende ao ensinar.',
    corpo:
      '<p>Cheguei ao Instituto para ajudar a organizar o estoque e acabei ficando para o reforço escolar. Hoje, <strong>quarta-feira é o meu dia favorito</strong> da semana.</p>' +
      '<p>Aprendi que ensinar é, antes de tudo, <em>escutar</em>. Cada criança chega com um jeito diferente de entender o mundo.</p>' +
      '<blockquote><p>Não é sobre dar aulas perfeitas, é sobre aparecer.</p></blockquote>' +
      '<p>Se você pensa em ajudar, o caminho é simples: preencha a candidatura de voluntário aqui no site e a equipe entra em contato.</p>',
    capa: './images/camiseta-equipe.webp',
    capaAlt: 'Voluntários vestindo a camiseta da equipe',
    autor: 'Camila Ferreira',
    autorId: 'u-vol',
    categoria: 'Voluntariado',
    status: 'publicado',
    publicadoEm: '2026-09-15',
    criadoEm: '2026-09-12',
  },
  {
    id: 'pm6',
    slug: 'balanco-das-oficinas-do-segundo-semestre',
    titulo: 'Balanço das oficinas do segundo semestre',
    resumo: 'Texto enviado por voluntário, aguardando revisão da equipe.',
    corpo:
      '<p>O segundo semestre trouxe turmas cheias nas oficinas de música e reforço escolar. Estamos organizando os números para compartilhar com todos.</p>' +
      '<p><em>Rascunho enviado para revisão.</em></p>',
    capa: '',
    capaAlt: '',
    autor: 'Camila Ferreira',
    autorId: 'u-vol',
    categoria: 'Notícias',
    status: 'revisao',
    publicadoEm: '2026-11-08',
    criadoEm: '2026-11-08',
  },
  {
    id: 'pm7',
    slug: 'natal-solidario-como-participar',
    titulo: 'Natal Solidário: como participar',
    resumo: 'Planejamento da ação de fim de ano. Agendado para publicação em dezembro.',
    corpo:
      '<p>Neste fim de ano, o <strong>Natal Solidário</strong> vai reunir presentes e uma ceia para as famílias atendidas.</p>' +
      '<h2>Como ajudar</h2>' +
      '<ul><li><p>Apadrinhar um presente</p></li><li><p>Doar alimentos para a ceia</p></li><li><p>Ser voluntário no dia</p></li></ul>',
    capa: './images/hero.webp',
    capaAlt: '',
    autor: 'Equipe A.S.A.',
    autorId: 'u-adm',
    categoria: 'Eventos',
    status: 'publicado',
    publicadoEm: '2026-12-01',
    criadoEm: '2026-11-07',
  },
]
