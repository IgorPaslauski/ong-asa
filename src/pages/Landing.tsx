import { Link } from 'react-router-dom'
import { ORG } from '../data/mock'
import '../styles/landing.css'

export default function Landing() {
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-media" aria-hidden="true">
          <img src="./images/hero.jpg" alt="" />
        </div>

        <div className="container site-nav">
          <div className="brand">
            <span className="brand-mark">ASA</span>
            <span className="brand-sub">{ORG.fullName}</span>
          </div>
          <nav className="nav-links" aria-label="Principal">
            <a href="#sobre">Sobre</a>
            <a href="#atuacao">Atuação</a>
            <a href="#impacto">Impacto</a>
            <Link className="btn btn-ghost btn-sm" to="/sistema">
              Acessar sistema
            </Link>
          </nav>
        </div>

        <div className="hero-content">
          <h1 className="hero-brand anim-in">ASA</h1>
          <p className="hero-copy anim-in-delay">{ORG.tagline}</p>
          <div className="hero-actions anim-in-delay-2">
            <a className="btn btn-primary" href="#ajudar">
              Quero ajudar
            </a>
            <Link className="btn btn-ghost" to="/sistema">
              Painel da equipe
            </Link>
          </div>
        </div>
      </header>

      <section className="section" id="sobre">
        <div className="container split">
          <div>
            <p className="section-kicker">Quem somos</p>
            <h2>Uma asa que acolhe quem mais precisa.</h2>
            <p className="section-lead">
              A ONG ASA — {ORG.fullName} — nasceu em {ORG.founded} para oferecer apoio
              concreto a crianças e famílias em situação de vulnerabilidade: reforço
              escolar, alimentação, escuta e presença comunitária.
            </p>
            <p className="section-lead" style={{ marginTop: '1rem' }}>
              Trabalhamos lado a lado com voluntários, padrinhos e parceiros locais
              para transformar solidariedade em rotina — com transparência e cuidado.
            </p>
          </div>
          <div className="split-media">
            <img src="./images/about.jpg" alt="Crianças e educadores em atividade" />
          </div>
        </div>
      </section>

      <section className="section" id="atuacao" style={{ paddingTop: 0 }}>
        <div className="container">
          <p className="section-kicker">Como atuamos</p>
          <h2>Três frentes, um compromisso.</h2>
          <div className="pillars">
            <article className="pillar">
              <h3>Educação</h3>
              <p>
                Reforço escolar, oficinas e acompanhamento para que cada criança
                avance com confiança na escola e na vida.
              </p>
            </article>
            <article className="pillar">
              <h3>Acolhimento</h3>
              <p>
                Escuta, orientação familiar e rede de apoio para fortalecer vínculos
                e reduzir riscos sociais.
              </p>
            </article>
            <article className="pillar">
              <h3>Assistência</h3>
              <p>
                Cestas, material escolar e kits de vestuário distribuídos com
                critério, cadastro e rastreabilidade.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section" id="impacto" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="impact-band">
            <div>
              <p className="section-kicker" style={{ color: 'rgba(244,247,242,0.7)' }}>
                Impacto recente
              </p>
              <h2>Números que contam histórias.</h2>
              <p>
                Dados ilustrativos do MVP — no sistema completo, estes indicadores
                saem direto dos cadastros e doações.
              </p>
            </div>
            <div className="impact-stats">
              <div className="impact-stat">
                <strong>126</strong>
                <span>crianças acompanhadas</span>
              </div>
              <div className="impact-stat">
                <strong>48</strong>
                <span>voluntários ativos</span>
              </div>
              <div className="impact-stat">
                <strong>R$ 86 mil</strong>
                <span>em doações no ano</span>
              </div>
              <div className="impact-stat">
                <strong>920</strong>
                <span>cestas entregues</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section cta-section" id="ajudar">
        <div className="container">
          <p className="section-kicker">Participe</p>
          <h2>Doe tempo, recursos ou presença.</h2>
          <p className="section-lead">
            Seja voluntário, padrinho ou parceiro. A equipe ASA organiza cada
            contribuição no painel interno — com relatórios claros para prestar
            contas.
          </p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <a className="btn btn-primary" href={`mailto:${ORG.email}`}>
              Falar com a ASA
            </a>
            <Link className="btn btn-ghost-dark" to="/sistema">
              Ver painel demo
            </Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">ASA</div>
              <p>{ORG.fullName}</p>
              <p style={{ marginTop: '0.75rem' }}>{ORG.tagline}</p>
            </div>
            <div>
              <h4>Contato</h4>
              <p>{ORG.email}</p>
              <p>{ORG.phone}</p>
              <p>{ORG.address}</p>
            </div>
            <div>
              <h4>Sistema</h4>
              <p>
                <Link to="/sistema">Painel administrativo</Link>
              </p>
              <p>MVP com dados mockados para apresentação.</p>
            </div>
          </div>
          <div className="footer-note">
            <span>© {new Date().getFullYear()} ONG ASA — MVP de demonstração</span>
            <span>Feito para apresentação institucional</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
