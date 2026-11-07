# Guion: video guía del Sistema de Gestión «tuSpa»

> Estado: **video renderizado** → `out/guia-tuspa.mp4` (8:40, 1080p, voz es-PE-CamilaNeural + subtítulos). Narración en `narracion.json`, escenas en `tools/spec.mjs`, generador `tools/build.mjs`.
>
> **Cambios en la v3:** nuevo capítulo «Tu página pública» (buscar y elegir servicios, promociones, pedido por WhatsApp, galería y «Cómo llegar»). Se mantiene la paleta real del sistema y la duración larga, y se corrigieron los textos a «Nueva Categoría» y «Nueva Promoción».
>
> **Cambios en la v2:**
> - Clientes ahora muestra **editar** y **eliminar**, porque esos iconos ya funcionan.
> - La agenda muestra en detalle cómo ver las citas en el calendario (puntos de colores por cliente, «+N», citas del día y detalle de la cita) y cómo editarlas paso a paso.
> - La caja explica a fondo los adicionales, las promociones, el descuento manual (S/ o %), los métodos de pago, el detalle de cada movimiento, la consulta de otros días, el cierre y la reapertura.
> - Se agregaron las búsquedas, los contadores y los mensajes de cada módulo, para mostrar casi todo lo que hace el sistema.
>
> Formato: 1920×1080, 30 fps · Duración estimada: **≈ 8 min 30 s** (aprobada sin límite) · Español (Perú), tono amable, trato de "tú".
> Los textos entre `«…»` son literales de la interfaz, verificados en el código. Datos ficticios: clienta «María López», especialista «Ana Torres». La app se muestra con la marca **tuSpa** (`NEXT_PUBLIC_BRAND_NAME`), con contactos y fotos de demo.

## Escenas

### Intro e ingreso

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 1 | 0:10 | Fondo crema. Aparece el icono de spa y el nombre; entran tres viñetas. | **tuSpa** · Sistema de Gestión · Ingresar · Usar cada módulo · Qué puede hacer cada usuario | Bienvenida a tuSpa. En este video aprenderás a ingresar, a usar cada módulo y qué puede hacer cada tipo de usuario. | Todos |
| 2a | 0:12 | Navegador en `tuspa.pe/login` (dominio de ejemplo): logo, «tuSpa», «Sistema de Gestión». El cursor escribe en «Email» (`admin@demo.local`) y en «Contraseña» (`••••••••`). Clic en «Iniciar Sesión», que cambia a «Iniciando...». | Capítulo 1 · **Ingresar al sistema** | Abre la dirección del sistema, escribe el email y la contraseña que te dio el Administrador y pulsa «Iniciar Sesión». | Todos |
| 2b | 0:06 | Zoom a la caja roja de error. | «Email o contraseña incorrectos» | Si un dato está mal, verás este aviso. Revísalo e inténtalo otra vez. | Todos |
| 2c | 0:06 | Pantalla «Verificando acceso al sistema…» y luego el panel. Zoom arriba a la derecha: nombre, rol e inicial; se resalta el icono «Cerrar sesión». | Cerrar sesión → icono arriba a la derecha | El sistema verifica tu acceso y te lleva al panel. Para salir, usa este icono. | Todos |

### El panel

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 3a | 0:10 | Escritorio: menú lateral «tuSpa · Panel de gestión»; grupo «Tu espacio de trabajo» (Resumen, Agenda de citas, Clientes, Servicios, Categorías, Equipo, Promociones) y grupo «Administración» (Caja y cobros, Reportes). Tarjeta «Tu vitrina digital» → «Ver página pública». | Capítulo 2 · **Conoce el panel** | En computadora, el menú está a la izquierda. «Ver página pública» te muestra lo que ven tus clientes. | Todos |
| 3b | 0:10 | Teléfono: botón «Abrir menú» despliega el menú; barra inferior «Inicio · Citas · Clientes · Servicios · Caja». Cabecera «tuSpa / Gestión» + módulo actual. | Celular: menú ☰ + barra inferior | En el celular, abre el menú con este botón o usa la barra de abajo para moverte rápido. | Todos (Caja: solo Administrador y Recepción) |
| 4 | 0:15 | Resumen: «Tu negocio, en equilibrio» / **«Así va tu día»**, fecha, botón «Actualizar resumen» y «Ver agenda». Tarjetas «Citas de hoy», «Clientes», «Servicios activos», «Ingresos del mes». Lista de próximas citas con su estado. Accesos «Gestionar citas», «Ver clientes», «Abrir caja». Abajo: «Actualizado a las …». | Capítulo 3 · **Resumen** | El Resumen te dice cómo va tu día: citas de hoy, próximas atenciones y accesos directos. Actualízalo con este botón. | Todos (Ingresos y «Abrir caja»: Administrador y Recepción) |

