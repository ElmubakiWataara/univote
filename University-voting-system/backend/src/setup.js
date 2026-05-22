// backend/src/setup.js
const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  try {
    const schemaPath = path.join(__dirname, "config/schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    await pool.query(schemaSQL);
    console.log("✅ Database schema created successfully!");

    // Create super admin
    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash("change-me-123", 10);

    await pool.query(
      `
      INSERT INTO admins (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `,
      ["superadmin", hashedPassword, "superadmin"],
    );

    console.log("Super admin created:");
    console.log("   Username: superadmin");
    console.log("   Password: change-me-123");
  } catch (error) {
    console.error("Error setting up database:", error.message);
  } finally {
    await pool.end();
  }
}

setupDatabase();
