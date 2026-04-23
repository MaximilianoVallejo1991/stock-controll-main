// Roles del sistema RBAC
export const ROLES = {
  SISTEMA: 'SISTEMA',
  ADMINISTRADOR: 'ADMINISTRADOR',
  ENCARGADO: 'ENCARGADO',
  VENDEDOR: 'VENDEDOR'
};

export const EMPLOYEE_ROLES = [
    ROLES.SISTEMA,
    ROLES.ADMINISTRADOR,
    ROLES.ENCARGADO,
    ROLES.VENDEDOR
];

export const EMPLOYEE_ROLES_DET = [
    { value: ROLES.SISTEMA, label: "Sistema" },
    { value: ROLES.ADMINISTRADOR, label: "Administrador" },
    { value: ROLES.ENCARGADO, label: "Encargado" },
    { value: ROLES.VENDEDOR, label: "Vendedor" }
];