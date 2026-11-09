import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BlogShell, PostCard, usePublicPosts } from '../components/blog/BlogParts'
import { bodyToHtml, excerptOf, formatLongDate, readingMinutes, safeImageSrc } from '../lib/blog'

export default function BlogPostPage() {
  const { slug = '' } = useParams()
  const posts = usePublicPosts()
  const post = posts.find((p) => p.slug === slug)
  const html = useMemo(() => (post ? bodyToHtml(post.corpo) : ''), [post])
  const others = useMemo(() => posts.filter((p) => p.slug !== slug).slice(0, 3), [posts, slug])

  useEffect(() => {
    document.title = post ? `${post.titulo} — Blog Instituto A.S.A.` : 'Post não encontrado — Instituto A.S.A.'
  }, [post])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!post) {
    return (
      <BlogShell current="blog">
        <section className="blog-hero">
          <div className="blog-wrap">
            <p className="eyebrow">Blog</p>
            <h1>Não encontramos esta notícia.</h1>
            <p className="lead">Ela pode ter sido removida ou ainda não foi publicada.</p>
            <p>
              <Link className="btn btn-primary" to="/blog">
                Ver todas as notícias
              </Link>
            </p>
          </div>
        </section>
      </BlogShell>
    )
  }

  const cover = safeImageSrc(post.capa)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareText = `${post.titulo} — Instituto A.S.A.`

  return (
    <BlogShell current="blog">
      <article className="post">
        <header className="post-head">
          <div className="blog-wrap post-narrow">
            <p>
              <Link to="/blog" className="post-back">
                <span aria-hidden="true">←</span> Todas as notícias
              </Link>
            </p>
            <p className="post-meta">
              <span className="post-cat">{post.categoria}</span>
              <time dateTime={post.publicadoEm}>{formatLongDate(post.publicadoEm)}</time>
              <span>{readingMinutes(post.corpo)} min de leitura</span>
            </p>
            <h1>{post.titulo}</h1>
            {post.resumo ? <p className="lead">{excerptOf(post, 240)}</p> : null}
            {post.autor ? <p className="post-author">Por {post.autor}</p> : null}
          </div>
        </header>

        {cover ? (
          <figure className="post-cover blog-wrap post-wide">
            <img src={cover} alt={post.capaAlt} />
          </figure>
        ) : null}

        <div className="blog-wrap post-narrow post-body">
          {/* HTML já filtrado por sanitizeHtml (só formatação do editor, sem scripts). */}
          <div className="post-content" dangerouslySetInnerHTML={{ __html: html }} />

          <p className="post-share">
            <a className="btn btn-primary" href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`} target="_blank" rel="noopener noreferrer">
              Compartilhar no WhatsApp<span className="visually-hidden"> (abre em nova aba)</span>
            </a>
          </p>
        </div>
      </article>

      {others.length > 0 ? (
        <section className="blog-list blog-more" aria-labelledby="mais-noticias">
          <div className="blog-wrap">
            <h2 id="mais-noticias">Mais notícias</h2>
            <div className="post-grid">
              {others.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </BlogShell>
  )
}
