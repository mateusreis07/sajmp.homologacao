export const STATUS_META = {
  PENDENTE: { label: 'Pendente', color: 'var(--stone)', stampLabel: null },
  FUNCIONA: { label: 'Funciona', color: 'var(--forest)', stampLabel: 'HOMOLOGADO' },
  FUNCIONA_COM_RESSALVAS: { label: 'Funciona c/ Ressalvas', color: 'var(--amber)', stampLabel: 'RESSALVAS' },
  ERRO_IMPEDITIVO: { label: 'Erro Impeditivo', color: 'var(--brick)', stampLabel: 'REPROVADO' },
  ITEM_DESABILITADO: { label: 'Item Desabilitado', color: 'var(--stone-dark)', stampLabel: 'DESABILITADO' }
} as const

export const STATUS_ORDER = [
  'PENDENTE',
  'FUNCIONA',
  'FUNCIONA_COM_RESSALVAS',
  'ERRO_IMPEDITIVO',
  'ITEM_DESABILITADO'
] as const
