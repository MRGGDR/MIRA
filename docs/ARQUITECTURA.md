# Arquitectura

La solucion separa frontend y backend:

- Frontend: React, TypeScript, Vite, React Router, TanStack Query, React Hook Form y Zod.
- Backend: Google Apps Script mediante `doGet(e)` y `doPost(e)`.
- Base de datos: Google Sheets.

El frontend no conoce detalles de columnas de Sheets. Toda comunicacion pasa por `src/services/apiClient.ts`, que envia JSON como `text/plain;charset=utf-8` para evitar preflight CORS en Apps Script.

El backend organiza su codigo en `app_scripts` con archivos numerados para copiar manualmente al editor de Apps Script. El mapeo A:AE vive solo en `00_Config.gs`.

No se implementa backend Node. Node se usa exclusivamente para desarrollo, pruebas y build del frontend.
