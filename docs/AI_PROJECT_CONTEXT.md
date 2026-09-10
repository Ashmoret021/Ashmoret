# Ashmoret Project Context for AI Agents

## Mission

Ashmoret is a web application for simulating and training an air-defense command workflow. The main user experience is a map-based simulation of hostile drones entering an area and defensive launcher systems attempting to intercept them. The project is also intended to support scenario authoring: users can place drones, organize attack waves, configure defense assets, save scenarios, and then run the simulation.

The repository is a monorepo with two independent Node.js applications:

- `frontend/`: React + TypeScript + Vite user interface and browser-side simulation.
- `backend/`: Express + TypeScript REST API backed by PostgreSQL through TypeORM.

The repository also contains shared domain types in the root `types/` directory and design/specification documents in `docs/`.

## Important Operating Model

There are currently two related but not fully unified data flows:

1. The active frontend simulation is mostly browser-local. Draft drones, attack waves, metadata, and saved scenarios are persisted with `localStorage` through `frontend/src/services/storageService.ts`.
2. The backend provides CRUD APIs for scenarios, drone groups, launcher groups, drones, launchers, ammunition, and type catalogs. The frontend contains API-related code, but the current simulation path still relies heavily on local state and mock data.

Do not assume that creating a record through the backend automatically updates the browser simulation. Treat the frontend simulation model and the backend persistence model as separate integration surfaces until an explicit adapter is added.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Leaflet for map rendering
- Material UI and Emotion for UI components and styling
- `lucide-react` for icons
- Axios is installed for HTTP requests
- ESLint and TypeScript build checks

### Backend

- Node.js
- Express
- TypeScript
- TypeORM
- PostgreSQL via `pg`
- `dotenv` for environment configuration
- Winston for logging
- Morgan for HTTP request logging
- CORS, cookie-parser, and JSON/urlencoded body parsing

## Repository Layout

```text
Ashmoret/
  README.md
  types/
    types.ts                 Shared frontend/domain primitives
    tables.json              Database/table-related metadata
  backend/
    package.json
    tsconfig.json
    .env                     Local database configuration; ignored by Git
    src/
      app.ts                 Express middleware and /api mounting
      server.ts              HTTP server startup and DB initialization
      config/
        db.ts                TypeORM DataSource and pg Pool
        schema.ts            PostgreSQL schema/table-name helper
      Entities/              TypeORM entities and relations
      middleware/            Error handling and logging
      routes/                REST route modules
      services/              Repository-based CRUD services
      types/                 Backend model types
  frontend/
    package.json
    vite.config.ts
    public/CITIES.geojson    Map geographic data
    src/
      App.tsx                Main application integration point
      algorithm/             Algorithm contract, client, snapshot builder, mock
      components/            Authoring and modal components
      contexts/              Domain contexts such as drones and launchers
      layouts/               Page/layout composition
      map/                   Leaflet renderer and map icons
      pages/                 Application pages
      services/              Browser persistence and service helpers
      simulation/            Clock, state, threat processing, and providers
      styles/                Global and feature styling
      types/                 Frontend simulation and authoring types
      ui/                    Simulation controls, stats, event log, legend
      visual/                Visual event transformation and queue
  docs/
    ashmoret_simulation_spec.md       Detailed simulation specification
    TEAM3_PARALLEL_DEV_PLAN.md        Architecture/development plan
```

## Backend Architecture

### Startup

`backend/src/server.ts` creates the HTTP server, reads `PORT` (default `3000`), starts listening, and then attempts to initialize the TypeORM database connection. A database connection failure is logged as a warning during startup rather than immediately preventing the HTTP server from listening.

`backend/src/app.ts` configures:

- Morgan request logging.
- CORS with `FRONTEND_ORIGIN` and credentials enabled.
- JSON and URL-encoded request parsing.
- Cookie parsing.
- The API router at `/api`.
- A final error handler.

### Environment Variables

