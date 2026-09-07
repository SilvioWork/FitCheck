export const NOTA_CHIPS = [
  'Con ayuda',
  'Fallo muscular',
  'Rest-pause',
  'Myo-reps',
  'Dropset / serie descendente',
  'Doble dropset',
  'Repeticiones forzadas',
  'Repeticiones negativas',
  'Rest-pause + dropset',
] as const

export type NotaChip = (typeof NOTA_CHIPS)[number]

const CHIP_SET = new Set<string>(NOTA_CHIPS)

export function parseNotaChips(nota: string | null | undefined): NotaChip[] {
  if (!nota) return []
  const found = new Set<NotaChip>()
  for (const part of nota.split(' · ')) {
    const trimmed = part.trim()
    if (CHIP_SET.has(trimmed)) found.add(trimmed as NotaChip)
  }
  return NOTA_CHIPS.filter((chip) => found.has(chip))
}

export function serializeNotaChips(chips: string[]): string {
  return NOTA_CHIPS.filter((chip) => chips.includes(chip)).join(' · ')
}
