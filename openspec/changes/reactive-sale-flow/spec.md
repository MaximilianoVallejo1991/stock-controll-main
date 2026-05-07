# Especificaciones: Flujo de Venta Reactivo

## Requerimientos Funcionales

### 1. Gestión de Pagos en Modal
- El modal debe permitir elegir entre "Pago Simple" y "Pago Combinado".
- **Pago Simple**: Un solo selector de medio de pago que cubre el 100% del total neto.
- **Pago Combinado**: Lista de medios con montos editables, botón para agregar y botón para eliminar.

### 2. Sincronización de Descuentos
- El modal debe disparar un evento `onPaymentChange` cada vez que:
    - Se cambie el medio en Pago Simple.
    - Se agregue/elimine un medio en Pago Combinado.
    - Se modifique un monto en Pago Combinado.
- El componente padre (`NewSale`) debe recibir este evento y ejecutar `fetchDiscountPreview` con el nuevo `paymentBreakdown`.

### 3. Validación de Cierre
- El botón de "Confirmar Venta" en el modal debe estar deshabilitado si el total de pagos no cubre el `netTotal`.
- Si el medio es "Cuenta Corriente", se debe validar que haya un cliente seleccionado y que tenga la cuenta abierta (esto ya existe pero debe integrarse en la validación del modal).

### 4. Interfaz de Usuario (UI)
- Mostrar un indicador de "Falta cubrir: $X.XXX" de forma prominente.
- El diseño debe ser consistente con el sistema de temas (Dark/Light).

## Escenarios de Prueba (Scenarios)

### Escenario A: Pago Simple con Descuento Directo
- **Dado** que tengo un producto de $1.000 y un descuento del 10% por "Efectivo".
- **Cuando** selecciono "Efectivo" en el modal.
- **Entonces** el total debe bajar a $900 automáticamente.

### Escenario B: Pago Combinado con Descuento Proporcional
- **Dado** que tengo una venta de $10.000 y un descuento del 10% por "Efectivo" con `allowPartial: true`.
- **Cuando** agrego "$5.000 Efectivo" y "$5.000 Tarjeta".
- **Entonces** el descuento aplicado debe ser de $500 (10% de la porción en efectivo).
- **Y** el total a cubrir debe ser $9.500.
