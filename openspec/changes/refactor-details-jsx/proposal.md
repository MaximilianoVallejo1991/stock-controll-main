# Proposal: Refactor Details.jsx

## Intent
Dismantle the 1100+ line "God Component" `Details.jsx` to improve maintainability, enforce Single Responsibility Principle (SRP), and modernize the UI/UX with better loading states and structured layouts.

## Scope

### In Scope
- Extract configuration and hardcoded rules to a separate file.
- Extract data fetching and saving logic to custom hooks (`useEntityData`, `useEntitySave`).
- Extract UI elements into modular sub-components (`EntityHeader`, `EntityForm`, `BarcodePreview`).
- Implement Skeleton loaders for better UX.

### Out of Scope
- Changing backend API endpoints.
- Modifying routing paths.
- Changing global theme system.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `details-refactor`: Refactoring the `Details.jsx` component.

## Approach
1. Move constants (`ENTITY_ALLOWED_ROLES`, `ENTITY_FIELD_RULES`) to `src/config/entityRules.js`.
2. Create custom hooks in `src/hooks/` to handle fetching, saving, and role checks.
3. Create sub-components in `src/pages/Details/components/` (e.g., Header, Form, Actions).
4. Recompose `Details.jsx` using these new modular pieces.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/Details.jsx` | Modified | Core component being refactored |
| `src/config/entityRules.js` | New | Extracted configurations |
| `src/hooks/useEntityData.js` | New | Extracted fetch logic |
| `src/hooks/useEntitySave.js` | New | Extracted save logic |
| `src/pages/Details/components/*` | New | Extracted UI components |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking entity-specific logic (e.g., users vs products) | Medium | Rigorous manual testing per entity type. |
| Losing unsaved changes | Low | Mirroring existing state guard `isSaving`. |

## Rollback Plan
Revert via Git to the commit prior to the start of the refactor.

## Dependencies
- None

## Success Criteria
- [ ] `Details.jsx` is under 300 lines of code.
- [ ] Logic is cleanly separated into reusable hooks.
- [ ] UI displays skeleton loaders during initial fetch.
- [ ] All previous entity actions (edit, active toggle, print) work without regressions.
