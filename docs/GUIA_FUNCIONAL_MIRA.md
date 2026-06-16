# Guia funcional fuente para manual de usuario - MIRA

Este documento es una guia fuente para construir un manual de usuario completo, claro e intuitivo de MIRA. No esta pensado como texto final para el usuario, sino como insumo detallado para que una IA redacte un manual pedagogico con capturas, pasos guiados, advertencias y ejemplos.

## 1. Objetivo del sistema

MIRA es una plataforma institucional de la UNGRD para registrar, consultar, hacer seguimiento y cerrar acciones correctivas y de mejora.

El sistema reemplaza y moderniza el flujo anterior de SIPLAG, permitiendo:

- Registrar hallazgos y acciones.
- Hacer analisis de causas cuando aplica.
- Construir planes de accion.
- Revisar y validar actividades por rol.
- Notificar manualmente a Control Interno.
- Evaluar la eficacia final de las acciones.
- Consultar estados, vencimientos, responsables, procesos y etapas.
- Mantener trazabilidad de cambios en historial.

## 2. Conceptos basicos que debe explicar el manual

### Accion

Es el registro principal del sistema. Representa una accion correctiva o de mejora que debe pasar por un flujo de etapas.

### Proceso

Es el area o dependencia a la que pertenece el usuario y la accion. En la hoja de usuarios se guarda en la columna `proceso`.

Regla importante:

- Si el usuario no es administrador, solo ve registros de su proceso.
- Si el usuario es administrador, puede ver todos los procesos.

### Rol

Define que puede hacer el usuario dentro del flujo. Los roles principales son:

- `CREADOR`
- `REV`
- `VAL`
- `OCI`
- `ADMIN`
- `CONSULTA`

### Estado visual

Indica la situacion operativa de la accion:

- `ABIERTA`: accion en seguimiento.
- `CERRADA`: accion terminada.
- `VENCIDA`: accion abierta cuya fecha fin ya paso.

### Estado del flujo

Indica la etapa documental en la que va la accion:

- `REGISTRO`
- `ANALISIS`
- `PLAN_ACCION`
- `VALIDACION`
- `REVISION_OCI`
- `CERRADA`

El estado visual y el estado del flujo no son lo mismo. Una accion puede estar abierta y al mismo tiempo estar en etapa de plan de accion, validacion u OCI.

## 3. Autenticacion e inicio de sesion

### Pantalla de login

Ruta:

- `/login`

Elementos visibles:

- Fondo institucional con imagen `login_neogestion.png`.
- Banner superior izquierdo con logo UNGRD y texto de la Oficina Asesora de Planeacion e Informacion.
- Tarjeta de ingreso al lado derecho.
- Logo o simbolo institucional dentro de la tarjeta.
- Titulo: `Ingresar a MIRA`.
- Campo `Correo institucional`.
- Campo `Contrasena`.
- Icono para mostrar u ocultar contrasena.
- Checkbox `Mostrar contrasena`.
- Link `Olvidaste tu contrasena?`.
- Boton principal `Ingresar`.
- Mensaje de seguridad: `Conexion segura y encriptada`.
- Caja de soporte con correo `manolo.rey@gestiondelriesgo.gov.co`.
- Footer: `Oficina Asesora de Planeacion e Informacion © 2026`.

### Validacion basica del login

Antes de enviar, el formulario valida que:

- El correo no este vacio.
- La contrasena no este vacia.

Si faltan datos, se muestran errores visuales en el formulario.

### Loader al iniciar sesion

Al presionar `Ingresar`, se muestra el loader institucional:

- Popup mediano, no pantalla completa.
- Fondo de la pagina visible, opaco y con blur.
- Tarjeta azul institucional.
- Logo UNGRD y Oficina Asesora de Planeacion e Informacion.
- GIF `Loader_MIRA.gif`.
- Barra de progreso amarilla.

El loader tambien se usa en cargas importantes del sistema.

### Seguridad de credenciales

El backend en Google Apps Script consulta la hoja `Usuarios`.

Columnas esperadas:

| Columna | Descripcion |
| --- | --- |
| `email` | Correo del usuario |
| `nombre` | Nombre visible |
| `proceso` | Proceso o area del usuario |
| `rol` | Rol asignado |
| `password_salt` | Salt de la contrasena |
| `password_hash` | Hash seguro de la contrasena |
| `activo` | Indica si el usuario puede ingresar |

