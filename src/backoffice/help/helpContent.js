export const HELP_CONTENT = {
  '/admin': {
    title: 'Dashboard',
    icon: '📊',
    intro: 'El dashboard es tu pantalla de inicio. Te da un resumen del estado de la tienda de un vistazo, sin necesidad de entrar a cada módulo.',
    items: [
      {
        heading: 'Métricas principales',
        text: 'Las tarjetas superiores muestran: productos publicados, productos en borrador, mensajes nuevos sin leer, total de categorías y banners activos. Los números se actualizan en tiempo real.',
      },
      {
        heading: 'Barra lateral',
        text: 'Usá el menú de la izquierda para navegar entre módulos. Podés colapsarlo con el botón ‹ para ganar espacio en pantallas pequeñas.',
      },
      {
        heading: 'Ver sitio',
        text: 'El enlace "Ver sitio" (parte inferior del menú) abre el sitio público en una pestaña nueva. Ideal para verificar cambios después de guardar.',
      },
      {
        heading: 'Sesión',
        text: 'El botón "Salir" cierra tu sesión de administrador. Si cerrás el navegador sin cerrar sesión, Firebase mantiene la sesión activa por seguridad.',
      },
    ],
  },

  '/admin/productos': {
    title: 'Productos',
    icon: '📦',
    intro: 'Desde aquí gestionás todo el catálogo: crear, editar, archivar y ordenar productos. Los cambios se reflejan en el sitio de forma inmediata.',
    items: [
      {
        heading: 'Estados del producto',
        text: 'Publicado: visible en el catálogo público. Borrador: guardado en el sistema pero no visible para los visitantes. Archivado: retirado temporalmente sin perder los datos.',
      },
      {
        heading: 'Precio y precio de oferta',
        text: 'Si completás "Precio oferta", el catálogo mostrará el precio original tachado junto al precio de oferta resaltado. Dejá el campo vacío cuando no haya promoción activa.',
      },
      {
        heading: 'Stock',
        text: 'Número de unidades disponibles. Cuando llega a 0 el producto se muestra como "Sin stock" en el catálogo. En Configuración > Tienda podés definir a partir de qué número se muestra la alerta de stock bajo en este panel.',
      },
      {
        heading: 'Etiquetas (tags)',
        text: 'Palabras clave separadas por coma. Facilitan la búsqueda y el filtrado. Ejemplos: "nuevo, verano, destacado, oferta". No tienen espacios internos.',
      },
      {
        heading: 'Imagen principal',
        text: 'Imagen que aparece en la tarjeta del catálogo y como imagen hero en el detalle del producto. Recomendamos formato cuadrado o vertical, mínimo 800×800 px.',
      },
      {
        heading: 'Galería de imágenes',
        text: 'Fotos adicionales del producto que aparecen como miniaturas en la página de detalle. Podés subir varias a la vez, reordenarlas con las flechas ◀ ▶ y elegir imágenes de la biblioteca de medios.',
      },
      {
        heading: 'Descripción',
        text: 'Texto visible en la página de detalle del producto. Podés incluir ingredientes, instrucciones de uso, beneficios, etc.',
      },
      {
        heading: 'Slug (URL)',
        text: 'Se genera automáticamente desde el nombre. Define la URL del producto, ej: /producto/crema-hidratante. Solo modificalo si es necesario; evitá cambiarlo después de publicar para no romper links.',
      },
    ],
  },

  '/admin/categorias': {
    title: 'Categorías',
    icon: '🏷️',
    intro: 'Las categorías organizan el catálogo y aparecen en la grilla de la página de inicio. Cada producto pertenece a una categoría.',
    items: [
      {
        heading: 'Nombre',
        text: 'Nombre visible en el catálogo y en la grilla de inicio. Usá nombres cortos y descriptivos: "Maquillaje", "Perfumes", "Body Care".',
      },
      {
        heading: 'Tagline',
        text: 'Texto breve que aparece debajo del nombre en la tarjeta de categoría. Le da personalidad a la sección. Ej: "Para tu rutina diaria".',
      },
      {
        heading: 'Descripción',
        text: 'Descripción extendida de la categoría. Puede usarse para SEO o mostrarse como introducción en la página filtrada del catálogo.',
      },
      {
        heading: 'Imagen',
        text: 'Imagen de portada. Se muestra en la tarjeta de categoría en la home. Recomendamos imágenes verticales o cuadradas de al menos 600×600 px con buena resolución.',
      },
      {
        heading: 'Slug',
        text: 'Identificador único en la URL. Se genera desde el nombre. Ej: "cosmeticos", "body-care". Se usa para filtrar el catálogo: /catalogo?categoria=body-care.',
      },
    ],
  },

  '/admin/banners': {
    title: 'Banners',
    icon: '🎨',
    intro: 'Los banners son bloques visuales configurables que aparecen en distintas secciones del sitio: hero de inicio, catálogo, etc.',
    items: [
      {
        heading: 'Título y subtítulo',
        text: 'Texto principal y secundario superpuesto sobre la imagen. El título suele usar tipografía serif elegante. Soportan saltos de línea.',
      },
      {
        heading: 'Imagen de fondo',
        text: 'La imagen se muestra detrás del texto. Para el hero de inicio recomendamos imágenes anchas (1920×800 px), de buena calidad y con zona oscura donde leer el texto.',
      },
      {
        heading: 'Botón CTA',
        text: 'Texto del botón de llamada a la acción y la URL a la que lleva. Podés vincular a una categoría (/catalogo?categoria=perfumes), a un producto (/producto/nombre) o a cualquier página.',
      },
      {
        heading: 'Activo / Inactivo',
        text: 'Solo los banners marcados como "Activo" se muestran en el sitio. Esto te permite preparar banners de temporada con anticipación y activarlos cuando quieras.',
      },
      {
        heading: 'Posición',
        text: 'Define en qué sección del sitio aparece el banner. El "hero" es el banner grande de la página de inicio. Pueden coexistir varios banners activos en distintas posiciones.',
      },
    ],
  },

  '/admin/media': {
    title: 'Biblioteca de medios',
    icon: '🖼️',
    intro: 'Centralizá todas las imágenes del sitio. Desde aquí podés subir, organizar y reutilizar archivos en productos, banners y más.',
    items: [
      {
        heading: 'Subir imágenes',
        text: 'Arrastrá archivos al área de carga o hacé clic en el botón. Se admiten JPG, PNG, WebP y GIF. Peso máximo recomendado: 2 MB por imagen para asegurar velocidad de carga.',
      },
      {
        heading: 'Carpetas',
        text: 'Organizá las imágenes en carpetas: "productos", "banners", "brand", etc. Filtrá por carpeta usando el selector en la barra superior. Ayuda a encontrar archivos rápido cuando la biblioteca crece.',
      },
      {
        heading: 'Renombrar',
        text: 'Hacé clic en el nombre debajo de cualquier imagen para editarlo. El nombre del archivo se usa también como texto alternativo (alt text) para los buscadores y lectores de pantalla.',
      },
      {
        heading: 'Exportar a CSV / Excel',
        text: 'Los botones CSV y XLS generan un archivo con el nombre, URL, carpeta y tamaño de cada imagen. Es muy útil para armar el Excel de carga masiva de productos.',
      },
      {
        heading: 'Imágenes huérfanas',
        text: 'Son archivos subidos al almacenamiento que no están referenciados en ningún producto, banner ni categoría. Podés identificarlas y eliminarlas para liberar espacio en Firebase Storage.',
      },
      {
        heading: 'Tamaño de grilla',
        text: 'Los botones S / M / L en la barra superior cambian el tamaño de las miniaturas. "L" es útil para revisar el detalle de imágenes; "S" para ver muchas a la vez.',
      },
    ],
  },

  '/admin/mensajes': {
    title: 'Mensajes',
    icon: '💬',
    intro: 'Aquí llegan todas las consultas enviadas desde el formulario de contacto del sitio. Podés gestionarlas y responderlas directamente.',
    items: [
      {
        heading: 'Estados',
        text: 'Nuevo: consulta sin revisar (badge en el menú). Leído: ya la viste. Archivado: procesada o descartada. Al abrir un mensaje nuevo, su estado cambia a "Leído" automáticamente.',
      },
      {
        heading: 'Filtrar por estado',
        text: 'Las pestañas superiores (Todos / Nuevos / Leídos / Archivados) te permiten enfocarte en los mensajes que necesitás atender.',
      },
      {
        heading: 'Responder por WhatsApp',
        text: 'Si el cliente dejó número de teléfono, podés hacer clic en el botón de WhatsApp para abrir una conversación con el mensaje precompletado.',
      },
      {
        heading: 'Responder por email',
        text: 'El link de email abre tu cliente de correo con el destinatario ya cargado. El cliente siempre deja su email al completar el formulario.',
      },
      {
        heading: 'Datos del mensaje',
        text: 'Cada consulta incluye: nombre completo, email, teléfono (si lo completó), el asunto y el texto del mensaje, más la fecha y hora de envío.',
      },
    ],
  },

  '/admin/configuracion': {
    title: 'Configuración',
    icon: '⚙️',
    intro: 'Controlá todos los aspectos del sitio desde una sola pantalla. Los cambios se guardan sección por sección con el botón "✓ Guardar sección".',
    items: [
      {
        heading: 'General',
        text: 'Nombre del sitio (aparece en el título del navegador y la navbar), tagline, texto del pie de página y logo. Si subís un logo, reemplaza el texto en la barra de navegación.',
      },
      {
        heading: 'Inicio (Hero)',
        text: 'Título principal de la home, subtítulo y textos de los botones. El título soporta saltos de línea para controlar el diseño.',
      },
      {
        heading: 'Contacto',
        text: 'Número de WhatsApp (sin el +, con código de país), mensaje predefinido que se abre al hacer clic en el botón WA, email, teléfono, dirección y horarios de atención. El botón "Probar link" verifica que el número sea correcto.',
      },
      {
        heading: 'Redes sociales',
        text: 'URLs completas de cada red. Los íconos aparecen automáticamente en el footer cuando completás el campo. Dejá vacío los que no usás.',
      },
      {
        heading: 'Tienda',
        text: 'Moneda, cantidad de productos por página del catálogo, monto mínimo para mostrar "Envío gratis" y número de stock a partir del cual se muestra la alerta roja en el listado de productos.',
      },
      {
        heading: 'SEO',
        text: 'Meta título (máx. 60 caracteres), meta descripción (máx. 160 caracteres) y imagen Open Graph (se ve al compartir el link en WhatsApp, redes, etc.). También podés ingresar el ID de Google Analytics.',
      },
      {
        heading: 'Políticas',
        text: 'Textos de política de envíos y devoluciones que se pueden mostrar en páginas dedicadas. También podés ingresar los links a los documentos legales.',
      },
      {
        heading: 'Avanzado',
        text: 'Modo mantenimiento: activa una pantalla de "volvemos pronto" para los visitantes mientras trabajás en el sitio. El panel de administración siempre queda accesible. También controlás esta guía de ayuda desde acá.',
      },
    ],
  },
}
