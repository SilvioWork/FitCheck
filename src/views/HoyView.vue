<script setup lang="ts">
import { computed, reactive } from 'vue'
import AsistenciaList from '@/components/AsistenciaList.vue'
import RegistroSeries from '@/components/RegistroSeries.vue'
import { formatFecha, todayISO } from '@/lib/ids'
import { useFitcheckStore } from '@/stores/fitcheck'

const gym = useFitcheckStore()

const alta = reactive({
  fecha: todayISO(),
  nota: '',
})

const sesion = computed(() => gym.sesionDeHoy)

async function crearSesion() {
  await gym.crearSesion(alta.fecha, alta.nota)
  alta.nota = ''
  alta.fecha = todayISO()
}
</script>

<template>
  <section class="page">
    <header class="header">
      <p class="eyebrow">Sesión</p>
      <h1>Hoy</h1>
      <p class="lede">
        {{ gym.miembroActivo ? `Registras como ${gym.miembroActivo.nombre}.` : 'Cargando perfil…' }}
        <span v-if="gym.enVivo"> · En vivo</span>
      </p>
    </header>

    <article v-if="!gym.listo" class="card">
      <p>Sincronizando con Supabase…</p>
    </article>

    <template v-else-if="!sesion">
      <article class="card">
        <h2>Nueva sesión</h2>
        <label>
          Fecha
          <input v-model="alta.fecha" type="date" />
        </label>
        <label>
          Nota (opcional)
          <input v-model="alta.nota" type="text" maxlength="80" placeholder="pierna + hombro" />
        </label>
        <button class="primary" type="button" @click="crearSesion">Crear sesión</button>
      </article>
    </template>

    <template v-else>
      <p class="meta">{{ formatFecha(sesion.fecha) }}<span v-if="sesion.nota"> · {{ sesion.nota }}</span></p>
      <AsistenciaList :sesion-id="sesion.id" />
      <RegistroSeries :sesion-id="sesion.id" />
    </template>
  </section>
</template>

<style scoped>
.page {
  display: grid;
  gap: 16px;
  padding-bottom: 8px;
}

.header h1 {
  margin: 4px 0 8px;
  font-size: 2rem;
}

.eyebrow {
  margin: 0;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.lede,
.meta,
.card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
}

.card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  box-shadow: var(--shadow);
  display: grid;
  gap: 12px;
}

h2 {
  margin: 0;
  font-size: 1.05rem;
}

label {
  display: grid;
  gap: 6px;
  font-weight: 700;
  font-size: 0.9rem;
}

input {
  min-height: var(--tap);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  padding: 0 12px;
}

.primary {
  min-height: var(--tap);
  border: 0;
  border-radius: var(--radius);
  background: var(--accent);
  color: #06210f;
  font-weight: 700;
}
</style>
