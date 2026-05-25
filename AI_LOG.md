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
**Prompt:** Implied by the execution plan to write Mongoose schemas.
**Output:** Mongoose schemas for `Subscription`, `Event`, and `Delivery`.
**Action taken:** Accepted. Kept the schemas simple with indexes on `status` and `nextAttemptAt` to optimize the polling query for pending deliveries.

### 4. Exponential Backoff Logic
**Prompt:** Implied by the execution plan to implement retry with jitter.
**Output:** Worker logic generating backoff: `BASE_BACKOFF_MS * Math.pow(2, delivery.attempts - 1) + jitter`.
**Action taken:** Accepted. This standard backoff formula ensures the retries scale correctly over time.

### 5. Docker Orchestration
**Prompt:** Implied by the execution plan to allow a single command startup.
**Output:** `docker-compose.yml` and a multi-stage `Dockerfile`.
**Action taken:** Kept. The multi-stage build effectively compiles both the React frontend and the TypeScript backend and serves them from a single Node instance, minimizing footprint while satisfying the constraint.
