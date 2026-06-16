# Migracion desde Excel

1. Haga una copia de seguridad del archivo `.xlsm` y de la hoja de calculo destino.
2. Importe o copie la hoja `Base` al Google Sheet destino.
3. Verifique que los encabezados esten en la fila 2 y que los datos inicien en la fila 3.
4. Compruebe que el orden A:AE coincide con `docs/MODELO_DE_DATOS.md`.
5. Importe o copie la hoja `Parámetros`.
6. Revise que las listas esten en A:H: origen, tipo de accion, procesos, personas, lideres, relacion proceso-lider, lideres SIPLAG y auditores.
7. Valide que los IDs sean numericos y no existan duplicados.
8. Revise fechas importadas desde Excel; Apps Script normaliza salida a `YYYY-MM-DD`.
9. Revise presupuestos; deben ser numeros y nunca negativos.
10. Configure `SPREADSHEET_ID` en Script Properties.
11. Ejecute `validateConfiguration()` desde Apps Script.
12. Ejecute `setupProject()` solo despues de verificar la copia. La funcion no sobrescribe datos existentes.
