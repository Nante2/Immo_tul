// Historique des biens consultés, conservé dans le navigateur du visiteur
const STORAGE_KEY = "recentlyViewed";
const MAX_ITEMS = 8;
const EVENT = "recently-viewed-change";

// Seuls les champs utiles à l'affichage d'une carte sont conservés
const FIELDS = ["id", "titre", "prix", "location", "image", "actionType", "status", "type", "area", "beds", "baths"];

export const getRecentlyViewed = () => {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const addRecentlyViewed = (property) => {
  if (!property?.id) return;
  const entry = Object.fromEntries(FIELDS.map((k) => [k, property[k]]));
  const list = [entry, ...getRecentlyViewed().filter((p) => String(p.id) !== String(property.id))].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Stockage indisponible : l'historique n'est simplement pas conservé
  }
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignoré
  }
};

export const RECENTLY_VIEWED_EVENT = EVENT;