Reglas:

- El usuario debe existir.
- `activo` debe estar en verdadero.
- La contrasena se verifica comparando hash con salt.
- El sistema no guarda contrasenas en texto plano.
- La sesion se guarda en el navegador con token.
- La sesion se valida al cargar la aplicacion.

## 4. Menu lateral y estructura general

Cuando el usuario inicia sesion entra a una aplicacion con menu lateral.

### Encabezado lateral

Muestra:

- Logo institucional UNGRD.
- Titulo: `Acciones correctivas y de mejora`.

### Modulos

Opciones del menu:

| Modulo | Ruta | Uso |
| --- | --- | --- |
| Dashboard | `/` | Vista general de indicadores, filtros y graficas |
| Reportar | `/acciones` | Consulta, registro y seguimiento de acciones |
| Historial | `/historial` | Consulta de cambios registrados |

### Zona inferior del menu

Muestra:

- Tarjeta del usuario con nombre, rol y proceso.
- Boton rojo `Cerrar sesion`.
- Badge institucional de la Oficina Asesora de Planeacion e Informacion.

### Cerrar sesion

El boton `Cerrar sesion`:

- Elimina la sesion local.
- Redirige al login.
- Usa estilo rojo institucional.
- Tiene hover mas oscuro.

## 5. Roles y permisos

El manual debe explicar que el sistema funciona por permisos en cascada. Esto significa:

- Un usuario puede ver informacion de etapas anteriores.
- Solo puede editar la etapa que le corresponde.
- Las etapas futuras aparecen bloqueadas.
- Las etapas anteriores aparecen como solo lectura.

### Tabla general de permisos

| Rol | Que puede hacer | Que puede ver | Alcance |
| --- | --- | --- | --- |
| `CREADOR` | Crear acciones, diligenciar registro y analisis | Puede revisar la informacion de su proceso | Solo su proceso |
| `REV` | Diligenciar plan de accion, fechas, presupuesto y notificar a OCI cuando aplique | Puede revisar registro y analisis | Solo su proceso |
| `VAL` | Validar plan, registrar observaciones y evidencia | Puede revisar informacion previa | Solo su proceso |
| `OCI` | Evaluar eficacia, marcar eficaz/no eficaz y dejar recomendaciones finales | Puede revisar todo el expediente | Solo su proceso, salvo configuracion admin |
| `ADMIN` | Ver, crear, editar y apoyar cualquier fase | Todo | Todos los procesos |
| `CONSULTA` | Solo lectura | Informacion disponible segun alcance | Solo su proceso |

### CREADOR

Puede:

- Crear un reporte nuevo.
- Editar `A. Descripcion del hallazgo`.
- Editar `B. Analisis de causas`, cuando aplique.
- Consultar registros de su proceso.

No puede:

- Editar plan de accion.
- Validar.
- Evaluar eficacia final como OCI.

### REV

Puede:

- Consultar reportes de su proceso.
- Editar la etapa `C. Plan de actividades` cuando la accion esta en etapa de plan.
- Asignar responsables.
- Asignar fechas.
- Registrar presupuesto.
- Notificar a Control Interno cuando el flujo lo permita.

No puede:

- Modificar el registro inicial si ya no es su fase.
- Hacer validacion final.
- Marcar eficaz o no eficaz.

### VAL

Puede:

- Consultar reportes de su proceso.
- Validar la accion o plan.
- Registrar responsable de validacion.
- Registrar fecha de validacion.
- Dejar observaciones.
- Adjuntar o registrar evidencia si el campo aplica.

No puede:

- Editar plan si ya fue diligenciado por Revisor.
- Evaluar eficacia final como OCI.

### OCI

Puede:

- Revisar el expediente completo.
- Registrar auditor interno.
- Registrar fecha de evaluacion.
- Marcar si la accion fue `Eficaz` o `No eficaz`.
- Dejar observaciones de evaluacion.
- Dejar recomendaciones finales.

Regla clave:

- Si OCI marca `Eficaz`, la accion llega a estado cerrado/terminado.

### ADMIN

Puede:

- Ver todos los procesos.
- Cambiar filtros de proceso.
- Crear reportes para cualquier proceso.
- Editar o apoyar cualquier etapa segun necesidad.
- Revisar todos los registros.

### CONSULTA

Puede:

