# Hexagonal Architecture

The codebase is organized around ports and adapters to keep business logic independent from frameworks and transport details.

## Backend (Node/Express)

### Layers
- `backend/src/domain/`: pure domain logic (`profile` projection, text transforms)
- `backend/src/application/`: use-case services, bootstrap seeding, input schemas
- `backend/src/infrastructure/`: file DB, JWT, bcrypt, UUID adapters
- `backend/src/adapters/http/`: Express app, middleware, routes (REST delivery)
- `backend/src/server.js`: composition root (bootstraps app + starts server)

### Dependency Rule
- Inward dependencies only:
  - adapters -> application -> domain
  - infrastructure is injected into application
  - domain depends on nothing outside itself

## Frontend (React)

### Layers
- `frontend/src/domain/`: UI-agnostic domain helpers (`splitCsv`, query defaults)
- `frontend/src/application/`: stateful app hooks (`useAuthState`)
- `frontend/src/infrastructure/`: axios client and HTTP repository gateway
- `frontend/src/adapters/`: router and UI pages/components
- `frontend/src/App.jsx`: composition root (router mount)

### Dependency Rule
- UI pages call application/infrastructure through explicit modules.
- Infrastructure can be replaced (e.g., GraphQL, mocked APIs) without changing domain or most UI logic.

## Why this is cleaner
- Domain logic is testable without Express/React.
- Transport concerns (HTTP routes and browser router) are isolated.
- Infrastructure can evolve (JSON DB -> PostgreSQL) with minimal impact on use cases.
- Composition roots define wiring in one place.
