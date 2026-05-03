import { ROLES } from "../constants/roles";

export const ENTITY_ALLOWED_ROLES = {
    clients: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    suppliers: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    products: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO, ROLES.VENDEDOR],
    categories: [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO],
    user: [ROLES.SISTEMA, ROLES.ADMINISTRADOR],
    stores: [ROLES.SISTEMA],
};

export const EDIT_ALLOWED_ROLES = [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO];

export const ENTITY_FIELD_RULES = {
    suppliers: {
        showExtra: ["fullName"],
        hide: ["name", "firstName", "lastName", "dni", "price", "stock"],
    },
    categories: {
        readOnly: ["barcodePrefix"],
    },
    products: {
        readOnly: ["barcode"],
    },
};
