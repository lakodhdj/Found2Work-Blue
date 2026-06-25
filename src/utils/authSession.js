import { API_URL } from '../config/api.js'
import { getStoredToken, clearAuthStorage } from './authToken.js'

/**
 * Проверяет сохранённый JWT и возвращает актуальный профиль пользователя.
 */
export async function fetchSessionUser() {
  const token = getStoredToken()
  if (!token) return null

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.status === 401 || response.status === 403) {
      clearAuthStorage()
      return null
    }

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    const user = data.user
    if (user) {
      localStorage.setItem('found2work_user', JSON.stringify(user))
    }
    return user || null
  } catch {
    return null
  }
}
