import { API_URL } from '../config/api.js'

export const getAllReports = async () => {
  const response = await fetch(`${API_URL}/reports`)
  const reports = await response.json()
  return Array.isArray(reports) ? reports : []
}

export const createReport = async (reportedBy, reportedUser, reason, description, contentType = 'user') => {
  const response = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportedBy, reportedUser, reason, description, contentType })
  })
  const data = await response.json()
  return { success: !data.error, report: data.report, error: data.error }
}

export const updateReportStatus = async (reportId, status) => {
  const response = await fetch(`${API_URL}/reports/${reportId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  return await response.json()
}

export const getReportStats = async () => {
  const reports = await getAllReports()

  return {
    total: reports.length,
    new: reports.filter(r => r.status === 'Новое').length,
    processing: reports.filter(r => r.status === 'В процессе').length,
    resolved: reports.filter(r => r.status === 'Решено').length,
    critical: reports.filter(r => r.priority === 'Критический').length
  }
}
