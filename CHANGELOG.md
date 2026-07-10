# Changelog

Todos los cambios relevantes de MIRA se documentan en este archivo.

## [1.2.1] - 2026-07-10

Corrección del flujo de evaluadores y revisión para acciones correctivas y de mejora.

### Flujo por roles

- Se dejó el evaluador de acciones correctivas fijo en `OCI`.
- Se habilitó para acciones de mejora la selección de evaluador entre `OCI` y `Lider del proceso`.
- Se permitió que `REV` consulte y gestione acciones en `PLAN_ACCION` de todos los procesos.
- Se conservó el flujo de validación y evaluación sin abrir permisos de `VAL` u `OCI` al rol `REV`.

### Actividades y revisión

- Se retiró el campo visible `Observación REV` del formulario y del detalle.
- Se dejó `Descripción de la ejecución` como el texto operativo de REV.
- Se actualizó la validación del frontend para que `observacionRevision` no sea requerida antes de enviar a validación u OCI.
- Se actualizó el mock local para avanzar de REV a VAL usando solo fecha de ejecución y descripción de ejecución.

### Validación

- Se agregaron pruebas unitarias para el evaluador de acciones correctivas y de mejora.
- Se validó contra Apps Script el flujo completo con usuarios CREADOR, REV, VAL y OCI.
- Se probaron dos acciones end-to-end: correctiva `417` y mejora `418`; ambas avanzaron de `PLAN_ACCION` a `VALIDACION` sin `observacionRevision`, pasaron a `REVISION_OCI` y cerraron como eficaces.

## [1.2.0] - 2026-07-08

Actualización del flujo de actividades, revisión, validación y evaluación OCI para reforzar permisos, mejorar reportes y corregir la experiencia responsive.

### Flujo y permisos

- Se bloqueó la evaluación OCI hasta que todas las actividades tengan ejecución REV y validación VAL completas.
- Se impidió notificar o mover acciones a revisión OCI cuando falte diligenciamiento REV/VAL.
- Se permitió que el CREADOR mantenga actividades en acciones abiertas: editar, agregar o quitar actividades.
- Se restringió la creación, edición y eliminación de actividades al rol `CREADOR` y administradores.
- Se mantuvieron los campos propios de `REV`, `VAL` y `OCI` protegidos por etapa y permisos.
- Se propagó el `Líder del proceso` como responsable de validación y se bloqueó su edición para VAL.
- Se ajustó el formulario de OCI para mostrar primero actividades, luego evaluación de la acción y al final la descripción del hallazgo.

### Actividades y datos

- Se agregó el campo `Observación REV` por actividad.
- Se dejó `Descripción de la ejecución` como campo manual, sin autollenarlo desde acción de contención.
- Se enumeraron actividades en pantalla como `1`, `2`, `3` y se expusieron códigos técnicos como `415-001`, `415-002`.
- Se ajustó el resumen del detalle para mostrar códigos reales de actividad.
- Se configuró el consecutivo de acciones con base mínima `411`, usando siempre el máximo existente más uno para permitir reutilizar el siguiente número si se elimina.

### Formularios

- Se cambió `Registrado por` y `Líder del proceso` a campos de texto libre.
- Se eliminó la lista fija de líderes de proceso en el formulario.
- Se movió `Evaluador` al bloque inicial del reporte para acciones correctivas.
- Se limitó el evaluador de acciones correctivas a `OCI` o `Líder del proceso`.
- Se corrigieron etiquetas, mensajes y textos visibles con tildes.

### Reportes y responsive

- Se rediseñó el plan de actividades en el detalle para evitar texto vertical o columnas estrechas.
- Se reemplazó la URL de evidencia por el botón `Abrir evidencia`.
- Se dejó la observación de ejecución, REV y VAL en filas horizontales con todo el ancho disponible.
- Se reorganizó la sección de revisión, validación y evaluación para que cada registro ocupe una fila completa.
- Se ajustaron tablas, tarjetas y textos largos con saltos y ancho mínimo para evitar solapamientos en pantallas pequeñas.

### Backend y autenticación

