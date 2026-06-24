// backend/src/add-test-voters.js
const pool = require("./config/db");

async function addTestVoters() {
  try {
    await pool.query(`
      INSERT INTO voters (student_id, full_name, department)
      VALUES 
        ('U2023001', 'John Doe', 'Computer Science'),
        ('U2023002', 'Jane Smith', 'Business'),
        ('U2023003', 'Ahmed Khan', 'Engineering')
      ON CONFLICT (student_id) DO NOTHING;
    `);
    console.log("✅ Test voters added successfully");
  } catch (error) {
    console.error("Error adding test voters:", error.message);
  } finally {
    await pool.end();
  }
}

addTestVoters();
