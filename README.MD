# Esofa Votes / University Voting System

Complete setup guide for running the system **offline (local / LAN)** and **online**.

This document is for anyone who clones the project from GitHub and needs to get it running.

---

## Table of Contents

1. [What This System Is](#1-what-this-system-is)
2. [Prerequisites](#2-prerequisites)
3. [Clone the Project](#3-clone-the-project)
4. [Database Setup (PostgreSQL)](#4-database-setup-postgresql)
5. [Backend Setup](#5-backend-setup)
6. [Frontend Setup](#6-frontend-setup)
7. [Run Offline (Local / LAN)](#7-run-offline-local--lan)
8. [Access From Other Computers on the Same Network](#8-access-from-other-computers-on-the-same-network)
9. [Run Online (Production / Hosted)](#9-run-online-production--hosted)
10. [Default Roles & First Login](#10-default-roles--first-login)
11. [Project Structure](#11-project-structure)
12. [Common Issues & Fixes](#12-common-issues--fixes)
13. [Security Notes](#13-security-notes)

---

## 1. What This System Is

A **multi-tenant university election system** with:

| Role           | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| **Owner**      | Registers faculties/organizations and controls access              |
| **SuperAdmin** | Manages one faculty election (candidates, config, results, admins) |
| **Admin**      | Registers voters and generates voting tokens                       |
| **Voter**      | Uses a short token to cast a ballot                                |

**Tech stack**

- Backend: Node.js + Express
- Frontend: React (Vite) + Tailwind CSS
- Database: PostgreSQL
- Auth: JWT

---

## 2. Prerequisites

Install these before starting:

| Tool       | Version (recommended) | Check command    |
| ---------- | --------------------- | ---------------- |
| Node.js    | 18+ or 20+            | `node -v`        |
| npm        | 9+                    | `npm -v`         |
| PostgreSQL | 14+                   | `psql --version` |
| Git        | any recent            | `git --version`  |

Optional but useful:

- pgAdmin (GUI for PostgreSQL)
- Postman (API testing)

---

## 3. Clone the Project

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd University-voting-system
```

Typical folder layout after clone:

```text
University-voting-system/
├── backend/
├── frontend/
└── README.md
```

---

## 4. Database Setup (PostgreSQL)

### 4.1 Create database

Using `psql`:

```bash
psql -U postgres
```

```sql
CREATE DATABASE univote;
\q
```

Or create it from pgAdmin.

### 4.2 Run the schema

Use the multi-tenant schema script provided in the repo (or the one used during development).

Example:

```bash
psql -U postgres -d univote -f multi_tenant_schema.sql
```

Or open the SQL file in pgAdmin and execute it.

This creates tables such as:

- `owners`
- `organizations`
- `admins`
- `voters`
- `candidates`
- `tokens`
- `votes`
- `election_settings`
- `audit_logs`

### 4.3 Create the first Owner

You need at least one Owner to log in and register organizations.

```sql
INSERT INTO owners (username, password_hash)
VALUES (
  'owner',
  '$2a$10$REPLACE_WITH_BCRYPT_HASH'
);
```

Easiest way to generate a bcrypt hash:

```bash
cd backend
node -e "console.log(require('bcryptjs').hashSync('yourpassword', 10))"
```

Then paste the hash into the SQL above.

---

## 5. Backend Setup

```bash
cd backend
npm install
```

### 5.1 Create `.env`

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/univote
JWT_SECRET=change-this-to-a-long-random-secret
NODE_ENV=development
```

Notes:

- Replace `YOUR_PASSWORD` with your PostgreSQL password
- Change `JWT_SECRET` to something unique and long

### 5.2 Ensure uploads folder exists

```bash
mkdir -p uploads
```

### 5.3 Start backend

```bash
npm run dev
```

or

```bash
node src/server.js
```

You should see something like:

```text
Voting Server running on http://0.0.0.0:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

## 6. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
```

### 6.1 API base URL

Create or update:

```text
frontend/src/config/api.js
```

**For local development on the same machine:**

```js
const API_URL = "http://localhost:3000";
export default API_URL;
```

**For other devices on the same Wi‑Fi/LAN:**

```js
const API_URL = "http://YOUR_SERVER_IP:3000";
export default API_URL;
```

Example:

```js
const API_URL = "http://192.168.1.25:3000";
```

### 6.2 Favicon / tab logo (optional)

Put logo in:

```text
frontend/public/EsofaVotesLogo.png
```

In `frontend/index.html`:

```html
<link rel="icon" type="image/png" href="/EsofaVotesLogo.png" />
<title>Esofa Votes</title>
```

### 6.3 Start frontend

```bash
npm run dev
```

Default Vite URL:

```text
http://localhost:5173
```

---

## 7. Run Offline (Local / LAN)

### Same computer only

1. Start PostgreSQL
2. Start backend (`backend` → `npm run dev`)
3. Start frontend (`frontend` → `npm run dev`)
4. Open:

```text
http://localhost:5173
```

### Admin / Owner logins

| Role               | Login page     | Credentials         |
| ------------------ | -------------- | ------------------- |
| Owner              | `/owner/login` | username + password |
| SuperAdmin / Admin | `/admin/login` | email + password    |
| Voter              | `/`            | 6-character token   |

---

## 8. Access From Other Computers on the Same Network

This is the intended **offline election room** mode (no internet required if devices are on the same LAN).

### 8.1 Find the server IP

On the machine running the backend:

**Windows**

```bash
ipconfig
```

Look for IPv4, e.g. `192.168.1.25`

**Mac / Linux**

```bash
ifconfig
```

or

```bash
ip addr
```

### 8.2 Backend must listen on all interfaces

In `server.js` it should already be:

```js
app.listen(PORT, "0.0.0.0", () => { ... })
```

Not only `localhost`.

### 8.3 Update frontend API URL

```js
const API_URL = "http://192.168.1.25:3000";
```

Restart frontend after changing this.

### 8.4 Allow firewall access

On Windows, allow Node.js / port `3000` through the firewall.

### 8.5 Open from other devices

On phones/laptops connected to the same Wi‑Fi:

```text
http://192.168.1.25:5173
```

Or, if you serve the built frontend from Express:

```text
http://192.168.1.25:3000
```

### 8.6 Production-like local serve (optional)

Build frontend:

```bash
cd frontend
npm run build
```

If backend already serves `frontend/dist`, voters only need:

```text
http://SERVER_IP:3000
```

---

## 9. Run Online (Production / Hosted)

When you have a domain and host:

### Recommended approach

1. Host backend + PostgreSQL on a VPS (or managed platform)
2. Host frontend as static files (or let Express serve `dist`)
3. Use HTTPS
4. Set strong `JWT_SECRET`
5. Restrict CORS to your domain

### Example production `.env`

```env
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/univote
JWT_SECRET=very-long-random-secret
NODE_ENV=production
```

### Frontend API URL

```js
const API_URL = "https://api.yourdomain.com";
```

or same origin if Express serves the React build:

```js
const API_URL = "";
```

### Build for production

```bash
cd frontend
npm run build
```

Serve `frontend/dist` via Express or Nginx.

---

## 10. Default Roles & First Login

### First-time flow

1. Insert Owner in DB (see section 4.3)
2. Login as Owner → register an Organization (faculty election)
3. Give the organization email + password to the faculty SuperAdmin
4. SuperAdmin logs in → configures election, adds admins, candidates
5. Admin registers voters and generates tokens
6. Voters enter token and vote when election is **ACTIVE**

### Important rules

- SuperAdmin login uses **email + password** (from organization)
- Admin login uses **email + password**
- Owner login uses **username + password**
- Organization must be `status = 'active'` or login is blocked
- Election must be toggled **ON** before voting works

---

## 11. Project Structure

```text
backend/
  src/
    controllers/
    routes/
    middleware/
    helpers/
    utils/
    config/
  uploads/
  .env
  package.json

frontend/
  public/
  src/
    pages/
    components/
    context/
    config/
  index.html
  package.json
```

---

## 12. Common Issues & Fixes

### `npm install` fails / no package.json

Make sure you are inside `backend` or `frontend`, not the root folder only.

### Database connection error

- Check PostgreSQL is running
- Check `DATABASE_URL` password/port/db name
- Confirm database exists

### CORS / network error on other laptops

- Backend must use `0.0.0.0`
- Frontend `API_URL` must use the server LAN IP, not `localhost`
- Firewall must allow port 3000

### Favicon not updating

- Path must be `/logo.png` (file in `frontend/public`)
- Hard refresh: Ctrl + F5
- Or test in Incognito

### Bulk CSV upload: "Only image files are allowed"

Use a separate multer config for CSV (`uploadCsv.single("file")`), not the image uploader.

### Invalid token / expired token

- Tokens expire (short lifetime, e.g. 15 minutes)
- Generate a new token for the voter

### Organization login blocked

Owner must set organization status to **active**.

---

## 13. Security Notes

For real elections:

- Change default passwords immediately
- Use a strong `JWT_SECRET`
- Prefer HTTPS when online
- Keep Owner account private
- Do not expose PostgreSQL to the public internet
- Take DB backups before election day
- Test the full flow on LAN before the real election

---

## Quick Start Checklist

```text
[ ] Install Node.js, PostgreSQL, Git
[ ] Clone repo
[ ] Create database + run schema
[ ] Insert first Owner
[ ] Configure backend/.env
[ ] npm install in backend + start server
[ ] Configure frontend API_URL
[ ] npm install in frontend + start Vite
[ ] Login as Owner
[ ] Register organization
[ ] Login as SuperAdmin
[ ] Add candidates, register voters, generate tokens
[ ] Open election
[ ] Vote using token
```

---

## Support

If something fails:

1. Check backend terminal logs
2. Check browser Network tab
3. Confirm `.env` and `API_URL`
4. Confirm database tables exist

---

**Esofa Votes** — offline-ready multi-faculty election system.
