import { createContext, useState, useEffect, useContext } from 'react';
import { loginAdmin, getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
        } catch {
          localStorage.removeItem('adminToken');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // Le client API signale un jeton expiré (il n'émet l'événement que si un jeton existait)
  useEffect(() => {
    const onExpired = () => {
      setSessionExpired(true);
      setUser(null);
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (email, password) => {
    const data = await loginAdmin(email, password);
    localStorage.setItem('adminToken', data.token);
    setSessionExpired(false);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading, sessionExpired }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
