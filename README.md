# ⚡ Short.ly — URL Shortener

A full-stack URL shortening application with user authentication, click analytics, QR code generation, link expiry, and a complete observability stack (Prometheus + Grafana + Loki + Promtail). Everything runs in Docker via a single `docker-compose up` command.

---

## 📑 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Frontend Pages](#frontend-pages)
- [Monitoring & Observability](#monitoring--observability)
- [Docker Services](#docker-services)
- [Data Models](#data-models)
- [How It Works](#how-it-works)

---

## ✨ Features

- **Shorten any URL** — generates a random 6-character short code instantly
- **Custom aliases** — choose your own short code (e.g. `/my-link`)
- **Link expiry** — set links to expire after 1 day, 7 days, or never
- **QR code generation** — every short URL gets a scannable QR code
- **Click analytics** — tracks total clicks, device type, browser, IP, and timestamp per click
- **User accounts** — register/login to manage your own links
- **Dashboard** — view, copy, and delete all your short URLs in one place
- **Anonymous shortening** — works without an account too
- **Prometheus metrics** — exposes custom counters and histograms at `/metrics`
- **Structured logging** — JSON logs via Winston, shipped to Loki via Promtail
- **Grafana dashboards** — pre-provisioned dashboard with live data

---

## 🛠 Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Backend     | Node.js, Express.js                 |
| Database    | MongoDB (via Mongoose)              |
| Auth        | JWT (jsonwebtoken), bcryptjs        |
| Short Codes | nanoid                              |
| QR Codes    | qrcode                              |
| UA Parsing  | ua-parser-js                        |
| Metrics     | prom-client (Prometheus)            |
| Logging     | Winston (structured JSON)           |
| Frontend    | Vanilla HTML, CSS, JavaScript       |
| Web Server  | Nginx (reverse proxy + static serve)|
| Monitoring  | Prometheus, Grafana, Loki, Promtail |
| Container   | Docker, Docker Compose              |

---

## 📁 Project Structure

```
URL SHORTEN/
├── docker-compose.yml          # Orchestrates all services
├── backend/
│   ├── server.js               # Express app entry point
│   ├── logger.js               # Winston JSON logger
│   ├── metrics.js              # Prometheus custom metrics
│   ├── Dockerfile              # Backend container build
│   ├── .env                    # Local environment variables (not committed)
│   ├── .env.example            # Template for environment variables
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   ├── models/
│   │   ├── User.js             # User schema (name, email, hashed password)
│   │   └── Url.js              # URL schema (shortCode, clicks, clickData, expiry)
│   └── routes/
│       ├── auth.js             # POST /api/auth/register, /api/auth/login
│       ├── url.js              # POST /api/url/shorten, GET /api/url/my-urls, analytics, delete
│       └── redirect.js         # GET /:code — performs the actual redirect
├── frontend/
│   ├── index.html              # Home page — URL shortener form
│   ├── login.html              # Login page
│   ├── register.html           # Register page
│   ├── dashboard.html          # User dashboard — manage links
│   ├── app.js                  # Shorten URL logic, auth state, clipboard
│   ├── auth.js                 # Login and register form handlers
│   ├── dashboard.js            # Dashboard: load URLs, delete, show QR
│   ├── style.css               # Global stylesheet
│   ├── nginx.conf              # Nginx config — proxies /api to backend
│   └── Dockerfile              # Nginx container build
└── monitoring/
    ├── prometheus.yml          # Prometheus scrape config
    ├── loki-config.yml         # Loki log storage config
    ├── promtail-config.yml     # Promtail Docker log scraper config
    └── grafana/
        └── provisioning/
            ├── dashboards/
            │   ├── dashboards.yml      # Auto-provision dashboard config
            │   └── urlshortener.json   # Pre-built Grafana dashboard
            └── datasources/
                └── datasources.yml     # Auto-provision Prometheus + Loki sources
```

---

## 🚀 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed
- Port `80`, `3000`, `9090`, `3100` available on your machine

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd "URL SHORTEN"
```

### 2. Configure environment (optional)

The backend uses environment variables defined directly in `docker-compose.yml`. For local development outside Docker, create a `.env` file in the `backend/` folder:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values (see [Environment Variables](#environment-variables)).

### 3. Start everything

```bash
docker-compose up --build
```

This builds and starts all 8 services. On first run, Docker pulls images and installs dependencies — this takes a minute or two.

### 4. Open the app

| Service         | URL                          |
|-----------------|------------------------------|
| App (Frontend)  | http://localhost             |
| Grafana         | http://localhost:3000        |
| Prometheus      | http://localhost:9090        |
| Loki            | http://localhost:3100        |

**Grafana default credentials:** `admin` / `admin123`

### 5. Stop everything

```bash
docker-compose down
```

To also remove all stored data (MongoDB, Prometheus, Grafana, Loki volumes):

```bash
docker-compose down -v
```

---

## 🔧 Environment Variables

These are set in `docker-compose.yml` for the backend service. Override them as needed:

| Variable    | Default                                    | Description                                    |
|-------------|--------------------------------------------|------------------------------------------------|
| `PORT`      | `5000`                                     | Port the Express server listens on             |
| `MONGO_URI` | `mongodb://mongo:27017/urlshortener`       | MongoDB connection string                      |
| `JWT_SECRET`| `your_super_secret_jwt_key_change_this...` | Secret key for signing JWT tokens — **change in production** |
| `BASE_URL`  | `http://localhost`                         | Base URL prepended to generated short links    |

---

## 📡 API Reference

All API routes are prefixed with `/api`. The Nginx reverse proxy forwards `/api/*` requests from the frontend to the backend.

---

### Auth Routes — `/api/auth`

#### `POST /api/auth/register`

Register a new user account.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Response `201`:**
```json
{
  "token": "<jwt_token>",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

---

#### `POST /api/auth/login`

Login with existing credentials.

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "token": "<jwt_token>",
  "user": { "id": "...", "name": "John Doe", "email": "john@example.com" }
}
```

---

### URL Routes — `/api/url`

#### `POST /api/url/shorten`

Shorten a URL. Works anonymously or authenticated (pass `Authorization: Bearer <token>` to associate the link with your account).

**Request body:**
```json
{
  "originalUrl": "https://www.example.com/very/long/url",
  "alias": "my-link",   // optional — custom short code
  "expiresIn": "7d"     // optional — "1d", "7d", or omit for no expiry
}
```

**Response `201`:**
```json
{
  "shortUrl": "http://localhost/my-link",
  "shortCode": "my-link",
  "qrCode": "data:image/png;base64,...",
  "expiresAt": "2026-06-18T10:00:00.000Z"
}
```

---

#### `GET /api/url/my-urls`

Get all short URLs created by the authenticated user. **Requires JWT.**

**Headers:** `Authorization: Bearer <token>`

**Response `200`:** Array of URL objects with `shortCode`, `originalUrl`, `clicks`, `clickData`, `expiresAt`, `createdAt`.

---

#### `GET /api/url/analytics/:code`

Get click analytics for any short URL by its code. Public — no auth required.

**Response `200`:**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com",
  "clicks": 42,
  "clickData": [
    { "timestamp": "...", "ip": "...", "device": "desktop", "browser": "Chrome" }
  ],
  "createdAt": "...",
  "expiresAt": null
}
```

---

#### `DELETE /api/url/:code`

Delete a short URL. **Requires JWT.** Only the owner can delete their link.

**Headers:** `Authorization: Bearer <token>`

**Response `200`:** `{ "message": "URL deleted" }`

---

### Redirect Route

#### `GET /:code`

The core redirect. When a short code is accessed, the server:

1. Looks up the `shortCode` in MongoDB
2. Returns `404` if not found
3. Returns `410 Gone` if the link has expired
4. Parses the `User-Agent` header for device and browser info
5. Increments the click counter and appends click metadata
6. Increments the Prometheus `redirectsTotal` counter
7. Responds with an HTTP `302` redirect to the original URL

---

### Metrics Endpoint

#### `GET /metrics`

Exposes Prometheus metrics in text format. Scraped automatically by the Prometheus container every 15 seconds.

**Custom metrics exposed:**

| Metric Name                                         | Type      | Description                                   |
|-----------------------------------------------------|-----------|-----------------------------------------------|
| `urlshortener_urls_shortened_total`                 | Counter   | Total URLs shortened since startup            |
| `urlshortener_redirects_total{shortCode}`           | Counter   | Total successful redirects per short code     |
| `urlshortener_redirect_failures_total{reason}`      | Counter   | Failed redirects labelled `not_found`/`expired` |
| `urlshortener_http_request_duration_seconds`        | Histogram | HTTP request duration bucketed by method/route/status |
| `urlshortener_auth_events_total{type}`              | Counter   | Auth events labelled `register` or `login`    |
| `urlshortener_*` (default)                          | Various   | Node.js runtime metrics (memory, CPU, GC, etc.) |

---

## 🖥 Frontend Pages

| Page              | File              | Description                                             |
|-------------------|-------------------|---------------------------------------------------------|
| Home              | `index.html`      | URL shortening form with custom alias, expiry, QR result|
| Login             | `login.html`      | Email + password login form                             |
| Register          | `register.html`   | Name + email + password registration form               |
| Dashboard         | `dashboard.html`  | Table of all your short URLs with clicks, expiry, delete|

The frontend is plain HTML/CSS/JS served by Nginx. No framework or build step required.

**How the frontend connects to the backend:**
Nginx proxies all requests to `/api/*` to the backend container (`urlshortener-backend:5000`) using Docker's internal DNS. Frontend JavaScript always uses `/api` as the base path — no hardcoded ports needed.

---

## 📊 Monitoring & Observability

The project includes a complete observability stack, pre-configured and auto-provisioned.

### Prometheus

Scrapes the `/metrics` endpoint on the backend container every 15 seconds. Access the Prometheus UI at **http://localhost:9090**.

Config file: `monitoring/prometheus.yml`

### Grafana

Pre-provisioned with:
- **Datasources:** Prometheus and Loki (configured automatically from `datasources.yml`)
- **Dashboard:** A URL Shortener dashboard (`urlshortener.json`) that loads automatically on startup

Access Grafana at **http://localhost:3000** → Login: `admin` / `admin123`

### Loki

A log aggregation system that stores and indexes structured log entries shipped by Promtail. Access via Grafana's Explore panel (select the Loki datasource).

Config file: `monitoring/loki-config.yml`

### Promtail

Reads Docker container logs from the Docker socket and ships them to Loki. Only containers with the Docker label `logging=promtail` are scraped (the backend container has this label set in `docker-compose.yml`).

Config file: `monitoring/promtail-config.yml`

### Structured Logging

The backend uses Winston to emit structured JSON logs to stdout. Every log entry follows this shape:

```json
{
  "timestamp": "2026-06-11T10:00:00.000Z",
  "level": "info",
  "event": "url_shortened",
  "shortCode": "abc123",
  "originalUrl": "https://example.com",
  "userId": "664abc...",
  "expiresAt": "never"
}
```

**Useful Grafana/Loki queries:**

```logql
{job="urlshortener-backend"} | json | event="redirect_success"
{job="urlshortener-backend"} | json | level="error"
{job="urlshortener-backend"} | json | event="url_shortened"
{job="urlshortener-backend"} | json | event="user_registered"
```

---

## 🐳 Docker Services

All services share a single `app-network` bridge network and communicate using their Docker service names as hostnames.

| Service       | Container Name              | Image                     | Exposed Port | Description                             |
|---------------|-----------------------------|---------------------------|:------------:|-----------------------------------------|
| `mongo`       | urlshortener-mongo          | mongo:7                   | —            | MongoDB database (internal only)        |
| `backend`     | urlshortener-backend        | (built from `./backend`)  | —            | Express API (internal only)             |
| `frontend`    | urlshortener-frontend       | (built from `./frontend`) | **80**       | Nginx — serves UI + proxies API         |
| `prometheus`  | urlshortener-prometheus     | prom/prometheus:latest    | **9090**     | Metrics scraper and storage             |
| `grafana`     | urlshortener-grafana        | grafana/grafana:latest    | **3000**     | Metrics and log dashboards              |
| `loki`        | urlshortener-loki           | grafana/loki:latest       | **3100**     | Log aggregation backend                 |
| `promtail`    | urlshortener-promtail       | grafana/promtail:latest   | —            | Reads Docker logs → ships to Loki       |

**Persistent volumes:**

| Volume           | Used By    | Contains                        |
|------------------|------------|---------------------------------|
| `mongo-data`     | mongo      | MongoDB data files              |
| `prometheus-data`| prometheus | Time-series metrics storage     |
| `grafana-data`   | grafana    | Dashboards, users, settings     |
| `loki-data`      | loki       | Log chunks and index            |

---

## 🗄 Data Models

### User

```
User {
  name:      String   (required)
  email:     String   (required, unique)
  password:  String   (bcrypt hashed, salt rounds: 10)
  createdAt: Date     (default: now)
}
```

Passwords are hashed automatically via a Mongoose `pre('save')` hook. The model exposes a `comparePassword(plain)` method for login verification.

### Url

```
Url {
  originalUrl: String   (required)
  shortCode:   String   (required, unique — 6 chars or custom alias)
  alias:       String   (null if auto-generated)
  userId:      ObjectId (ref: User — null for anonymous links)
  clicks:      Number   (default: 0)
  clickData:   [ ClickEntry ]
  expiresAt:   Date     (null = never expires)
  createdAt:   Date     (default: now)
}

ClickEntry {
  timestamp: Date
  ip:        String
  device:    String   ("desktop", "mobile", "tablet", etc.)
  browser:   String   ("Chrome", "Firefox", "Safari", etc.)
}
```

---

## 🔄 How It Works

1. **User visits** `http://localhost` → Nginx serves `index.html`
2. **User pastes a URL** and clicks Shorten → `app.js` calls `POST /api/url/shorten`
3. **Nginx proxies** `/api/*` to the backend container on port `5000`
4. **Backend generates** a 6-char nanoid short code (or uses the custom alias), saves to MongoDB, returns the short URL + QR code
5. **User visits** `http://localhost/abc123` → Nginx serves `index.html` (SPA fallback), but the backend's `GET /:code` route intercepts it via the redirect route
6. **Backend looks up** `abc123`, checks expiry, records click metadata, and returns HTTP `302` to the original URL
7. **Promtail** continuously reads the backend container's stdout logs and ships them to Loki
8. **Prometheus** scrapes `http://backend:5000/metrics` every 15 seconds
9. **Grafana** visualises both metrics (from Prometheus) and logs (from Loki) in the pre-built dashboard

---

## 🔐 Security Notes

- **JWT_SECRET** in `docker-compose.yml` is a placeholder. Replace it with a strong random string before any deployment.
- The backend's port `5000` is **not** exposed to the host — all traffic goes through Nginx on port `80`.
- MongoDB is on the internal Docker network only — not accessible from outside.
- Passwords are stored as bcrypt hashes (10 salt rounds). Plain-text passwords are never persisted.

---

## 📝 License

MIT
