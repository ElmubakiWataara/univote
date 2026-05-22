// backend/src/add-admin.js
const pool = require("./config/db");
const bcrypt = require("bcryptjs");

async function addNewAdmin() {
  const username = "admin1"; // Change this
  const password = "admin123"; // Change this

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO admins (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, role
    `,
      [username, hashedPassword, "admin"],
    );

    if (result.rows.length > 0) {
      console.log("✅ New Admin created successfully!");
      console.log(`Username: ${username}`);
      console.log(`Password: ${password}`);
      console.log(`Role: admin`);
    } else {
      console.log("⚠️ Admin with this username already exists.");
    }
  } catch (err) {
    console.error("Error creating admin:", err.message);
  } finally {
    await pool.end();
  }
}

addNewAdmin();
