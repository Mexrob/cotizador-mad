const xlsx = require('xlsx');
const path = require('path');

// Read the original Excel file
const workbook = xlsx.readFile(path.join(__dirname, '..', 'COTIZADOR MODULE 2025.xlsx'));
const sheet1 = workbook.Sheets['Hoja1'];
const data = xlsx.utils.sheet_to_json(sheet1, { header: 1 });

console.log('Original data rows:', data.length);

// Create new workbook
const newWorkbook = xlsx.utils.book_new();

// =====================================
// SHEET 1: LÍNEAS DE PRODUCTO
// =====================================
const productLines = [
  ['ID', 'NOMBRE DE LÍNEA', 'CÓDIGO', 'DESCRIPCIÓN', 'TIPO', 'SOPORTA 2 CARAS', 'SOPORTA VETA', 'PRECIO BASE M2'],
  [1, 'Vidrio', 'VIDRIO', 'Puertas de vidrio con acabados especiales', 'VIDRIO', 'SI (Trascara)', 'NO', ''],
  [2, 'Línea Cerámica', 'CERAMICA', 'Acabados cerámicos premium', 'CERAMICA', 'SI (Trascara)', 'NO', ''],
  [3, 'Línea Alhú', 'ALHU', 'Acabados naturales y ahumados', 'ALHU', 'NO', 'NO', ''],
  [4, 'Línea Europa Básica', 'EUROPA_BASICA', 'Línea económica estilo europeo', 'MELAMINICO', 'SI', 'SI', ''],
  [5, 'Línea Europa Sincro', 'EUROPA_SINCRO', 'Línea sincronizada estilo europeo', 'MELAMINICO', 'SI', 'SI', ''],
  [6, 'Línea Guararapes', 'GUARARAPES', 'Línea brasileña de alta calidad', 'MELAMINICO', 'SI', 'NO', ''],
  [7, 'Línea Tenerife', 'TENERIFE', 'Línea contemporánea', 'MELAMINICO', 'SI', 'NO', ''],
  [8, 'Línea Alto Brillo', 'ALTO_BRILLO', 'Acabados brillantes premium', 'ALTO_BRILLO', 'SI', 'NO', ''],
  [9, 'Línea Super Mate', 'SUPER_MATE', 'Acabados mate de alta calidad', 'SUPER_MATE', 'SI', 'NO', ''],
  [10, 'Línea Foil', 'FOIL', 'Acabados foil con texturas', 'FOIL', 'SI (según tono)', 'SI (según tono)', ''],
];

const productLinesSheet = xlsx.utils.aoa_to_sheet(productLines);
xlsx.utils.book_append_sheet(newWorkbook, productLinesSheet, 'Líneas de Producto');