- Ver informacion.
- Consultar registros.

No puede:

- Crear.
- Editar.
- Notificar.
- Evaluar.

## 6. Banner de contexto de acceso

En Dashboard y Reportar aparece un bloque visual sobre el rol y el alcance.

Debe explicar al usuario:

- Que rol tiene.
- A que proceso pertenece.
- Si la informacion esta filtrada por su proceso.
- Que puede hacer con su rol.

El usuario puede hacer clic en este bloque para abrir un popup con informacion detallada:

- Nombre de usuario.
- Rol.
- Proceso.
- Alcance de visualizacion.
- Lista de acciones permitidas.

Mensajes esperados por perfil:

- Admin: puede ver todos los procesos y apoyar cualquier fase.
- Creador: registra hallazgos y analisis.
- Revisor: diligencia plan y puede notificar a OCI.
- Validador: valida plan y deja observaciones.
- OCI: evalua eficacia y recomendaciones finales.
- Consulta: solo lectura.

## 7. Flujo documental y maquina de estados

El manual debe explicar que cada accion avanza por etapas.

### Etapas

| Estado tecnico | Nombre para usuario | Responsable principal | Descripcion |
| --- | --- | --- | --- |
| `REGISTRO` | Registro del hallazgo | CREADOR | Se crea la accion y se diligencia la informacion inicial |
| `ANALISIS` | Analisis de causas | CREADOR | Se analizan causas; se oculta para acciones de mejora |
| `PLAN_ACCION` | Plan de accion | REV | Se diligencia accion, responsables, fechas y presupuesto |
| `VALIDACION` | Validacion | VAL | Se revisa y valida lo propuesto |
| `REVISION_OCI` | Revision OCI | OCI | Control Interno evalua eficacia |
| `CERRADA` | Cerrada | Sistema/OCI | La accion queda terminada |

### Reglas especiales del flujo

#### Fase 1: Registro

- Genera ID consecutivo.
- Genera fecha automatica si no se diligencia.
- Bloquea la opcion `preventiva`.
- Permite crear accion correctiva o de mejora.

#### Fase 2: Analisis

- Se muestra para accion correctiva.
- Se oculta o se salta para accion de mejora.
- Si la accion es correctiva, aparece el campo obligatorio `Accion de contencion`.

#### Fase 3: Plan de accion

- La diligencia el rol `REV`.
- Incluye fechas de inicio/fin y presupuesto.
- Al guardar, las fechas quedan bloqueadas.

#### Fase 4: Validacion

- La diligencia el rol `VAL`.
- Permite registrar observaciones de validacion.

#### Transicion manual a OCI

- No se envia correo automatico.
- Se muestra un boton manual: `Notificar a Control Interno`.
- Al hacer clic:
  - Se marca `correoEnviado = true`.
  - La accion pasa a `REVISION_OCI`.

#### Fase 7: Revision OCI

- Se habilitan campos exclusivos del rol `OCI`.
- OCI evalua eficacia.

#### Fase 8: Cerrada

- Se alcanza automaticamente cuando OCI marca el plan como `Eficaz`.
- El sistema calcula tambien si la accion esta abierta, cerrada o vencida segun fechas.

## 8. Dashboard

Ruta:

- `/`

Objetivo:

- Dar una vista general del estado de las acciones.
- Permitir filtrar rapidamente.
- Mostrar alertas y graficas interactivas.

### Encabezado

Titulo:

- `MIRA`

Descripcion:

- Seguimiento institucional de acciones correctivas, preventivas y de mejora.

Botones:

| Boton | Accion |
| --- | --- |
| `Reportar accion` | Abre la pantalla para crear una accion nueva |
| `Reportar` | Abre la lista de reportes |

### Filtros del Dashboard

Filtros disponibles:

| Filtro | Tipo | Comportamiento |
| --- | --- | --- |
| Origen | Desplegable | Lista origenes disponibles sin escribir manualmente |
| Proceso | Desplegable | Admin puede elegir; usuarios normales lo ven fijo a su proceso |
| Estado | Desplegable | Todos, abiertas, cerradas, vencidas |
| Eficacia | Desplegable | Todas, eficaz, no eficaz, sin evaluar |

Regla importante:

- Si el usuario pertenece a un proceso especifico, el filtro de proceso queda preseleccionado y bloqueado.
- El usuario no debe poder cambiarlo para ver informacion de otras areas.

