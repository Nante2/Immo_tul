export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL non défini : le site appelle http://localhost:3001/api (voir .env.production.example)');
}
// Origine du serveur (sans /api) : sert les images uploadées
const SERVER_URL = API_URL.replace(/\/api\/?$/, '');

const toQuery = (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== '')
  );
  return new URLSearchParams(cleanParams).toString();
};

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type if sending FormData (browser sets it with boundary automatically)
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Jeton expiré ou invalide : on déconnecte et on prévient l'application
    if (response.status === 401 && token && endpoint !== '/auth/login' && !options.keepSession) {
      localStorage.removeItem('adminToken');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    const message = errorData.error
      || (Array.isArray(errorData.errors) && errorData.errors.map((e) => e.msg).join(', '))
      || `Erreur serveur: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};

export const loginAdmin = async (email, password) => {
  return fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getMe = async () => {
  return fetchApi('/auth/me', {
    method: 'GET',
  });
};

export const updateMe = async (data) => {
  // keepSession : un mauvais mot de passe actuel renvoie 401 sans déconnecter
  return fetchApi('/auth/me', { method: 'PUT', body: JSON.stringify(data), keepSession: true });
};

export const getUsers = async () => fetchApi('/auth/users', { method: 'GET' });

export const createUser = async (data) => {
  return fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) });
};

export const deleteUser = async (id) => fetchApi(`/auth/users/${id}`, { method: 'DELETE' });

export const updatePropertyStatus = async (id, status) => {
  return fetchApi(`/properties/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
};

export const getProperties = async (params = {}) => {
  return fetchApi(`/properties?${toQuery(params)}`, {
    method: 'GET',
  });
};

export const createProperty = async (data) => {
  return fetchApi('/properties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProperty = async (id, data) => {
  return fetchApi(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProperty = async (id) => {
  return fetchApi(`/properties/${id}`, {
    method: 'DELETE',
  });
};

export const uploadImages = async (files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append('images', file);
  });
  
  return fetchApi('/upload', {
    method: 'POST',
    body: formData,
  });
};

export const getAdminStats = async () => {
  return fetchApi('/stats/dashboard', {
    method: 'GET',
  }).catch(() => ({ views: 0, inquiries: 0, properties: 0 }));
};

export const getPublicProperties = async (params = {}) => {
  return fetchApi(`/properties?${toQuery(params)}`, { method: 'GET' });
};

export const getPropertyFilters = async () => {
  return fetchApi('/properties/stats', { method: 'GET' });
};

export const getSimilarProperties = async (id, limit = 3) => {
  return fetchApi(`/properties/${id}/similar?limit=${limit}`, { method: 'GET' });
};

export const getPropertyById = async (id) => {
  return fetchApi(`/properties/${id}`, { method: 'GET' });
};

export const submitContact = async (data) => {
  return fetchApi('/contacts', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// --- Messagerie admin ---
export const getContacts = async (params = {}) => {
  return fetchApi(`/contacts?${toQuery(params)}`, { method: 'GET' });
};

export const getContactById = async (id) => {
  return fetchApi(`/contacts/${id}`, { method: 'GET' });
};

export const updateContactStatus = async (id, status) => {
  return fetchApi(`/contacts/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const deleteContact = async (id) => {
  return fetchApi(`/contacts/${id}`, { method: 'DELETE' });
};

export const PLACEHOLDER_IMAGE = '/placeholder.svg';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return PLACEHOLDER_IMAGE;
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('uploads/')) return `${SERVER_URL}/${imagePath}`;
  if (imagePath.startsWith('/')) return imagePath;
  return `/${imagePath}`;
};


