# Diseño Técnico: Flujo de Venta Reactivo

## Arquitectura de Estado

### `NewSale.jsx`
Mantendrá el estado maestro pero simplificado:
- `paymentBreakdown`: Sigue existiendo para la venta final, pero se inicializa vacío o con un valor por defecto al abrir el modal.
- `fetchDiscountPreviewWithParams`: Se mantiene como la "Fuente de Verdad" para los cálculos.

### `DiscountSummaryModal.jsx`
Se convierte en un componente con estado interno para la edición:
- `localBreakdown`: Copia de trabajo del desglose de pagos.
- `isSplit`: Booleano para alternar entre simple y combinado.

## Flujo de Datos (Data Flow)

1. `NewSale` -> abre modal con `cart`, `client` y `initialSubtotal`.
2. `DiscountSummaryModal` -> inicializa `localBreakdown`.
3. Usuario edita `localBreakdown` -> `useEffect` dispara `onPaymentChange(localBreakdown)`.
4. `NewSale` -> ejecuta `fetchDiscountPreview(localBreakdown)` -> actualiza `preview` prop del modal.
5. `DiscountSummaryModal` -> re-renderiza con nuevos descuentos y `netTotal`.

## Componentes UI a reutilizar/crear
- `PaymentEditor`: Sub-componente interno del modal para la tabla de pagos.
- `CoverageBadge`: Indicador visual de saldo restante.

## Cambios en Estilos
- Usar `theme.bgcards` para el fondo del editor de pagos.
- Usar `theme.primary` para el botón de confirmación.
