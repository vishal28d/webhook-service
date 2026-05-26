# Webhook Delivery Service

A robust, single-process webhook delivery service built to accept incoming events and reliably distribute (fan-out) those events to subscriber-controlled URLs. It implements industry-standard webhook practices including HMAC payload signing, exponential backoff retries, and database persistence so no events are lost during process restarts.

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [How to Run](#how-to-run)
- [Running Tests](#running-tests)
- [Core Mechanics](#core-mechanics)
- [API Reference](#api-reference)
- [What Works & What's Incomplete](#what-works--whats-incomplete)
- [Trade-offs & Future Improvements](#trade-offs--future-improvements)

---

## Architecture & Tech Stack

This service is designed as a monolithic application that combines a REST API, an internal background worker, and a React dashboard frontend.

- **Backend:** Node.js, Express, TypeScript.
- **Database:** MongoDB (via Mongoose) – chosen for its flexibility in storing unstructured event payloads and delivery responses.
- **Frontend:** React.js, Vite, Tailwind CSS – served as a Single Page Application (SPA) directly from the Express backend in production.
- **Testing:** Jest + ts-jest — unit tests for critical paths (signing, retry logic, event matching).
- **Orchestration:** Docker Compose – provides a single-command startup for both the database and the application.

---

## How to Run

### Using Docker Compose (Recommended)
The easiest way to run the service is using Docker Compose. It will automatically build the frontend, build the backend, and spin up a MongoDB instance.

1. Ensure [Docker](https://docs.docker.com/get-docker/) is installed and running.
2. From the root of this project, execute:
   ```bash
   docker-compose up --build
   ```
3. Open your browser to the Dashboard: [http://localhost:3000](http://localhost:3000)

### Manual Local Setup (Without Docker)
If you prefer to run it without Docker, you will need Node.js (v18+) and a running MongoDB instance.

1. Ensure MongoDB is running locally on port `27017` (or set `MONGO_URI` environment variable).
2. Install dependencies and build the client:
   ```bash
   cd client
   npm install
   npm run build
   ```
3. Install dependencies, build, and run the server:
   ```bash
   cd ../server
   npm install
   npm run build
   node dist/index.js
   ```

---

## Running Tests

The server includes unit tests for the critical business logic paths:

```bash
cd server
npm test
```

Tests cover:
- **HMAC Signing** — determinism, uniqueness across secrets/payloads, subscriber verifiability.
- **Exponential Backoff** — delay doubling, jitter bounds, positive totals.
- **Retry Decision Logic** — 4xx permanent failure vs. 5xx retryable, max-attempt cap.
- **Event Type Matching** — exact matches, wildcard patterns, edge cases.

---

## Core Mechanics

### 1. Event Fan-out
When an event is POSTed to `/api/events`, the system queries all active subscriptions. It uses a simple pattern matcher (e.g. `user.*` matches `user.created` and `user.deleted`) to find all interested subscribers. For every match, a `Delivery` record is immediately persisted to the database in a `pending` state.

### 2. In-Process Worker
A background interval loop runs within the Node.js process, querying MongoDB for `pending` deliveries whose `nextAttemptAt` timestamp has passed. By storing everything in MongoDB before attempting dispatch, the system safely survives process restarts.

### 3. Exponential Backoff & Retries
If an endpoint fails (timeout or 5xx error), the delivery attempt count increments. The system calculates the next retry time using exponential backoff with jitter:
`Delay = BASE_DELAY * (2 ^ (attempt - 1)) + JITTER`
The maximum number of attempts is capped at 5. After 5 failures, the delivery is marked as `failed`. **4xx errors are treated as permanent failures** and are not retried — they indicate a problem with the request itself, not a transient server issue.

### 4. Payload Signing (HMAC SHA-256)
If a subscriber provides a "Secret" during registration, the service computes an HMAC SHA-256 signature of the JSON payload. This signature is sent to the subscriber in the `X-Webhook-Signature` header, allowing the receiver to cryptographically verify the payload originated from this service.

### 5. Input Validation
The API validates incoming requests:
- Subscriptions require a valid `url` and a non-empty `eventTypes` array. Duplicate subscriptions (same URL + same event types) return a `409 Conflict`.
- Events require a non-empty `type` string and a non-null `payload`.

---

## API Reference

### Create a Subscription
Registers a new endpoint to receive webhooks.

**Request:** `POST /api/subscriptions`
```json
{
  "url": "https://webhook.site/your-unique-id",
  "secret": "my-shared-secret",
  "eventTypes": ["user.*", "order.created"]
}
```

### Ingest an Event
Accepts a new event and triggers the fan-out delivery process.

**Request:** `POST /api/events`
```json
{
  "type": "user.created",
  "payload": {
    "userId": "123",
    "email": "test@example.com"
  }
}
```

### Manual Retry
Forces a failed delivery back into the `pending` queue for immediate retry. Resets the attempt counter so the delivery gets a full retry budget.

**Request:** `POST /api/deliveries/:id/retry`
*(No body required)*

---

## What Works & What's Incomplete

### ✅ Fully functional
- Subscription CRUD with duplicate detection
- Event ingestion with fan-out to matching subscribers
- Delivery worker with exponential backoff + jitter
- 4xx vs 5xx retry distinction
- HMAC SHA-256 payload signing
- Manual retry from dashboard (with attempt counter reset)
- State persistence across restarts (MongoDB)
- Unit tests for all critical logic paths
- Single-command Docker startup

### ⚠️ Known limitations / deferred
- **No authentication** on API endpoints or dashboard. In production, these would require API keys or OAuth.
- **No real-time UI updates** — dashboard fetches on mount only. SSE or WebSocket would improve this.
- **Sequential worker processing** — deliveries are processed one at a time. A slow subscriber blocks the queue. `Promise.allSettled` with a concurrency pool would help.
- **No pagination** — event listing limited to 100 most recent. Cursor-based pagination needed at scale.
- **At-least-once semantics** — a crash after HTTP POST but before DB status update can cause duplicate delivery. Dedup is the subscriber's responsibility.

---

## Trade-offs & Future Improvements

To keep the scope realistic for a take-home assignment, several compromises were made:

- **Security:** There is currently no authentication (e.g., API keys, OAuth) protecting the ingest API or the dashboard. In a production scenario, these endpoints would be strictly protected.
- **Concurrency Control:** The worker relies on a simple `setInterval` loop. If deployed across multiple server instances horizontally, workers would race to process the same deliveries. Moving to a dedicated queue (like Redis + BullMQ) or implementing MongoDB document locking (`findAndModify`) would be required for horizontal scaling.
- **Real-time UI Updates:** The React dashboard currently fetches data on mount. It does not auto-refresh. Implementing Server-Sent Events (SSE) or WebSockets would provide a real-time view of deliveries progressing through their retry cycles.
- **Pagination:** The `/api/events` endpoint is artificially limited to the 100 most recent events to prevent massive payload sizes. Proper cursor-based pagination should be implemented.
