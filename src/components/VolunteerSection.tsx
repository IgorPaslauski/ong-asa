import { useState, type FormEvent } from 'react'
import Reveal from './Reveal'
import { whatsapp } from '../lib/contact'
import {
  applicationMessage,
  applicationsRepo,
  AVAILABILITY,
  CONTRIBUTIONS,
  isValidPhone,
  maskPhone,
  type ApplicationInput,
} from '../lib/volunteers'

type Field = 'nome' | 'profissao' | 'telefone' | 'contribuicoes' | 'consent'
type Errors = Partial<Record<Field, string>>

const ORDER: Field[] = ['nome', 'profissao', 'telefone', 'contribuicoes', 'consent']

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** Candidatura rápida de voluntário: 4 campos essenciais + extras opcionais. */
export default function VolunteerSection() {
  const [nome, setNome] = useState('')
  const [profissao, setProfissao] = useState('')
  const [telefone, setTelefone] = useState('')
  const [contribuicoes, setContribuicoes] = useState<string[]>([])
  const [disponibilidade, setDisponibilidade] = useState<string[]>([])
  const [mensagem, setMensagem] = useState('')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<ApplicationInput | null>(null)

  function clear(field: Field) {
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e))
  }

  function validate(): Errors {
    const e: Errors = {}
    const parts = nome.trim().split(/\s+/).filter(Boolean)
    if (parts.length < 2) e.nome = 'Informe seu nome completo (nome e sobrenome).'
    if (!profissao.trim()) e.profissao = 'Informe sua profissão ou ocupação.'
    if (!isValidPhone(telefone)) e.telefone = 'Informe um telefone com DDD, ex.: (55) 99999-9999.'
    if (contribuicoes.length === 0) e.contribuicoes = 'Escolha pelo menos uma forma de ajudar.'
    if (!consent) e.consent = 'Precisamos da sua autorização para entrar em contato.'
    return e
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const found = validate()
    setErrors(found)
    const first = ORDER.find((k) => found[k])
    if (first) {
      document.getElementById(`vol-${first}`)?.focus()
      return
    }
    const input: ApplicationInput = {
      nome: nome.trim().replace(/\s+/g, ' '),
      profissao: profissao.trim(),
      telefone,
      contribuicoes,
      disponibilidade,
      mensagem: mensagem.trim(),
    }
    try {
      applicationsRepo.add(input)
    } catch {
      /* armazenamento indisponível: o envio por WhatsApp na tela seguinte continua valendo */
    }
    setSent(input)
  }

  function reset() {
    setNome('')
    setProfissao('')
    setTelefone('')
    setContribuicoes([])
    setDisponibilidade([])
    setMensagem('')
    setConsent(false)
    setErrors({})
    setSent(null)
  }

  return (
    <section className="section volunteer" id="voluntario" aria-labelledby="voluntario-title">
      <div className="container volunteer-grid">
        <Reveal className="volunteer-intro">
          <p className="eyebrow">Seja voluntário</p>
          <h2 id="voluntario-title">Algumas horas por semana mudam uma história.</h2>
          <p className="lead">
            Conte um pouco sobre você e no que gostaria de ajudar. É rápido, leva menos de um minuto, e a
            equipe entra em contato para combinar os próximos passos.
          </p>
          <ul className="volunteer-points">
            <li>Sem experiência prévia obrigatória.</li>
            <li>Você escolhe o dia e o tempo que cabem na sua rotina.</li>
            <li>Seus dados são usados apenas para o contato da associação.</li>
          </ul>
          <figure className="volunteer-photo">
            <img
              src="./images/galeria/voluntarios-equipe.webp"
              alt="Equipe de voluntários de camiseta azul posando juntos para uma selfie"
              width={1400}
              height={933}
              loading="lazy"
              decoding="async"
            />
          </figure>
        </Reveal>

        <Reveal className="volunteer-card" delay={100}>
          {sent ? (
            <div className="volunteer-done" role="status">
              <h3>Obrigado, {sent.nome.split(' ')[0]}!</h3>
              <p>
                Recebemos a sua candidatura. A equipe vai entrar em contato pelo telefone{' '}
                <strong>{sent.telefone}</strong>.
              </p>
              <p className="volunteer-hint">
                Quer agilizar? Envie os mesmos dados direto para a equipe pelo WhatsApp.
              </p>
              <div className="volunteer-actions">
                <a
                  className="btn btn-primary"
                  href={whatsapp(applicationMessage(sent))}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar também pelo WhatsApp
                  <span className="visually-hidden"> — abre o WhatsApp</span>
                </a>
                <button type="button" className="volunteer-link" onClick={reset}>
                  Enviar outra candidatura
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-label="Candidatura de voluntário">
              <div className="vf-field">
                <label htmlFor="vol-nome">Nome completo</label>
                <input
                  id="vol-nome"
                  type="text"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    clear('nome')
                  }}
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? 'vol-nome-err' : undefined}
                  maxLength={100}
                />
                {errors.nome ? <p className="vf-error" id="vol-nome-err">{errors.nome}</p> : null}
              </div>

              <div className="vf-row">
                <div className="vf-field">
                  <label htmlFor="vol-profissao">Profissão</label>
                  <input
                    id="vol-profissao"
                    type="text"
                    autoComplete="organization-title"
                    placeholder="Ex.: professora, estudante"
                    value={profissao}
                    onChange={(e) => {
                      setProfissao(e.target.value)
                      clear('profissao')
                    }}
                    aria-invalid={!!errors.profissao}
                    aria-describedby={errors.profissao ? 'vol-profissao-err' : undefined}
                    maxLength={80}
                  />
                  {errors.profissao ? <p className="vf-error" id="vol-profissao-err">{errors.profissao}</p> : null}
                </div>
                <div className="vf-field">
                  <label htmlFor="vol-telefone">Telefone (com DDD)</label>
                  <input
                    id="vol-telefone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="(55) 99999-9999"
                    value={telefone}
                    onChange={(e) => {
                      setTelefone(maskPhone(e.target.value))
                      clear('telefone')
                    }}
                    aria-invalid={!!errors.telefone}
                    aria-describedby={errors.telefone ? 'vol-telefone-err' : undefined}
                  />
                  {errors.telefone ? <p className="vf-error" id="vol-telefone-err">{errors.telefone}</p> : null}
                </div>
              </div>

              <fieldset className="vf-field" aria-describedby={errors.contribuicoes ? 'vol-contribuicoes-err' : undefined}>
                <legend>
                  Em que você pode contribuir? <span className="vf-hint">Escolha quantas quiser.</span>
                </legend>
                <div className="vf-chips">
                  {CONTRIBUTIONS.map((item, index) => (
                    <label key={item} className="vf-chip">
                      <input
                        id={index === 0 ? 'vol-contribuicoes' : undefined}
                        type="checkbox"
                        checked={contribuicoes.includes(item)}
                        onChange={() => {
                          setContribuicoes((list) => toggle(list, item))
                          clear('contribuicoes')
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
                {errors.contribuicoes ? (
                  <p className="vf-error" id="vol-contribuicoes-err">{errors.contribuicoes}</p>
                ) : null}
              </fieldset>

              <fieldset className="vf-field">
                <legend>
                  Quando você tem disponibilidade? <span className="vf-hint">Opcional.</span>
                </legend>
                <div className="vf-chips">
                  {AVAILABILITY.map((item) => (
                    <label key={item} className="vf-chip">
                      <input
                        type="checkbox"
                        checked={disponibilidade.includes(item)}
                        onChange={() => setDisponibilidade((list) => toggle(list, item))}
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="vf-field">
                <label htmlFor="vol-mensagem">
                  Quer deixar um recado? <span className="vf-hint">Opcional.</span>
                </label>
                <textarea
                  id="vol-mensagem"
                  rows={3}
                  maxLength={400}
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                />
              </div>

              <div className="vf-field">
                <label className="vf-consent">
                  <input
                    id="vol-consent"
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked)
                      clear('consent')
                    }}
                    aria-invalid={!!errors.consent}
                    aria-describedby={errors.consent ? 'vol-consent-err' : undefined}
                  />
                  <span>Autorizo a A.S.A. a entrar em contato comigo por telefone ou WhatsApp sobre o voluntariado.</span>
                </label>
                {errors.consent ? <p className="vf-error" id="vol-consent-err">{errors.consent}</p> : null}
              </div>

              <button type="submit" className="btn btn-primary vf-submit">
                Quero ser voluntário
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
