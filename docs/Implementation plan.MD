Here is the complete, ready-to-use **Markdown documentation** for the **Implementation Plan**.

Copy the entire content below and save it as **`implementation-plan.md`** in the root of your project (alongside the previous `voting-system-architecture.md`).

```markdown
# University Voting System - Implementation Plan

**Project Name:** University Voting System (Local LAN Deployment)  
**Final Architecture:** Admin-mediated token generation, locally hosted on LAN (no internet)  
**Tech Stack:** Node.js + Express (backend monolith), React (frontend), PostgreSQL (database)  
**Version:** Final - March 2026

This document provides a clear, step-by-step implementation plan. Follow the phases sequentially for best results.

## Project Overview

The system allows admins to generate one-time tokens for students.  
Students receive the token on paper, enter it on a voting station, and cast one vote.  
Everything runs locally on a university LAN with full auditability and strict one-person-one-vote enforcement.

**Key Constraints:**

- Token generation only by authenticated admins
- Token displayed on admin screen and written down for handover
- Students input token on voting computers to authenticate and vote
- No email or internet required

## Recommended Project Structure
```

university-voting-system/
├── backend/
│ ├── src/
│ │ ├── config/ # database, jwt config
│ │ ├── controllers/ # auth, admin, voting controllers
│ │ ├── middleware/ # auth, error, validation
│ │ ├── routes/ # api routes
│ │ ├── services/ # business logic
│ │ ├── utils/ # crypto, audit logging
│ │ └── server.js
│ ├── prisma/ # schema.prisma (recommended)
│ ├── .env
│ └── package.json
├── frontend/
│ ├── src/
│ │ ├── components/ # AdminTokenGenerator, TokenInput, CandidateList, etc.
│ │ ├── pages/ # AdminDashboard, VotingStation, Results
│ │ ├── context/ # AuthContext
│ │ ├── utils/ # axios instance
│ │ └── App.js
│ ├── public/
│ └── package.json
├── docs/
│ ├── voting-system-architecture.md
│ └── implementation-plan.md ← This file
├── docker-compose.yml # Optional
└── README.md

```

## Implementation Phases

### Phase 1: Project Setup & Environment Configuration
**Objective:** Establish the project skeleton and local development environment.
**Key Tasks:**
- Create folder structure as shown above
- Initialize backend (`npm init -y`) and frontend (`npx create-react-app .` or Vite)
- Install core dependencies
- Set up `.env` file (JWT_SECRET, DATABASE_URL, PORT=3000)
- Configure Express to serve built React frontend
- Bind server to `0.0.0.0` for LAN access
- Install PM2 globally for running the server
**Recommended Tools:** Node.js v20+, PostgreSQL, PM2
**Deliverables:**
- Server runs on `http://0.0.0.0:3000` and is accessible from other LAN devices
- React app builds and is served by Express
**Dependencies:** None
**Estimated Effort:** 2–4 hours

### Phase 2: Database Setup & Schema Implementation
**Objective:** Create and connect the PostgreSQL database with the full schema.
**Key Tasks:**
- Create database `university_voting`
- Execute the complete SQL schema (admins, voters, tokens, candidates, votes, election_settings, audit_logs)
- Add necessary indexes (`student_id`, `token_value`, `voter_id`)
- Create seed script to insert initial super admin account
- Connect backend to database (Prisma recommended or pg library)
**Deliverables:**
- Database fully set up and accessible
- Seed script runs successfully (creates superadmin)
**Dependencies:** Phase 1
**Estimated Effort:** 3–5 hours

### Phase 3: Backend Foundation (Express Server + Middleware)
**Objective:** Build a secure and robust Express application base.
**Key Tasks:**
- Set up Express with Helmet, CORS, rate limiting, and JSON parsing
- Create global error handling and request logging middleware
- Establish database connection pool
- Add health check endpoint (`GET /api/health`)
**Recommended Packages:** express, helmet, cors, express-rate-limit, dotenv
**Deliverables:**
- Server starts cleanly and connects to PostgreSQL
**Dependencies:** Phase 1–2
**Estimated Effort:** 4–6 hours

### Phase 4: Authentication System (JWT for Admin & Voter)
**Objective:** Implement secure authentication flows.
**Key Tasks:**
- Admin login endpoint with bcrypt password verification
- JWT generation and validation middleware (different roles: admin, superadmin, voter)
- Voter token verification endpoint (`POST /api/auth/verify-token`)
- Protect routes using auth middleware
**Recommended Packages:** jsonwebtoken, bcryptjs
**Deliverables:**
- Admin can log in and receive JWT
- Protected routes reject invalid or missing tokens
**Dependencies:** Phase 3
**Estimated Effort:** 6–8 hours

