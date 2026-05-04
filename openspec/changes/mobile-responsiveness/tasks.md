# Tareas de Implementación: Optimización Mobile

- [ ] **Tarea 1: Modificar `MainLayout.jsx`**
  - [ ] Importar `Menu` (hamburguesa) de `lucide-react` o usar `FaBars`.
  - [ ] Crear el estado `isMobileOpen` y la función de toggle.
  - [ ] Cambiar el layout raíz para soportar flujo de columna en móvil (`flex-col md:flex-row`).
  - [ ] Crear el "Mobile Header" (`div md:hidden`) con el título y el botón para abrir menú.
  - [ ] Pasar `isMobileOpen` y `setIsMobileOpen` como props a `Sidebar`.

- [ ] **Tarea 2: Refactorizar `Sidebar.jsx`**
  - [ ] Agregar el Backdrop (`div fixed inset-0 z-40 bg-black/50`) que se muestra si `isMobileOpen` es true y no estamos en `md`.
  - [ ] Modificar el contenedor del Sidebar (`aside`) para que en pantallas pequeñas sea `fixed`, tenga `z-50`, y transicione su desplazamiento (ej. `-translate-x-full` si está cerrado). En `md`, volver al flujo relativo/estático original.
  - [ ] En los links/botones del menú (`menuItems`), si es móvil, cerrar el menú automáticamente al hacer click (`onCloseMobile()`).

- [ ] **Tarea 3: Optimizar POS (`NewSale.jsx`)**
  - [ ] Refactorizar la grilla principal (`grid-cols-12` -> `flex flex-col`).
  - [ ] Crear el componente visual de "Total Flotante" para mobile.
  - [ ] Ajustar paddings de las tablas de productos y carrito.

- [ ] **Tarea 4: Optimizar Caja (`CashRegister.jsx`)**
  - [ ] Revisar el sistema de modales (Apertura/Cierre) para que no se corten en pantallas bajas.
  - [ ] Ajustar el footer de totales para que sea responsivo (pasar de 3 columnas a 2 o scroll horizontal si es necesario).

- [ ] **Tarea 5: Revisión de Seguridad CSS**
