import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { emailDeUsuario, normalizarUsuario, usuarioValido } from '@/lib/usuario'

type AltaPayload = { nombre: string; usuario: string; password: string }

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const ready = ref(false)
  const aviso = ref('')
  const error = ref('')
  const user = computed(() => session.value?.user ?? null)

  async function init() {
    const { data, error: err } = await supabase.auth.getSession()
    if (err) error.value = err.message
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
    })
    ready.value = true
  }

  async function grupoEstaVacio() {
    const { data, error: err } = await supabase.rpc('grupo_esta_vacio')
    if (err) throw err
    return Boolean(data)
  }

  async function signIn(usuario: string, password: string) {
    error.value = ''
    aviso.value = ''
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: emailDeUsuario(usuario),
      password,
    })
    if (err) {
      error.value = err.message
      return false
    }
    session.value = data.session
    return Boolean(data.session)
  }

  async function invokeAlta(modo: 'invitar' | 'reset', payload: AltaPayload) {
    error.value = ''
    aviso.value = ''
    const usuario = normalizarUsuario(payload.usuario)
    if (!usuarioValido(usuario)) {
      error.value = 'El usuario debe tener 3–24 caracteres (letras, números o _).'
      return false
    }
    if (payload.password.length < 8) {
      error.value = 'La contraseña debe tener al menos 8 caracteres.'
      return false
    }
    const { data, error: err } = await supabase.functions.invoke('invitar-miembro', {
      body: {
        modo,
        nombre: payload.nombre.trim(),
        usuario,
        password: payload.password,
      },
    })
    if (err) {
      let message = err.message
      const ctx = err as { context?: Response }
      if (ctx.context) {
        try {
          const body = (await ctx.context.json()) as { error?: string }
          if (body?.error) message = body.error
        } catch {
          /* keep message */
        }
      }
      error.value = message
      return false
    }
    const payloadErr = data && typeof data === 'object' && 'error' in data ? String(data.error) : ''
    if (payloadErr) {
      error.value = payloadErr
      return false
    }
    return true
  }

  async function crearGrupo(payload: AltaPayload) {
    error.value = ''
    aviso.value = ''
    const usuario = normalizarUsuario(payload.usuario)
    if (!usuarioValido(usuario)) {
      error.value = 'El usuario debe tener 3–24 caracteres (letras, números o _).'
      return false
    }
    if (payload.password.length < 8) {
      error.value = 'La contraseña debe tener al menos 8 caracteres.'
      return false
    }
    if (!payload.nombre.trim()) {
      error.value = 'Falta el nombre.'
      return false
    }
    const vacio = await grupoEstaVacio()
    if (!vacio) {
      error.value = 'El grupo ya existe. Entra con tu usuario.'
      return false
    }
    const { error: err } = await supabase.auth.signUp({
      email: emailDeUsuario(usuario),
      password: payload.password,
      options: { data: { nombre: payload.nombre.trim(), usuario } },
    })
    if (err) {
      error.value = err.message
      return false
    }
    return signIn(usuario, payload.password)
  }

  async function invitar(payload: AltaPayload) {
    const ok = await invokeAlta('invitar', payload)
    if (ok) aviso.value = `Cuenta creada para ${normalizarUsuario(payload.usuario)}.`
    return ok
  }

  async function resetPassword(usuario: string, password: string) {
    const ok = await invokeAlta('reset', { nombre: '-', usuario, password })
    if (ok) aviso.value = `Contraseña actualizada para ${normalizarUsuario(usuario)}.`
    return ok
  }

  async function cambiarPassword(password: string) {
    error.value = ''
    aviso.value = ''
    if (password.length < 8) {
      error.value = 'La contraseña debe tener al menos 8 caracteres.'
      return false
    }
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) {
      error.value = err.message
      return false
    }
    aviso.value = 'Contraseña actualizada.'
    return true
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
  }

  return {
    session,
    user,
    ready,
    aviso,
    error,
    init,
    grupoEstaVacio,
    signIn,
    crearGrupo,
    invitar,
    resetPassword,
    cambiarPassword,
    signOut,
  }
})
