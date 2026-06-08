# URL Shortener

A full-stack URL shortener with user authentication, QR code generation, click analytics, and custom aliases.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Nginx
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Deployment:** Docker, Docker Compose

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/url-shortener.git
   cd url-shortener
   ```

2. Create the backend environment file
   ```bash
   cp backend/.env.example backend/.env
   ```

3. Edit `backend/.env` and set your own `JWT_SECRET`

4. Run the app
   ```bash
   docker compose up --build
   ```

5. Open your browser at `http://localhost`

### Stop the app
```bash
docker compose down
```

## Features

- Shorten any URL
- Custom aliases
- QR code generation
- Link expiry
- Click analytics (device, browser, IP)
- User authentication (register/login)
- Personal dashboard to manage URLs
