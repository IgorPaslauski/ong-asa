import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { formatCurrency } from '../data/mock'
import { PIX } from '../data/org'
import { whatsapp } from '../lib/contact'
import { buildPixPayload } from '../lib/pix'

/** Doação via Pix com valor fixo: QR Code e "copia e cola" gerados no navegador. */
export default function PixDonation() {
  const payload = useMemo(
    () => buildPixPayload({ key: PIX.key, name: PIX.receiver, city: PIX.city, amount: PIX.amount, txid: 'ASADOACAO' }),
    [],
  )
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    QRCode.toDataURL(payload, { margin: 1, width: 384, errorCorrectionLevel: 'M' })
      .then((url) => alive && setQr(url))
      .catch(() => alive && setQr(''))
    return () => {
      alive = false
    }
  }, [payload])

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copie o código Pix:', payload)
    }
  }

  return (
    <section className="section pix" id="doar" aria-labelledby="pix-title">
      <div className="container">
        <div className="section-head">
          <p className="eyebrow">Doe com Pix</p>
          <h2 id="pix-title">Uma doação que chega direto às crianças.</h2>
        </div>
        <div className="pix-card">
          {qr ? <img className="pix-qr" src={qr} alt={`QR Code Pix para doar ${formatCurrency(PIX.amount)} à ${PIX.receiver}`} width={192} height={192} /> : null}
          <div className="pix-info">
            <p className="pix-amount">{formatCurrency(PIX.amount)}</p>
            <p>
              Aponte a câmera do app do seu banco para o QR Code, ou copie o código e use “Pix copia e cola”. Favorecido: {PIX.receiver} ({PIX.keyLabel}).
            </p>
            <div className="pix-actions">
              <button type="button" className="btn btn-primary" onClick={copy}>
                {copied ? 'Código copiado!' : 'Copiar código Pix'}
              </button>
              <a className="btn" href={whatsapp(`Olá! Acabei de fazer uma doação de ${formatCurrency(PIX.amount)} via Pix para a A.S.A. Segue o comprovante.`)} target="_blank" rel="noreferrer">
                Enviar comprovante
              </a>
            </div>
            <p className="pix-code" aria-hidden="true">{payload}</p>
            <p aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{copied ? 'Código Pix copiado.' : ''}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
