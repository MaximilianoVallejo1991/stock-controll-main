export const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return "$ 0,00";
    
    // Convertir a número por si acaso viene como string
    const num = Number(amount);
    if (isNaN(num)) return "$ 0,00";

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const parseCurrency = (value) => {
    if (!value) return 0;
    // Permitir escribir números con punto o coma para decimales
    // Eliminar todo lo que no sea dígito, coma, punto o signo menos
    let clean = value.toString().replace(/[^0-9,\.-]/g, '');
    
    // Si hay coma, asumir que es separador decimal
    if (clean.includes(',')) {
        clean = clean.replace(/\./g, ''); // Quitar puntos (separadores de miles)
        clean = clean.replace(',', '.');  // Cambiar coma decimal por punto
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};
