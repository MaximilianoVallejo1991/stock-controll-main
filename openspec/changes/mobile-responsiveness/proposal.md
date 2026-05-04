# Cambio: Optimización Mobile (Mobile First)
**Autor:** Antigravity (Orchestrator)
**Fecha:** 03/05/2026
**Estado:** Propuesto

## 1. Problema Actual
El sistema actual fue diseñado principalmente para pantallas de escritorio. Al acceder desde dispositivos móviles:
1. El `Sidebar` tiene un ancho fijo (64 o 20) que rompe el layout y ocupa espacio crítico en la pantalla.
2. El contenedor principal usa `h-screen` y `overflow-hidden` con flex, lo que a veces choca con el comportamiento de los navegadores móviles (especialmente en iOS Safari).
3. Las tablas anchas (`DataTable`) requieren mucho zoom o desbordan el contenedor.
4. Los botones de acción no están optimizados para tap targets táctiles.

## 2. Visión de la Solución (Estrategia)
Queremos lograr una experiencia "App-like" en celulares sin perjudicar la excelente vista de escritorio. 

### Pilar A: Layout y Navegación Dinámica
- **Desktop (md hacia arriba):** El layout actual se mantiene. Sidebar lateral fijo o colapsable.
- **Mobile (menor a md):** 
  - El Sidebar desaparece del flujo normal y se convierte en un **Drawer** o menú lateral deslizante (Absolute/Fixed con un backdrop).
  - Se introduce un **Mobile Header** fijo arriba con el logo, el botón de menú hamburguesa y opciones rápidas.

### Pilar B: Reingeniería de Componentes
- **Tablas:** Implementar scrolls horizontales controlados (`overflow-x-auto`) dentro del contenedor de la tabla, y considerar un modo "Cards" para tablas críticas en móviles.
- **Formularios:** Asegurar `grid-cols-1` por defecto, escalando a `md:grid-cols-2`.
- **Botones de Acción:** Los botones importantes (como Guardar/Pagar) deben estar accesibles, idealmente como botones sticky bottom en vistas móviles largas.

## 3. Alcance de Implementación (Fases)

### Fase 1: El Layout Principal y el Sidebar (Prioridad)
1. Modificar `MainLayout.jsx` para integrar el Mobile Header.
2. Refactorizar `Sidebar.jsx` para que reaccione al tamaño de pantalla (usar media queries o hooks de resize).
3. Implementar un "Backdrop" que cierre el menú al tocar fuera.

### Fase 2: Componentes Base (UI)
1. Refinar `DataTable.jsx` para prevenir desbordes horizontales de la pantalla completa.
2. Ajustar `EntityActionButtons` y los modales para ser 100% amigables en móvil (width 100%, p-4).

### Fase 3: Pantallas Críticas
1. Revisar `CurrentAccountDetails.jsx` y `Details.jsx` (especialmente las grillas de información y botones flotantes).

## 4. Riesgos y Mitigaciones
- **Regresión en Desktop:** Todos los cambios deben estar protegidos por prefijos como `md:` o `lg:` en Tailwind. La regla es "Mobile primero, expandir después".
- **Comportamiento del Scroll en iOS:** Evitaremos combinaciones conflictivas de `h-screen` y `100vh`.

---
## 5. Próximos Pasos (Para aprobación)
1. ¿Estás de acuerdo con el enfoque del **Sidebar como Drawer** + **Header Superior** para celulares?
2. ¿Aprobamos esta propuesta para pasar a la fase de **Especificaciones (Specs)**?
