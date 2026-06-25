import { API_URL } from '../config/api.js'
import { setStoredToken } from './authToken.js'

// Helper function for API requests
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    })
    if (!response.ok && response.status !== 400) {
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    return { success: false, error: error.message }
  }
}

// Auth calls
export const loginUser = async (email, password) => {
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  if (result.success && result.token) {
    setStoredToken(result.token)
    localStorage.setItem('found2work_user', JSON.stringify(result.user))
  }
  return result
}

export const registerUser = async (id, email, password, name, type) => {
  return apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ id, email, password, name, type })
  })
}

// User calls
export const getAllUsers = async () => {
  return apiCall('/users')
}

export const getUser = async (userId) => {
  return apiCall(`/users/${userId}`)
}

export const updateUserProfile = async (userId, updates) => {
  const result = await apiCall(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
  if (result.success) {
    const user = await getUser(userId)
    localStorage.setItem('found2work_user', JSON.stringify(user))
  }
  return result
}

// Vacancy calls
export const getAllVacancies = async () => {
  return apiCall('/vacancies')
}

export const getVacancyByEmployer = async (employerId) => {
  return apiCall(`/vacancies/employer/${employerId}`)
}

export const createVacancy = async (id, employerId, title, description, salary, location, company, type) => {
  return apiCall('/vacancies', {
    method: 'POST',
    body: JSON.stringify({ id, employerId, title, description, salary, location, company, type })
  })
}

export const updateVacancy = async (vacancyId, updates) => {
  return apiCall(`/vacancies/${vacancyId}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  })
}

export const deleteVacancy = async (vacancyId) => {
  return apiCall(`/vacancies/${vacancyId}`, {
    method: 'DELETE'
  })
}

// Application calls
export const applyForVacancy = async (userId, vacancyId, coverLetter) => {
  const id = `app_${Date.now()}`
  return apiCall('/applications', {
    method: 'POST',
    body: JSON.stringify({ id, userId, vacancyId, coverLetter })
  })
}

export const getApplicationsByUser = async (userId) => {
  return apiCall(`/applications/user/${userId}`)
}

export const getApplicationsByVacancy = async (vacancyId) => {
  return apiCall(`/applications/vacancy/${vacancyId}`)
}

export const updateApplicationStatus = async (applicationId, status) => {
  return apiCall(`/applications/${applicationId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
}

// Saved jobs calls
export const getSavedJobs = async (userId) => {
  return apiCall(`/saved-jobs/${userId}`)
}

export const saveJob = async (userId, vacancyId) => {
  const id = `saved_${Date.now()}`
  return apiCall('/saved-jobs', {
    method: 'POST',
    body: JSON.stringify({ id, userId, vacancyId })
  })
}

export const unsaveJob = async (userId, vacancyId) => {
  return apiCall(`/saved-jobs/${userId}/${vacancyId}`, {
    method: 'DELETE'
  })
}

// Reports calls
export const getAllReports = async () => {
  return apiCall('/reports')
}

export const createReport = async (reportedBy, reason, description) => {
  const id = `report_${Date.now()}`
  return apiCall('/reports', {
    method: 'POST',
    body: JSON.stringify({ id, reportedBy, reason, description })
  })
}

export const updateReportStatus = async (reportId, status) => {
  return apiCall(`/reports/${reportId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  })
}

// Stats call
export const getStats = async () => {
  return apiCall('/stats')
}
