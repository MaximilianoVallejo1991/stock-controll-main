# Exploración: Optimización Mobile (Mobile First)

## Hallazgos de la Arquitectura Actual

He revisado `MainLayout.jsx`, `routes/index.jsx` y `Sidebar.jsx`. Esto es lo que encontré y por qué la optimización es necesaria:

### 1. Estructura de `MainLayout.jsx`
Actualmente, el layout usa un contenedor flex clásico de pantalla completa:
```javascript
<main className="flex h-screen w-screen overflow-hidden">
  <Sidebar />
  <div className="flex-1 h-full overflow-y-auto custom-scrollbar">
    <Outlet />
  </div>
</main>
```
**Problema en Mobile:** Al ser un `flex` por defecto (que es `flex-row`), el Sidebar SIEMPRE está al lado del contenido, quitándole espacio valioso a la pantalla (como mínimo, el Sidebar ocupa `w-20`, que en celulares es mucho).

### 2. Estructura de `Sidebar.jsx`
El Sidebar tiene un estado local `isOpen` que solo alterna entre `w-64` (abierto) y `w-20` (cerrado). No tiene conciencia de si está en desktop o mobile.
Además, el Sidebar contiene selectores de tienda y de simulación de roles que son muy importantes pero ocupan mucho espacio vertical.

### 3. Componentes Internos
- No hay un `Header` superior en la aplicación. Toda la navegación y control de sesión vive en el Sidebar. En móviles, lo estándar es tener un "App Bar" (Header) arriba con un botón hamburguesa.

## Estrategia de Implementación (Basada en la Exploración)

1. **Nuevo Mobile Header (`MainLayout`):**
   - Agregaremos un Header superior que **solo sea visible en mobile** (`md:hidden`). Este header tendrá el logo/nombre y un botón para abrir el menú.

2. **Refactorización del Sidebar (`Sidebar.jsx`):**
   - En **Desktop (`md:flex`)**: Seguirá funcionando exactamente igual que ahora (fijo a la izquierda, expandible).
   - En **Mobile (`max-md`)**: Se transformará en un Drawer (Cajón) usando posicionamiento fijo (`fixed inset-y-0 left-0 z-50`).
   - Se agregará un **Backdrop** (Fondo oscuro semitransparente) que cubrirá la pantalla cuando el Sidebar esté abierto en mobile, permitiendo cerrarlo al tocar fuera.

3. **Responsividad en Tablas y Grillas:**
   - Una vez estabilizado el layout, revisaremos que las páginas inyectadas por el `<Outlet />` usen correctamente `grid-cols-1 md:grid-cols-2`, y que las tablas tengan `overflow-x-auto`.

Esta estructura asegura **0% de regresiones en Desktop** (porque usaremos las clases `md:` para preservar el comportamiento original) y **100% de usabilidad en Mobile**.
