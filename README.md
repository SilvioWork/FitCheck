# FitCheck

PWA Vue 3 para registrar entrenos del grupo (asistencia, series, historial).

## Arranque

```sh
npm install
npm run dev
```

Copia `.env.example` a `.env` con la URL y la clave publishable/anon del proyecto.

En Supabase → **Authentication → URL Configuration**:

**Desarrollo**

- Site URL (si trabajas en local): `http://127.0.0.1:5174`
- Redirect URLs: `http://127.0.0.1:5174/**` y `http://192.168.1.30:5174/**` (LAN)

**Producción (gym / iPhone)**

- Site URL: la URL HTTPS de Vercel (hoy el deploy anónimo es `https://temporary-nimble-basin-ycmrd13.vercel.app`)
- Redirect URLs: `https://TU-DOMINIO.vercel.app/**` (deja también las de desarrollo si sigues usando `npm run dev`)
- Si `emailRedirectTo` no está en esa lista, el correo abre `127.0.0.1` y el navegador muestra *conexión rechazada*.

El correo integrado de Supabase permite **2 emails/hora en todo el proyecto**. Si ves `email rate limit exceeded`, espera ~1 h y pide un solo enlace desde la URL HTTPS. Para el grupo, SMTP propio.

En Vercel → Project → Settings → Environment Variables, las mismas que en `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Tras el primer `git push` a `main` (con el proyecto reclamado y enlazado), Vercel construye solo. Hasta entonces: `npx vercel deploy --prod` desde esta carpeta, ya autenticado.

El esquema está en `supabase/schema.sql`. Realtime ya está publicado en el proyecto FitCheck; `supabase/realtime.sql` queda como referencia. El borrado de catálogo está en el esquema y en `supabase/catalogo_delete.sql`.

En iPhone: abre la URL **https** en Safari → Compartir → Añadir a pantalla de inicio. El magic link no funciona si la URL no está en Redirect URLs. Un enlace pedido en local no sirve para entrar en Vercel.

La Spec de producto está en `SPEC.md`. El estado de lo implementado y lo pendiente está en `Spec-Status.md`.
