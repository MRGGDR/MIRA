# MIRA

MIRA es una aplicacion web institucional para gestionar acciones correctivas y de mejora de la UNGRD. El sistema integra autenticacion, control de acceso por roles, flujo documental por etapas, filtros por proceso, dashboard operativo, bandejas de pendientes, historial y backend en Google Apps Script conectado a Google Sheets.

## Funcionalidades principales

- Inicio de sesion institucional con usuarios almacenados en Google Sheets.
- Roles `ADMIN`, `CREADOR`, `REV`, `VAL`, `OCI` y `CONSULTA`.
- Filtro automatico por proceso para usuarios no administradores.
- Dashboard con indicadores, semaforo, pendientes por rol y graficas interactivas.
- Modulo Reportar con consulta, filtros desplegables, tabla, paginacion y acciones por registro.
- Formulario por acordeones con secciones editables, solo lectura o bloqueadas segun rol y etapa.
- Maquina de estados para registro, analisis, plan de accion, validacion, revision OCI y cierre.
- Notificacion manual a Control Interno.
- Evaluacion de eficacia por OCI.
- Historial de cambios.
- Skeleton loaders y loader institucional con identidad MIRA.

## Stack

- React 19 + TypeScript + Vite.
- React Router.
- TanStack Query.
- React Hook Form + Zod.
- Recharts.
- Lucide React.
- Google Apps Script como backend.
- Google Sheets como base de datos.
- Vercel como plataforma objetivo de despliegue frontend.

## Instalacion local

```bash
npm install
```

Cree un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Variables:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
VITE_USE_MOCKS=false
VITE_USE_DEV_PROXY=false
```

Para desarrollo local contra Apps Script puede activar el proxy de Vite:

```env
VITE_USE_DEV_PROXY=true
```

Para trabajar solo con datos simulados:

```env
VITE_USE_MOCKS=true
```

## Comandos

```bash
npm run dev
npm run lint
npm run test
npm run build
```

## Estructura del repositorio

```text
app_scripts/   Backend Google Apps Script.
docs/          Documentacion funcional y tecnica.
public/        Imagenes, logos y assets publicos.
src/           Frontend React.
```

Documentacion clave:

- [`docs/GUIA_FUNCIONAL_MIRA.md`](docs/GUIA_FUNCIONAL_MIRA.md): guia funcional completa para manual de usuario.
- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): arquitectura general.
- [`docs/API.md`](docs/API.md): contrato de API Apps Script.
- [`docs/MODELO_DE_DATOS.md`](docs/MODELO_DE_DATOS.md): estructura de hojas y campos.
- [`CHANGELOG.md`](CHANGELOG.md): historial de cambios.

## Configuracion de Apps Script

1. Cree o abra el proyecto Apps Script vinculado al Google Sheet.
2. Copie los archivos de `app_scripts` en orden numerico.
3. Configure Script Properties:
   - `SPREADSHEET_ID`: ID real de la hoja de calculo.
   - `AUTH_TOKEN_SECRET`: secreto privado para firmar tokens.
   - `AUTH_FALLBACK`: modo de respaldo, por ejemplo `READ_ONLY`.
4. Ejecute `setupProject()`.
5. Ejecute `validateConfiguration()`.
6. Despliegue el proyecto como aplicacion web.
7. Configure la URL del despliegue en `VITE_APPS_SCRIPT_URL`.

No se debe commitear el ID real de la hoja, secretos, `.env`, credenciales de Google ni archivos exportados con datos institucionales.

## Despliegue en Vercel

El proyecto incluye `vercel.json` para Vite:

- `installCommand`: `npm ci`
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`
- Rewrites SPA hacia `index.html`

En Vercel configure las variables de entorno de produccion:

```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
VITE_USE_MOCKS=false
VITE_USE_DEV_PROXY=false
```

Luego conecte el repositorio de GitHub y deje que Vercel despliegue desde la rama principal.

## Seguridad

El `.gitignore` excluye:

- `.env` y variantes locales.
- Credenciales y llaves.
- `.vercel`.
- `.clasp.json` y archivos de autenticacion local.
- `node_modules`, `dist`, logs y coverage.
- Excel y PDF locales que puedan contener datos internos.

## Licencia y uso

Proyecto institucional para la gestion interna de acciones correctivas y de mejora. Revise las politicas internas antes de publicar datos, registros o anexos.
