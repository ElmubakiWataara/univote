
// Convert to Title Case (e.g., "john doe" → "John Doe")
const toTitleCase = (str) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Convert to UPPERCASE (e.g., "president" → "PRESIDENT")
const toUpperCase = (str) => {
  return str ? str.trim().toUpperCase() : "";
};

// Validate student ID
const isValidStudentId = (str) => {
  if (!str) return false;
  // Only letters and numbers, no spaces or special characters
  return /^[A-Za-z0-9]+$/.test(str);
};

// Validate email
const isValidEmail = (email) => {
  if (!email) return true; // email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  toTitleCase,
  toUpperCase,
  isValidStudentId,
  isValidEmail,
};
