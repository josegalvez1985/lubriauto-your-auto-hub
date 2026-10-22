# LubriAuto

App web (PWA) para llevar el mantenimiento de vehículos: cada usuario registra sus autos y los servicios que les hace (cambios de aceite, filtros, repuestos, reparaciones) con fecha, kilometraje y costo. Calcula el próximo cambio de aceite, exporta el historial a PDF y trae un asistente con IA que responde sobre los propios datos del usuario.

- **Manual de uso** (para quienes usan la app): [MANUAL_USUARIO.md](MANUAL_USUARIO.md). También se ve dentro de la app, en Ajustes → Manual de uso, y es lo que lee el asistente.
- **Asistente con IA**: [GUIA_ASISTENTE_IA.md](GUIA_ASISTENTE_IA.md) (guía original y cómo se adaptó acá).

---

## Stack

| Parte | Qué usa |
| --- | --- |
| Frontend | TanStack Start en modo **SPA** (React 19, TanStack Router con rutas por archivo), Vite 8, Tailwind CSS 4, shadcn/ui, lucide-react, sonner |
| PDF | jspdf + jspdf-autotable (en el navegador) |
| Backend | **Oracle APEX / ORDS**, fuera de este repo salvo los scripts de [`backend/`](backend/). Esquema `JOSEGALVEZ`, módulo ORDS `lt`: `https://oracleapex.com/ords/josegalvez/lt/` |
| IA | Claude (Haiku 5.5), llamado **desde Oracle** con `APEX_WEB_SERVICE`: la clave nunca llega al navegador |
| Deploy | GitHub Pages, con GitHub Actions en cada push a `main` |

---

## Correrlo

```bash
npm install
npm run dev        # http://localhost:8080 (si está ocupado, Vite usa el siguiente)
npm run build      # build estático en dist/client
npm run lint
```

> El código usa CRLF en Windows y Prettier marca esos saltos de línea como errores de formato (`npm run lint`). No afecta al build.

### Lockfiles: npm local, bun en el deploy

En local se usa **npm** (`package-lock.json`); el workflow usa **bun** con `bun install --frozen-lockfile` (`bun.lock`). Si se cambia `package.json`, hay que regenerar **los dos** o el deploy falla:

```bash
npm install
npx -y bun@1.3 install --lockfile-only
```

### Deploy

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) compila con `GITHUB_PAGES=1` y publica `dist/client` en GitHub Pages: copia el shell SPA (`_shell.html`) como `index.html` y como `404.html` (para que los enlaces directos funcionen).

En GitHub Pages sin dominio propio el sitio vive en `/lubriauto-your-auto-hub/`, y [`vite.config.ts`](vite.config.ts) usa esa base. Con dominio propio (un `public/CNAME`, o `CUSTOM_DOMAIN=1`) usa `/`.

**Cada push a `main` despliega solo**: no subir cambios del frontend que dependan de un script SQL antes de correrlo en APEX.

---

## Estructura

```
src/
  routes/          una pantalla por archivo (ver src/routes/README.md)
  components/      diálogos y piezas propias; ui/ es shadcn
  lib/             llamadas al backend (*-api.ts), sesión, biometría, foto de perfil, asistente
  hooks/           tema y responsive
  assets/          patrón de herramientas del fondo del login
  styles.css       tema (colores de la marca en :root y .dark) y efectos propios
backend/           scripts SQL para correr en APEX (ver más abajo)
public/            íconos, manifest de la PWA y service worker
MANUAL_USUARIO.md  manual de uso: lo muestra la app y lo lee el asistente
```

### Pantallas

| Ruta | Pantalla | Sesión |
| --- | --- | --- |
| `/` | Inicio de sesión (correo + contraseña, biometría, "¿La olvidaste?") | No |
| `/registro` | Crear cuenta; si el correo tiene una cuenta dada de baja, ofrece reactivarla | No |
| `/dashboard` | Inicio: vehículo activo, próximo cambio de aceite, historial reciente | Sí |
| `/autos` | Mis vehículos: alta, edición e inactivación | Sí |
| `/historial` | Servicios por vehículo, total gastado, PDF (`?nuevo=true` abre el alta) | Sí |
| `/profile` | Ajustes: foto, tema, biometría, contraseña, manual, baja de cuenta | Sí |
| `/manual` | Manual de uso con buscador | No |

El asistente (botón flotante) aparece en todas las pantallas con sesión salvo `/` y `/registro` ([`src/components/asistente.tsx`](src/components/asistente.tsx)).

### Lo que se guarda en el dispositivo (`localStorage`)

| Clave | Qué es |
| --- | --- |
| `auth-session` | La sesión (token, vencimiento, nombre, usuario). En `sessionStorage` si no se marca "Mantener sesión iniciada" |
| `theme` | `light` o `dark` |
| `biometric-enabled`, `biometric-cred-id` | Desbloqueo con huella o rostro: es un candado local (WebAuthn), no autentica contra el backend |
| `foto-perfil:<usuario>` | La foto de perfil, reducida a 256×256 en JPEG. Solo existe en ese dispositivo |

La conversación del asistente vive solo en memoria y se borra al recargar o cerrar sesión.

---

## Backend (Oracle APEX / ORDS)

### El esquema es compartido

En el mismo esquema `JOSEGALVEZ` conviven **LubriAuto**, el **ERP** (módulo ORDS `lubrimec`, `PKG_IA_LUBRIMEC`, `LUBRIMEC_IA_*`) y la **página web** (`paginaweb`, `PW_IA_*`). Reglas:

