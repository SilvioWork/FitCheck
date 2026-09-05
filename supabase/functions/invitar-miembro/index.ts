import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USUARIO_RE = /^[a-z0-9_]{3,24}$/
const EMAIL_DOMAIN = 'fitcheck.local'
const MAX_MIEMBROS = 5

type Body = {
  modo?: 'invitar' | 'reset'
  nombre?: string
  usuario?: string
  password?: string
}

function json(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function emailDe(usuario: string) {
  return `${usuario}@${EMAIL_DOMAIN}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as Body
    const modo = body.modo
    const usuario = (body.usuario ?? '').trim().toLowerCase()
    const password = body.password ?? ''
    const nombre = (body.nombre ?? '').trim()

    if (modo !== 'invitar' && modo !== 'reset') {
      return json(400, { error: 'Modo no válido.' })
    }
    if (!USUARIO_RE.test(usuario)) {
      return json(400, { error: 'El usuario debe tener 3–24 caracteres (letras, números o _).' })
    }
    if (password.length < 8) {
      return json(400, { error: 'La contraseña debe tener al menos 8 caracteres.' })
    }
    if (modo === 'invitar' && !nombre) {
      return json(400, { error: 'Falta el nombre.' })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const admin = createClient(supabaseUrl, serviceKey)

    const { count, error: countErr } = await admin
      .from('miembros')
      .select('id', { count: 'exact', head: true })
    if (countErr) throw countErr
    const total = count ?? 0

    const authHeader = req.headers.get('Authorization') ?? ''

    async function callerId(): Promise<string | null> {
      if (!authHeader.toLowerCase().startsWith('bearer ')) return null
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      })
      const token = authHeader.slice(7)
      const { data, error } = await userClient.auth.getUser(token)
      if (error || !data.user) return null
      const { data: miembro } = await admin
        .from('miembros')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle()
      return miembro?.id ?? null
    }

    const mid = await callerId()
    if (!mid) return json(401, { error: 'Tienes que estar dentro del grupo.' })

    if (modo === 'reset') {
      const { data: target } = await admin
        .from('miembros')
        .select('id')
        .eq('usuario', usuario)
        .maybeSingle()
      if (!target) return json(404, { error: 'No hay ningún miembro con ese usuario.' })
      const { error } = await admin.auth.admin.updateUserById(target.id, { password })
      if (error) return json(400, { error: error.message })
      return json(200, { ok: true })
    }

    if (total >= MAX_MIEMBROS) {
      return json(409, { error: 'El grupo ya tiene 5 personas.' })
    }

    const created = await admin.auth.admin.createUser({
      email: emailDe(usuario),
      password,
      email_confirm: true,
      user_metadata: { nombre, usuario },
    })
    if (created.error || !created.data.user) {
      return json(400, { error: created.error?.message ?? 'No se pudo crear la cuenta.' })
    }
    const { error: insErr } = await admin.from('miembros').insert({
      id: created.data.user.id,
      nombre,
      usuario,
      email: emailDe(usuario),
    })
    if (insErr) {
      await admin.auth.admin.deleteUser(created.data.user.id)
      return json(400, { error: insErr.message })
    }
    return json(200, { ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado'
    return json(500, { error: message })
  }
})
