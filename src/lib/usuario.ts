export const AUTH_EMAIL_DOMAIN = 'fitcheck.local'

export function normalizarUsuario(raw: string): string {
  return raw.trim().toLowerCase()
}

export function usuarioValido(raw: string): boolean {
  return /^[a-z0-9_]{3,24}$/.test(normalizarUsuario(raw))
}

export function emailDeUsuario(raw: string): string {
  return `${normalizarUsuario(raw)}@${AUTH_EMAIL_DOMAIN}`
}