Boton o accion `Limpiar`:

- Limpia filtros activos.
- Mantiene el proceso del usuario si no es admin.

### Tarjetas KPI

Tarjetas principales:

| Tarjeta | Explicacion |
| --- | --- |
| Total Acciones | Total de acciones del alcance actual |
| En Seguimiento | Acciones abiertas |
| Cerradas | Acciones cerradas |
| Vencidas | Acciones abiertas con fecha fin vencida |

Cada tarjeta puede mostrar:

- Numero principal.
- Porcentaje.
- Indicador visual circular o barra.

### Franja de resumen

Puede incluir:

- Tasa de cierre.
- Eficacia evaluada.
- Vencimiento.
- Procesos activos.

### Semaforo y pendientes

El Dashboard incluye alertas tipo semaforo:

| Color | Significado |
| --- | --- |
| Rojo | Acciones vencidas |
| Amarillo | Pendientes del rol actual |
| Verde | Acciones abiertas al dia |

Tarjetas esperadas:

- `Vencidas`.
- `Mis pendientes`.
- `Abiertas al dia`.
- `Pendientes por rol`.

Al hacer clic en estas tarjetas, el sistema filtra la informacion relacionada.

### Pendientes por rol

Muestra conteos para:

- Creador.
- Revisor.
- Validador.
- OCI.

Sirve para saber donde se concentra el trabajo del flujo.

### Graficas interactivas

Todas las graficas deben entenderse como filtros visuales.

#### Estado de Acciones

Grafica de dona o distribucion por estado.

Al hacer clic en un segmento:

- Filtra por ese estado.

#### Evaluacion de Eficacia

Muestra acciones eficaces, no eficaces o sin evaluar.

Al hacer clic:

- Filtra por la eficacia elegida.

#### Tasas clave

Muestra indicadores agregados.

Al hacer clic:

- Aplica el filtro relacionado.

#### Acciones por Proceso

Grafica de barras verticales.

Reglas:

- Debe mostrar todos los procesos configurados.
- No debe mostrar barra de desplazamiento.
- Procesos con cero acciones tambien pueden aparecer para mantener vision institucional.
- Al hacer clic en una barra, filtra por ese proceso.
- Si el usuario no es admin, el proceso ya esta fijo a su proceso.

### Registros recientes

Muestra las ultimas acciones encontradas.

Cada elemento permite abrir el detalle del registro.

Boton:

- `Ver todas`: lleva a Reportar.

### Carga del Dashboard

Mientras se cargan datos:

- Se muestra skeleton loader en el fondo.
- Si hay carga global importante, aparece el popup institucional con GIF.
- El fondo debe verse blur/opaco para que el loader sea protagonista.

## 9. Pagina Reportar / Consulta de acciones

Ruta:

- `/acciones`

Objetivo:

- Consultar registros.
- Crear nuevos reportes.
- Ver bandeja de pendientes por rol.
- Filtrar y abrir acciones.

### Header azul

Texto principal:

- `Reporte y seguimiento en un solo flujo`

Botones:

| Boton | Accion |
| --- | --- |
| `Crear reporte` | Abre formulario de nueva accion |
| `Buscar registro` | Lleva a la zona de filtros |

### Banner de contexto

Igual que en Dashboard, informa:

- Rol.
- Proceso.
- Alcance.
- Que puede hacer el usuario.

### Tarjetas resumen

Tarjetas:

| Tarjeta | Explicacion |
| --- | --- |
| Total reportadas | Total de registros encontrados para el alcance/filtros |
| Abiertas | Acciones abiertas |
| Cerradas | Acciones cerradas |
| Vencidas | Acciones vencidas |

### Semaforo en Reportar

Tambien debe mostrar:

- Vencidas.
- Mis pendientes.
- Abiertas al dia.
- Bandeja por rol.

Al hacer clic, aplica filtros a la lista.

### Filtros de Reportar

Seccion:

- `Consultar reportes`

Todos los filtros son desplegables. Ninguno debe ser campo libre para escribir.

Filtros:

| Filtro | Funcion |
| --- | --- |
| Numero exacto | Selecciona un ID exacto |
| Reporte | Selecciona por descripcion/resumen del reporte |
| Proceso | Filtra por proceso; bloqueado al proceso del usuario si no es admin |
| Estado | Filtra por abierta, cerrada o vencida |
| Eficacia | Filtra por eficaz, no eficaz o sin evaluar |
| Responsable | Filtra por responsable |
| Etapa del flujo | Filtra por etapa documental |

