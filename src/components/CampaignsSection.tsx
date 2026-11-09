import { campaignRaised, campaigns, publicCampaigns } from '../admin/data/modules'
import { useDonations } from '../admin/data/store'
import { formatCurrency } from '../data/mock'
import { whatsapp } from '../lib/contact'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Campanhas de arrecadação publicadas no painel, com a meta e o quanto já foi arrecadado. */
export default function CampaignsSection() {
  const all = campaigns.useAll()
  const donations = useDonations()
  const list = publicCampaigns(all, today())
  if (list.length === 0) return null

  return (
    <section className="section campaigns" id="campanhas" aria-labelledby="campanhas-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Ajude agora</p>
          <h2 id="campanhas-title">Campanhas em andamento.</h2>
        </div>
        <ul className="campaign-list">
          {list.map((c) => {
            const raised = campaignRaised(c, donations)
            const pct = Math.min(100, Math.round((raised / c.meta) * 100))
            return (
              <li key={c.id} className="campaign-card">
                <h3>{c.titulo}</h3>
                {c.descricao ? <p>{c.descricao}</p> : null}
                <div
                  className="campaign-bar"
                  role="progressbar"
                  aria-label={`Arrecadado na campanha ${c.titulo}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={pct}
                >
                  <span style={{ width: `${pct}%` }} />
                </div>
                <p className="campaign-figures">
                  <strong>{formatCurrency(raised)}</strong> de {formatCurrency(c.meta)} · {pct}%
                </p>
                <a className="btn btn-primary" href={whatsapp(`Olá! Quero contribuir com a campanha "${c.titulo}" da A.S.A.`)} target="_blank" rel="noreferrer">
                  Quero contribuir
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
