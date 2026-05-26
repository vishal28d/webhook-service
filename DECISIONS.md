# Technical Decisions

### Storage
**Decision:** MongoDB
**Alternatives considered:** SQLite (in-process), PostgreSQL, Redis.
**Reasoning:** The initial thought was SQLite for simplicity, but MongoDB provides superior flexibility for storing arbitrary JSON event payloads and unstructured delivery response bodies without strict schemas. It handles the document structure naturally. To maintain the single-command startup constraint, Docker Compose is used to orchestrate MongoDB alongside the Node application.

### Concurrency / Worker Model
**Decision:** In-process polling loop (`setInterval`)
**Alternatives considered:** BullMQ with Redis, RabbitMQ.
**Reasoning:** To avoid introducing a message broker like Redis as a requirement (keeping the infra footprint low per constraints), a simple in-process loop querying MongoDB for "due" deliveries works perfectly for a single-process deployment. It ensures events survive restarts because everything is persisted to MongoDB immediately, and the polling loop picks up pending items on startup.

### Crash Recovery & Delivery Guarantees
**Decision:** At-least-once delivery semantics.
**Reasoning:** All deliveries are persisted to MongoDB in a `pending` state *before* any HTTP dispatch is attempted. If the process crashes mid-delivery, the in-flight delivery remains `pending` in the database. On restart, the worker's polling loop picks it up again. This means a subscriber may receive the same webhook twice if the crash happens after the HTTP POST succeeds but before the status update is saved. Deduplication is the subscriber's responsibility — a common pattern in webhook systems (Stripe, GitHub). True exactly-once would require a transactional outbox or two-phase commit, which is out of scope for a 4-6 hour take-home.

### Retry Policy
**Decision:** Exponential backoff with jitter, distinguishing 4xx from 5xx.
**Alternatives considered:** Fixed intervals (e.g. retry every 5 mins).
**Reasoning:** Exponential backoff is the standard for webhooks to prevent overwhelming a struggling subscriber endpoint. Adding random jitter prevents the "thundering herd" problem if a service comes back online. The cap is set at 5 attempts to prevent endless retries. 4xx responses (client errors like 400, 404) are treated as permanent failures and are *not* retried — only 5xx (server errors) and network timeouts trigger the retry cycle.

### Payload Signing
**Decision:** HMAC SHA-256
**Alternatives considered:** Asymmetric cryptography (RSA/ECDSA), API keys.
**Reasoning:** HMAC is the industry standard for webhook signing (used by Stripe, GitHub). It is simple to compute symmetrically and robust against tampering when both sides share the secret.

### Dashboard Scope
**Decision:** React.js Single Page Application (SPA)
**Alternatives considered:** EJS/Pug templates, Vanilla JS/HTML.
**Reasoning:** While Vanilla JS is simpler to set up initially without a build step, a React SPA provides a much better developer experience for managing state (like polling/refreshing deliveries) and navigating between views (Subscriptions -> Events -> Details). Vite handles the fast bundling, and Express serves the built static files so it still runs as one unified web service in production.
