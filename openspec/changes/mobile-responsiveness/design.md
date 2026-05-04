# Diseño Técnico: Optimización Mobile

## Decisiones de Arquitectura

1. **Patrón de Layout Responsivo (Tailwind)**
   - Utilizaremos el sistema de Breakpoints de Tailwind (`md:`) para diferenciar el estado de las vistas.
   - El contenedor raíz de `MainLayout` pasará de un simple `flex-row` a un contenedor que gestiona el layout colapsable (`flex-col md:flex-row`).

2. **Control de Estado del Drawer Móvil**
   - El estado de "Abierto/Cerrado" para móviles (`isMobileMenuOpen`) se gestionará dentro de `MainLayout.jsx` o delegando en el componente `Sidebar`, pero considerando que el botón hamburguesa del Header necesitará disparar la apertura.
   - Decisión: Mantener el estado `isMobileOpen` dentro de `MainLayout`, para poder pasárselo tanto al `Header` (botón abrir) como al `Sidebar` (mostrar/ocultar y botón cerrar).

3. **Inyección del App Header**
   - Se creará un pequeño bloque `div` en `MainLayout` que solo será visible (`block md:hidden`) que actuará como encabezado.

## Componentes Afectados

- `src/layouts/MainLayout.jsx`: Inyectar el App Header, manejar el estado del drawer.
- `src/components/Sidebar.jsx`: Recibir `isMobileOpen` y gestionar modo Drawer (fixed + backdrop).
- `src/pages/sales/NewSale.jsx`: Cambiar a grilla vertical y agregar Sticky Total Bar en mobile.
- `src/pages/sales/CashRegister.jsx`: Reordenamiento de columnas y footer responsivo.
- `src/pages/MainPanel.jsx`: Ajuste de paddings y centrado vertical condicional (Hecho ✅).
- `src/components/SectionCard.jsx`: Ancho flexible y altura mínima mejorada (Hecho ✅).