- Se agregó caché de usuarios en Apps Script para reducir lecturas repetidas de la hoja `Usuarios` durante login y validación de sesión.
- Se invalidó la caché al crear, actualizar usuarios o migrar hashes de contraseña.
- Se mantuvo el almacenamiento de contraseñas mediante salt y hash; no se guardan contraseñas en archivos del frontend.
- Se mejoró el manejo de errores HTTP de Apps Script en el cliente.

## [1.1.1] - 2026-07-05

Actualizacion de catalogos operativos para dejar los accesos de evidencia alineados con las dependencias configuradas.

### Procesos y evidencias

- Se actualizo el catalogo de procesos con las dependencias y siglas oficiales entregadas.
- Se agrego el mapa de enlaces de Drive por proceso para evidencias.
- Se conecto el boton `Abrir Drive` del formulario de actividades con el proceso seleccionado.
- Se mantuvo deshabilitado visualmente el boton cuando no exista enlace configurado.
- Se conservaron equivalencias para codigos y nombres heredados de procesos.

## [1.1.0] - 2026-07-05

Actualizacion del flujo de registro, seguimiento y administracion de usuarios para separar mejor las responsabilidades por rol y dejar la interfaz alineada con el formato MIRA.

### Flujo por roles

- Se separo el formulario de creador frente a las vistas de revision, validacion y OCI.
- Se limito a `CREADOR` al registro, analisis de causas y plan de actividades.
- Se habilito a `REV` para diligenciar solo la ejecucion de actividades que le correspondan.
- Se habilito a `VAL` para diligenciar solo la validacion de actividades que le correspondan.
- Se habilito a `OCI` como perfil global para consultar acciones de todos los procesos y diligenciar la evaluacion final.
- Se ajusto el dashboard y la bandeja de acciones para mostrar pendientes segun el rol y la etapa actual.
- Se corrigio el avance de etapa para pasar de ejecucion a validacion y luego a revision OCI cuando las actividades ya estan diligenciadas.

### Formulario de acciones

- Se actualizo la descripcion del hallazgo con fecha automatica del dia y numero de accion editable de forma manual.
- Se agregaron listas ordenadas para procesos y lideres de proceso.
- Se cambio `Identificado por` a `Registrado por`.
- Se cambio `Correccion` a `Accion de contencion`.
- Se oculto el analisis de causas cuando el tipo es accion de mejora.
- Se quitaron las secciones de miembros del equipo de mejoramiento continuo, definicion de causas definitivas y plan de mejoramiento.
- Se reemplazo `Accion` por `Actividad` en el plan.
- Se permitio agregar multiples actividades en una misma accion.
- Se cambio `Responsable` por `Responsable de actividad` como campo abierto.
- Se dejo la evidencia como campo de URL con instrucciones para organizar carpetas en Drive.
- Se cambio revision por ejecucion y observacion revision por descripcion de la ejecucion.
- Se cambio `Auditor interno` por `Evaluador` como campo abierto.
- Se cambio `Observacion` por `Observacion de la accion`.
- Se retiro el campo de recomendaciones finales.

### Configuracion de usuarios

- Se agrego una pagina de `Configuracion` visible solo para administradores.
- Se permitio listar usuarios registrados.
- Se agrego creacion de usuarios con identificador, nombre, rol, proceso, estado y contrasena.
- Se agrego edicion de usuarios sin mostrar la contrasena actual, permitiendo solo cambiarla.
- Se permitio iniciar sesion con el identificador configurado en la hoja de usuarios, sin exigir formato de correo.

### Experiencia y validacion

- Se reemplazo la confirmacion nativa del navegador por un modal profesional antes de guardar.
- Se agregaron mensajes de exito y error al guardar acciones.
- Se integro el loader institucional durante operaciones de guardado.
- Se aumento el tiempo de espera del inicio de sesion y se mejoro el mensaje cuando Apps Script tarda en responder.
- Se ajusto el formato visual de fechas a `DD/MM/YYYY`.

## [1.0.0] - 2026-06-16

Primera version funcional del sistema. Esta version construye la aplicacion completa desde cero: frontend React, backend Apps Script, modelo de datos en Google Sheets, autenticacion, control de acceso, dashboard, modulo de reportes, flujo documental, documentacion y preparacion para despliegue en Vercel.

### Identidad y experiencia visual

