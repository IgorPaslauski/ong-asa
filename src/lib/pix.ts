/** Pix "copia e cola" (BR Code estático, padrão EMV do Banco Central). */

function field(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

/** Remove acentos e caracteres fora do ASCII e limita o tamanho (exigência do BR Code). */
function ascii(text: string, max: number) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7e]/g, '')
    .trim()
    .slice(0, max)
}

export function crc16(payload: string) {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export type PixInput = {
  key: string
  name: string
  city: string
  /** Valor em reais. Se omitido, o doador digita o valor no app do banco. */
  amount?: number
  /** Identificador da transação (letras e números, até 25). */
  txid?: string
}

export function buildPixPayload({ key, name, city, amount, txid }: PixInput) {
  const account = field('00', 'br.gov.bcb.pix') + field('01', key.trim())
  const extra = field('05', ascii(txid ?? '', 25).replace(/[^A-Za-z0-9]/g, '') || '***')
  const body =
    field('00', '01') +
    field('26', account) +
    field('52', '0000') +
    field('53', '986') +
    (amount && amount > 0 ? field('54', amount.toFixed(2)) : '') +
    field('58', 'BR') +
    field('59', ascii(name, 25)) +
    field('60', ascii(city, 15)) +
    field('62', extra) +
    '6304'
  return body + crc16(body)
}