### Agenda de citas (ampliado)

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 5a | 0:12 | Pantalla «Citas», «Gestiona tus citas y agenda». Contadores «Citas de hoy», «Confirmadas del período», «Pendientes del período». Calendario del mes con «Mes anterior» / «Mes siguiente», días Lun–Dom y el día de hoy remarcado. | Capítulo 4 · **Agenda de citas** | Esta es tu agenda. Arriba ves los contadores y, abajo, el calendario del mes. Hoy aparece remarcado. | Todos |
| 5b | 0:15 | Zoom a un día: **un punto de color por cita** (verde = Confirmada, amarillo = Pendiente, azul = En curso, morado = Completada, gris = Cancelada). El cursor pasa sobre un punto: tooltip «10:00 a. m. · María López · Manicure spa». En un día con muchas citas aparece «+2». | Leyenda de colores por estado | Cada punto es una cita, y su color indica el estado. Pasa el cursor para ver la hora, la clienta y el servicio. Si hay más de tres citas, verás un «+». | Todos |
| 5c | 0:12 | Clic en el día → ventana «Citas del sábado 7 de noviembre 2026»: «3 citas programadas · Selecciona una para ver el detalle». Cada fila tiene hora de inicio y fin, nombre, insignia de estado, servicios y trabajador. | Ver las clientas del día | Toca un día para ver a todas las clientas agendadas, con la hora, el servicio y quién las atiende. | Todos |
| 5d | 0:12 | Clic en una fila → «Detalle de la cita»: nombre, fecha, insignia de estado; tarjetas «Cliente», «Servicio», «Trabajador», «Fecha», «Hora de inicio», «Hora de finalización»; «Observaciones». Botones «Editar cita» y «Cerrar», y enlace «Volver a las citas del día». | Detalle de la cita | Al elegir una cita ves todo su detalle: clienta, servicios, trabajador, horario y observaciones. | Todos |
| 5e | 0:20 | Clic en «Nueva Cita» → «Nueva cita». En «Cliente *» busca «María» y la elige (o cambia a invitado con «Nombre del invitado *» y «Teléfono (opcional)»). En «Servicios *», «Agregar servicio...» dos veces. «Empleado» → Ana Torres (o «Sin asignar»). «Fecha y hora *» → calendario + reloj + minutos 00/15/30/45 → «Confirmar». «Notas». Se resaltan «Duración estimada» y el total. «Guardar cita». | Nueva cita · Horario de Perú | Para agendar, pulsa «Nueva Cita». Elige a la clienta, agrega uno o varios servicios, la especialista, la fecha y la hora. El sistema calcula la duración y el total. | Todos |
| 5f | 0:08 | Dentro del buscador de cliente: «Nuevo cliente» → «Nombre *», «Apellido», «Teléfono» → «Crear y seleccionar». | Crear clienta sin salir de la cita | ¿Es nueva? Créala desde aquí mismo y queda elegida en la cita. | Todos |
| 5g | 0:20 | Desde el detalle, «Editar cita» → modal: «Cliente *», «Servicios *» (agrega o quita), «Trabajador», «Fecha *», «Hora de inicio *», «Estado» (Pendiente → Confirmada → En curso → Completada, o Cancelada), «Observaciones». Se ve cómo cambian «Duración» y el total. «Guardar cambios». En el calendario, el punto cambia de color. | Editar cita · Cambiar estado · Cancelar | Con «Editar cita» puedes cambiar la clienta, los servicios, la especialista, la fecha o la hora. También su estado: confírmala, márcala en curso o cancélala. | Todos |
| 5h | 0:08 | Cita con insignia «Invitado» → «Registrar como cliente» → «Nombre *», «Apellido», «Teléfono», «Email (opcional)» → «Registrar cliente». | Invitado → clienta registrada | Si atendiste a una invitada, regístrala como clienta desde su cita. | Todos |
| 5i | 0:10 | Filtros de fecha «Ayer», «Hoy», «Mañana», «Todas las fechas», «Elegir fecha» y el selector de estado («Pendientes», «Confirmadas», «En curso», «Completadas», «Canceladas»). Panel «Citas del período» con «Pagar cita» en cada cita activa. | Filtrar · Pagar cita | Filtra por día y por estado. Desde «Citas del período», «Pagar cita» te lleva directo a cobrarla en la caja. | Filtros: todos · Pagar: Administrador y Recepción |