- Se definio el nombre final del sistema como `MIRA`.
- Se implemento una pantalla de login institucional con fondo visual, banner UNGRD y tarjeta de ingreso.
- Se incorporaron assets publicos para la identidad visual:
  - `login_neogestion.png` como fondo de login.
  - `Logo-ungrd-blanco.png` para banner institucional.
  - `mano_ungrd.png` para la tarjeta de login.
  - `Loader_MIRA.gif` para el loader institucional.
- Se agrego footer institucional con la Oficina Asesora de Planeacion e Informacion.
- Se reemplazaron referencias visibles del nombre anterior por `MIRA`.
- Se redisenaron botones, tarjetas, badges, modales, tablas, filtros, graficas y estados para una experiencia institucional moderna.

### Autenticacion y sesion

- Se implemento pantalla de inicio de sesion en React.
- Se agregaron campos de correo institucional y contrasena.
- Se agrego toggle para mostrar u ocultar contrasena.
- Se agrego checkbox `Mostrar contrasena`.
- Se agrego soporte por correo a `manolo.rey@gestiondelriesgo.gov.co`.
- Se agrego validacion visual de campos vacios.
- Se agrego manejo de sesion mediante contexto de autenticacion.
- Se almacena token de sesion en el navegador.
- Se valida sesion al cargar la aplicacion.
- Se protege el acceso a rutas privadas.
- Se agrego boton de cierre de sesion en el menu lateral.
- Se mejoro el boton de cierre de sesion con estilo rojo institucional y hover.

### Backend Apps Script

- Se implemento backend completo en Google Apps Script.
- Se agregaron entrypoints `doGet` y `doPost`.
- Se implemento router de operaciones.
- Se creo contrato de respuesta estandar con `ok`, `data`, `meta` y `error`.
- Se implemento repositorio para Google Sheets.
- Se implemento repositorio de acciones.
- Se implemento servicio de acciones.
- Se implemento servicio de parametros.
- Se implemento servicio de estadisticas.
- Se implemento servicio de historial/auditoria.
- Se implementaron validadores de reglas de negocio.
- Se implementaron utilidades de normalizacion, fechas, JSON y errores.
- Se agrego archivo de setup para preparar hojas y configuracion.
- Se agregaron pruebas utilitarias en Apps Script.
- Se removio el ID real de hoja como fallback para evitar fuga de informacion.
- Se dejo la hoja real configurable por Script Properties con `SPREADSHEET_ID`.

### Seguridad de contrasenas

- Se implemento login contra la hoja `Usuarios`.
- Se definio estructura de usuarios con:
  - `email`
  - `nombre`
  - `proceso`
  - `rol`
  - `password_salt`
  - `password_hash`
  - `activo`
- Se implemento verificacion de usuario activo.
- Se implemento hashing con salt.
- Se agrego helper para generar salt y hash de contrasena.
- Se evito almacenar contrasenas en texto plano.
- Se implemento token de sesion firmado.
- Se agrego secreto configurable por Script Properties con `AUTH_TOKEN_SECRET`.

### Roles y permisos

- Se implemento control de acceso basado en roles.
- Se agregaron roles:
  - `ADMIN`
  - `CREADOR`
  - `REV`
  - `VAL`
  - `OCI`
  - `CONSULTA`
- Se implemento permiso de lectura.
- Se implemento permiso de creacion.
- Se implemento permiso de actualizacion.
- Se implemento permiso administrativo.
- Se implementaron permisos por fase:
  - Registro.
  - Analisis.
  - Plan.
  - Validacion.
  - OCI.
- Se implemento permiso especial para notificar a OCI.
- Se implemento visualizacion en cascada:
  - Fases previas en solo lectura.
  - Fase actual editable segun rol.
  - Fases futuras bloqueadas.
- Se agrego soporte para administrador con alcance global.
- Se agrego soporte para usuario de consulta en solo lectura.

### Filtro por proceso y alcance de usuario

- Se agrego columna `proceso` en la hoja `Usuarios`.
- Se implemento filtro automatico por proceso para usuarios no administradores.
- Se bloqueo el filtro de proceso cuando el usuario no es admin.
- Se preserva el proceso asignado al limpiar filtros.
- Se ajustaron consultas, registros, dashboard y reportes para respetar el proceso del usuario.
- Se permitio que admin vea todos los procesos.
- Se evito que usuarios de un proceso vean registros de otro proceso.
- Se agrego contexto visual indicando rol, proceso y alcance.
- Se agrego popup explicativo de permisos por rol.

