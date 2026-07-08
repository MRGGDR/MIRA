# MIRA

MIRA es una aplicación web institucional para gestionar acciones correctivas y de mejora de la UNGRD. El frontend integra autenticación, control de acceso por roles, flujo documental por etapas, filtros por proceso, dashboard operativo, bandejas de pendientes e historial. La app consume un backend externo configurado mediante variables de entorno.

## Funcionalidades principales

- Inicio de sesión institucional con usuarios almacenados en Google Sheets.
- Roles `ADMIN`, `CREADOR`, `REV`, `VAL`, `OCI` y `CONSULTA`.
- Filtro automatico por proceso para usuarios no administradores.
- Dashboard con indicadores, semaforo, pendientes por rol y graficas interactivas.
- Módulo Reportar con consulta, filtros desplegables, tabla, paginación y acciones por registro.
- Formulario por acordeones con secciones editables, solo lectura o bloqueadas segun rol y etapa.
- Máquina de estados para registro, análisis, plan de acción, validación, revisión OCI y cierre.
- Notificacion manual a Control Interno.
- Evaluación de eficacia por OCI.
- Historial de cambios.
- Skeleton loaders y loader institucional con identidad MIRA.

## Stack

- React 19 + TypeScript + Vite.
- React Router.
- TanStack Query.
- React Hook Form + Zod.
- Recharts.
- Lucide React.
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
public/        Imagenes, logos y assets publicos.
src/           Frontend React.
```

`CHANGELOG.md` conserva el historial de cambios publico del frontend.

No se debe commitear el ID real de la hoja, secretos, `.env`, credenciales de Google, Apps Script local, documentacion interna ni archivos exportados con datos institucionales.

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
- `app_scripts`, `.clasp.json` y archivos de autenticacion local.
- `docs`, documentacion interna y carpetas locales de hojas de calculo.
- `node_modules`, `dist`, logs y coverage.
- Excel, CSV, PDF y documentos locales que puedan contener datos internos.

## Licencia y uso

Proyecto institucional para la gestión interna de acciones correctivas y de mejora. Revise las políticas internas antes de publicar datos, registros o anexos.
