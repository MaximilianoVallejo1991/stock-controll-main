# Stock Control Frontend - Panel de Control y POS

Aplicación web moderna desarrollada en React 19, Vite y Tailwind CSS v4. Es el cliente visual que interactúa con la API de Stock Control, ofreciendo un Punto de Venta (POS) ágil, generador y selector de código de barras para etiquetas térmicas, constructor de reglas de descuento dinámicas y una interfaz de reportes interactiva.

---

## Inicio Rápido (Local)

Para levantar el cliente de desarrollo en tu máquina local, seguí estos pasos:

### 1. Configurar Variables de Entorno
Crea un archivo `.env` o `.env.local` en la raíz del proyecto:

```env
# URL de la API del Backend
VITE_API_URL="http://localhost:3000"
```

### 2. Instalar Dependencias
Instalá los paquetes de Node:
```bash
npm install
```

### 3. Iniciar Servidor de Desarrollo
Corré la aplicación de manera local:
```bash
npm run dev
```
La aplicación abrirá por defecto en `http://localhost:5173` o `http://localhost:5174`.

### 4. Compilar para Producción
Para generar el bundle optimizado para despliegue:
```bash
npm run build
```

---

## Estructura del Proyecto

El código está estructurado siguiendo principios de componentes reutilizables y stores globales:

```
├── public/               # Recursos estáticos
├── src/
│   ├── components/       # Componentes UI (Tablas genéricas, Modales, Form builders)
│   ├── config/           # Configuraciones de cliente (Axios, URLs)
│   ├── constants/        # Enums de permisos, roles y opciones de pago
│   ├── context/          # Contexto global (Tema Oscuro/Claro)
│   ├── hooks/            # Hooks de React personalizados
│   ├── layouts/          # Envoltorios de navegación (Sidebar, Navbar)
│   ├── pages/            # Vistas principales (Ventas, Productos, Cajas, Clientes, etc.)
│   ├── routes/           # Declaración y protección de rutas (React Router 7)
│   ├── store/            # Gestión de estado global con Zustand (User, Cart)
│   ├── styles/           # Estilos base y tokens de Tailwind CSS
│   └── utils/            # Helper funciones y formateadores
```

---

## Características y Soluciones de Diseño

### Flujo de Venta Reactivo (POS)
*   **"El Backend Calcula"**: El carrito delega la determinación de totales y descuentos a la API mediante `/api/discounts/preview`. El frontend nunca calcula precios netos finales directamente para evitar desajustes en el pago final.
*   **Modal de Confirmación**: Antes de procesar una venta, muestra un desglose inmutable del ticket, detalles de descuentos por producto (ITEM) y del ticket completo (ORDER).

### Motor de Códigos de Barra Integrado
*   **JsBarcode (Code 128)**: Renders vectoriales y ligeros integrados directamente en el DOM.
*   **Impresión Térmica Directa**: Rinde el canvas en memoria a un formato de imagen inyectado en un iframe de impresión dedicada, garantizando soporte nativo 1:1 en ticketeadoras sin distorsión de fuentes externas.

### UI Adaptativa por Permisos (RBAC)
*   La interfaz detecta dinámicamente el rol del usuario (`SISTEMA`, `ADMIN`, `ENCARGADO`, `VENDEDOR`) ocultando botones de acción destructiva, vistas de estadísticas financieras complejas y controles de administración para roles limitados (ej. Vendedores).

### Interfaz Premium con Modo Oscuro
*   Diseño visual con paleta de colores moderna (Tailwind v4), transiciones suaves, y soporte completo para modo claro/oscuro configurable mediante `ThemeContext`.

---

## Scripts Disponibles

*   `npm run dev`: Levanta el servidor local con Vite.
*   `npm run build`: Compila la aplicación optimizada para producción.
*   `npm run lint`: Ejecuta el análisis de código estático (ESLint).
*   `npm run preview`: Previsualiza localmente el build de producción compilado.
