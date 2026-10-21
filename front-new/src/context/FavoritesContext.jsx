import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const STORAGE_KEY = 'favorites';

const readFavorites = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const FavoritesContext = createContext();

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState(readFavorites);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Stockage indisponible (navigation privée, quota) : les favoris restent en mémoire
    }
  }, [favorites]);

  // Synchronise les favoris entre plusieurs onglets
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) setFavorites(readFavorites());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(String(id)), [favorites]);

  const toggleFavorite = useCallback((id) => {
    const key = String(id);
    setFavorites((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
  }, []);

  const removeFavorite = useCallback((id) => {
    const key = String(id);
    setFavorites((prev) => prev.filter((f) => f !== key));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        count: favorites.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