// =====================================
// SHEET 2: TONOS POR LÍNEA
// =====================================
const tonesByLine = [
  ['ID', 'LÍNEA', 'NOMBRE TONO', 'CÓDIGO', 'SOPORTA 1 CARA', 'SOPORTA 2 CARAS', 'SOPORTA VETA HORIZONTAL', 'SOPORTA VETA VERTICAL'],
  
  // VIDRIO
  [1, 'Vidrio', 'Blanco', 'VID_BLANCO', 'SI', 'SI', 'NO', 'NO'],
  [2, 'Vidrio', 'Blanco Brillante', 'VID_BLANCO_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [3, 'Vidrio', 'Blanco Mate', 'VID_BLANCO_MATE', 'SI', 'SI', 'NO', 'NO'],
  [4, 'Vidrio', 'Paja', 'VID_PAJA', 'SI', 'SI', 'NO', 'NO'],
  [5, 'Vidrio', 'Paja Brillante', 'VID_PAJA_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [6, 'Vidrio', 'Paja Mate', 'VID_PAJA_MATE', 'SI', 'SI', 'NO', 'NO'],
  [7, 'Vidrio', 'Capuchino', 'VID_CAPUCHINO', 'SI', 'SI', 'NO', 'NO'],
  [8, 'Vidrio', 'Capuchino Brillante', 'VID_CAPUCHINO_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [9, 'Vidrio', 'Capuchino Mate', 'VID_CAPUCHINO_MATE', 'SI', 'SI', 'NO', 'NO'],
  [10, 'Vidrio', 'Humo', 'VID_HUMO', 'SI', 'SI', 'NO', 'NO'],
  [11, 'Vidrio', 'Humo Brillante', 'VID_HUMO_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [12, 'Vidrio', 'Humo Mate', 'VID_HUMO_MATE', 'SI', 'SI', 'NO', 'NO'],
  [13, 'Vidrio', 'Gris', 'VID_GRIS', 'SI', 'SI', 'NO', 'NO'],
  [14, 'Vidrio', 'Gris Brillante', 'VID_GRIS_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [15, 'Vidrio', 'Gris Mate', 'VID_GRIS_MATE', 'SI', 'SI', 'NO', 'NO'],
  [16, 'Vidrio', 'Rojo', 'VID_ROJO', 'SI', 'SI', 'NO', 'NO'],
  [17, 'Vidrio', 'Rojo Brillante', 'VID_ROJO_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [18, 'Vidrio', 'Rojo Mate', 'VID_ROJO_MATE', 'SI', 'SI', 'NO', 'NO'],
  [19, 'Vidrio', 'Negro', 'VID_NEGRO', 'SI', 'SI', 'NO', 'NO'],
  [20, 'Vidrio', 'Negro Brillante', 'VID_NEGRO_BRILL', 'SI', 'SI', 'NO', 'NO'],
  [21, 'Vidrio', 'Negro Mate', 'VID_NEGRO_MATE', 'SI', 'SI', 'NO', 'NO'],
  
  // CERÁMICA
  [22, 'Línea Cerámica', 'Dekton', 'CER_DEKTON', 'SI', 'SI', 'NO', 'NO'],
  [23, 'Línea Cerámica', 'ABK Stone', 'CER_ABK_STONE', 'SI', 'SI', 'NO', 'NO'],
  [24, 'Línea Cerámica', 'Xtone', 'CER_XTONE', 'SI', 'SI', 'NO', 'NO'],
  [25, 'Línea Cerámica', 'Infinity', 'CER_INFINITY', 'SI', 'SI', 'NO', 'NO'],
  [26, 'Línea Cerámica', 'Antolini', 'CER_ANTOLINI', 'SI', 'SI', 'NO', 'NO'],
  [27, 'Línea Cerámica', 'Lioli', 'CER_LIOLI', 'SI', 'SI', 'NO', 'NO'],
  
  // ALHÚ
  [28, 'Línea Alhú', 'Natural', 'ALHU_NATURAL', 'SI', 'NO', 'NO', 'NO'],
  [29, 'Línea Alhú', 'Ahumado Claro', 'ALHU_AHUMADO_CLARO', 'SI', 'NO', 'NO', 'NO'],
  [30, 'Línea Alhú', 'Bronce Texturizada con 1 Capa de Pintura', 'ALHU_BRONCE_TEXT', 'SI', 'NO', 'NO', 'NO'],
  [31, 'Línea Alhú', 'Espejo Bronce de 6mm', 'ALHU_ESPEJO_BRONCE', 'SI', 'NO', 'NO', 'NO'],
  [32, 'Línea Alhú', 'Tela Encapsulada en Vidrio Ultraclaro 4+4', 'ALHU_TELA_ULTRACLARO', 'SI', 'NO', 'NO', 'NO'],
  [33, 'Línea Alhú', 'Tela Encapsulada en Vidrio Claro 4+4', 'ALHU_TELA_CLARO', 'SI', 'NO', 'NO', 'NO'],
  [34, 'Línea Alhú', 'Espejo Claro Anticado de 6mm', 'ALHU_ESPEJO_ANTICADO', 'SI', 'NO', 'NO', 'NO'],
  [35, 'Línea Alhú', 'Filtrasol Texturizado de 6mm', 'ALHU_FILTRASOL', 'SI', 'NO', 'NO', 'NO'],
  [36, 'Línea Alhú', 'Vidrio Claro Texturizado de 6mm con Pintura', 'ALHU_VIDRIO_CLARO_TEXT', 'SI', 'NO', 'NO', 'NO'],
  [37, 'Línea Alhú', 'Vidrio Cristazul Texturizado de 6mm', 'ALHU_CRISTAZUL', 'SI', 'NO', 'NO', 'NO'],
  
  // EUROPA BÁSICA
  [38, 'Línea Europa Básica', 'York', 'EUR_BAS_YORK', 'SI', 'SI', 'SI', 'SI'],
  [39, 'Línea Europa Básica', 'Chelsea', 'EUR_BAS_CHELSEA', 'SI', 'SI', 'SI', 'SI'],
  [40, 'Línea Europa Básica', 'Soho', 'EUR_BAS_SOHO', 'SI', 'SI', 'SI', 'SI'],
  [41, 'Línea Europa Básica', 'Gales', 'EUR_BAS_GALES', 'SI', 'SI', 'SI', 'SI'],
  [42, 'Línea Europa Básica', 'Liverpool', 'EUR_BAS_LIVERPOOL', 'SI', 'SI', 'SI', 'SI'],
  
  // EUROPA SINCRO
  [43, 'Línea Europa Sincro', 'Roma', 'EUR_SIN_ROMA', 'SI', 'SI', 'SI', 'SI'],
  [44, 'Línea Europa Sincro', 'Parma', 'EUR_SIN_PARMA', 'SI', 'SI', 'SI', 'SI'],
  [45, 'Línea Europa Sincro', 'Genova', 'EUR_SIN_GENOVA', 'SI', 'SI', 'SI', 'SI'],
  [46, 'Línea Europa Sincro', 'Pisa', 'EUR_SIN_PISA', 'SI', 'SI', 'SI', 'SI'],
  [47, 'Línea Europa Sincro', 'Turín', 'EUR_SIN_TURIN', 'SI', 'SI', 'SI', 'SI'],
  
  // GUARARAPES
  [48, 'Línea Guararapes', 'Alaska', 'GUA_ALASKA', 'SI', 'SI', 'NO', 'NO'],
  [49, 'Línea Guararapes', 'Obsidiana', 'GUA_OBSIDIANA', 'SI', 'SI', 'NO', 'NO'],
  [50, 'Línea Guararapes', 'Magnesio', 'GUA_MAGNESIO', 'SI', 'SI', 'NO', 'NO'],
  [51, 'Línea Guararapes', 'Topacio', 'GUA_TOPACIO', 'SI', 'SI', 'NO', 'NO'],
  
  // TENERIFE
  [52, 'Línea Tenerife', 'Plata', 'TEN_PLATA', 'SI', 'SI', 'NO', 'NO'],
  [53, 'Línea Tenerife', 'Murano', 'TEN_MURANO', 'SI', 'SI', 'NO', 'NO'],
  [54, 'Línea Tenerife', 'Petrol', 'TEN_PETROL', 'SI', 'SI', 'NO', 'NO'],
  [55, 'Línea Tenerife', 'Calcio', 'TEN_CALCIO', 'SI', 'SI', 'NO', 'NO'],
  
  // ALTO BRILLO
  [56, 'Línea Alto Brillo', 'Alaska', 'ALT_ALASKA', 'SI', 'SI', 'NO', 'NO'],
  [57, 'Línea Alto Brillo', 'Obsidiana', 'ALT_OBSIDIANA', 'SI', 'SI', 'NO', 'NO'],
  [58, 'Línea Alto Brillo', 'Magnesio', 'ALT_MAGNESIO', 'SI', 'SI', 'NO', 'NO'],
  [59, 'Línea Alto Brillo', 'Topacio', 'ALT_TOPACIO', 'SI', 'SI', 'NO', 'NO'],
  
  // SUPER MATE
  [60, 'Línea Super Mate', 'Plata', 'SUP_PLATA', 'SI', 'SI', 'NO', 'NO'],
  [61, 'Línea Super Mate', 'Murano', 'SUP_MURANO', 'SI', 'SI', 'NO', 'NO'],
  [62, 'Línea Super Mate', 'Petrol', 'SUP_PETROL', 'SI', 'SI', 'NO', 'NO'],
  [63, 'Línea Super Mate', 'Calcio', 'SUP_CALCIO', 'SI', 'SI', 'NO', 'NO'],
  
  // FOIL
  [64, 'Línea Foil', 'Drift Wood', 'FOIL_DRIFT_WOOD', 'SI', 'SI', 'SI', 'SI'],
  [65, 'Línea Foil', 'Negro Mate', 'FOIL_NEGRO_MATE', 'SI', 'NO', 'NO', 'NO'],
  [66, 'Línea Foil', 'Azul Marino Mate', 'FOIL_AZUL_MARINO', 'SI', 'NO', 'NO', 'NO'],
  [67, 'Línea Foil', 'Azul Claro Mate', 'FOIL_AZUL_CLARO', 'SI', 'NO', 'NO', 'NO'],
  [68, 'Línea Foil', 'Almendra Elegante', 'FOIL_ALMENDRA', 'SI', 'NO', 'NO', 'NO'],
  [69, 'Línea Foil', 'Blanco Elegante', 'FOIL_BLANCO_ELEGANTE', 'SI', 'NO', 'NO', 'NO'],
  [70, 'Línea Foil', 'Nogal Woodlook', 'FOIL_NOGAL_WOODLOOK', 'SI', 'SI', 'SI', 'SI'],
  [71, 'Línea Foil', 'Gris Elegant', 'FOIL_GRIS_ELEGANT', 'SI', 'NO', 'NO', 'NO'],
  [72, 'Línea Foil', 'Gris Claro Elegante', 'FOIL_GRIS_CLARO', 'SI', 'NO', 'NO', 'NO'],
  [73, 'Línea Foil', 'Landsdowne', 'FOIL_LANDSDOWNE', 'SI', 'SI', 'SI', 'SI'],
  [74, 'Línea Foil', 'Olmo Rustik', 'FOIL_OLMO_RUSTIK', 'SI', 'SI', 'SI', 'SI'],
  [75, 'Línea Foil', 'Nogal Claro', 'FOIL_NOGAL_CLARO', 'SI', 'SI', 'SI', 'SI'],
  [76, 'Línea Foil', 'Nogal Terracota', 'FOIL_NOGAL_TERRACOTA', 'SI', 'SI', 'SI', 'SI'],
  [77, 'Línea Foil', 'Gris Cemento Mate', 'FOIL_GRIS_CEMENTO', 'SI', 'NO', 'NO', 'NO'],
  [78, 'Línea Foil', 'Nuez', 'FOIL_NUEZ', 'SI', 'SI', 'SI', 'SI'],
  [79, 'Línea Foil', 'Blanco Carrara', 'FOIL_BLANCO_CARRARA', 'SI', 'NO', 'NO', 'NO'],
  [80, 'Línea Foil', 'Maple Oriental', 'FOIL_MAPLE_ORIENTAL', 'SI', 'SI', 'SI', 'SI'],
  [81, 'Línea Foil', 'Oak', 'FOIL_OAK', 'SI', 'SI', 'SI', 'SI'],
  [82, 'Línea Foil', 'Blanco Liso', 'FOIL_BLANCO_LISO', 'SI', 'NO', 'NO', 'NO'],
  [83, 'Línea Foil', 'Maple Grabado', 'FOIL_MAPLE_GRABADO', 'SI', 'SI', 'SI', 'SI'],
  [84, 'Línea Foil', 'Blanco Cortesa', 'FOIL_BLANCO_CORTESA', 'SI', 'SI', 'SI', 'SI'],
  [85, 'Línea Foil', 'Negro Liso', 'FOIL_NEGRO_LISO', 'SI', 'NO', 'NO', 'NO'],
];

const tonesSheet = xlsx.utils.aoa_to_sheet(tonesByLine);
xlsx.utils.book_append_sheet(newWorkbook, tonesSheet, 'Tonos por Línea');

// =====================================
// SHEET 3: MODELOS DE JALADERA
// =====================================
const handleModels = [
  ['ID', 'MODELO', 'TAMAÑO', 'COLOR', 'CÓDIGO', 'PRECIO ML', 'DESCRIPCIÓN'],
  [1, 'Sorento', 'A (Pequeña)', 'Negro', 'JAL_SORENTO_A_NEGRO', '', 'Jaladera Sorento tamaño A en color negro'],
  [2, 'Sorento', 'L (Mediana)', 'Negro', 'JAL_SORENTO_L_NEGRO', '', 'Jaladera Sorento tamaño L en color negro'],
  [3, 'Sorento', 'G (Grande)', 'Negro', 'JAL_SORENTO_G_NEGRO', '', 'Jaladera Sorento tamaño G en color negro'],
  [4, 'Sorento', 'A (Pequeña)', 'Aluminio', 'JAL_SORENTO_A_ALUMINIO', '', 'Jaladera Sorento tamaño A en color aluminio'],
  [5, 'Sorento', 'L (Mediana)', 'Aluminio', 'JAL_SORENTO_L_ALUMINIO', '', 'Jaladera Sorento tamaño L en color aluminio'],
  [6, 'Sorento', 'G (Grande)', 'Aluminio', 'JAL_SORENTO_G_ALUMINIO', '', 'Jaladera Sorento tamaño G en color aluminio'],
];

const handlesSheet = xlsx.utils.aoa_to_sheet(handleModels);
xlsx.utils.book_append_sheet(newWorkbook, handlesSheet, 'Modelos de Jaladera');

// =====================================
// SHEET 4: MODELOS DE PUERTA
// =====================================
const doorModels = [
  ['ID', 'NOMBRE', 'CÓDIGO', 'DESCRIPCIÓN', 'SOPORTA JALADERA MAQUINADA'],
  [1, 'Line (Liscio)', 'LINE', 'Puerta lisa sin maquinado', 'NO'],
  [2, 'Line + Jaladera', 'LINE_JALADERA', 'Puerta lisa con jaladera maquinada integrada', 'SI'],
];

const doorModelsSheet = xlsx.utils.aoa_to_sheet(doorModels);
xlsx.utils.book_append_sheet(newWorkbook, doorModelsSheet, 'Modelos de Puerta');

// =====================================
// SHEET 5: TIPOS DE PRODUCTO
// =====================================
const productTypes = [
  ['ID', 'TIPO', 'CÓDIGO', 'DESCRIPCIÓN', 'UNIDAD DE MEDIDA', 'CALCULA POR'],
  [1, 'Puerta', 'PUERTA', 'Puertas para muebles de cocina', 'Pieza', 'Metro Cuadrado'],
  [2, 'Ventana', 'VENTANA', 'Ventanas para muebles (referencia a líneas 4-7)', 'Pieza', 'Metro Cuadrado'],
  [3, 'Panel', 'PANEL', 'Paneles decorativos (referencia a líneas 1-7)', 'Pieza', 'Metro Cuadrado'],
  [4, 'Hoja Vista', 'HOJA_VISTA', 'Hojas de vista para acabados (referencia a línea 7)', 'Pieza', 'Metro Cuadrado'],
  [5, 'Cubrecanto', 'CUBRECANTO', 'Cubrecanto para acabado de cantos', 'Metro Lineal', 'Metro Lineal'],
  [6, 'Jaladera Aluminio', 'JALADERA_ALUMINIO', 'Jaladeras de aluminio', 'Metro Lineal', 'Metro Lineal'],
];

const productTypesSheet = xlsx.utils.aoa_to_sheet(productTypes);
xlsx.utils.book_append_sheet(newWorkbook, productTypesSheet, 'Tipos de Producto');

// =====================================
// SHEET 6: OPCIONES DE CUBRECANTO
// =====================================
const edgeBanding = [
  ['ID', 'LÍNEA', 'TIPO DE CUBRECANTO', 'DESCRIPCIÓN'],
  [1, 'Vidrio', 'Tono similar al vidrio', 'Se puede elegir un tono similar al del vidrio seleccionado'],
  [2, 'Vidrio', 'Aluminio', 'Cubrecanto en tono aluminio'],
  [3, 'Línea Cerámica', 'Tono similar a la cerámica', 'Se puede elegir un tono similar al de la cerámica seleccionada'],
  [4, 'Línea Cerámica', 'Aluminio', 'Cubrecanto en tono aluminio'],
  [5, 'Línea Alhú', 'No aplica', 'No se ofrece cubrecanto para esta línea'],
  [6, 'Línea Europa Básica', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [7, 'Línea Europa Sincro', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [8, 'Línea Guararapes', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [9, 'Línea Tenerife', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [10, 'Línea Alto Brillo', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [11, 'Línea Super Mate', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
  [12, 'Línea Foil', 'Mismo tono de puerta', 'El cubrecanto es del mismo tono que la puerta'],
];

const edgeBandingSheet = xlsx.utils.aoa_to_sheet(edgeBanding);
xlsx.utils.book_append_sheet(newWorkbook, edgeBandingSheet, 'Opciones de Cubrecanto');

// =====================================
// SHEET 7: CONFIGURACIÓN TRASCARA
// =====================================
const backfaceConfig = [
  ['ID', 'LÍNEA', 'OPCIÓN 1 CARA', 'OPCIÓN 2 CARAS', 'TIPO TRASCARA 2 CARAS'],
  [1, 'Vidrio', 'SI', 'SI', 'Blanca o Especialidad'],
  [2, 'Línea Cerámica', 'SI', 'SI', 'Blanca o Especialidad'],
  [3, 'Línea Alhú', 'SI', 'NO', 'N/A'],
  [4, 'Línea Europa Básica', 'SI', 'SI', 'Mismo acabado'],
  [5, 'Línea Europa Sincro', 'SI', 'SI', 'Mismo acabado'],
  [6, 'Línea Guararapes', 'SI', 'SI', 'Mismo acabado'],
  [7, 'Línea Tenerife', 'SI', 'SI', 'Mismo acabado'],
  [8, 'Línea Alto Brillo', 'SI', 'SI', 'Mismo acabado'],
  [9, 'Línea Super Mate', 'SI', 'SI', 'Mismo acabado'],
  [10, 'Línea Foil', 'SI', 'Según tono', 'Ver hoja de Tonos'],
];

const backfaceSheet = xlsx.utils.aoa_to_sheet(backfaceConfig);
xlsx.utils.book_append_sheet(newWorkbook, backfaceSheet, 'Configuración Trascara');

// =====================================
// SHEET 8: NOTAS Y REGLAS DE NEGOCIO
// =====================================
const businessRules = [
  ['#', 'CATEGORÍA', 'REGLA', 'DESCRIPCIÓN'],
  [1, 'Precios', 'Tono de aproximación', 'Tono de aproximación del total del pedido más $2,500 pesos'],
  [2, 'Precios', 'Mano de obra ventanas', 'Precio de la ventana es el precio del m2 + $300 pesos de mano de obra + cristal'],
  [3, 'Garantía', 'Dimensiones máximas', 'Producto con dimensiones mayores a 1500 mm NO aplica garantía'],
  [4, 'Pedidos', 'Tiempo de acceso', '24 horas para poder accesar a fincar pedido'],
  [5, 'Adicionales', 'Paquetería', 'Agregar costo de paquetería'],
  [6, 'Adicionales', 'Empaque', 'Agregar costo de empaque'],
  [7, 'Adicionales', 'Corte', 'Agregar precio por corte'],
  [8, 'Adicionales', 'Enchapado', 'Agregar precio por ML de enchapado'],
  [9, 'Adicionales', 'Armado', 'Agregar precio por armar mueble'],
  [10, 'Adicionales', 'Exhibición', 'Precio de exhibición disponible'],
  [11, 'Adicionales', 'Express', 'Precio express disponible'],
  [12, 'Producto', 'Espesor puertas chinas', 'Colocar en el catálogo el espesor de las puertas chinas'],
  [13, 'Foil', 'Precio 2 caras', 'El precio sube al meter foil 2 caras - consultar incremento'],
  [14, 'Foil', 'Jaladeras disponibles', 'Verificar qué jaladeras hay en foil maquinadas y de aluminio'],
];

const businessRulesSheet = xlsx.utils.aoa_to_sheet(businessRules);
xlsx.utils.book_append_sheet(newWorkbook, businessRulesSheet, 'Reglas de Negocio');

// =====================================
// SHEET 9: PRECIOS (PLANTILLA)
// =====================================
const pricesTemplate = [
  ['CÓDIGO PRODUCTO', 'DESCRIPCIÓN', 'PRECIO BASE M2', 'PRECIO 1 CARA', 'PRECIO 2 CARAS', 'INCREMENTO VETA', 'INCREMENTO JALADERA', 'ÚLTIMA ACTUALIZACIÓN'],
  ['', '', '', '', '', '', '', ''],
  ['NOTA: Complete esta hoja con los precios de cada producto', '', '', '', '', '', '', ''],
];

const pricesSheet = xlsx.utils.aoa_to_sheet(pricesTemplate);
xlsx.utils.book_append_sheet(newWorkbook, pricesSheet, 'Precios (Plantilla)');

// =====================================
// SHEET 10: REFERENCIAS ORIGINALES
// =====================================
const originalReferences = [
  ['TIPO EN ORIGINAL', 'DESCRIPCIÓN', 'REFERENCIA A NUEVA ESTRUCTURA'],
  ['1 - VIDRIO', 'Puertas de vidrio', 'Línea: Vidrio'],
  ['2 - LÍNEA CERÁMICA', 'Acabados cerámicos', 'Línea: Línea Cerámica'],
  ['3 - LÍNEA ALHÚ', 'Vidrios especiales', 'Línea: Línea Alhú'],
  ['4 - LÍNEA EUROPA BÁSICA', 'Melamínicos Europa', 'Línea: Línea Europa Básica'],
  ['5 - LÍNEA EUROPA SINCRO', 'Melamínicos sincronizados', 'Línea: Línea Europa Sincro'],
  ['6 - LÍNEA GUARARAPES', 'Línea brasileña', 'Línea: Línea Guararapes'],
  ['7 - LÍNEA TENERIFE', 'Línea contemporánea', 'Línea: Línea Tenerife'],
  ['8 - LÍNEA ALTO BRILLO', 'Acabados brillantes', 'Línea: Línea Alto Brillo'],
  ['9 - LÍNEA SUPER MATE', 'Acabados mate', 'Línea: Línea Super Mate'],
  ['10 - LÍNEA FOIL', 'Acabados foil', 'Línea: Línea Foil'],
  ['11-12 - FOIL (1 y 2 CARAS)', 'Detalle de caras en foil', 'Ver hoja Tonos por Línea, columnas SOPORTA 1/2 CARAS'],
  ['VENTANAS', 'Ventanas para muebles', 'Tipo de Producto: Ventana (aplica líneas 4-7)'],
  ['PANEL', 'Paneles decorativos', 'Tipo de Producto: Panel (aplica líneas 1-7)'],
  ['HOJA VISTA', 'Hojas de vista', 'Tipo de Producto: Hoja Vista (aplica línea 7)'],
  ['CUBRECANTO', 'Cubrecanto ML', 'Tipo de Producto: Cubrecanto'],
  ['JALADERA ALUMINIO', 'Jaladera ML', 'Tipo de Producto: Jaladera Aluminio'],
];

const originalRefsSheet = xlsx.utils.aoa_to_sheet(originalReferences);
xlsx.utils.book_append_sheet(newWorkbook, originalRefsSheet, 'Referencias Originales');

// Set column widths for all sheets
const sheets = [
  { name: 'Líneas de Producto', widths: [5, 25, 20, 50, 15, 18, 15, 15] },
  { name: 'Tonos por Línea', widths: [5, 22, 45, 30, 15, 15, 25, 25] },
  { name: 'Modelos de Jaladera', widths: [5, 15, 18, 15, 28, 12, 45] },
  { name: 'Modelos de Puerta', widths: [5, 20, 18, 50, 25] },
  { name: 'Tipos de Producto', widths: [5, 20, 20, 50, 18, 18] },
  { name: 'Opciones de Cubrecanto', widths: [5, 25, 30, 55] },
  { name: 'Configuración Trascara', widths: [5, 25, 18, 18, 25] },
  { name: 'Reglas de Negocio', widths: [5, 18, 30, 60] },
  { name: 'Precios (Plantilla)', widths: [20, 40, 15, 15, 15, 18, 20, 20] },
  { name: 'Referencias Originales', widths: [25, 35, 55] },
];

sheets.forEach(({ name, widths }) => {
  const sheet = newWorkbook.Sheets[name];
  if (sheet) {
    sheet['!cols'] = widths.map(w => ({ wch: w }));
  }
});

// Save the new workbook
const outputPath = path.join(__dirname, '..', 'COTIZADOR_MODULE_2025_REORGANIZADO.xlsx');
xlsx.writeFile(newWorkbook, outputPath);

console.log('✅ Excel reorganizado creado exitosamente!');
console.log('📁 Archivo guardado en:', outputPath);
console.log('');
console.log('📋 Hojas creadas:');
console.log('   1. Líneas de Producto - 10 líneas de productos');
console.log('   2. Tonos por Línea - 85 tonos organizados por línea');
console.log('   3. Modelos de Jaladera - 6 modelos de jaladeras');
console.log('   4. Modelos de Puerta - 2 modelos (Line y Line + Jaladera)');
console.log('   5. Tipos de Producto - 6 tipos (Puerta, Ventana, Panel, etc.)');
console.log('   6. Opciones de Cubrecanto - Reglas de cubrecanto por línea');
console.log('   7. Configuración Trascara - Opciones de 1/2 caras por línea');
console.log('   8. Reglas de Negocio - Notas y pendientes del cotizador');
console.log('   9. Precios (Plantilla) - Plantilla para agregar precios');
console.log('  10. Referencias Originales - Mapeo del Excel original');