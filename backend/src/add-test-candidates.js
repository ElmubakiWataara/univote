const pool = require("./config/db");

async function addTestCandidates() {
  try {
    await pool.query(`
      INSERT INTO candidates (name, position)
      VALUES 
        ('Ali Hassan', 'President'),
        ('Sara Ahmed', 'Vice President'),
        ('Omar Farooq', 'General Secretary'),
        ('Aisha Khan', 'Treasurer')
      ON CONFLICT DO NOTHING;
    `);
    console.log("✅ Test candidates added successfully!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

addTestCandidates();
