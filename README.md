# Overseer

**Overseer** is a lightweight uptime and latency monitoring application.  
It periodically checks your services, records response times, detects downtime, and presents the data in a clean, responsive dashboard.

Built to monitor personal projects without relying on paid monitoring tools.

---

## What It Does

- Periodically pings configured URLs
- Tracks uptime and downtime
- Records response latency over time
- Groups failures into downtime incidents
- Displays live status and historical charts
- Supports pausing and resuming monitors
- Secured with JWT-based authentication

---

## Tech Stack

### Frontend
- **React (Vite)** — fast dev/build, simple SPA
- **Tailwind CSS** — clean, responsive UI
- **Recharts** — latency and uptime visualization
- **Axios** — API communication

### Backend
- **FastAPI** — async-friendly, high-performance API
- **SQLAlchemy** — structured ORM for PostgreSQL
- **APScheduler** — in-process background pings
- **Pydantic** — request/response validation

### Infrastructure
- **PostgreSQL (Supabase)** — persistent monitoring data
- **Deployment-ready** for Render / AWS / Vercel

---


## Local Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/overseer.git
cd overseer
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

Activate virtual environment:

**Windows**

```bash
source venv/Scripts/activate
```

**Mac / Linux**

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` inside `backend/` like `.env.example`:

```env
DATABASE_URL=postgresql://user:password@your-supabase-host:5432/postgres
SECRET_KEY = "any-secret-key"
ALGORITHM = "hashing-algo you want to use"
FRONTEND_URL=yourfrontendurl
```

Run backend:

```bash
uvicorn main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

API docs - Swagger UI:

```
http://127.0.0.1:8000/docs
```

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` inside `frontend/` like `.env.example`:

```env
VITE_API_URL=yourBACKEND_URL
```

Run frontend:

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

