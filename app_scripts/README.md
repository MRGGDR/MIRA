# Backend Apps Script

Copie estos archivos al editor de Apps Script asociado al Google Sheet en orden numerico:

1. `00_Config.gs`: configuracion, hojas, columnas A:AE, permisos y procesos iniciales.
2. `01_EntryPoints.gs`: `doGet(e)` y `doPost(e)`.
3. `02_Router.gs`: enrutamiento de operaciones.
4. `03_Response.gs`: contrato JSON estandar.
5. `04_Auth.gs`: usuario actual y permisos.
6. `05_SheetsRepository.gs`: acceso a Spreadsheet y hojas.
7. `06_ActionsRepository.gs`: conversion fila/accion, busqueda exacta e IDs.
8. `07_ActionsService.gs`: CRUD inicial.
9. `08_ParametersService.gs`: listas desde `Parámetros`.
10. `09_StatsService.gs`: indicadores.
11. `10_AuditService.gs`: historial.
12. `11_Validators.gs`: validacion backend.
13. `12_Utils.gs`: fechas, normalizacion y estado.
14. `13_Setup.gs`: `setupProject()` y `validateConfiguration()`.
15. `14_Tests.gs`: pruebas manuales.

## Configuracion

En Apps Script, abra Project Settings > Script Properties y agregue:

- `SPREADSHEET_ID`: ID de la hoja de calculo.
- `AUTH_TOKEN_SECRET`: secreto largo y privado para firmar tokens de sesion.
- `AUTH_FALLBACK`: opcional. Valores: `BLOCK_WRITES`, `READ_ONLY`, `ALLOW_DEVELOPMENT`.

El valor seguro esperado para produccion es no permitir escrituras a usuarios no identificados.

## Puesta en marcha

1. Configure `SPREADSHEET_ID` y `AUTH_TOKEN_SECRET`.
2. Ejecute `setupProject()`.
3. Ejecute `validateConfiguration()`.
4. Despliegue como aplicacion web.
5. Seleccione ejecutar como el usuario que despliega.
6. Defina acceso para cualquier usuario, incluso anonimo, si la interfaz se conecta por proxy local o por un backend sin sesion de Google.
7. Copie la URL `/exec`.
8. Configure esa URL en `.env` como `VITE_APPS_SCRIPT_URL`.
