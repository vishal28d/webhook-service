# Webhook Delivery Service

A robust, single-process webhook delivery service built to accept incoming events and reliably distribute (fan-out) those events to subscriber-controlled URLs. It implements industry-standard webhook practices including HMAC payload signing, exponential backoff retries, and database persistence so no events are lost during process restarts.

## Table of Contents
- [Architecture & Tech Stack](#architecture--tech-stack)
- [How to Run](#how-to-run)
- [Core Mechanics](#core-mechanics)
- [API Reference](#api-reference)
- [Trade-offs & Future Improvements](#trade-offs--future-improvements)

---

## Architecture & Tech Stack

This service is designed as a monolithic application that combines a REST API, an internal background worker, and a React dashboard frontend.

- **Backend:** Node.js, Express, TypeScript.
- **Database:** MongoDB (via Mongoose) – chosen for its flexibility in storing unstructured event payloads and delivery responses.
- **Frontend:** React.js, Vite, Tailwind CSS – served as a Single Page Application (SPA) directly from the Express backend in production.
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

## Core Mechanics

### 1. Event Fan-out
When an event is POSTed to `/api/events`, the system queries all active subscriptions. It uses a simple pattern matcher (e.g. `user.*` matches `user.created` and `user.deleted`) to find all interested subscribers. For every match, a `Delivery` record is immediately persisted to the database in a `pending` state.

### 2. In-Process Worker
A background interval loop runs within the Node.js process, querying MongoDB for `pending` deliveries whose `nextAttemptAt` timestamp has passed. By storing everything in MongoDB before attempting dispatch, the system safely survives process restarts.

### 3. Exponential Backoff & Retries
If an endpoint fails (timeout, 5xx, or 4xx error), the delivery attempt count increments. The system calculates the next retry time using exponential backoff with jitter:
`Delay = BASE_DELAY * (2 ^ (attempt - 1)) + JITTER`
The maximum number of attempts is capped at 5. After 5 failures, the delivery is marked as `failed`.

### 4. Payload Signing (HMAC SHA-256)
If a subscriber provides a "Secret" during registration, the service computes an HMAC SHA-256 signature of the JSON payload. This signature is sent to the subscriber in the `X-Webhook-Signature` header, allowing the receiver to cryptographically verify the payload originated from this service.

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
Forces a failed delivery back into the `pending` queue for immediate retry.

**Request:** `POST /api/deliveries/:id/retry`
*(No body required)*

---

## Trade-offs & Future Improvements

To keep the scope realistic for a take-home assignment, several compromises were made:

- **Security:** There is currently no authentication (e.g., API keys, OAuth) protecting the ingest API or the dashboard. In a production scenario, these endpoints would be strictly protected.
- **Concurrency Control:** The worker relies on a simple `setInterval` loop. If deployed across multiple server instances horizontally, workers would race to process the same deliveries. Moving to a dedicated queue (like Redis + BullMQ) or implementing MongoDB document locking (`findAndModify`) would be required for horizontal scaling.
- **Real-time UI Updates:** The React dashboard currently fetches data on mount. It does not auto-refresh. Implementing Server-Sent Events (SSE) or WebSockets would provide a real-time view of deliveries progressing through their retry cycles.
- **Pagination:** The `/api/events` endpoint is artificially limited to the 100 most recent events to prevent massive payload sizes. Proper cursor-based pagination should be implemented.