The current local file is `backend/.env` and is ignored by Git. Its current values are:

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=<local PostgreSQL password>
DB_NAME=postgres
DB_SCHEMA=scenario_management
DB_SSL=false
```

The code also reads:

- `PORT`: backend HTTP port, default `3000`.
- `FRONTEND_ORIGIN`: allowed CORS origin. It should be set when the frontend is served from a different origin.

`backend/src/config/db.ts` creates both a TypeORM `DataSource` and a raw PostgreSQL `Pool`. TypeORM uses development logging when `NODE_ENV=development`; schema synchronization is disabled (`synchronize: false`). The PostgreSQL schema defaults to `scenario_management`.

### Domain Model

The principal backend entities are:

- `Scenario`: identified by a string ID; has a name and type; references one drone group and one launcher group.
- `DronesGroup`: named group containing many drones and belonging to many scenarios.
- `Drone`: a drone definition with location, heading, velocity, type, and group relation.
- `LaunchersGroup`: named group containing many launchers and belonging to many scenarios.
- `Launcher`: a defensive launcher with location, type, active state, ammunition, and group relation.
- `LauncherAmmunition`: associates launchers with interceptor types and quantities.
- `DroneType`: drone type catalog.
- `InterceptorType`: interceptor type catalog.
- `LauncherType`: launcher type catalog.

The main relationship graph is:

```text
Scenario -> DronesGroup -> Drone
Scenario -> LaunchersGroup -> Launcher -> LauncherAmmunition
DroneType, InterceptorType, LauncherType act as catalogs
```

Scenario reads eagerly request the nested group contents: drones under the drone group and launchers under the launcher group.

### REST API

All routes are mounted below `/api` and follow a conventional CRUD shape:

```text
/api/scenarios
/api/drones-groups
/api/launchers-groups
/api/drones
/api/launchers
/api/launcher-ammunitions
/api/drone-types
/api/interceptor-types
/api/launcher-types
```

Each resource normally supports:

```text
GET    /resource             List records
GET    /resource/:id         Read one record
POST   /resource             Create a record
PUT    /resource/:id         Update a record
DELETE /resource/:id         Delete a record
```

The scenario service is a representative implementation. It uses the TypeORM repository, loads the nested drone and launcher group relations, accepts both camelCase and snake_case group ID fields on writes, and returns `404` when a requested scenario does not exist. Numeric resource IDs are validated in route handlers and return `400` for invalid formats.

When adding backend functionality, preserve the existing route -> service -> repository layering. Keep HTTP concerns in route modules and database concerns in services/entities. Use `next(error)` so the central error middleware can handle failures.

## Frontend Architecture

### Main Composition

`frontend/src/App.tsx` is the main integration point. It connects:

- `MainLayout` and the map view.
- Simulation controls and statistics.
- Event log and map legend.
- Drone placement and attack-side authoring components.
- Defense-side configuration components.
- The simulation clock/state layer.
- The algorithm client and world snapshot builder.
- The visual event builder, visual event queue, and Leaflet renderer.

The application includes Hebrew user-facing labels in several places. Preserve the existing RTL/localized content conventions when changing those screens.

### Scenario Authoring and Browser Storage

`storageService.ts` stores the following values in `localStorage`:

- Placed drones: `ashmoret_placed_drones`
- Attack waves: `ashmoret_attack_waves`
- Attack metadata: `ashmoret_attack_metadata`
- Saved scenarios: `ashmoret_scenarios`
- Active scenario ID: `ashmoret_active_scenario_id`

The authoring flow supports attack name/description, drone waves, placing drones on the map, selecting or deleting drones, and saving/loading scenario drafts. Storage methods catch malformed or unavailable local-storage errors and return safe empty values.

### Simulation State and Clock

`frontend/src/simulation/SimulationContext.ts` owns a module-level state store and a `requestAnimationFrame` clock. Its state includes:

- `simulationTime` and `maxSimulationTime`.
- Status: `idle`, `running`, `paused`, or `finished`.
- Speed multiplier: `1`, `2`, `5`, or `10`.
- Threat/drone states.
- Launcher states.
- Interceptor states.
- Visual events and event log history.

The clock advances simulation time using real elapsed time multiplied by the selected speed. It records snapshots during live playback, enabling replay/scrubbing behavior. Public helpers include `getState`, `setState`, `subscribe`, `startClock`, `pauseClock`, `resumeClock`, `stopClock`, `finishClock`, and scenario-loading helpers.

The current movement path in `App.tsx` activates waiting threats and advances active threats by interpolating from the first route point to the last. That path uses a fixed flight duration of 40 simulation seconds. It is therefore not yet identical to every route/speed rule described in the written simulation specification.

### Threat and Interceptor Lifecycle

Logical drone statuses are:

```text
waiting -> active -> interceptPending -> intercepted
                       \-> impacted