### Clientes (ampliado)

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 6a | 0:10 | «Clientes», «Gestiona tu base de datos de clientes», «Total Clientes». En «Buscar cliente...» se escribe «López» y luego un número de teléfono; la lista se filtra. | Capítulo 5 · **Clientes** | Busca a cualquier clienta por su nombre, teléfono o email. | Todos |
| 6b | 0:08 | «Nuevo Cliente» → Nombre *, Apellido *, Teléfono *, Email → «Guardar». | Registrar clienta | Registra clientas nuevas con sus datos de contacto. | Todos |
| 6c | 0:10 | Clic en el icono de lápiz → «Editar cliente»: Nombre *, Apellido *, Teléfono, Email → «Guardar cambios». La fila se actualiza. | Editar clienta | Con el lápiz corriges sus datos, por ejemplo un teléfono nuevo. | Todos |
| 6d | 0:10 | Clic en el icono de papelera → confirmación «¿Eliminar a … ? Esta acción no se puede deshacer.». Si la clienta tiene historial, aparece el aviso «No se puede eliminar a … porque tiene citas o pagos registrados. Así se conserva su historial.». | Eliminar clienta · *Solo Administrador* | El Administrador puede eliminar una clienta. Si ya tiene citas o pagos, el sistema la protege para no perder su historial. | Administrador |

### Catálogo y Equipo

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 7a | 0:10 | Categorías: «Organiza tus servicios por categoría», «Nueva Categoría» (Nombre, Descripción); «Editar categoría» (Nombre, Descripción, Ícono); «Eliminar». Aviso si tiene servicios: «No se puede eliminar … porque tiene N servicios asociados». | Capítulo 6 · **Catálogo** · *Solo Administrador puede modificar* | El catálogo empieza por las categorías. Una categoría con servicios no se puede borrar hasta moverlos. | Ver: todos · Modificar: Administrador |
| 7b | 0:14 | Servicios: «Administra los servicios de tu salón», «Total Servicios», «Activos», «Precio Promedio», «Buscar servicio...», filtro por categoría. «Nuevo Servicio»: «Nombre *», «Categoría *», «Precio *», «Duración (minutos) *», «Descripción», «Imagen de referencia (opcional)» con vista previa y «Quitar imagen», «Activo» → «Guardar servicio». | *Solo Administrador puede modificar* | Luego vienen los servicios, con su precio, su duración y una imagen. Desactívalos para que no se ofrezcan. | Ver: todos · Modificar: Administrador |
| 7c | 0:10 | Promociones: «Gestiona tus promociones», «Buscar promoción...». «Nueva Promoción»: Nombre, Descripción, «Descuento (%)», «Desde», «Hasta». «Editar promoción» → «Promoción activa». Se ven las insignias «Activa» / «Inactiva», «Sin inicio» y «Sin vencimiento». | *Solo Administrador puede modificar* | Las promociones tienen un porcentaje de descuento y fechas de vigencia, y luego se aplican al cobrar. | Ver: todos · Modificar: Administrador |
| 7d | 0:12 | Equipo: «Nuestro equipo», «Personas en el equipo», «Buscar por nombre...». «Nuevo Empleado»: Nombre, Apellido, Teléfono, «Email de acceso», «Contraseña (mínimo 8 caracteres)», Cargo, Rol, Especialidad. «Editar perfil» → «Rol *» (Manicurista / Recepcionista / Administrador), «Nueva contraseña (opcional)» con el texto «Déjala vacía para conservar la actual.». «Eliminar» con su confirmación. | Capítulo 7 · **Equipo** · *Solo Administrador puede modificar* | Todo el equipo ve quién trabaja en el spa. El Administrador crea las cuentas, asigna los roles, cambia contraseñas y da de baja. | Ver: todos · Modificar: Administrador |