### Maquina de estados del documento

- Se implemento flujo documental por etapas:
  - `REGISTRO`
  - `ANALISIS`
  - `PLAN_ACCION`
  - `VALIDACION`
  - `REVISION_OCI`
  - `CERRADA`
- Se agrego estado actual del documento.
- Se agrego calculo de estado visual:
  - `ABIERTA`
  - `CERRADA`
  - `VENCIDA`
- Se implemento vencimiento por fecha fin contra la fecha actual.
- Se implemento cierre automatico cuando OCI marca una accion como eficaz.
- Se implemento salto de analisis para acciones de mejora.
- Se implemento requerimiento de accion de contencion para acciones correctivas.
- Se bloqueo la opcion de accion preventiva.
- Se implemento bloqueo de fechas despues de guardar plan.

### Dashboard

- Se implemento pagina principal de dashboard.
- Se agrego encabezado `MIRA`.
- Se agregaron botones de acceso rapido:
  - `Reportar accion`
  - `Reportar`
- Se agrego banner de contexto de usuario.
- Se agregaron filtros desplegables:
  - Origen.
  - Proceso.
  - Estado.
  - Eficacia.
- Se corrigio duplicidad de origen por tildes mediante normalizacion.
- Se agregaron KPI principales:
  - Total de acciones.
  - En seguimiento.
  - Cerradas.
  - Vencidas.
- Se agrego franja de resumen con tasas e indicadores.
- Se agrego semaforo operativo:
  - Vencidas.
  - Mis pendientes.
  - Abiertas al dia.
  - Pendientes por rol.
- Se implementaron conteos por rol:
  - Creador.
  - Revisor.
  - Validador.
  - OCI.
- Se agregaron graficas interactivas como filtros visuales.
- Se agrego grafica de estado de acciones.
- Se agrego grafica de eficacia.
- Se agrego grafica de tasas clave.
- Se agrego grafica de acciones por proceso.
- Se ajusto la grafica de procesos para mostrar todos los procesos configurados.
- Se cambio la grafica de procesos a barras verticales.
- Se elimino el scroll horizontal de la grafica de procesos.
- Se corrigio el borde/overlay negro que aparecia al hacer click en graficas.
- Se agrego lista de registros recientes.

### Modulo Reportar

- Se implemento pagina de consulta y seguimiento de acciones.
- Se retiro titulo redundante anterior y se subio la tarjeta azul como encabezado principal.
- Se agrego hero `Reporte y seguimiento en un solo flujo`.
- Se agregaron botones:
  - `Crear reporte`
  - `Buscar registro`
- Se agrego banner de contexto de usuario.
- Se agregaron tarjetas resumen:
  - Total reportadas.
  - Abiertas.
  - Cerradas.
  - Vencidas.
- Se agrego semaforo tambien en Reportar.
- Se agrego bandeja por rol.
- Se agregaron filtros desplegables sin campos libres:
  - Numero exacto.
  - Reporte.
  - Proceso.
  - Estado.
  - Eficacia.
  - Responsable.
  - Etapa del flujo.
- Se agrego contador de filtros activos.
- Se agrego boton `Buscar`.
- Se agrego boton `Limpiar filtros`.
- Se implemento tabla de registros encontrados.
- Se agregaron columnas de numero, elaboracion, proceso, tipo, reporte, responsable, fecha fin, estado, etapa, eficacia y acciones.
- Se agregaron acciones por fila:
  - Ver detalle.
  - Editar.
- Se agrego paginacion.
- Se agrego estado vacio.
- Se optimizo la experiencia para cargar datos una vez y filtrar de forma inmediata.

### Crear y editar acciones

- Se implemento ruta para crear acciones.
- Se implemento ruta para editar acciones.
- Se implemento formulario unico reutilizable.
- Se agrego confirmacion antes de guardar cambios.
- Se agrego alerta de cambios sin guardar.
- Se agrego cancelacion con confirmacion cuando hay cambios pendientes.
- Se agrego asignacion automatica de proceso para usuarios no admin.
- Se agrego soporte para query param de proceso cuando aplica.
- Se agrego navegacion al detalle luego de guardar.

### Formulario por acordeones

