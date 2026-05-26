# AI Interactions Log

### 1. Generating Implementation Plan
**Prompt:** "Break down this whole assignment task into Task, subtask and microtasks, make some decisions which are required."
**Output:** An initial implementation plan using SQLite and Vanilla JS.
**Action taken:** Rejected by the user. Requested to use ReactJS for frontend and MongoDB for storage instead. I modified the plan accordingly to include Docker Compose for orchestration.

### 2. Boilerplate Scaffolding
**Prompt:** Implied by the accepted implementation plan to create the setup structure.
**Output:** Commands to run `create-vite` and `npm init` for the backend.
**Action taken:** Accepted. Used the standard toolchains without heavy modification to ensure standard directory layout.

### 3. Database Schema Design (Mongoose)
**Prompt:** "Create Mongoose schemas for the webhook system — Subscription, Event, and Delivery models."
**Output:** Mongoose schemas with basic fields and no indexes.
**Action taken:** Modified. Added compound indexes on `status` + `nextAttemptAt` for the Delivery schema to optimize the worker's polling query. The original output lacked indexes entirely, which would have caused full collection scans on every poll interval.

### 4. Exponential Backoff Logic
**Prompt:** "Implement retry with exponential backoff and jitter for the delivery worker."
**Output:** Worker logic generating backoff: `BASE_BACKOFF_MS * Math.pow(2, delivery.attempts - 1) + jitter`.
**Action taken:** Accepted the formula, but modified the retry decision logic. The original output retried on all HTTP errors indiscriminately. I changed it to distinguish 4xx (permanent, don't retry) from 5xx (transient, do retry) — retrying a 404 is pointless and wastes attempts.

### 5. Docker Orchestration
**Prompt:** "Create a Docker setup for single-command startup with MongoDB."
**Output:** `docker-compose.yml` and a multi-stage `Dockerfile`.
**Action taken:** Kept. The multi-stage build effectively compiles both the React frontend and the TypeScript backend and serves them from a single Node instance, minimizing footprint while satisfying the constraint.

### 6. Frontend Component Structure
**Prompt:** "Build a React dashboard with subscription management, event listing, and delivery detail views."
**Output:** A single 350+ line `App.tsx` with all components inlined.
**Action taken:** Rejected the monolith structure. Refactored into separate files under `src/components/` — `Subscriptions.tsx`, `Events.tsx`, and `EventDetails.tsx`. The original output crammed everything into one file which made navigation and future maintenance difficult. Also added error display for the subscription form so validation errors (like duplicates) surface in the UI.

### 7. Test Suite Setup
**Prompt:** "Add unit tests for the critical paths — HMAC signing, retry logic, and event matching."
**Output:** Suggested integration tests requiring a running MongoDB instance.
**Action taken:** Rejected. Wrote pure unit tests instead that extract the core logic (backoff calculation, retry decision, signature generation, event type matching) and test it without any database dependency. This makes the tests fast, deterministic, and runnable in CI without Docker. 18 tests covering signing correctness, backoff math, 4xx/5xx distinction, and wildcard pattern matching.
