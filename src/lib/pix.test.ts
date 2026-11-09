import { describe, expect, it } from 'vitest'
import { buildPixPayload, crc16 } from './pix'

describe('pix', () => {
  it('calcula o CRC16/CCITT-FALSE padrão', () => {
    expect(crc16('123456789')).toBe('29B1')
  })

  it('monta o BR Code com valor, nome e cidade, terminando no CRC válido', () => {
    const code = buildPixPayload({ key: '34711182000120', name: 'Associação Semeando o Amanhã', city: 'Condor', amount: 50, txid: 'ASA' })
    expect(code.startsWith('000201')).toBe(true)
    expect(code).toContain('0014br.gov.bcb.pix0114' + '34711182000120')
    expect(code).toContain('540550.00')
    expect(code).toContain('5802BR')
    expect(code).toContain('5925Associacao Semeando o Ama')
    expect(code).toContain('6006Condor')
    expect(code).toContain('0503ASA')
    expect(code.slice(-8, -4)).toBe('6304')
    expect(code.slice(-4)).toBe(crc16(code.slice(0, -4)))
  })

  it('omite o valor quando não informado', () => {
    const base = { key: 'a@b.com', name: 'ASA', city: 'Condor' }
    expect(buildPixPayload({ ...base, amount: 10 }).length - buildPixPayload(base).length).toBe('540510.00'.length)
  })
})
