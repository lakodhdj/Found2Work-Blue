/** Адрес API (без завершающего слэша). В Docker: VITE_API_URL=/api */
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001/api'