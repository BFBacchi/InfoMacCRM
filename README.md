# CRM INFOMAC — Field service y garantías

Aplicación web full stack (Next.js 15, Once UI, Supabase) para gestión de tickets de soporte IT en campo, garantías y operaciones tipo INFOMAC.

## Requisitos previos

- **Node.js** 20 LTS o superior (recomendado)
- **npm** (el proyecto incluye `.npmrc` con `legacy-peer-deps=true` por compatibilidad con Once UI / `sharp`)
- Cuenta en **[Supabase](https://supabase.com)** (proyecto con Postgres, Auth, Storage y Realtime)
- (Opcional) Cuenta en **[Vercel](https://vercel.com)** para despliegue
- (Opcional) **Google Cloud** con APIs **Distance Matrix** (servidor) y **Maps Embed** / restricciones por referrer para la key pública

## Instalación en local

1. Clonar el repositorio e ir al directorio del proyecto.

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Copiar variables de entorno y completarlas:

   ```bash
   copy .env.example .env.local
   ```

   En macOS/Linux:

   ```bash
   cp .env.example .env.local
   ```

4. Rellenar `.env.local` (ver tabla más abajo).

## Base de datos (Supabase)

1. Crea un proyecto en Supabase y anota **Project URL** y **anon key**.

2. En el **SQL Editor** de Supabase, ejecuta el contenido del archivo:

   `supabase/migrations/20250511000001_init_schema.sql`

   Eso crea tablas, enums, RLS, triggers, buckets de Storage y publicación Realtime según el diseño del CRM.

3. **Auth → URL configuration** en Supabase:

   - **Site URL**: la URL de tu app (en local: `http://localhost:3000`).
   - **Redirect URLs**: incluye `http://localhost:3000/auth/callback` y la misma ruta con tu dominio de producción (por ejemplo `https://tu-app.vercel.app/auth/callback`).

4. (Opcional) Datos de demostración — con `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`:

   ```bash
   npm run db:seed
   ```

   Genera usuarios demo (correos `@demo.infomac.local`) y datos de ejemplo. **No** uses la service role en el cliente ni la subas a repositorios públicos.

## Variables de entorno

| Variable | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (cliente y servidor con RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor / scripts (`db:seed`, cron); **secreta** |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (magic links); local: `http://localhost:3000` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa embebido en detalle de ticket (Embed API + restricciones) |
| `GOOGLE_MAPS_SERVER_KEY` | Distance Matrix llamada **solo** en servidor (recomendado; si falta, puede usarse la pública con mucho cuidado) |
| `CRON_SECRET` | Secreto para proteger `GET /api/cron/sla-check` (`Authorization: Bearer <CRON_SECRET>`) |

## Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Tras iniciar sesión, si el perfil está incompleto te redirige a **onboarding** (nombre, teléfono, base).

Otros comandos:

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilación de producción |
| `npm run start` | Servidor tras `build` |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed con service role (solo entornos controlados) |

## Despliegue en Vercel

1. **Importar** el repositorio en Vercel (o enlazar con Git).

2. **Framework preset**: Next.js (detectado automáticamente). El archivo `vercel.json` define el framework y un cron opcional para comprobación de SLA.

3. En **Settings → Environment Variables**, define las mismas variables que en `.env.local`, al menos:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` → URL de producción (`https://tu-dominio.vercel.app` o dominio custom)
   - `CRON_SECRET` (si usás el cron de Vercel hacia `/api/cron/sla-check`)
   - Claves de Google según lo que uses en producción

4. **Supabase**: añade la URL de producción y `/auth/callback` en Redirect URLs.

5. Despliega (`git push` en la rama conectada o “Deploy” desde el dashboard).

### Cron de SLA (opcional)

`vercel.json` puede incluir una entrada `crons` que llama a `/api/cron/sla-check`. El endpoint exige el header:

`Authorization: Bearer <CRON_SECRET>`

Configurá `CRON_SECRET` en Vercel y, si hace falta, ajustá el cron en `vercel.json` a tu frecuencia deseada. El cron usa `SUPABASE_SERVICE_ROLE_KEY` en runtime: añadila también como variable **solo** en Vercel (entorno Production), con cuidado de no exponerla al cliente (no uses el prefijo `NEXT_PUBLIC_`).

## Stack principal

- Next.js 15 (App Router), TypeScript estricto
- Tailwind CSS v4 (`@tailwindcss/postcss`), componentes propios en `src/components/ui/`
- Supabase: Auth (email + magic link), Postgres + RLS, Storage, Realtime
- Zustand, React Hook Form, Zod, TanStack Table, Recharts, `sonner` (toasts), `next-themes`, Lucide, `@dnd-kit` en Kanban

## Soporte

Si falla la instalación por dependencias peer, el proyecto ya fuerza `legacy-peer-deps` en `.npmrc`. Para problemas de RLS o migraciones, revisá políticas y logs en el dashboard de Supabase.
