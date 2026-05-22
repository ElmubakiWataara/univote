Here is the complete, ready-to-use **Markdown documentation** for your final voting system architecture and development reference.

You can copy the entire content below and save it as **`voting-system-architecture.md`** in the root of your project.

````markdown
# University Online Voting System - Final Architecture & Development Reference

**Project Name:** University Voting System (Local LAN Deployment)  
**Deployment Type:** Locally hosted on a dedicated server machine, accessed via LAN (no internet required)  
**Tech Stack:** Node.js + Express (Backend), React (Frontend), PostgreSQL (Database)  
**Date:** March 2026

## 1. System Overview

This is a secure, supervised online voting system for university elections.  
The entire system runs on a **single local server** on the university LAN.

### Core Flow (Admin-Mediated Token)

- Students approach an **admin desk** and provide their **Student ID**.
- Admin logs into the Admin Dashboard and generates a **one-time token** for that Student ID.
- Admin writes the token on paper and hands it to the student.
- Student goes to a **voting station** (any computer on the LAN), opens the voting website, enters the token.
- System validates the token, issues a short-lived JWT, and allows the student to cast **one vote**.
- After voting, the token is marked as used and the voter is flagged as `has_voted = true`.
- Only admins can generate tokens. Super Admin has additional controls.

**Key Features:**

- Strict one-person-one-vote enforcement
- Full audit trail (who generated token, who voted, when)
- Election can be turned ON/OFF only by Super Admin
- All operations happen locally on the LAN

## 2. Architecture Diagram

```mermaid
graph TD
    A[Admin Devices (LAN)]
    --> B[Local University Network (Wi-Fi / Ethernet)]
    B --> C[Voting Server Machine<br/>(Node.js + Express Monolith)]
    C --> D[PostgreSQL Database (Local)]
    E[Student Voting Devices (LAN)] --> B
    style C fill:#e1f5fe
```
````

**Components:**

- **Voting Server Machine**: Runs Node.js backend, serves built React frontend, and hosts PostgreSQL.
- **Admin Stations**: Computers used by election officials to generate tokens.
- **Voting Stations**: Computers where students enter tokens and cast votes.
- **Local Network**: All communication happens over LAN (HTTP/HTTPS on local IP).

## 3. Deployment Instructions (Local LAN)

1. Install Node.js, PostgreSQL, and Git on the server machine.
2. Clone the project and run `npm install` in both backend and frontend folders.
3. Build React frontend: `cd frontend && npm run build`
4. Configure Express to serve static files from `frontend/build`.
5. Bind server to all interfaces:
   ```js
   app.listen(PORT, "0.0.0.0", () => {
     console.log(`Server running on http://0.0.0.0:${PORT}`);
     console.log(`Access from LAN: http://YOUR_SERVER_LOCAL_IP:${PORT}`);
   });
   ```
6. Find server IP using `ipconfig` (Windows) or `ip addr show` (Linux/macOS).
7. Students and admins access the system via `http://192.168.x.x:3000`
8. Recommended: Use PM2 to keep the server running: `pm2 start server.js --name voting-server`

**Security Note:** Use a dedicated election Wi-Fi network with a strong password. Consider self-signed HTTPS for better security.

## 4. Database Schema (PostgreSQL)

