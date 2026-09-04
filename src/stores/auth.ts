import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

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

  async function sendMagicLink(email: string, nombre: string) {
    error.value = ''
    aviso.value = ''
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { nombre: nombre.trim() },
      },
    })
    if (err) {
      error.value = err.message
      return
    }
    aviso.value = 'Revisa el correo y toca el enlace para entrar.'
  }

  async function signOut() {
    await supabase.auth.signOut()
    session.value = null
  }

  return { session, user, ready, aviso, error, init, sendMagicLink, signOut }
})
