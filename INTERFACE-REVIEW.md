# Essence Spa: análisis y propuesta de interfaz

Fecha: 28 de octubre de 2026.

## Alcance y evidencia

Revisión del código de `app/public-catalog.tsx`, `app/page.tsx`, `components/layout/Header.tsx`, `app/globals.css` y `tailwind.config.ts`. No se completó una inspección visual de la web renderizada. La propuesta parte del catálogo público, por ser la ruta principal del proyecto; el panel de gestión requiere una revisión independiente.

Archivo creado: https://www.figma.com/design/09RGbx0ghXrqZ4edBDGSs1

Estado: archivo vacío. El límite de llamadas del plan Starter impidió continuar la edición. No se creó ni verificó un diseño en Figma.

## Hallazgos

1. El hero ocupa un mínimo de 680–740 px y la galería de ocho fotos precede a promociones y servicios. La acción principal exige desplazarse por bastante contenido antes de elegir un servicio.
2. WhatsApp aparece como icono en la navegación de escritorio y el pedido se muestra solo tras seleccionar servicios. Falta una llamada visible para quien necesita orientación antes de elegir.
3. La navegación principal se oculta en móvil sin un reemplazo equivalente en el encabezado público.
4. `brand.text-light` (#9D9488) se utiliza para textos pequeños sobre fondos claros. Debe medirse su contraste y sustituirse por un tono más oscuro para texto funcional. El footer también reutiliza este token sobre fondo oscuro.
5. Las variables llamadas green contienen #1A1A1A, y terracotta contiene #9D9488. La identidad real es carbón, crema y taupe; los nombres pueden inducir cambios incorrectos.
6. Playfair Display e Inter están declaradas, pero el layout revisado no carga esas fuentes. Verificar la fuente renderizada y resolver su carga antes de comparar web y diseño.
7. El pedido se denomina pedido aunque su cierre consiste en coordinar por WhatsApp. Explicar que precio y disponibilidad se confirman con el local.

## Propuesta para Figma

Crear dos pantallas editables: escritorio de 1440 px y móvil de 390 px. Mantener Playfair Display para titulares e Inter para controles. Conservar carbón #1A1A1A, crema #F7F6F1 y taupe como acento; usar #595C60 como candidato para texto secundario sobre crema, pendiente de verificar contraste.

### Orden de contenido

1. Encabezado: marca, Servicios, Promociones, Cómo llegar y botón «Consultar por WhatsApp». En móvil: marca, menú accesible y acción de consulta.
2. Hero compacto: titular «Un momento para ti», texto sobre cuidado personal, botón «Explorar servicios» y enlace secundario a promociones. Usar una fotografía real del local como contenido, con superficie opaca detrás del texto cuando sea necesario.
3. Servicios: título, búsqueda con borde visible, filtros y resultados. Mostrar nombre, descripción, precio y duración en posiciones consistentes. Acción «Agregar a mi selección».
4. Promociones: descuento, vigencia y condiciones verificadas. No inventar promociones ni permitir inferir que todos los descuentos aplican a todos los servicios sin confirmación del negocio.
5. Galería breve: tres imágenes representativas y opción para ver más, sin retrasar el acceso al catálogo.
6. Ubicación y contacto: conservar enlaces reales existentes; no inventar dirección u horarios.
7. Selección: resumen persistente al agregar servicios, acción «Coordinar por WhatsApp» y aclaración «Disponibilidad y total sujetos a confirmación».

### Componentes mínimos

Botones primario/secundario con foco, hover y deshabilitado; campo de búsqueda; filtro activo/inactivo; tarjeta de servicio; promoción; resumen de selección; navegación móvil. Reutilizar componentes y vincular colores y espaciados a variables. Mantener fotografías como recursos individuales y textos como capas editables.

### Estados y validación

Diseñar catálogo con datos, búsqueda sin resultados con «Limpiar filtros», error con reintento, catálogo sin servicios y selección vacía/con servicios. Los nombres y precios de ejemplo deben marcarse como demostración, nunca como datos vigentes.

Verificar ausencia de desbordamiento horizontal a 390 px, controles táctiles de al menos 44 px, foco visible, lectura de precio y duración, contraste WCAG AA, tipografías efectivas y jerarquía editable. Revisar una captura completa por pantalla antes de dar el trabajo por terminado.

## Pendiente

Con el acceso de Figma disponible: descubrir bibliotecas y componentes, capturar la web para referencia visual y recuperar sus fotografías, construir la propuesta con capas editables y validar ambas pantallas. La implementación del sitio no se modificó durante esta revisión.
