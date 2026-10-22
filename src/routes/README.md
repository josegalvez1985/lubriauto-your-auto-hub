# Rutas

TanStack Start usa **rutas por archivo**: cada `.tsx` de esta carpeta es una
pantalla. No hay `src/pages/` ni `app/layout.tsx` (son convenciones de Next.js
y Remix). El único layout es `__root.tsx`.

## Las pantallas de LubriAuto

| Archivo | URL | Pantalla |
| --- | --- | --- |
| `__root.tsx` | — | El layout de todas: `<head>`, sesión (`AuthProvider`), asistente (`ContenedorAsistente`), toasts y el registro del service worker. Tiene que mantener el `<Outlet />` |
| `index.tsx` | `/` | Inicio de sesión, con el fondo de herramientas |
| `registro.tsx` | `/registro` | Crear cuenta (y reactivar una dada de baja) |
| `dashboard.tsx` | `/dashboard` | Inicio |
| `autos.tsx` | `/autos` | Mis vehículos |
| `historial.tsx` | `/historial` | Historial de servicios (`?nuevo=true` abre el alta) |
| `profile.tsx` | `/profile` | Ajustes |
| `manual.tsx` | `/manual` | Manual de uso (lee `MANUAL_USUARIO.md`) |

Al sumar una pantalla con sesión, agregar su nombre en `PANTALLAS` de
`src/components/asistente.tsx` (para "¿cómo uso esta pantalla?") y describirla
en `MANUAL_USUARIO.md`.

## Convenciones de nombres

| Archivo | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dinámica: `$` solo, sin llaves) |
| `posts/{-$category}.tsx` | `/posts/:category?` (segmento opcional) |
| `files/$.tsx` | `/files/*` (comodín: se lee con el parámetro `_splat`, nunca `*`) |
| `_layout.tsx` | ruta de layout (muestra las hijas con `<Outlet />`) |
| `__root.tsx` | el layout de toda la app |

`routeTree.gen.ts` lo genera el plugin del router al correr `npm run dev` o
`npm run build`: no se edita a mano.
