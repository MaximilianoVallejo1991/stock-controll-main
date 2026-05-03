


export function translate(entityIdField) {

    if (entityIdField === "clientsId") {
        entityIdField = "clientId"
    } else if (entityIdField === "usersId") {
        entityIdField = "userId"
    } else if (entityIdField === "suppliersId") {
        entityIdField = "supplierId"
    } else if (entityIdField === "categoriesId") {
        entityIdField = "categoryId"
    } else if (entityIdField === "productsId") {
        entityIdField = "productId"
    } else if (entityIdField === "storesId") {
        entityIdField = "storeId"
    }



    return entityIdField;


}

export function reverseTranslate(entity) {

    if (entity === "clients") {
        entity = "client"
    } else if (entity === "users") {
        entity = "user"
    } else if (entity === "supplier") {
        entity = "supplier"
    } else if (entity === "category") {
        entity = "categories"
    } else if (entity === "products") {
        entity = "product"
    } else if (entity === "stores") {
        entity = "store"
    }

    return entity;

}

export function translateField(field) {
    const labels = {
        firstName: "Nombre",
        lastName: "Apellido",
        email: "Email",
        dni: "DNI",
        cuit: "CUIT",
        phoneNumber: "Teléfono",
        address: "Dirección",
        city: "Ciudad",
        description: "Descripción",
        name: "Nombre",
        barcode: "Código de Barras",
        barcodePrefix: "Prefijo",
        stock: "Stock",
        price: "Precio",
        cost: "Costo",
        categoryId: "Categoría",
        role: "Rol",
        status: "Estado",
        isActive: "Activo",
        password: "Contraseña",
        fullName: "Nombre Completo",
        profilePicture: "Foto de Perfil"
    };

    return labels[field] || field.charAt(0).toUpperCase() + field.slice(1);
}
