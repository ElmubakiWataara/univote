How To Run this App

---

## How to Run the System

### Backend

```powershell
cd backend
npm install
npm run dev
```

cd frontend
npm install
npm run build

Access the system at:

Server machine: http://localhost:3000
Other LAN devices: http://YOUR_SERVER_IP:3000

Key Features & Pages
Student Side

/ → Token Input Page
/vote → Categorized Voting Screen (one position at a time with Next button)

Admin Side

/admin/login → Single Login Page (works for both admin & superadmin)
/admin/dashboard → Normal Admin Dashboard
/admin/register-voter → Register new voter
/admin/generate-token → Generate voter token
/admin/list-voters → List voters (with Edit/Delete)
/admin/add-candidate → Add candidate (with photo upload)
/admin/list-candidates → List candidates (with Edit/Delete)
/admin/settings → Settings

Super Admin Only

/admin/super → Super Admin Dashboard (Election toggle, Audit logs, etc.)

Login Credentials

Super Admin:
Username: superadmin
Password: change-me-123

Normal admins can be created using the add-admin.js script.

Important Notes

Token generation is admin only.
Voter tokens are valid for 15 minutes.
Final vote submission marks has_voted = true.
Images are served from /uploads folder.

Postman Testing Flow

Admin Login → Get Admin JWT
Generate Token → Get Voter Token
Verify Token → Get Voter JWT
Vote using Voter JWT

3. How to Access the System

On the server machine: Go to http://localhost:3000
On other computers on the same LAN: Go to http://YOUR_SERVER_IP:3000
(Find your IP by running ipconfig in PowerShell)

Main Pages:

Student Voting: http://localhost:3000
Admin Login: http://localhost:3000/admin/login

4. Full Startup Sequence (Recommended)

Start PostgreSQL
Open backend folder → run npm run dev
Open frontend folder → run npm run build
Access the system via browser using the server IP