### Caja y cobros (ampliado)

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 8a | 0:10 | «Caja», «Cobra citas y controla ingresos y egresos». Selector «Día»: «Hoy», «Ayer», «Otra fecha». Tarjetas «Ingresos», «Egresos», «Balance», «Movimientos». | Capítulo 8 · **Caja y cobros** · *Administrador y Recepción* | La caja muestra el día que elijas: hoy, ayer u otra fecha, con sus ingresos, egresos y balance. | Administrador, Recepción |
| 8b | 0:10 | «Cobrar cita» («Ingreso automático») → «Seleccionar cita»: lista con fecha, hora, clienta y monto. Al elegirla aparece la caja de resumen «Subtotal de la cita: S/ 80.00» y el servicio. (También llegando desde «Pagar cita» en la agenda, ya seleccionada). | Elegir la cita | Para cobrar, elige la cita. También puedes llegar desde «Pagar cita» en la agenda. | Administrador, Recepción |
| 8c | 0:14 | «Adicionales»: «Agrega productos o servicios extra al cobro.» → «Agregar» dos veces: «Esmalte gel · S/ 15.00», «Decoración · S/ 10.00»; se quita una con la X. El resumen suma cada adicional. | Adicionales | ¿Llevó algo extra? Agrega productos o servicios adicionales con su concepto y su monto. Puedes quitarlos con la X. | Administrador, Recepción |
| 8d | 0:16 | Selector de promoción («Sin promoción» → «Promo Noviembre (-10%)»). Luego «Descuento manual» con «S/ fijo» o «Porcentaje». Nota «Los descuentos se aplican solo al precio de la cita.». El resumen muestra «Descuento» y «Total a cobrar». | Promoción · Descuento S/ o % | Aplica una promoción vigente o un descuento manual, en soles o en porcentaje. El descuento solo afecta el precio de la cita, no los adicionales. | Administrador, Recepción |
| 8e | 0:10 | «Método de pago»: Efectivo, Yape, Plin, Tarjeta, Transferencia. «Registrar pago y movimiento» → mensaje «Pago registrado correctamente». En la agenda, la cita pasa a «Completada» (punto morado). | Método de pago · Registrar | Elige cómo pagó y registra. El ingreso entra solo a la caja y la cita queda como completada. | Administrador, Recepción |
| 8f | 0:08 | «Registrar egreso»: «Concepto (compra, alquiler...)», «Monto», método → «Guardar egreso» → «Egreso registrado correctamente». | Registrar egreso | Los gastos del día, como compras o pagos, se anotan en «Registrar egreso». | Administrador, Recepción |
| 8g | 0:14 | «Movimientos del día» con «Totales por método» (p. ej. «Yape: +S/ 95.00», «Efectivo: +S/ 60.00 · −S/ 20.00»). Clic en un ingreso → «Detalle del movimiento» + «Detalle del cobro»: Cliente, Servicio, «Fecha de la cita», «Subtotal de la cita», «Adicionales», «Subtotal», «Descuento», «Total pagado», Observaciones. | Movimientos · Detalle del cobro | Cada movimiento se puede abrir para ver el detalle completo del cobro: adicionales, descuento y total pagado. | Administrador, Recepción |
| 8h | 0:14 | «Cerrar caja» → «Cierre de caja»: «Efectivo esperado», «Efectivo contado (opcional)» (`S/ monto contado en caja`), «Diferencia», observaciones («Notas del cierre, faltantes, incidencias…») → «Cerrar caja del día». El botón pasa a «Cerrada». | Cierre de caja | Al terminar el día, cuenta el efectivo. El sistema lo compara con lo esperado y te muestra la diferencia. | Administrador, Recepción |
| 8i | 0:10 | «Cierres de caja»: «Historial de los últimos 30 días.» Cada cierre muestra «Cerrada por …», ingresos, egresos, «Balance» y la diferencia. Clic en uno → se abren sus movimientos; en el cierre aparece «Reabrir caja». | Historial · Reabrir caja | Revisa los cierres de los últimos 30 días y, si hubo un error, reabre la caja para corregirlo. | Administrador, Recepción |

