
---

### **Nombre Sugerido para la Aplicación:**

*   **Moduel al Dente - Cotizador Pro**

---

### **Concepto General de la Aplicación**

**Moduel al Dente - Cotizador Pro** es una plataforma web integral diseñada para la cotización y gestión de pedidos de puertas para cocina. La aplicación automatiza todo el ciclo, desde la creación de una cotización de autoservicio por parte del cliente hasta la gestión de producción, pago y facturación por parte del equipo interno. Su núcleo es una calculadora precisa y configurable que permite a los clientes diseñar y cotizar sus proyectos a medida, 24/7.

---

### **Filosofía del Sistema: CRUD Integral**

La aplicación se construirá bajo una filosofía de **CRUD (Create, Read, Update, Delete)** en todos sus módulos. Esto significa que los usuarios con los permisos adecuados podrán crear, visualizar, modificar y eliminar registros en cada sección del sistema (Clientes, Productos, Catálogos, Cotizaciones, Pedidos), garantizando una gestión completa y flexible.

---

### **Módulos Principales y Funcionalidades**

#### **1. Módulo de Gestión de Clientes y Usuarios**

*   **Registro de Clientes (Formulario Detallado):** El formulario para dar de alta nuevos usuarios con rol de "Cliente" contendrá los siguientes campos obligatorios y opcionales:
    *   **Datos de Contacto:**
        *   Nombre Completo
        *   Correo Electrónico (será el usuario de acceso)
        *   Teléfono 1
        *   Teléfono 2 (opcional)
    *   **Domicilio de Entrega:**
        *   Calle, Número (exterior e interior), Colonia, Código Postal, Ciudad, Estado.
    *   **Datos Fiscales (para facturación):**
        *   Razón Social
        *   RFC
        *   Régimen Fiscal
        *   Uso de CFDI
    *   **Domicilio Fiscal:**
        *   Calle, Número, Colonia, Código Postal, Ciudad, Estado.
        *   (Sugerencia: Incluir un checkbox "Usar el mismo domicilio de entrega" para agilizar el llenado).
*   **Gestión de Usuarios (CRUD):** Funcionalidad completa para administrar usuarios y sus roles (Super Administrador, Supervisor, Agente de Ventas, Cliente).

---

#### **2. Módulo de Cotización Avanzado (Para Clientes y Agentes)**

Esta es la interfaz interactiva para construir un pedido. Cada cotización tendrá un **ID de Pedido único y consecutivo** (ej: `PED-2024-0001`) generado automáticamente y un campo para el **Nombre del Proyecto**.

**Proceso de Configuración por Partida (Línea de Pedido):**

1.  **Selección de Tipo de Puerta:** Menú principal con opciones como:
    *   Melamina
    *   Vidrio y Marcos de Aluminio
    *   Alto Brillo
    *   **Opción:** Checkbox para "Dos Caras" que ajusta el precio.

2.  **Selección de Modelo:** Las opciones dependen del tipo de puerta elegido.
    *   Con Moldura (diferentes estilos de molduras)
    *   Liso

3.  **Selección de Tono (Color):** Paleta de colores y texturas disponibles para el modelo seleccionado.

4.  **Selección de Veta:**
    *   Veta Vertical
    *   Veta Horizontal

5.  **Introducción de Medidas:**
    *   `Cantidad`
    *   `Alto (mm)`
    *   `Ancho (mm)`
    *   **Validación:** El sistema mostrará una **alerta si las medidas exceden los máximos** preconfigurados en el panel de administración (ej: "Alerta: El alto máximo para Melamina es de 2400 mm").

6.  **Selección de Jaladera (Opcional y Condicional):**
    *   El sistema solo mostrará esta opción si el tipo/modelo de puerta es compatible con jaladeras.
    *   Opciones: Catálogo de jaladeras.
    *   Orientación: `Vertical` u `Horizontal`.

7.  **Cálculo de Precios y Descripción por Partida:**
    *   Al completar los pasos, el sistema añade una línea a la cotización con una **descripción detallada y autogenerada**, por ejemplo: *“1 pza - Puerta de Melamina, Modelo Clásico, Tono Roble Cenizo, Veta Horizontal, Medidas 750x450mm, con Jaladera de Barra 30cm (Vertical)”*.
    *   **Fórmula de Precio por Partida:** `(Cantidad × Alto × Ancho × Precio Base mm²) + (Costo de Jaladera) + (Costo de Empaque calculado por Alto × Ancho)`.

**Resumen y Cierre de la Cotización:**

8.  **Opciones de Servicio:** Al final de la cotización, el cliente podrá seleccionar:
    *   `Pedido Express`: Aumenta el costo total en un porcentaje (configurable).
    *   `Pedido de Exhibición`: Aplica un descuento en un porcentaje (configurable).

9.  **Cálculo de Tiempos de Entrega:** El sistema mostrará una **fecha estimada de entrega**, calculada en base a reglas de negocio (ej: Pedido estándar = 15 días hábiles, Pedido Express = 7 días hábiles, Alto Brillo añade +3 días).

10. **Descarga de Documentos:** Botones para descargar la cotización en formatos:
    *   **PDF:** Con diseño profesional, logo y todos los detalles.
    *   **Excel:** Para que el cliente pueda manejar los datos.

---

#### **3. Módulo de Flujo de Pedido y Pagos**

Este módulo se activa una vez que la cotización está lista para ser aprobada.

11. **Mensaje de Vigencia:** La cotización mostrará claramente el mensaje: **"Esta cotización tiene una vigencia de 180 días para ser aprobada."**

12. **Aprobación y Pago:**
    *   El cliente aprueba la cotización.
    *   El sistema le indica el monto a pagar y los datos bancarios.
    *   El cliente puede **subir su comprobante de pago** (imagen o PDF) directamente a la plataforma.

13. **Validación del Pago:**
    *   Un **Supervisor** recibe una notificación de que se ha subido un comprobante.
    *   El Supervisor verifica el pago y cambia el estado del pedido.
    *   La **Fecha de Validación** se establece en el momento en que el Supervisor marca el pedido como "Pagado". Esta fecha inicia el conteo del tiempo de entrega y la vigencia del pedido.

---

#### **4. Módulo de Administración y Supervisión (Panel de Control)**

14. **Gestión de Estados del Pedido:**
    *   El **Supervisor** puede cambiar el estado de un pedido en cualquier momento. Los estados clave son:
        *   `Borrador`
        *   `Enviada al cliente`
        *   `Aprobada por cliente`
        *   `Pagado`
        *   `En Producción`
        *   `Listo para Entrega`
        *   `Facturado`
        *   `Completado`
        *   `Cancelado`

15. **Gestión de Facturación:**
    *   Una vez que el pedido está `Pagado` y se solicita factura, el Supervisor podrá **subir los archivos de la factura oficial**:
        *   **Factura.pdf**
        *   **Factura.xml**
    *   Estos archivos estarán disponibles para que el cliente los descargue desde su panel.

16. **Cálculo de Fechas de Producción:**
    *   La **Fecha de Salida de Producción** se calcula automáticamente por el sistema.
    *   Se basa en una regla configurable en el panel: `Fecha de Validación (Pago) + Días Hábiles de Producción (según tipo de pedido y acabados)`.
    *   Esta fecha será visible tanto para el supervisor como para el cliente.