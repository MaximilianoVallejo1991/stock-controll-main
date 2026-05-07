# Propuesta: Refactorización de Flujo de Venta Reactivo (Estación de Cierre)

## Problema
Actualmente, el vendedor debe configurar los medios de pago en la pantalla principal de `NewSale` antes de conocer el total final con descuentos. Esto genera confusión cuando los descuentos dependen del medio de pago (parciales), obligando al usuario a entrar y salir del modal de descuentos para ajustar montos.

## Solución Propuesta
Transformar el `DiscountSummaryModal` en una **Estación de Cierre de Venta** integral que combine:
1.  Desglose de productos y descuentos (existente).
2.  Configuración de medios de pago (nueva).
    -   Modo Simple (único medio).
    -   Modo Combinado (Split Payment).
3.  Cálculo reactivo: Al cambiar un pago en el modal, se dispara el preview de descuentos.

## Cambios en Componentes

### 1. `NewSale.jsx` (Simplificación)
-   Eliminar la lógica pesada de `paymentBreakdown` y `handleToggleSplit` de la barra lateral.
-   Reemplazar la sección de pagos por un botón de "Cerrar Venta" que solo requiere el subtotal.
-   Mantener el estado de `paymentBreakdown` pero delegar su gestión al modal.

### 2. `DiscountSummaryModal.jsx` (Potenciación)
-   Integrar UI de selección de medios de pago.
-   Implementar validación de "Saldo Restante" basada en el `netTotal` dinámico devuelto por el backend.
-   Añadir callback `onPaymentChange` para sincronizar descuentos en vivo.

## Riesgos y Mitigaciones
-   **Latencia**: Cada cambio de monto dispara una petición. *Mitigación*: Implementar un pequeño debounce o asegurar que el backend sea ultra-rápido.
-   **Circularidad**: El total cambia al cambiar el pago. *Mitigación*: Mostrar claramente el "Monto Restante" para que el vendedor entienda por qué el total se mueve.

## Plan de Acción
1.  Refactorizar `DiscountSummaryModal` para incluir la lógica de pagos.
2.  Actualizar `NewSale` para conectar los callbacks de pago.
3.  Limpiar la UI de `NewSale` para un diseño más despejado.
