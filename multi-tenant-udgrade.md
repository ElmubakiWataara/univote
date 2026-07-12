Overall Strategy

Phase 0: Preparation (Today)

Backup your current database (very important).
Create a new branch in git: git checkout -b multi-tenant-upgrade
Confirm you have the latest working version of your current single-tenant system.

Phase 1: Database Schema Changes (1–2 days)
Goal: Add the new tables and columns without breaking existing data.
Steps:

Run the full schema script (with organizations, updated foreign keys, etc.).
Add organization_id to existing tables (voters, candidates, admins, tokens, votes, audit_logs, election_settings).
Run a migration script to assign a default organization_id = 1 to all existing records (so current data still works).
Add UNIQUE constraint on election_settings.organization_id.
Test: Make sure all existing queries still work after adding organization_id.

Deliverable: A clean database with proper structure.

Phase 2: Backend - Owner Layer (2–3 days)
Goal: Owner can register organizations.
Steps:

Create owner authentication (new login for Owner).
Create POST /owner/organizations endpoint:
Takes name, email, phone
Auto-generates password
Creates row in organizations table
Returns the plaintext password once

Add middleware to protect Owner routes.
Create basic Owner dashboard routes.

Deliverable: Owner can register a faculty and get credentials.

Phase 3: Tenant Scoping & Authentication (3–5 days)
Goal: SuperAdmin can only see their own organization’s data.
Steps:

Update JWT to include organization_id.
Update all existing controllers (voters, candidates, tokens, votes, results, etc.) to filter by req.user.organization_id.
Update login flow:
First check organizations table (for SuperAdmin)
Then check admins table (for regular Admin)
Enforce organizations.status = 'active'

Update middleware to reject if organization is suspended.

Deliverable: SuperAdmin can log in and only see their faculty’s data.

Phase 4: Frontend Updates (3–5 days)
Steps:

Create Owner Dashboard:
Register new organization
List organizations
Toggle status

Update sidebar based on role (Owner vs SuperAdmin vs Admin).
Update all pages to work within tenant context.

Deliverable: Owner can manage faculties, SuperAdmin can manage their election.

Phase 5: Testing & Polish (2–4 days)

Test full flow: Owner registers faculty → SuperAdmin logs in → manages election.
Test data isolation (no cross-faculty data leak).
Test soft delete guard.
Fix bugs and improve UX.

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

-- Insert First Owner
INSERT INTO owners (username, password_hash)
VALUES (
'owner',
'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- password: "password"
)
ON CONFLICT (username) DO NOTHING;

-- Verify insertion
SELECT id, username, created_at FROM owners WHERE username = 'owner';
