import { useEffect, useMemo, useState } from 'react'
import { BlogShell, PostCard, usePublicPosts } from '../components/blog/BlogParts'

export default function Blog() {
  const posts = usePublicPosts()
  const [category, setCategory] = useState('')

  useEffect(() => {
    document.title = 'Blog — Instituto A.S.A.'
    window.scrollTo(0, 0)
  }, [])

  const categories = useMemo(() => [...new Set(posts.map((p) => p.categoria))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [posts])
  const activeCategory = categories.includes(category) ? category : ''
  const visible = activeCategory ? posts.filter((p) => p.categoria === activeCategory) : posts
  const [first, ...rest] = visible

  return (
    <BlogShell current="blog">
      <section className="blog-hero">
        <div className="blog-wrap">
          <p className="eyebrow">Blog</p>
          <h1>Notícias e histórias do Instituto.</h1>
          <p className="lead">O que acontece nas oficinas, nos eventos e nas campanhas da Associação Semeando o Amanhã.</p>
        </div>
      </section>

      <section className="blog-list" aria-label="Posts do blog">
        <div className="blog-wrap">
          {categories.length > 1 ? (
            <div className="blog-filters" role="group" aria-label="Filtrar por categoria">
              <button type="button" aria-pressed={activeCategory === ''} onClick={() => setCategory('')}>
                Todas
              </button>
              {categories.map((c) => (
                <button key={c} type="button" aria-pressed={activeCategory === c} onClick={() => setCategory(c)}>
                  {c}
                </button>
              ))}
            </div>
          ) : null}

          {posts.length === 0 ? (
            <div className="blog-empty">
              <h2>Em breve, novidades por aqui.</h2>
              <p>Assim que a equipe publicar as primeiras notícias, elas aparecem nesta página.</p>
            </div>
          ) : (
            <>
              <p className="visually-hidden" role="status" aria-live="polite">
                {visible.length} {visible.length === 1 ? 'post' : 'posts'}
              </p>
              {first ? <PostCard post={first} featured headingLevel={2} /> : null}
              {rest.length > 0 ? (
                <div className="post-grid">
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} headingLevel={2} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </BlogShell>
  )
}
