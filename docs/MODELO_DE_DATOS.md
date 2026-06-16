# Modelo de datos

La hoja `Base` conserva las columnas A:AE originales y agrega AF:AH para datos detallados del seguimiento.

| Columna | Campo |
| --- | --- |
| A | id |
| B | fechaElaboracion |
| C | origen |
| D | tipoAccion |
| E | proceso |
| F | identificadoPor |
| G | liderProceso |
| H | descripcion |
| I | equipoMejoramiento |
| J | identificacionCausas |
| K | causaRaiz |
| L | correccion |
| M | accion |
| N | responsable |
| O | fechaApertura |
| P | fechaCierre |
| Q | fechaInicioAccion |
| R | fechaFinAccion |
| S | presupuesto |
| T | revisionResponsable |
| U | revisionFecha |
| V | revisionObservacion |
| W | validacionResponsable |
| X | validacionFecha |
| Y | validacionObservacion |
| Z | evidencia |
| AA | auditorInterno |
| AB | fechaEvaluacion |
| AC | eficacia |
| AD | evaluacionObservacion |
| AE | estado |
| AF | equipoMejoramientoDetalle |
| AG | causasDefinitivas |
| AH | planMejoramiento |

Filas configuradas:

- Fila 1: titulos generales.
- Fila 2: encabezados.
- Fila 3: primer registro.

`estado` lo calcula el backend: eficacia vacia mantiene `ABIERTA`; eficacia `SI` o `NO` marca `CERRADA`.

Los campos AF:AH se guardan como JSON para soportar varios integrantes, causas definitivas y actividades de plan con sus controles Rev/Val sin alterar las columnas historicas.