### Phase 5: Admin Features – Voter Management & Token Generation
**Objective:** Implement core admin functionality (critical phase).
**Key Tasks:**
- Endpoints for managing voters (list, add)
- `POST /api/admin/generate-token`:
  - Validate student ID exists, election active, not voted
  - Generate 64-character cryptographically secure token (`crypto.randomBytes`)
  - Store in `tokens` table with `generated_by` admin ID
  - Log action to audit_logs
  - Return token to admin screen
**Deliverables:**
- Admin can successfully generate and view tokens via API (test with Postman)
**Dependencies:** Phase 4
**Estimated Effort:** 8–10 hours

### Phase 6: Voting Logic & One-Person-One-Vote Enforcement
**Objective:** Build the secure voting mechanism.
**Key Tasks:**
- `GET /api/candidates` (protected by voter JWT)
- `POST /api/vote` endpoint using database transaction:
  - Verify election is active
  - Check voter has not voted
  - Insert vote record
  - Update `has_voted = true`
  - Mark token as `used = true`
  - Log vote action
- Enforce UNIQUE constraint on `votes.voter_id`
**Deliverables:**
- Complete token → authentication → vote flow works without allowing multiple votes
**Dependencies:** Phase 5
**Estimated Effort:** 8–10 hours

### Phase 7: Super Admin Controls & Election Management
**Objective:** Add election control features.
**Key Tasks:**
- `POST /api/super/toggle-election` (superadmin only)
- Manage `election_settings` table
- Basic admin management (list other admins)
- Full audit logs viewing endpoint
**Deliverables:**
- Super admin can turn election ON/OFF
**Dependencies:** Phase 4–6
**Estimated Effort:** 5–7 hours

### Phase 8: Frontend Development (React UI)
**Objective:** Build user-friendly interfaces for admin and students.
**Key Tasks:**
- Admin Dashboard: Login, Token Generation page, Voters list, Audit logs
- Student Voting Station: Token input screen, Candidate selection, Confirmation page
- Implement auth context and Axios interceptors for JWT
- Make UI clear and simple (large fonts for token display)
**Recommended Tools:** React Router, Axios, Tailwind CSS or Bootstrap, Context API
**Deliverables:**
- Fully functional React frontend served by the backend
**Dependencies:** Phase 4–7 (backend APIs must be ready)
**Estimated Effort:** 10–14 hours

### Phase 9: Results Display, Security Hardening & Polish
**Objective:** Finalize results and strengthen security.
**Key Tasks:**
- Results endpoint and page (controlled by election settings)
- Add input validation and additional rate limiting
- Self-signed HTTPS setup (optional)
- Improve audit log display
**Deliverables:**
- Results visible when election is closed
- Security best practices applied
**Dependencies:** Phase 8
**Estimated Effort:** 6–8 hours

### Phase 10: Testing, Deployment & Go-Live Preparation
**Objective:** Test thoroughly and prepare for actual election use.
**Key Tasks:**
- End-to-end manual testing (admin token generation → student voting)
- Test edge cases (expired token, duplicate vote attempts, election OFF)
- Load testing with multiple concurrent users
- Set up PM2 + Nginx reverse proxy on the server
- Create "Election Day Checklist" document
- Kiosk mode recommendations for voting computers
**Deliverables:**
- System fully tested and stable on LAN
- Documentation for election officials
**Dependencies:** All previous phases
**Estimated Effort:** 8–12 hours

## Total Estimated Effort
**4–6 days** for an experienced full-stack developer working full time.
Beginners may need 7–10 days.

## Development Guidelines

- **Order:** Follow phases strictly. Complete and test backend APIs with Postman before starting frontend.
- **Testing:** After each phase, test the new functionality thoroughly.
- **Security:** Always validate inputs, use transactions for voting, and log critical actions.
- **Token Generation:** Use `crypto.randomBytes(32).toString('hex')` for tokens.
- **LAN Access:** Keep server bound to `0.0.0.0`.
- **Checkpoint:** Each phase must have a working, testable deliverable.

## Next Steps After Implementation

1. Run the full end-to-end flow multiple times.
2. Simulate an election day with test students and admins.
3. Document any custom changes made during development.
4. Prepare backup and restore procedures for the database.

---

**This document is the official implementation plan.**
Keep it alongside `voting-system-architecture.md` as your primary development references.

You are now ready to begin **Phase 1**.

**Recommendation:** Start with Phase 1 today. Once completed, move to Phase 2 (database schema).

If you need code templates, package.json files, or detailed instructions + code for any specific phase, let me know which phase you want next and I will provide copy-paste ready content.
```

---

**How to use this file:**

1. Create a `docs/` folder in your project root (optional but clean).
2. Paste the content above into `docs/implementation-plan.md`.
3. Refer to it while developing.

You now have two complete Markdown files:

- `voting-system-architecture.md` (from previous response)
- `implementation-plan.md` (this one)

Would you like me to generate the **exact code and instructions for Phase 1** right now so you can start building immediately? Just confirm and I’ll provide it.
