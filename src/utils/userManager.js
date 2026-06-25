import { API_URL } from '../config/api.js'
import { setStoredToken } from './authToken.js'

export const registerUser = async (email, password, name, type, agreedToTerms) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, type, agreedToTerms })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error) {
    return { success: false, error: data.error || 'Ошибка регистрации' }
  }
  if (data.token) setStoredToken(data.token)
  if (data.user) localStorage.setItem('found2work_user', JSON.stringify(data.user))
  return { success: true, user: data.user, token: data.token }
}

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || !data.success) {
    return { success: false, error: data.error || 'Ошибка входа' }
  }
  if (data.token) setStoredToken(data.token)
  if (data.user) localStorage.setItem('found2work_user', JSON.stringify(data.user))
  return { success: true, user: data.user, token: data.token }
}

export const getAllUsers = async () => {
  const response = await fetch(`${API_URL}/users`)
  return await response.json()
}

export const updateUserProfile = async (userId, updates) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  const data = await response.json()
  if (data.success) {
    const user = await fetch(`${API_URL}/users/${userId}`).then(r => r.json())
    localStorage.setItem('found2work_user', JSON.stringify(user))
  }
  return data
}

export const blockUser = async (userId, blocked = 1) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocked })
  })
  return await response.json()
}

