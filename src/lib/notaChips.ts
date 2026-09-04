export const NOTA_CHIPS = ['Con ayuda', 'Fallo muscular'] as const

export type NotaChip = (typeof NOTA_CHIPS)[number]

export function parseNotaChips(nota: string | null | undefined): NotaChip[] {
  if (!nota) return []
  return NOTA_CHIPS.filter((chip) => nota.includes(chip))
}

export function serializeNotaChips(chips: string[]): string {
  return NOTA_CHIPS.filter((chip) => chips.includes(chip)).join(' · ')
}
