# Tasks: Details.jsx Refactoring

## Phase 1: Infrastructure & Configuration

- [x] 1.1 Create `src/config/entityRules.js` and move `ENTITY_ALLOWED_ROLES` and `ENTITY_FIELD_RULES` from `Details.jsx` into it.
- [x] 1.2 Create `src/hooks/useEntityData.js` and migrate the data fetching logic (`fetchData`, `loading` state, `data` state) into it.
- [x] 1.3 Create `src/hooks/useEntitySave.js` and migrate the `performSave` logic (including stock and image logic) and `isSaving` ref into it.

## Phase 2: UI Component Extraction

- [x] 2.1 Create `src/pages/Details/components/SkeletonDetails.jsx` to serve as a loading placeholder.
- [x] 2.2 Create `src/pages/Details/components/BarcodePreview.jsx` and migrate the `useEffect` that renders the barcode canvas.
- [x] 2.3 Create `src/pages/Details/components/EntityHeader.jsx` and migrate the avatar rendering and title/active status logic.
- [x] 2.4 Create `src/pages/Details/components/EntityActionButtons.jsx` and migrate the top-right button logic.
- [x] 2.5 Create `src/pages/Details/components/DynamicForm.jsx` and migrate the massive grid rendering logic.

## Phase 3: Assembly & Validation

- [x] 3.1 Refactor `src/pages/Details.jsx` to import and compose all the newly created hooks and components.
- [x] 3.2 Ensure the validation logic inside `handleConfirmSave` is correctly hooked up.
- [x] 3.3 Verify routing and permissions redirection still works correctly at the top level of `Details.jsx`.
