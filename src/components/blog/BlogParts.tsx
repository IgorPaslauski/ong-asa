import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logoUrl from '../../assets/logo-asa.png'
import { ORG } from '../../data/org'
import { excerptOf, formatLongDate, getPublicPosts, safeImageSrc, type BlogPost } from '../../lib/blog'

/** Posts públicos, atualizados quando a equipe publica (mesma aba, outras abas ou ao voltar à janela). */
export function usePublicPosts(): BlogPost[] {
  const [posts, setPosts] = useState(getPublicPosts)
  useEffect(() => {
    const refresh = () => setPosts(getPublicPosts())
    window.addEventListener('asa:data-changed', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('asa:data-changed', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return posts
}

export function BlogHeader({ current }: { current?: 'blog' }) {
  return (
    <header className="site-header is-solid">
      <div className="blog-wrap header-row">
        <Link className="logo" to="/" aria-label={`${ORG.shortName} — ${ORG.legalName}, página inicial`}>
          <img className="logo-img" src={logoUrl} alt="" aria-hidden="true" width={44} height={44} />
          <span className="logo-name">{ORG.legalName}</span>
        </Link>
        <nav className="blog-nav" aria-label="Principal">
          <Link to="/">Início</Link>
          <Link to="/blog" aria-current={current === 'blog' ? 'page' : undefined}>
            Blog
          </Link>
          <Link to="/sistema" className="blog-nav-team">
            Área da equipe
          </Link>
        </nav>
      </div>
    </header>
  )
}

export function BlogFooter() {
  return (
    <footer className="site-footer on-dark">
      <div className="blog-wrap footer-grid">
        <div>
          <img className="footer-logo" src={logoUrl} alt="Instituto A.S.A. — Semeando o Amanhã" width={96} height={96} loading="lazy" />
          <p>
            {ORG.name} — {ORG.legalName}
          </p>
          <p className="footer-muted">CNPJ {ORG.cnpj}</p>
        </div>
        <div>
          <h2>Contato</h2>
          <p>
            <a href="tel:+5555991349705">{ORG.phone}</a> · <a href="tel:+555533791685">{ORG.phoneAlt}</a>
          </p>
          <p>
            <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
          </p>
        </div>
        <div>
          <h2>Site</h2>
          <p>
            <Link to="/">Página inicial</Link>
          </p>
          <p>
            <Link to="/blog">Blog</Link>
          </p>
        </div>
      </div>
      <div className="blog-wrap footer-note">
        © {new Date().getFullYear()} {ORG.legalName}
      </div>
    </footer>
  )
}

export function PostCard({ post, featured = false, headingLevel = 3 }: { post: BlogPost; featured?: boolean; headingLevel?: 2 | 3 }) {
  const cover = safeImageSrc(post.capa)
  const H = `h${headingLevel}` as 'h2' | 'h3'
  return (
    <article className={`post-card${featured ? ' post-card--featured' : ''}`}>
      <Link to={`/blog/${post.slug}`} className="post-card-media" tabIndex={-1} aria-hidden="true">
        {cover ? <img src={cover} alt="" loading="lazy" /> : <span className="post-card-fallback">{post.categoria}</span>}
      </Link>
      <div className="post-card-body">
        <p className="post-meta">
          <span className="post-cat">{post.categoria}</span>
          <time dateTime={post.publicadoEm}>{formatLongDate(post.publicadoEm)}</time>
        </p>
        <H>
          <Link to={`/blog/${post.slug}`}>{post.titulo}</Link>
        </H>
        <p className="post-excerpt">{excerptOf(post, featured ? 240 : 150)}</p>
        <Link to={`/blog/${post.slug}`} className="post-more">
          Ler notícia<span className="visually-hidden">: {post.titulo}</span> <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export function BlogShell({ children, current }: { children: ReactNode; current?: 'blog' }) {
  return (
    <div className="landing blog">
      <a className="skip-link" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById('conteudo')?.focus() }}>
        Ir para o conteúdo
      </a>
      <BlogHeader current={current} />
      <main id="conteudo" tabIndex={-1}>
        {children}
      </main>
      <BlogFooter />
    </div>
  )
}
