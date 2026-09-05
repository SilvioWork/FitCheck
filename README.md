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

Tras el primer `git push` a `main` (con el proyecto reclamado y enlazado), Vercel construye solo. Hasta entonces: `npx vercel deploy --prod` desde esta carpeta, ya autenticado.

El esquema está en `supabase/schema.sql`. Realtime ya está publicado en el proyecto FitCheck; `supabase/realtime.sql` queda como referencia. El borrado de catálogo está en el esquema y en `supabase/catalogo_delete.sql`. Alta de miembros: Edge Function `invitar-miembro`.

En iPhone: abre la URL **https** en Safari → Compartir → Añadir a pantalla de inicio.

La Spec de producto está en `SPEC.md`. El estado de lo implementado y lo pendiente está en `Spec-Status.md`.