- Todo lo de LubriAuto empieza con **`LT_`** (tablas), **`PKG_LT_`** / **`PKG_IA_LT`** (paquetes) y **`V_LT_IA_`** (vistas).
- **Nunca `ORDS.DEFINE_MODULE` sobre `lt`**: lo redefine y borra todos sus endpoints. Para sumar uno, solo `DEFINE_TEMPLATE` + `DEFINE_HANDLER` (como hacen los scripts de `backend/`).
- No tocar `PKG_AUTH` ni `PKG_AUTOS`: los scripts nuevos solo usan sus funciones públicas.

### Tablas y paquetes de LubriAuto

| Objeto | Qué es |
| --- | --- |
| `LT_USUARIOS` | Usuarios. `ESTADO`: `A` activo, `I` inactivo (dado de baja), `B` bloqueado por intentos fallidos |
| `LT_TOKENS` | Sesiones. `ESTADO`: `A` activa, `R` revocada. Duran `PKG_AUTH.c_horas_token` (2 h) |
| `LT_AUTOS` | Vehículos (`USUARIO` = `LT_USUARIOS.USERNAME`, `ACTIVO` `S`/`N`) |
| `LT_SERVICIOS_AUTOS` | Servicios de cada vehículo |
| `PKG_AUTH` | Registro, login, contraseñas, tokens y correos |
| `PKG_AUTOS` | `fn_usuario(token)` (devuelve el `USERNAME` o lanza `-20401`) y el CRUD de autos |
| `LT_CUENTAS_BAJAS`, `PKG_LT_CUENTA` | Baja y reactivación de cuentas ([`backend/cuenta.sql`](backend/cuenta.sql)) |
| `LT_IA_CONFIG`, `LT_IA_CONSULTAS`, `PKG_IA_LT`, `V_LT_IA_*` | El asistente ([`backend/asistente.sql`](backend/asistente.sql)) |

### Endpoints (`/ords/josegalvez/lt/…`)

Todos responden `{ ok: true, … }` o `{ ok: false, error }`. Los que llevan sesión usan `Authorization: Bearer <token>`; un token inválido da `ORA-20401` y el frontend cierra la sesión.

| Método y ruta | Sesión | Qué hace |
| --- | :-: | --- |
| `POST autenticacion/login` · `registro` · `reset` | | Entrar, crear cuenta, contraseña temporal por correo |
| `PUT autenticacion/password` | | Cambiar contraseña (con la actual) |
| `GET autos/lista` · `GET/PUT/DELETE autos/:id` · `POST autos/crear` | ✓ | Vehículos |
| `GET servicios/auto/:id_auto` · `GET/PUT/DELETE servicios/:id` · `POST servicios/crear` | ✓ | Servicios |
| `POST cuenta/inactivar` | ✓ | Dar de baja la cuenta (con la contraseña) |
| `POST cuenta/estado` · `reactivar` · `reactivar-correo` | | ¿Correo dado de baja? y reactivarlo |
| `POST asistente/preguntar` | ✓ | El asistente con IA |

### Scripts de `backend/`

Se corren en **SQL Workshop → SQL Scripts** (Upload → Run). Todos se pueden correr más de una vez y terminan con una verificación (`[OK]` / `[ERROR]`).

| Orden | Script | Crea |
| :-: | --- | --- |
| 1 | [`asistente-tablas.sql`](backend/asistente-tablas.sql) | `LT_IA_CONFIG`, `LT_IA_CONSULTAS` y la configuración de entrada |
| 2 | [`asistente.sql`](backend/asistente.sql) | `PKG_IA_LT`, `V_LT_IA_MIS_AUTOS`, `V_LT_IA_MIS_SERVICIOS` y `POST asistente/preguntar`. Al final prueba la conexión con la API de Claude |
| — | [`cuenta.sql`](backend/cuenta.sql) | `LT_CUENTAS_BAJAS`, `PKG_LT_CUENTA` y los endpoints `cuenta/*` |

El asistente usa la **clave de la API del ERP** (`LUBRIMEC_IA_CONFIG.API_KEY`): no hay que cargar nada. Sus límites se cambian sin reejecutar nada:

```sql
UPDATE LT_IA_CONFIG SET VALOR = '20' WHERE CLAVE = 'LIMITE_DIARIO'; COMMIT;  -- por usuario y por día
UPDATE LT_IA_CONFIG SET VALOR = '80' WHERE CLAVE = 'LIMITE_GLOBAL_DIARIO'; COMMIT;  -- todo LubriAuto
```

Reactivar una cuenta a mano:

```sql
UPDATE LT_USUARIOS SET ESTADO = 'A', FECHA_MODIF = SYSTIMESTAMP WHERE USERNAME = '...'; COMMIT;
```

---

## Pendientes conocidos

- **`GET autos/lista` devuelve los autos de todos los usuarios**: en su handler el filtro está comentado (`--WHERE USUARIO = l_user AND ACTIVO = 'S'`). Hay que restaurar el filtro por usuario. Conviene revisar también que `autos/:id` y `servicios/*` validen que el auto sea del usuario del token.
- **El asistente del ERP puede ver `LT_IA_CONSULTAS`** (las preguntas de los usuarios de LubriAuto) si `PKG_IA_LUBRIMEC` ve todo el esquema: sumar `LT_IA_%` a sus tablas privadas.
- **Sin implementar**: Avisos (la campana), Notificaciones y Datos personales. El manual los nombra como "todavía no disponible".
- **La foto de perfil es local**: para que acompañe al usuario en todos sus dispositivos habría que guardarla en Oracle.
