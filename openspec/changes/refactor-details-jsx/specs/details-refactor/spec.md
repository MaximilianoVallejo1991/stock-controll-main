# Specification: Details.jsx Refactoring

## 1. Description
This specification defines the requirements for refactoring the `Details.jsx` component. The core objective is to dismantle the monolithic structure into smaller, testable, and maintainable units (hooks and components) while strictly preserving existing functionality.

## 2. Requirements

### 2.1. Structural Requirements
- **R-01**: `Details.jsx` MUST be reduced to under 300 lines of code.
- **R-02**: All entity configuration and rules MUST be extracted to `src/config/entityRules.js`.
- **R-03**: Data fetching and saving logic MUST be extracted into custom hooks (e.g., `useEntityData`, `useEntitySave`).
- **R-04**: Complex UI sections MUST be extracted into sub-components located in `src/pages/Details/components/`.

### 2.2. Functional Requirements (Preservation)
- **R-05**: The system MUST continue to render the correct fields based on `ENTITY_FIELD_RULES`.
- **R-06**: The system MUST continue to enforce access and edit permissions based on `ENTITY_ALLOWED_ROLES`.
- **R-07**: Features like "Open Current Account", "Print Barcode", "Toggle Active Status", and "Reset Password" MUST function exactly as before.
- **R-08**: Form validation and error handling logic MUST remain intact.
- **R-09**: Image uploading, previewing, and "set as main" logic MUST remain intact.

### 2.3. UX/UI Requirements (Modernization)
- **R-10**: The component MUST display a Skeleton loader during the initial data fetch instead of the plain "Cargando datos..." text.
- **R-11**: The layout SHOULD be cleaner and more structured.

## 3. Scenarios

### Scenario 1: Viewing an Entity (Read-Only)
**Given** a user navigates to the details page of an entity
**And** the data is still fetching
**Then** the UI MUST display skeleton loaders
**When** the data fetch is complete
**Then** the UI MUST display the entity data using the extracted `DynamicForm` or similar component.

### Scenario 2: Editing an Entity
**Given** a user has edit permissions and clicks "Editar"
**When** the user modifies fields and clicks "Guardar"
**Then** the `useEntitySave` hook MUST process the changes, including any pending stock adjustments or image actions, exactly as the monolithic component did.

### Scenario 3: Unauthorized Access
**Given** a user without sufficient permissions (based on `ENTITY_ALLOWED_ROLES`) attempts to view an entity
**Then** the system MUST redirect them to the home page `/home`.
