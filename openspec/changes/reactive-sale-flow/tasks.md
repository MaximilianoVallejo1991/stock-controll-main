# Tareas: Flujo de Venta Reactivo

## Preparación
- [ ] Mapear todas las referencias de `paymentBreakdown` en `NewSale.jsx`.

## Fase 1: Refactorización de DiscountSummaryModal
- [ ] Crear estado local `localBreakdown` y `isSplit` dentro del modal.
- [ ] Implementar UI de "Pago Simple" (Select grande).
- [ ] Implementar UI de "Pago Combinado" (Lista + Inputs + Botones).
- [ ] Conectar cambios de pagos al callback `onPaymentChange`.
- [ ] Implementar lógica de "Saldo Restante" dinámico.
- [ ] Bloquear confirmación si el saldo no está cubierto.

## Fase 2: Sincronización en NewSale
- [ ] Simplificar la barra lateral de `NewSale.jsx` (quitar lógica de pagos).
- [ ] Conectar el nuevo prop `onPaymentChange` del modal a `fetchDiscountPreviewWithParams`.
- [ ] Asegurar que `processSale` use el desglose final enviado desde el modal.

## Fase 3: Pulido y QA
- [ ] Verificar descuentos proporcionales en vivo.
- [ ] Probar validaciones de Cuenta Corriente dentro del modal.
- [ ] Verificar responsividad en Mobile (el modal debe ser scrollable).
