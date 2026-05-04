# Especificaciones: Optimización Mobile

## Requerimientos Funcionales
1. **Navegación Móvil (App Bar):**
   - En pantallas pequeñas (`< 768px`), debe existir una barra superior visible permanentemente.
   - La barra debe contener un botón de menú ("Hamburguesa") para abrir/cerrar el Sidebar y el logo/título de la app.
   
2. **Drawer (Sidebar Móvil):**
   - El Sidebar debe estar oculto por defecto en móviles.
   - Al abrirse, debe sobreponerse al contenido principal (Fixed/Absolute con alto `z-index`).
   - Debe cerrarse automáticamente si el usuario hace click fuera de él (Backdrop).

3. **Preservación Desktop:**
   - En pantallas grandes (`>= 768px`), el sistema debe comportarse exactamente igual que en la actualidad (Sidebar fijo a la izquierda, barra superior oculta).

## Escenarios (Scenarios)

### Escenario 1: Uso en Computadora
- **Dado** que un usuario accede al sistema en una pantalla mayor a 768px.
- **Entonces** ve el layout clásico de 2 columnas (Sidebar a la izquierda, contenido a la derecha).
- **Y** no hay ninguna barra de navegación superior extraña.

### Escenario 2: Uso en Celular (Navegación Básica)
- **Dado** que un usuario accede al sistema desde su teléfono móvil.
- **Entonces** el Sidebar inicial está oculto y no ocupa espacio.
- **Y** ve un "App Header" arriba con un botón de menú.

### Escenario 3: Abrir/Cerrar Menú en Celular
- **Dado** que el usuario móvil presiona el botón del menú.
- **Entonces** el Sidebar se desliza desde la izquierda y oscurece ligeramente el fondo de la aplicación.
- **Cuando** el usuario toca el fondo oscuro o selecciona una opción de menú.
- **Entonces** el Sidebar se vuelve a cerrar suavemente, devolviendo el foco a la aplicación.
