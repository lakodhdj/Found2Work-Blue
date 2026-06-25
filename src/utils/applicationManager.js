import { API_URL } from '../config/api.js'

export const applyForVacancy = async (userId, vacancyId, coverLetter) => {
  const response = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vacancyId, coverLetter })
  })
  const data = await response.json()
  return { success: !data.error, application: data.application, error: data.error }
}

export const getUserApplications = async (userId) => {
  const response = await fetch(`${API_URL}/applications/user/${userId}`)
  const apps = await response.json()
  return Array.isArray(apps) ? apps : []
}

export const getVacancyApplications = async (vacancyId) => {
  const response = await fetch(`${API_URL}/applications/vacancy/${vacancyId}`)
  const apps = await response.json()
  return Array.isArray(apps) ? apps : []
}

export const getAllApplications = async () => {
  const response = await fetch(`${API_URL}/applications`)
  const apps = await response.json()
  return Array.isArray(apps) ? apps : []
}

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  return await response.json()
}

export const getApplicationStats = async () => {
  const response = await fetch(`${API_URL}/stats`)
  return await response.json()
}
