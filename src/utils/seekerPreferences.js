import { API_URL } from '../config/api.js'

async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { success: false, error: data.error || response.statusText }
  }
  return data
}

export async function getBlockedEmployers(userId) {
  const response = await fetch(`${API_URL}/users/${userId}/blocked-employers`)
  const data = await response.json().catch(() => [])
  return Array.isArray(data) ? data : []
}

export async function blockEmployer(userId, employerId) {
  const response = await fetch(`${API_URL}/users/${userId}/blocked-employers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employerId })
  })
  return parseJsonResponse(response)
}

export async function unblockEmployer(userId, employerId) {
  const response = await fetch(`${API_URL}/users/${userId}/blocked-employers/${employerId}`, {
    method: 'DELETE'
  })
  return parseJsonResponse(response)
}

export async function getHiddenVacancies(userId) {
  const response = await fetch(`${API_URL}/users/${userId}/hidden-vacancies`)
  const data = await response.json().catch(() => [])
  return Array.isArray(data) ? data : []
}

export async function hideVacancy(userId, vacancyId) {
  const response = await fetch(`${API_URL}/users/${userId}/hidden-vacancies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacancyId })
  })
  return parseJsonResponse(response)
}

export async function unhideVacancy(userId, vacancyId) {
  const response = await fetch(`${API_URL}/users/${userId}/hidden-vacancies/${vacancyId}`, {
    method: 'DELETE'
  })
  return parseJsonResponse(response)
}