### Reportes, roles y cierre

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 9 | 0:15 | Reportes: «Información y estadísticas de tu negocio». Tarjetas «Ingresos del mes», «Citas del mes», «Promedio diario», «Servicio más solicitado». Gráficos «Ingresos mensuales» y «Servicios más solicitados». | Capítulo 9 · **Reportes** | En Reportes ves cómo le va al negocio: ingresos, citas, promedio diario y los servicios más pedidos. | Todos |


### Página pública: lo que ven tus clientes (nuevo)

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| P1 | 0:12 | Desde el panel, clic en «Ver página pública» → se abre la página pública en otra pestaña. Portada con foto, «Belleza y cuidado, a tu manera.», botones «Consultar servicios» y «Consultar por WhatsApp», y el menú «Servicios · Promociones». | Capítulo 10 · **Tu página pública** | Esta es la vitrina digital de tu spa: lo que ven tus clientas cuando entran a la página, sin iniciar sesión. | Clientes (público) |
| P2 | 0:14 | Sección «Nuestro menú»: «Encuentra el cuidado que buscas y consulta precios y duración.». Se escribe en «Buscar servicio» y se filtra por categoría («Todos» → «Manicure»). Las tarjetas muestran categoría, nombre, precio («S/ 45»), duración («60 min») y descripción. Si no hay resultados: «No encontramos servicios con esos criterios.» → «Limpiar filtros». | Buscar y filtrar servicios | Tus clientas buscan un servicio o filtran por categoría, y ven al instante su precio y su duración. | Clientes (público) |
| P3 | 0:12 | Clic en «Ver detalle» → ventana con la imagen del servicio, categoría, nombre, precio, duración, «Descripción», «Elegir servicio» y «Consultar por WhatsApp». | Detalle del servicio | Al abrir un servicio ven su foto, su descripción y pueden elegirlo o consultarlo directamente por WhatsApp. | Clientes (público) |
| P4 | 0:12 | Sección «Promociones vigentes» («Por tiempo limitado»): tarjeta con «10% de descuento», vigencia («Desde hoy» / «Sin fecha límite») y «Elegir esta promo», que cambia a «Promo elegida». | Promociones vigentes | Solo aparecen las promociones activas y vigentes. Tu clienta puede elegir una para su pedido. | Clientes (público) |
| P5 | 0:16 | Se eligen dos servicios: aparece el botón flotante «Tu selección» con el contador. Panel del pedido: «2 servicios», lista con precios y opción de quitar, «Promo: …», «Subtotal», **«Total estimado»**, nota «Confirmaremos disponibilidad, promociones y total por WhatsApp.» → «Coordinar por WhatsApp». Se ve el mensaje prellenado: «Hola, tuSpa. Quisiera hacer un pedido: – Manicure spa: S/ 45 …». | Arma tu pedido → WhatsApp | Al elegir servicios se arma un pedido con el total estimado. Con «Coordinar por WhatsApp» el mensaje llega al spa ya escrito, y el equipo agenda la cita en el sistema. | Clientes (público) → Recepción agenda |
| P6 | 0:12 | Galería «Un vistazo a tuSpa» / «Un espacio para sentirte bien» → «Conoce nuestro espacio» abre más fotos («Ver menos fotos» las oculta). Pie de página y cabecera: **«Cómo llegar»** (abre la ubicación en Google Maps), iconos de Facebook, Instagram y WhatsApp. | Galería · Cómo llegar · Redes | Tus clientas conocen el local en la galería, abren la ubicación con «Cómo llegar» y te encuentran en Facebook, Instagram y WhatsApp. | Clientes (público) |
| P7 | 0:06 | En el panel, ejemplo de cómo un cambio en Servicios o Promociones se ve al momento en la página pública (un servicio desactivado desaparece). | Lo que cambias en el catálogo, se ve aquí | Todo lo que el Administrador cambia en Servicios y Promociones se refleja en tu página pública. | Administrador |
| P8 | 0:10 | Marco de teléfono (390×844): la página pública en el celular. Menú «Abrir menú» con Servicios, Promociones, «Cómo llegar» y «Consultar por WhatsApp ↗». Al elegir servicios aparece el botón flotante «Tu selección» y el panel del pedido ocupa la pantalla. | La vitrina también en el celular | La mayoría de tus clientas entrará desde el celular, y la página se adapta sola. | Clientes (público) |

