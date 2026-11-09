import { describe, expect, it } from 'vitest'
import { formatEventTime, selectPublicEvents } from './publicEvents'

const ev = (o: Record<string, unknown>) => ({ id: 'x', titulo: 'Festa', data: '2026-12-10', horaInicio: '', horaFim: '', local: '', descricao: '', publicado: true, ...o })

describe('selectPublicEvents', () => {
  const today = '2026-11-09'
  it('mostra só publicados de hoje em diante, em ordem de data e hora', () => {
    const out = selectPublicEvents(
      [
        ev({ id: 'c', data: '2026-12-20' }),
        ev({ id: 'rascunho', publicado: false }),
        ev({ id: 'passado', data: '2026-11-08' }),
        ev({ id: 'hoje', data: '2026-11-09', horaInicio: '15:00' }),
        ev({ id: 'hoje-cedo', data: '2026-11-09', horaInicio: '09:00' }),
      ],
      today,
    )
    expect(out.map((e) => e.id)).toEqual(['hoje-cedo', 'hoje', 'c'])
  })
  it('ignora registros inválidos sem lançar erro', () => {
    expect(selectPublicEvents(null, today)).toEqual([])
    expect(selectPublicEvents([null, 1, { id: 'a' }, ev({ titulo: '  ' }), ev({ data: 'xx' })], today)).toEqual([])
  })
})

describe('formatEventTime', () => {
  it('formata horários', () => {
    expect(formatEventTime({ horaInicio: '14:00', horaFim: '17:00' })).toBe('14:00 às 17:00')
    expect(formatEventTime({ horaInicio: '14:00', horaFim: '' })).toBe('a partir das 14:00')
    expect(formatEventTime({ horaInicio: '', horaFim: '' })).toBe('')
  })
})
