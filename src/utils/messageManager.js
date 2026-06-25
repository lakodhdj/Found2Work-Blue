import { API_URL } from '../config/api.js'

export const getConversations = async (userId) => {
  const response = await fetch(`${API_URL}/messages/conversations/${userId}`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const getMessageThread = async (userId, withUserId, vacancyId = null) => {
  const params = new URLSearchParams({
    userId: String(userId),
    withUserId: String(withUserId)
  })
  if (vacancyId !== null && vacancyId !== undefined) {
    params.set('vacancyId', String(vacancyId))
  }
  const response = await fetch(`${API_URL}/messages/thread?${params.toString()}`)
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

export const sendMessage = async (senderId, receiverId, text, vacancyId = null) => {
  const response = await fetch(`${API_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senderId, receiverId, text, vacancyId })
  })
  return await response.json()
}