- Se implemento formulario por secciones acordeon.
- Se agrego leyenda visual:
  - Editable.
  - Solo lectura.
  - Bloqueada.
- Se agregaron colores y estados por permisos.
- Se implemento seccion `A. Descripcion del hallazgo`.
- Se implemento seccion `B. Analisis de causas`.
- Se implemento seccion `C. Plan de actividades`.
- Se implemento seccion `Revision y validacion`.
- Se implemento seccion `D. Evaluacion de las acciones`.
- Se implementaron secciones dinamicas:
  - Miembros del Equipo de Mejoramiento Continuo.
  - Definicion de Causas Definitivas.
  - Plan de Mejoramiento.
- Se agregaron botones para agregar y quitar registros dinamicos.
- Se bloquearon secciones no disponibles para el rol.
- Se dejaron en solo lectura secciones previas.

### Detalle de accion

- Se implemento pagina de detalle por ID.
- Se agrego encabezado con tipo de accion y proceso.
- Se agregaron badges de estado y eficacia.
- Se agrego boton `Editar`.
- Se agrego boton `Notificar a Control Interno`.
- Se implemento actualizacion de `correoEnviado`.
- Se implemento transicion a `REVISION_OCI`.
- Se agregaron secciones de expediente:
  - Datos del Mejoramiento.
  - Descripcion.
  - Accion de Contencion.
  - Miembros del Equipo de Mejoramiento Continuo.
  - Brainstorming/causas potenciales.
  - Causas Definitivas.
  - Plan de Mejoramiento.
  - Revision, Validacion y Evaluacion.
  - Ultima actividad.

### Historial

- Se implemento modulo Historial.
- Se agrego tabla de cambios registrados.
- Se agregaron columnas:
  - Fecha.
  - Usuario.
  - Operacion.
  - Numero.
  - Datos modificados.
- Se registra auditoria para creacion y actualizacion.

### Carga, skeletons y feedback

- Se implemento loader global institucional.
- Se integro `Loader_MIRA.gif`.
- Se implemento popup mediano en azul institucional.
- Se agrego blur y opacidad al fondo durante cargas.
- Se retiro el spinner generico anterior.
- Se mantuvieron skeleton loaders en Dashboard y Reportar.
- Se agrego bridge con TanStack Query para mostrar loader en cargas globales.
- Se agrego progress bar superior de navegacion.
- Se mejoraron mensajes de error.

### Frontend tecnico

- Se creo estructura por funcionalidades.
- Se agrego router protegido.
- Se agrego layout principal.
- Se agrego contexto de autenticacion.
- Se agrego contexto de loader.
- Se agrego cliente API centralizado.
- Se agregaron tipos compartidos.
- Se agregaron esquemas Zod.
- Se agregaron utilidades de fecha, formato, estado y workflow.
- Se agregaron tests unitarios para API, schema, defaults, status y formato.
- Se agregaron estilos globales, tokens, reset y utilidades.

### Documentacion

- Se creo guia funcional completa en `docs/GUIA_FUNCIONAL_MIRA.md`.
- Se documentaron arquitectura, API, modelo de datos, migracion desde Excel y paleta institucional.
- Se actualizo README con instalacion, variables, Apps Script, Vercel y seguridad.
- Se creo este CHANGELOG.

### Preparacion para Vercel

- Se agrego `vercel.json`.
- Se definio framework Vite.
- Se definio `npm ci` como comando de instalacion.
- Se definio `npm run build` como build command.
- Se definio `dist` como output directory.
- Se agrego rewrite SPA hacia `index.html`.
- Se documento configuracion de variables de entorno en Vercel.

### Seguridad del repositorio

- Se amplio `.gitignore`.
- Se excluyeron `.env` y variantes locales.
- Se excluyeron credenciales, llaves y archivos de autenticacion local.
- Se excluyo `.vercel`.
- Se excluyeron `node_modules`, `dist`, coverage y logs.
- Se excluyeron Excel y PDF locales que pueden contener datos institucionales.
- Se neutralizo el ID real de Google Sheet que estaba como fallback.

### Validacion

- Se ejecuto build de produccion con `npm run build`.
- Se comprobo que el proyecto compila con TypeScript y Vite.
- Se verifico que los textos visibles usan el nombre `MIRA`.