Botones:

| Boton | Accion |
| --- | --- |
| `Buscar` | Aplica filtros seleccionados |
| `Limpiar filtros` | Limpia filtros, conservando el proceso si aplica |

Contador:

- Muestra cuantos filtros estan activos.

### Tabla de registros

Columnas:

| Columna | Explicacion |
| --- | --- |
| Numero | ID de la accion |
| Elaboracion | Fecha de elaboracion |
| Proceso | Proceso asociado |
| Tipo de accion | Correctiva o de mejora |
| Reporte | Descripcion breve |
| Responsable | Responsable de accion |
| Fecha fin | Fecha limite |
| Estado | Abierta, cerrada o vencida |
| Etapa | Etapa actual del flujo |
| Eficacia | Eficaz, no eficaz o sin evaluar |
| Acciones | Botones para ver o editar |

Botones por fila:

| Icono/Boton | Accion |
| --- | --- |
| Ojo | Abrir detalle |
| Lapiz | Editar accion |

### Paginacion

Botones:

- `Anterior`.
- `Siguiente`.

Texto:

- Pagina actual y total.

### Estado vacio

Si no hay resultados:

- Mostrar mensaje indicando que no hay acciones con los filtros actuales.
- Ofrecer boton `Reportar accion`.

### Carga en Reportar

Mientras se cargan datos:

- Se muestra skeleton loader de la pagina.
- El loader popup institucional se usa solo para cargas globales importantes.
- Los filtros deben ser inmediatos despues de que la informacion inicial ya fue cargada.

## 10. Crear accion

Ruta:

- `/acciones/nueva`

Objetivo:

- Crear un nuevo reporte.

### Encabezado

Titulo:

- `Reportar accion`

Descripcion:

- `Registro unico para todos los procesos.`

### Reglas al crear

- El ID lo genera el backend.
- La fecha de elaboracion puede venir automatica.
- Si el usuario no es admin, el proceso se asigna al proceso del usuario.
- La opcion preventiva no debe aparecer.
- Una accion de mejora salta el analisis.
- Una accion correctiva exige accion de contencion.

### Botones

| Boton | Accion |
| --- | --- |
| `Guardar` | Crea la accion |
| `Cancelar` | Sale del formulario |

Si hay cambios sin guardar, el sistema debe advertir antes de salir.

## 11. Editar accion

Ruta:

- `/acciones/:id/editar`

Objetivo:

- Editar la accion segun rol, etapa y permisos.

### Encabezado

Titulo:

- `Editar accion {id}`

Descripcion:

- La actualizacion se aplica solo al ID exacto.

### Confirmacion

Antes de guardar, el sistema puede preguntar:

- `Desea guardar los cambios de esta accion?`

### Reglas de edicion

- Solo se edita la fase que corresponde al rol.
- Las fases anteriores quedan en solo lectura.
- Las fases futuras quedan bloqueadas.
- Admin puede apoyar cualquier fase.
- Si las fechas del plan ya quedaron bloqueadas, no se deben modificar.

## 12. Formulario por acordeones

El formulario se organiza en secciones tipo acordeon para que sea mas intuitivo.

### Leyenda visual

Estados de cada seccion:

| Estado visual | Significado |
| --- | --- |
| Editable | El usuario puede diligenciar esa fase |
| Solo lectura | El usuario puede revisar, pero no editar |
| Bloqueada | Se habilita en otra fase o para otro rol |

### A. Descripcion del hallazgo

Responsable:

- CREADOR.

Campos:

- Numero de la accion.
- Fecha de elaboracion.
- Origen.
- Tipo de accion.
- Proceso/subproceso.
- Identificado por.
- Lider del proceso.
- Descripcion del hallazgo.

Reglas:

- `Numero` puede estar bloqueado.
- `Proceso` se bloquea para usuarios no admin.
- Tipo preventiva no se permite.

### B. Analisis de causas

Responsable:

- CREADOR.

Campos:

- Equipo de mejoramiento.
- Identificacion de causas.
- Causa raiz.
- Correccion.
- Accion de contencion.

Reglas:

- Se oculta para acciones de mejora.
- `Accion de contencion` aparece y es obligatoria para accion correctiva.

