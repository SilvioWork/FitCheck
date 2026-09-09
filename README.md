# FitCheck

PWA Vue 3 para registrar entrenos del grupo (asistencia, series, historial).

## Arranque

```sh
npm install
npm run dev
```

Copia `.env.example` a `.env` con la URL y la clave publishable/anon del proyecto.

Login: **usuario + contraseña**. Auth usa el email interno `{usuario}@fitcheck.local`. El primer integrante crea el grupo; el resto se da de alta desde Ajustes (máx. 5).

En Supabase → **Authentication → Providers → Email**: desactiva **Confirm email**. El login diario no envía correo.

En Vercel → Project → Settings → Environment Variables, las mismas que en `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Tras `git push` a `main`, Vercel despliega solo (proyecto **fitcheck** enlazado a `SilvioWork/FitCheck`). `npx vercel deploy --prod` es opcional, solo si hay que publicar sin GitHub.

**URL de producción (iPhone):** https://fitcheck-silviowork89-4758.vercel.app

En iPhone: Safari → esa URL → Compartir → Añadir a pantalla de inicio. Entra con usuario y contraseña (sin correo).

El esquema está en `supabase/schema.sql`. Realtime ya está publicado en el proyecto FitCheck; `supabase/realtime.sql` queda como referencia. El borrado de catálogo está en el esquema y en `supabase/catalogo_delete.sql`. Alta de miembros: Edge Function `invitar-miembro`.

La Spec de producto está en `SPEC.md`. El estado de lo implementado y lo pendiente está en `Spec-Status.md`.
