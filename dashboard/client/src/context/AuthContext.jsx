import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('dashToken'));
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dashAdmin')); } catch { return null; }
  });

  const login = (tok, adminData) => {
    localStorage.setItem('dashToken', tok);
    localStorage.setItem('dashAdmin', JSON.stringify(adminData));
    setToken(tok);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('dashToken');
    localStorage.removeItem('dashAdmin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