### C. Plan de actividades

Responsable:

- REV.

Campos:

- Accion.
- Responsable.
- Fecha apertura.
- Fecha cierre.
- Fecha inicio accion.
- Fecha fin accion.
- Presupuesto.

Reglas:

- Al guardar el plan, las fechas pueden quedar bloqueadas.
- Usuarios no REV no editan esta seccion, salvo ADMIN.

### Revision y validacion

Responsable:

- VAL, con informacion de revision segun flujo.

Campos:

- Responsable revision.
- Fecha ejecucion revision.
- Observacion revision.
- Responsable validacion.
- Fecha ejecucion validacion.
- Observacion validacion.
- Evidencia.

### D. Evaluacion de las acciones

Responsable:

- OCI.

Campos:

- Auditor interno.
- Fecha evaluacion.
- Las acciones fueron eficaces.
- Observacion evaluacion.
- Recomendaciones finales.

Reglas:

- Solo OCI y ADMIN deben poder diligenciar.
- Al marcar eficaz, la accion se cierra.

### Secciones dinamicas

#### Miembros del Equipo de Mejoramiento Continuo

Campos por integrante:

- Nombre.
- Previas.
- Votacion.

Boton:

- `Agregar`.
- Boton de eliminar por fila.

#### Definicion de Causas Definitivas

Campos por causa:

- Causa.
- Descripcion.
- Votos.
- Puntaje.

Boton:

- `Agregar`.
- Boton de eliminar por fila.

#### Plan de Mejoramiento

Permite agregar varias actividades.

Campos por actividad:

- Actividad.
- Fecha apertura.
- Fecha cierre.
- Presupuesto.
- Responsable.
- Responsable revision.
- Fecha revision.
- Observacion revision.
- Responsable validacion.
- Fecha validacion.
- Observacion validacion.

Botones:

- `Agregar`.
- `Quitar`.

## 13. Detalle de accion

Ruta:

- `/acciones/:id`

Objetivo:

- Ver el expediente completo de una accion.

### Encabezado

Titulo:

- `Mejoramiento {id}`

Descripcion:

- Tipo de accion y proceso.

Botones:

| Boton | Cuando aparece | Accion |
| --- | --- | --- |
| `Notificar a Control Interno` | Cuando el rol puede notificar y aun no se ha enviado | Marca correo enviado y mueve a Revision OCI |
| `Editar` | Segun permisos de acceso | Abre formulario de edicion |

### Resumen del registro

Debe mostrar:

- Descripcion principal.
- Estado visual.
- Eficacia.
- Codigo.
- Sistema de gestion.
- Fecha de inicio.
- Fecha de cierre.

### Secciones del detalle

El detalle puede incluir:

- Datos del Mejoramiento.
- Descripcion.
- Accion de Contencion.
- Miembros del Equipo de Mejoramiento Continuo.
- Brainstorming o causas potenciales.
- Definicion de Causas Definitivas.
- Plan de Mejoramiento.
- Revision, Validacion y Evaluacion de Actividades.
- Ultima actividad registrada.

### Notificar a Control Interno

Al presionar el boton:

- Se muestra loader.
- Se actualiza el registro.
- La accion pasa a etapa `REVISION_OCI`.
- El boton deja de aparecer si `correoEnviado = true`.

## 14. Historial

Ruta:

- `/historial`

Objetivo:

- Consultar cambios registrados por Apps Script.

### Encabezado

Titulo:

- `Historial`

Descripcion:

- `Cambios registrados por Apps Script.`

### Tabla

Columnas:

| Columna | Explicacion |
| --- | --- |
| Fecha | Momento del cambio |
| Usuario | Usuario que hizo la accion |
| Operacion | Tipo de operacion |
| Numero | ID de la accion |
| Datos modificados | Resumen o JSON del cambio |

Operaciones comunes:

- `CREATE`.
- `UPDATE`.

## 15. Catalogo de botones principales

