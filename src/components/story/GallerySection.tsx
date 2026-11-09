import Reveal from '../Reveal'

type Photo = { file: string; alt: string; w: number; h: number }

/** Fotos reais de eventos da associação (public/images/galeria). Mantém a proporção original de cada foto. */
const PHOTOS: Photo[] = [
  { file: 'festa-lanche', alt: 'Voluntárias servindo lanche a crianças em uma festa, com pula-pula ao fundo', w: 1400, h: 933 },
  { file: 'algodao-doce', alt: 'Menina sorrindo com pintura no rosto, segurando um algodão-doce', w: 933, h: 1400 },
  { file: 'mesa-voluntarios', alt: 'Voluntários montando pratos numa mesa comprida, ao lado do banner do Instituto A.S.A.', w: 1400, h: 933 },
  { file: 'pintura-rosto', alt: 'Menina com pintura no rosto olhando para o alto durante uma festa', w: 933, h: 1400 },
  { file: 'fila-lanche', alt: 'Crianças na fila para receber lanche, atendidas por uma voluntária de camiseta azul', w: 1400, h: 933 },
  { file: 'bolo', alt: 'Bolo decorado com desenhos sendo cortado e servido', w: 1400, h: 933 },
  { file: 'equipe-quadra', alt: 'Seis integrantes da equipe, de camiseta azul, abraçados diante do banner do Instituto A.S.A. na quadra', w: 1400, h: 1187 },
  { file: 'diretor-paulo', alt: 'Diretor Paulo falando ao microfone com a camiseta do Instituto A.S.A.', w: 933, h: 1400 },
  { file: 'mesa-doces', alt: 'Mesa cheia de doces e brinquedos, com crianças e voluntários em volta', w: 1400, h: 933 },
  { file: 'mesa-comida', alt: 'Voluntários e famílias ao redor de uma mesa de comidas sob o galpão', w: 1400, h: 933 },
]

export default function GallerySection() {
  return (
    <section className="section gallery" id="momentos" aria-labelledby="momentos-title">
      <div className="container">
        <Reveal className="section-head">
          <p className="eyebrow">Momentos</p>
          <h2 id="momentos-title">Dias de festa, de encontro e de cuidado.</h2>
        </Reveal>
        <figure className="gallery-featured">
          <img
            src="./images/galeria/grupo-quadra.webp"
            alt="Crianças, adolescentes e equipe do Instituto A.S.A. reunidos na quadra, diante do banner da associação"
            width={1800}
            height={1455}
            loading="lazy"
            decoding="async"
          />
        </figure>
        <ul className="gallery-grid">
          {PHOTOS.map((photo) => (
            <li key={photo.file}>
              <img
                src={`./images/galeria/${photo.file}.webp`}
                alt={photo.alt}
                width={photo.w}
                height={photo.h}
                loading="lazy"
                decoding="async"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