```sql
-- Admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'superadmin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voters
CREATE TABLE voters (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    department VARCHAR(50),
    has_voted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tokens (Admin-generated)
CREATE TABLE tokens (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE CASCADE,
    token_value VARCHAR(64) UNIQUE NOT NULL,
    generated_by INTEGER REFERENCES admins(id) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Candidates
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    bio TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes (Immutable)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voter_id INTEGER REFERENCES voters(id) ON DELETE SET NULL,
    candidate_id INTEGER REFERENCES candidates(id),
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    UNIQUE (voter_id)
);

-- Election Settings (Single row)
CREATE TABLE election_settings (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT FALSE,
    allow_live_results BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES admins(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    actor_id INTEGER,
    actor_role VARCHAR(20),
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Important Constraints:**

- `votes.voter_id` has `UNIQUE` constraint → enforces one vote per voter.
- All critical operations must use database transactions.

## 5. Key API Endpoints

### Admin Authentication & Token Generation

- `POST /api/auth/admin-login`  
  Body: `{ "username": "...", "password": "..." }`  
  Returns: Admin JWT

- `POST /api/admin/generate-token`  
  Headers: `Authorization: Bearer <admin-jwt>`  
  Body: `{ "student_id": "U2023001" }`  
  Returns: `{ "token": "a1b2c3...", "expires_in": 900, "voter_name": "..." }`

### Student Voting

- `POST /api/auth/verify-token`  
  Body: `{ "token": "a1b2c3..." }`  
  Returns: Voter JWT + voter info

- `POST /api/vote`  
  Headers: `Authorization: Bearer <voter-jwt>`  
  Body: `{ "candidate_id": 5 }`  
  Returns: Success message

### Other Endpoints

- `GET /api/candidates` → Protected by voter JWT
- `GET /api/results` → Controlled by election settings
- `POST /api/super/toggle-election` → Super Admin only

## 6. Voting Process (Step-by-Step)

1. Student tells admin their **Student ID**.
2. Admin logs in → goes to "Generate Token" → enters Student ID → clicks Generate.
3. Admin receives token on screen, writes it down, and hands it to student.
4. Student goes to voting station → opens site → enters token.
5. System validates token → issues short-lived JWT.
6. Student selects candidate and submits vote.
7. Backend processes vote in a **transaction**:
   - Check election active
   - Check voter not voted
   - Insert vote
   - Set `has_voted = true`
   - Mark token `used = true`
   - Log action
8. Student sees confirmation.

## 7. Security Measures

- Token generation restricted to authenticated admins only.
- Cryptographically secure token (`crypto.randomBytes(32).toString('hex')`).
- JWT for session management (short expiry for voters).
- Database transactions for vote + has_voted update.
- UNIQUE constraint on votes.voter_id.
- Full audit logging (including which admin generated each token).
- Physical supervision of admin desk and voting stations.

## 8. Development Recommendations

**Project Structure (Recommended):**

```
voting-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── prisma/          (if using Prisma)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.js
│   └── package.json
├── docker-compose.yml   (optional)
└── voting-system-architecture.md   ← This file
```

**Token Generation Tip (Backend):**

```js
const crypto = require("crypto");
const tokenValue = crypto.randomBytes(32).toString("hex");
```

**Transaction Example (PostgreSQL + Prisma or pg):**
Use `BEGIN; ... COMMIT;` or Prisma `$transaction()` for vote submission.

**Development Tips:**

- Use environment variables for JWT secret, database URL, and port.
- Implement rate limiting on token generation and vote endpoints.
- Add input validation (express-validator or Zod).
- For voting stations, consider kiosk-mode browsers (full screen, limited navigation).
- Test the full flow: admin token generation → student token entry → voting.

## 9. Super Admin Special Functions

- Toggle election ON/OFF
- Manage other admin accounts
- View complete audit logs
- Emergency reset (if needed, with heavy logging)

---

**This document contains the complete final architecture** based on the agreed requirements:

- Locally hosted on LAN
- Token generated **only by admins**
- Token written down and handed to students
- Students input token on voting screen to vote
- Monolith architecture with Node.js, Express, React, and PostgreSQL

Save this file in your project root for ongoing reference during development.

You can now start implementation using this as the single source of truth.

```

---

**Next Steps Suggestion:**
1. Create the project folders as shown above.
2. Set up PostgreSQL and run the schema.
3. Implement the backend routes starting with admin login and token generation.
4. Build the React pages for Admin Dashboard and Student Voting Screen.

Would you like me to generate:
- The complete backend route code for token generation + voting (with transaction)?
- Sample React components?
- A `docker-compose.yml` for easy local setup?

Just say the word and I’ll provide the next piece ready to copy-paste.
```