| Pantalla | Boton | Funcion |
| --- | --- | --- |
| Login | `Ingresar` | Valida credenciales e inicia sesion |
| Login | `Mostrar contrasena` | Muestra u oculta la contrasena |
| Login | `Olvidaste tu contrasena?` | Abre contacto de soporte |
| Menu lateral | `Cerrar sesion` | Cierra sesion y vuelve al login |
| Dashboard | `Reportar accion` | Crea una accion nueva |
| Dashboard | `Reportar` | Abre lista de reportes |
| Dashboard | `Limpiar` | Limpia filtros activos |
| Dashboard | Graficas | Funcionan como filtros visuales |
| Reportar | `Crear reporte` | Abre formulario nuevo |
| Reportar | `Buscar registro` | Baja a filtros |
| Reportar | `Buscar` | Aplica filtros |
| Reportar | `Limpiar filtros` | Limpia filtros manteniendo proceso si aplica |
| Reportar | Ojo | Abre detalle |
| Reportar | Lapiz | Abre edicion |
| Formulario | `Guardar` | Guarda o actualiza accion |
| Formulario | `Cancelar` | Sale del formulario |
| Detalle | `Notificar a Control Interno` | Pasa a Revision OCI |
| Detalle | `Editar` | Abre formulario editable |
| Historial | Sin accion principal | Solo consulta |

## 16. Filtros y comportamiento esperado

### Filtros bloqueados por proceso

Para usuarios con proceso especifico:

- El filtro `Proceso` debe aparecer seleccionado con su proceso.
- No debe dejar desplegar o elegir otro proceso.
- Todas las actividades, registros, graficas y conteos deben respetar ese proceso.

Para admin:

- Puede seleccionar cualquier proceso.
- Puede ver todos.

### Filtro de origen

Debe evitar duplicados por tildes o diferencias de escritura.

Ejemplo:

- `Auditoría interna` y `Auditoria interna` no deben aparecer duplicados si representan lo mismo.

### Filtros inmediatos

El sistema carga la informacion necesaria al entrar a Dashboard y Reportar. Luego, los filtros deben responder de forma inmediata sin recargar innecesariamente.

## 17. Carga, skeletons y loaders

El sistema usa dos niveles visuales de carga.

### Skeleton loader

Se muestra en el fondo de paginas como:

- Dashboard.
- Reportar.

Sirve para dar a entender la estructura de la pagina mientras llegan datos.

### Loader popup institucional

Se usa para cargas importantes:

- Login.
- Validacion de sesion.
- Mutaciones o procesos globales.

Caracteristicas:

- No ocupa toda la pagina como bloque solido.
- Aparece en popup mediano.
- Fondo visible con blur y opacidad.
- Usa `Loader_MIRA.gif`.
- Tiene barra de progreso amarilla.
- Mantiene identidad UNGRD y Oficina Asesora de Planeacion e Informacion.

## 18. Reglas de negocio importantes

### Accion preventiva

- La opcion preventiva esta bloqueada.
- No debe aparecer en el formulario.
- El backend tambien la rechaza si llega a enviarse.

### Accion de mejora

- Salta u oculta la etapa de analisis.
- Pasa directamente hacia plan de accion.

### Accion correctiva

- Debe mostrar `Accion de contencion`.
- Ese campo es obligatorio.

### Fechas bloqueadas

- Al guardar el plan de accion, las fechas quedan bloqueadas.
- Esto evita cambios posteriores no controlados.

### Cierre por eficacia

- OCI es el unico rol operativo que marca `Eficaz` o `No eficaz`.
- Si marca `Eficaz`, la accion queda cerrada/terminada.

### Vencimiento

Una accion se considera vencida cuando:

- Esta abierta.
- Tiene fecha fin de accion anterior a la fecha actual.

## 19. Datos y hojas de calculo

### Hoja Usuarios

Columnas:

- `email`
- `nombre`
- `proceso`
- `rol`
- `password_salt`
- `password_hash`
- `activo`

### Hoja Base o acciones

Contiene los registros de acciones.

Campos principales:

- ID.
- Fecha de elaboracion.
- Origen.
- Tipo de accion.
- Proceso.
- Identificado por.
- Lider de proceso.
- Descripcion.
- Analisis de causas.
- Accion de contencion.
- Accion.
- Responsable.
- Fechas.
- Presupuesto.
- Revision.
- Validacion.
- Evidencia.
- Evaluacion OCI.
- Eficacia.
- Estado.
- Estado actual del flujo.
- Correo enviado.
- Fechas bloqueadas.
- Recomendaciones finales.

### Hoja Parametros

Alimenta listas desplegables:

- Procesos.
- Origenes.
- Tipos.
- Responsables u otras listas parametrizadas.

### Hoja Historial

Guarda trazabilidad de cambios:

- Fecha.
- Usuario.
- Operacion.
- ID de accion.
- Datos anteriores.
- Datos nuevos.

## 20. Mensajes y situaciones que debe cubrir el manual

### Usuario no ve registros de otros procesos

Explicacion:

- Es comportamiento esperado.
- El sistema filtra automaticamente por el proceso asignado al usuario.

### REV no puede editar

Posibles causas:

- La accion no esta en etapa `PLAN_ACCION`.
- Las fechas del plan ya estan bloqueadas.
- El registro pertenece a otro proceso.
- El usuario no tiene rol `REV`.

### VAL no puede editar

Posibles causas:

- La accion no esta en etapa `VALIDACION`.
- El usuario pertenece a otro proceso.

### OCI no puede evaluar

Posibles causas:

- La accion aun no fue notificada a Control Interno.
- `correoEnviado` no esta marcado.
- La accion no esta en `REVISION_OCI`.

### No aparecen opciones en filtros

Posibles causas:

- No hay datos cargados para el proceso del usuario.
- La hoja Parametros no tiene opciones.
- El proceso del usuario limita los resultados.

### Accion aparece vencida

Explicacion:

- La fecha fin ya paso y la accion sigue abierta.

## 21. Recomendaciones para redactar el manual final

La IA que genere el manual final debe:

- Usar lenguaje simple y directo.
- Separar el manual por rol.
- Incluir rutas de navegacion paso a paso.
- Incluir capturas o espacios para capturas por pantalla.
- Explicar siempre que ve un usuario normal y que ve un admin.
- Repetir la regla clave: el usuario solo ve su proceso, excepto admin.
- Explicar los colores: editable, solo lectura, bloqueado, semaforo.
- Incluir ejemplos de uso por rol:
  - Como CREADOR registra una accion.
  - Como REV completa plan.
  - Como VAL valida.
  - Como REV notifica a OCI.
  - Como OCI evalua eficacia.
  - Como ADMIN consulta todo.
- Incluir una seccion de preguntas frecuentes.
- Incluir una seccion de errores comunes.
- Evitar lenguaje tecnico como `estadoActual` en el manual de usuario; traducirlo como `etapa actual`.
- Usar nombres visibles de botones tal como aparecen en la interfaz.

## 22. Estructura sugerida del manual final

1. Bienvenida a MIRA.
2. Como iniciar sesion.
3. Como entender mi rol y mi proceso.
4. Navegacion general.
5. Dashboard.
6. Reportar y consultar acciones.
7. Crear una accion nueva.
8. Editar segun mi rol.
9. Revisar detalle de una accion.
10. Notificar a Control Interno.
11. Evaluar eficacia como OCI.
12. Consultar historial.
13. Significado de estados, etapas y colores.
14. Preguntas frecuentes.
15. Solucion de problemas.
16. Glosario.

## 23. Glosario recomendado

| Termino | Explicacion simple |
| --- | --- |
| Accion | Registro de una correccion o mejora que debe gestionarse |
| Proceso | Area institucional responsable |
| Rol | Permiso asignado al usuario |
| Etapa | Paso actual del flujo |
| Estado | Situacion operativa: abierta, cerrada o vencida |
| Eficacia | Resultado final evaluado por OCI |
| Skeleton | Vista temporal que simula la pagina mientras carga |
| Loader | Popup de carga institucional |
| Notificar a Control Interno | Boton que envia el registro a Revision OCI dentro del sistema |
| Solo lectura | Informacion visible, pero no editable |
| Bloqueada | Seccion que aun no se puede abrir o editar |
| Editable | Seccion disponible para diligenciar |

## 24. Checklist funcional para validar el manual

Antes de entregar el manual final, verificar que explique:

- Como entrar al sistema.
- Como recuperar soporte por correo.
- Que hace cada rol.
- Que significa el filtro por proceso.
- Por que un usuario no ve registros de otra area.
- Que botones existen en Dashboard.
- Que botones existen en Reportar.
- Que significa cada tarjeta del semaforo.
- Como usar graficas como filtros.
- Como crear una accion.
- Como editar por acordeones.
- Que secciones puede editar cada rol.
- Como notificar a Control Interno.
- Como OCI cierra una accion eficaz.
- Que es una accion vencida.
- Como consultar historial.
- Que hacer si no se puede editar.
- Que hacer si no aparecen registros.