### Tu sistema en el celular (nuevo)

| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| M1 | 0:10 | Marco de teléfono. Login en el celular → Resumen. Arriba aparece la tarjeta **«tuSpa siempre a mano»** con el texto «Instala el panel en tu teléfono. El acceso requiere tu sesión.» y el botón **«Instalar sistema»**. | Capítulo 11 · **Tu sistema en el celular** | Desde el celular, el sistema te invita a instalarlo, como una app más. | Todos |
| M2 | 0:14 | Clic en «Instalar sistema». En Android con Chrome se abre el diálogo del navegador «Instalar aplicación»; si no aparece, se muestran los pasos «Añadir el sistema a tu dispositivo»: «Abre este panel en Chrome o Edge», «busca Instalar aplicación o Añadir a pantalla de inicio», «Confirma el nombre tuSpa Gestión». | Android: Instalar aplicación | En Android pulsa «Instalar sistema» y confirma. Si tu navegador no lo ofrece, sigue estos tres pasos. | Todos |
| M3 | 0:12 | Variante iPhone: «Instalar en iPhone o iPad»: «Abre este panel en Safari», «Toca Compartir y luego Añadir a pantalla de inicio», «Activa Abrir como app web si aparece y toca Añadir». Animación del botón Compartir de Safari. | iPhone: Compartir → Añadir a inicio | En iPhone se hace desde Safari: Compartir, «Añadir a pantalla de inicio» y listo. | Todos |
| M4 | 0:08 | Pantalla de inicio ilustrada con el icono **«tuSpa Gestión»**. Al tocarlo, el panel se abre a pantalla completa, sin la barra del navegador, y la tarjeta de instalación ya no aparece. | Anclado a tu pantalla de inicio | Queda anclado a tu pantalla de inicio y se abre a pantalla completa, como una app. | Todos |
| M5 | 0:12 | Navegación en el teléfono: barra inferior «Inicio · Citas · Clientes · Servicios · Caja»; el botón «Abrir menú» despliega el menú completo (con «Ver página pública»); cabecera «tuSpa / Gestión» + módulo actual; icono «Cerrar sesión». En una cuenta de Especialista, la barra no muestra «Caja». | Moverte con el pulgar | Abajo tienes tus accesos rápidos, y en el menú, todo lo demás. Cada persona ve solo lo que le corresponde. | Todos (Caja: Administrador y Recepción) |
| M6 | 0:16 | Agenda en el celular: filtros, calendario con puntos de colores, «Ver todas las citas del día», detalle de la cita a pantalla completa, «Editar cita» y «Pagar cita». «Nueva Cita» con el selector de reloj y minutos pensado para el dedo. | Agenda en el celular | Agenda, revisa y edita citas desde el celular, y elige la hora con este reloj táctil. | Todos |
| M7 | 0:12 | Clientes en el celular (buscar, lápiz para editar) y Caja en el celular: «Cobrar cita» con adicionales y descuento, «Registrar egreso» y «Cerrar caja». | Clientes y caja en el celular | Registra clientas y cobra desde el teléfono, sin ir a la computadora. | Clientes: todos · Caja: Administrador y Recepción |
| M8 | 0:06 | Tarjeta «Actualización disponible» → «Actualizar». | Siempre al día | Cuando haya una versión nueva del sistema, te lo avisará para que actualices con un toque. | Todos |


| N.º | Duración | Qué se ve | Texto en pantalla | Narración / subtítulo | Rol |
|---|---|---|---|---|---|
| 10a | 0:18 | Tres tarjetas por rol. | Capítulo 12 · **¿Qué puede hacer cada usuario?** · **Administrador**: todo, incluido catálogo, equipo y eliminar clientas · **Recepción**: agenda, clientas, caja y cierre · **Especialista**: agenda, clientas y reportes; sin Caja | El Administrador maneja todo. Recepción atiende la agenda y la caja. La Especialista se enfoca en sus citas y sus clientas. | Todos |
| 10b | 0:12 | Matriz de permisos animada fila por fila. | Matriz de permisos | Este es el resumen de permisos de cada rol. | Todos |
| 12 | 0:08 | Tarjeta con icono de llave y luego el logo. | ¿Olvidaste tu contraseña? **Pídela al Administrador** · tuSpa | Si olvidas tu contraseña, el Administrador te asigna una nueva desde Equipo. ¡Gracias por ver! | Todos |

