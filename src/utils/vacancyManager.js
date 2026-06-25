import { API_URL } from '../config/api.js'

export const getAllVacancies = async () => {
  const response = await fetch(`${API_URL}/vacancies`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const getAllVacanciesAdmin = async () => {
  const response = await fetch(`${API_URL}/vacancies/all`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const getEmployerVacancies = async (employerId) => {
  const response = await fetch(`${API_URL}/vacancies/employer/${employerId}`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const createVacancy = async (employerId, vacancyData) => {
  const { title, description, salary, location, company, type, requirements, startupStage, teamPace, workStyle } = vacancyData
  
  const response = await fetch(`${API_URL}/vacancies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employerId,
      title,
      description,
      salary,
      location: location || 'Удалённо',
      company: company || 'Не указано',
      type: type || 'full-time',
      requirements: requirements || '',
      startupStage: startupStage || 'mvp',
      teamPace: teamPace || 'balanced',
      workStyle: workStyle || 'flexible'
    })
  })
  const data = await response.json()
  return { success: !data.error, vacancy: data.vacancy, error: data.error }
}

export const updateVacancy = async (vacancyId, updates) => {
  const response = await fetch(`${API_URL}/vacancies/${vacancyId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  return await response.json()
}

export const moderateVacancy = async (vacancyId, moderationStatus, moderationComment = '') => {
  const response = await fetch(`${API_URL}/vacancies/${vacancyId}/moderation`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ moderationStatus, moderationComment })
  })
  return await response.json()
}

export const deleteVacancy = async (vacancyId) => {
  const response = await fetch(`${API_URL}/vacancies/${vacancyId}`, {
    method: 'DELETE'
  })
  return await response.json()
}

export const getSavedJobs = async (userId) => {
  const response = await fetch(`${API_URL}/saved-jobs/${userId}`)
  const saved = await response.json()
  return Array.isArray(saved) ? saved : []
}

export const saveJob = async (userId, vacancyId) => {
  const response = await fetch(`${API_URL}/saved-jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, vacancyId })
  })
  return await response.json()
}

export const unsaveJob = async (userId, vacancyId) => {
  const response = await fetch(`${API_URL}/saved-jobs/${userId}/${vacancyId}`, {
    method: 'DELETE'
  })
  return await response.json()
}

export const getModerationLog = async () => {
  const response = await fetch(`${API_URL}/moderation-log`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}