```

Logical and visual statuses are intentionally separate. A logical state change can happen immediately while the map animation continues through visual events.

The simulation tick currently:

1. Reads the central state.
2. Activates threats whose start time has arrived.
3. Moves active and interception-pending threats.
4. Marks threats that reach route completion as impacted and logs an impact event.
5. Builds and sends a world snapshot approximately once per simulation second.
6. Processes algorithm engagement decisions asynchronously.
7. Converts decisions into interceptor state and visual events.

### Algorithm Contract

The browser-side algorithm contract is defined in `frontend/src/algorithm/types.ts`.

The client sends a `WorldSnapshot` containing:

- `tickId`.
- `simulationTime`.
- Active threats with ID, type, position, route, progress, and engagement status.
- Defense systems with position and interceptor inventory.
- Active interceptors.
- Active engagements, used to prevent duplicate assignments.

The external endpoint is:

```text
POST {VITE_ALGORITHM_URL}/simulation/step
```

The request body is `{ snapshot }`. The expected response contains `tickId` and an `engagements` array. Each engagement identifies a defense system, interceptor type, target threat, and optional success/failure result.

The client uses the mock algorithm when `VITE_ALGORITHM_URL` is empty or `VITE_USE_MOCK_ALGORITHM=true`. It also falls back to the mock server on HTTP errors, timeouts, or network failures. Responses with an old or duplicate tick ID are ignored.

### Visual Event Layer

The visual layer keeps animation concerns separate from simulation decisions:

- `VisualEventBuilder.ts` validates and resolves an engagement against current state, calculates a future intercept position, and creates plain interceptor/event data.
- `VisualEventQueue.ts` stores events sorted by start time, advances `pending -> active -> finished`, prevents duplicate event IDs, supports subscriptions, and periodically prunes finished events.
- `LeafletRenderer.ts` owns map markers and polylines. It runs its own animation-frame loop, updates marker positions, renders threat/interceptor routes, and displays impacts/interception flashes.

Leaflet is a renderer, not the source of truth. Do not place business decisions or simulation state inside markers, polylines, or animation callbacks.

### Map

The map uses Leaflet with custom icons and route polylines. `public/CITIES.geojson` supplies geographic data. The renderer maintains marker pools keyed by entity ID and supports toggles for threat and interceptor route visibility. Map rendering is intended to remain decoupled from the lower-frequency simulation and algorithm loops.

## Local Development

Install dependencies separately in each package:

```powershell
cd backend
npm install

cd ..\frontend
npm install
```

Run the backend in development mode:

```powershell
cd backend
npm run dev
```

Run the frontend in development mode in another terminal:

```powershell
cd frontend
npm run dev
```

Backend production-style build and start:

```powershell
cd backend
npm run build
npm start
```

Frontend checks:

```powershell
cd frontend
npm run build
npm run lint
```

The backend defaults to port `3000`. Vite typically serves the frontend on its standard development port. Configure the frontend algorithm URL with Vite environment variables when using a real algorithm service:

```env
VITE_ALGORITHM_URL=http://localhost:4000
VITE_USE_MOCK_ALGORITHM=false
```

## Current Caveats and Integration Risks

1. The frontend uses `Drone`, `Launcher`, and `Location` structures from the root/shared type area, while the backend entities use database-oriented fields and relations. Mapping is required; do not pass backend entities directly into the simulation.
2. Frontend scenario persistence is currently local-storage based. Backend CRUD endpoints exist, but a complete synchronization workflow is not established by the current architecture.
3. The algorithm service is external by contract, but the default development behavior is the in-browser mock server.
4. The written simulation specification and the current implementation are not perfectly identical. In particular, the current app movement logic uses a fixed 40-second endpoint interpolation, while the visual builder also contains velocity/route-length projection logic.
5. TypeScript builds exist for both packages, but there is no evident comprehensive automated test suite in the repository. Validate simulation changes manually and add focused tests when changing shared state transitions or algorithm contracts.
6. Database synchronization is disabled. Schema/table changes require an existing migration or database update process; changing an entity alone does not create database tables.
7. The backend should be checked carefully when extending route registration because route files and import aliases have been developed in parallel and may not all have identical style or naming conventions.

## Guidance for Future AI Changes

Before editing, identify which layer owns the behavior:

- Persistence/API issue: inspect the relevant backend route, service, entity, and database configuration.
- Scenario authoring issue: inspect the relevant frontend component and `storageService`.
- Simulation timing/state issue: inspect `SimulationContext`, tick processing in `App.tsx`, and the threat/interceptor engines.
- Algorithm issue: inspect `algorithm/types.ts`, `WorldSnapshotBuilder`, `AlgorithmClient`, and the mock server.
- Map animation issue: inspect `VisualEventBuilder`, `VisualEventQueue`, and `LeafletRenderer`.

Keep logical state independent from visual state. Preserve tick IDs and stale-response protection. On restart, reset the simulation clock, async algorithm guards, visual event queue, markers, and interceptor state together. Prefer small, behavior-focused changes and run the narrowest available package build or lint check immediately afterward.