## Matriz de permisos verificada en el código

| Función | Administrador | Recepción | Especialista | Dónde se verificó |
|---|:-:|:-:|:-:|---|
| Iniciar sesión y ver el Resumen | ✅ | ✅ | ✅ | `app/api/dashboard/route.ts` |
| Agenda: ver calendario, crear, editar, cambiar estado y cancelar citas | ✅ | ✅ | ✅ | `app/api/citas/**` (sin restricción de rol) |
| Registrar como cliente a un invitado | ✅ | ✅ | ✅ | `app/api/citas/[id]/convertir/route.ts` |
| Clientes: ver, buscar, registrar y **editar** | ✅ | ✅ | ✅ | `app/api/clientes/route.ts`, `app/api/clientes/[id]/route.ts` (PATCH) |
| Clientes: **eliminar** (solo sin citas ni pagos) | ✅ | ❌ | ❌ | `app/api/clientes/[id]/route.ts` (DELETE, rol `admin`) |
| Servicios, Categorías y Promociones: ver | ✅ | ✅ | ✅ | GET sin rol |
| Servicios, Categorías y Promociones: crear / editar / eliminar | ✅ | ❌ | ❌ | `CATALOG_ADMIN` |
| Equipo: ver | ✅ | ✅ | ✅ | `app/api/empleados/route.ts` GET |
| Equipo: crear, editar, cambiar rol, contraseña y eliminar | ✅ | ❌ | ❌ | `authorizeAdminEmployeeRequest` |
| Caja: cobrar (adicionales, promoción, descuento), egresos, cierre y reapertura | ✅ | ✅ | ❌ (el menú no aparece) | `CAJA_ROLES = ["admin","recepcionista"]` |
| Reportes | ✅ | ✅ | ✅ | `app/api/reportes/route.ts` |

No hay ningún Superadministrador ni flujo de "olvidé mi contraseña" en el código.

## Cambio en la app hecho para el video

Los iconos de Clientes no hacían nada. Ahora:
- **Lápiz**: abre «Editar cliente». Lo puede usar cualquier empleado, igual que registrar.
- **Papelera**: solo la ve el Administrador. Pide confirmación y el servidor rechaza el borrado si la clienta tiene citas o pagos. Esto es necesario porque en la BD las citas se borran en cascada con la clienta (`ON DELETE CASCADE`).
- **Buscador**: ahora también encuentra por teléfono y por email.

Archivos: `app/api/clientes/[id]/route.ts` (nuevo) y `app/dashboard/clientes/page.tsx`.

## Decisiones tomadas

1. **Colores:** se usa la paleta real del sistema (negro `#1A1A1A`, crema `#F7F6F1` / `#F5F3EE` / `#FCFBF8`, gris piedra `#9D9488`), con Playfair Display para los títulos e Inter para el texto.
2. **Duración:** la versión larga (≈ 7 min), sin recortar.
3. **Cuentas de prueba:** sí se usan para las capturas (ver `CUENTAS-PRUEBA.md`; las contraseñas no se guardan en el guion).
4. **Textos:** se corrigieron en la app a «Nueva Categoría» y «Nueva Promoción» (`components/forms/CreateResourceModal.tsx`, prop `feminine`).
5. **Página pública:** no muestra una dirección escrita. La ubicación se abre con «Cómo llegar», que lleva a Google Maps.

## Dudas pendientes (no bloquean las capturas)

1. **Botones visibles sin permiso** en Catálogo y Equipo para Recepción y Especialista: por ahora el video solo pone la etiqueta *"Solo Administrador puede modificar"*.
2. **«Pagar cita» para Especialista:** el video no lo muestra con ese rol.
3. **Reportes muestra ingresos a la Especialista:** el video dice lo que hace el código.
4. **Narración:** ¿voz TTS o solo subtítulos con música suave? Se decide en el paso 4.
