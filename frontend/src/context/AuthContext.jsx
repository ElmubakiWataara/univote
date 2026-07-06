// frontend/src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from token on refresh
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          id: payload.id,
          username: payload.username,
          role: payload.role,
          voterId: payload.voterId,
        });
      } catch (e) {
        console.error("Failed to decode token");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let timeout;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // exp is in seconds
      const expiryTime = payload.exp * 1000;
      const timeRemaining = expiryTime - Date.now();

      if (timeRemaining <= 0) {
        logout();
        return;
      }

      timeout = setTimeout(() => {
        alert("Your session has expired. Please log in again.");
        logout();
      }, timeRemaining);
    } catch (err) {
      logout();
    }

    return () => clearTimeout(timeout);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
