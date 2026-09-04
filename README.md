# FitCheck

PWA Vue 3 para registrar entrenos del grupo (asistencia, series, historial).

## Arranque

```sh
npm install
npm run dev
```

Copia `.env.example` a `.env` con la URL y la clave publishable/anon del proyecto.

En Supabase → **Authentication → URL Configuration**:

- Site URL: `http://127.0.0.1:5174`
- Redirect URLs: `http://127.0.0.1:5174/**` y `http://192.168.1.30:5174/**` (LAN)

El esquema está en `supabase/schema.sql`. Para ver series del grupo al momento, ejecuta también `supabase/realtime.sql`. Para poder quitar ítems del catálogo, `supabase/catalogo_delete.sql`.

En iPhone: Safari → Compartir → Añadir a pantalla de inicio.

La Spec de producto está en `SPEC.md`. El estado de lo implementado y lo pendiente está en `Spec-Status.md`.
