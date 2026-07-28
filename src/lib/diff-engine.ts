import { TestItem } from '@prisma/client'

export type RawParsedItem = {
  id: string
  sistema: string
  modulo: string
  tela: string
  cenario: string
  requisitos: string
  responsavel: string
  status: string
  chamado: string
  statusChamado: string
  observacao: string
  subsidio: string
}

// Normaliza: upper-case + remove acentos/diacríticos + remove replacement chars
function normalizeHeader(s: string): string {
  return (s || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove combining diacritics (acentos)
    .replace(/\uFFFD/g, '')          // remove replacement chars (encoding ruim)
    .replace(/[?]/g, '')             // remove ? que aparecem de encoding errado
}

export function rowsToItems(rows: string[][]): { items: RawParsedItem[]; error: string | null } {
  let headerIdx = -1

  for (let i = 0; i < rows.length; i++) {
    const upper = rows[i].map(normalizeHeader)
    // Procura linha que tenha ID, SISTEMA e STATUS (exatamente "STATUS")
    const hasId = upper.some(h => h === 'ID')
    const hasSistema = upper.some(h => h === 'SISTEMA')
    const hasStatus = upper.some(h => h === 'STATUS')
    if (hasId && hasSistema && hasStatus) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    // Retorna debug das primeiras linhas para ajudar diagnóstico
    const preview = rows.slice(0, 12).map((r, i) => `[${i}]: ${r.map(normalizeHeader).join(' | ')}`).join('\n')
    return {
      items: [],
      error: `Não encontrei a linha de cabeçalho (colunas ID, SISTEMA, STATUS). Primeiras linhas após normalização:\n${preview}`
    }
  }

  const header = rows[headerIdx].map(normalizeHeader)

  // Busca por lista de nomes alternativos (normalizada)
  const colIndex = (names: string[]): number => {
    for (const name of names) {
      const idx = header.indexOf(name)
      if (idx >= 0) return idx
    }
    return -1
  }

  const idx = {
    id:            colIndex(['ID']),
    sistema:       colIndex(['SISTEMA']),
    modulo:        colIndex(['MODULO', 'MODULE']),
    // "TELA/FUNCIONALIDADE" normaliza para "TELA/FUNCIONALIDADE"
    tela:          header.findIndex(h => h.startsWith('TELA')),
    cenario:       colIndex(['CENARIO', 'SCENARIO', 'CENARIOS']),
    requisitos:    colIndex(['REQUISITOS', 'REQUISITO']),
    responsavel:   colIndex(['RESPONSAVEL', 'RESPONSABLE']),
    // STATUS puro (não "STATUS CHAMADO")
    status:        header.findIndex(h => h === 'STATUS'),
    chamado:       colIndex(['CHAMADO']),
    statusChamado: header.findIndex(h => h === 'STATUS CHAMADO'),
    observacao:    colIndex(['OBSERVACAO', 'OBSERVACOES', 'OBS', 'OBSERVAAO']),
    subsidio:      colIndex(['SUBSIDIO', 'SUBSIDIOS', 'SUBSDIO']),
  }

  const items: RawParsedItem[] = []
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r.length) continue
    const rawId = (r[idx.id] || '').trim()
    if (!/^\d+$/.test(rawId)) continue

    const get = (key: keyof typeof idx) =>
      idx[key] >= 0 && r[idx[key]] !== undefined ? r[idx[key]].trim() : ''

    items.push({
      id: rawId,
      sistema: get('sistema'),
      modulo: get('modulo'),
      tela: get('tela'),
      cenario: get('cenario'),
      requisitos: get('requisitos'),
      responsavel: get('responsavel'),
      status: get('status').toUpperCase(),
      chamado: get('chamado'),
      statusChamado: get('statusChamado'),
      observacao: get('observacao'),
      subsidio: get('subsidio'),
    })
  }

  return { items, error: null }
}

export type StatusBreakdown = {
  FUNCIONA: number
  FUNCIONA_COM_RESSALVAS: number
  ERRO_IMPEDITIVO: number
  ITEM_DESABILITADO: number
  PENDENTE: number
}

function normalizeStatus(raw: string): keyof StatusBreakdown {
  const s = raw.toUpperCase().trim()
  if (s === 'FUNCIONA') return 'FUNCIONA'
  if (s === 'FUNCIONA COM RESSALVAS' || s === 'FUNCIONA_COM_RESSALVAS') return 'FUNCIONA_COM_RESSALVAS'
  if (s === 'ERRO IMPEDITIVO' || s === 'ERRO_IMPEDITIVO') return 'ERRO_IMPEDITIVO'
  if (s === 'ITEM DESABILITADO' || s === 'ITEM_DESABILITADO') return 'ITEM_DESABILITADO'
  return 'PENDENTE'
}

export function computeDiff(oldItems: TestItem[], newItemsRaw: RawParsedItem[]) {
  const oldById = new Map(
    oldItems.filter(i => !i.arquivado).map(i => [i.numeroRoteiro.toString(), i])
  )
  const newIds = new Set(newItemsRaw.map(i => i.id))

  const novos = newItemsRaw.filter(i => !oldById.has(i.id))
  const removidos = oldItems.filter(i => !i.arquivado && !newIds.has(i.numeroRoteiro.toString()))

  const alterados = newItemsRaw.filter(i => {
    const old = oldById.get(i.id)
    if (!old) return false
    return (
      old.sistema !== i.sistema ||
      old.modulo !== i.modulo ||
      old.tela !== i.tela ||
      old.cenario !== i.cenario ||
      old.requisitos !== i.requisitos
    )
  })

  // Breakdown de status do CSV sendo importado
  const statusNoCSV: StatusBreakdown = {
    FUNCIONA: 0,
    FUNCIONA_COM_RESSALVAS: 0,
    ERRO_IMPEDITIVO: 0,
    ITEM_DESABILITADO: 0,
    PENDENTE: 0,
  }
  for (const item of newItemsRaw) {
    const st = normalizeStatus(item.status)
    statusNoCSV[st]++
  }

  return {
    novos,
    removidos,
    alterados,
    preservados: newItemsRaw.length - novos.length,
    statusNoCSV,
  }
}
