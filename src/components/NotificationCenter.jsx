import React, { useState, useEffect } from 'react'

function NotificationCenter({ onClose }) {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Вакансия опубликована',
      message: 'Ваша вакансия успешно добавлена на платформу',
      time: new Date()
    },
    {
      id: 2,
      type: 'info',
      title: 'Новая заявка',
      message: 'У вас новый отклик на вакансию',
      time: new Date(Date.now() - 3600000)
    },
    {
      id: 3,
      type: 'warning',
      title: 'Истекает подписка',
      message: 'Ваша подписка истекает через 7 дней',
      time: new Date(Date.now() - 86400000)
    }
  ])

  const removeNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  const getNotificationColor = (type) => {
    switch(type) {
      case 'success':
        return '#10b981'
      case 'error':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'info':
        return '#3b82f6'
      default:
        return '#6b7280'
    }
  }

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (hours === 0) return 'только что'
    if (hours < 24) return `${hours}ч назад`
    if (days < 7) return `${days}д назад`
    return date.toLocaleDateString('ru-RU')
  }

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>🔔 Уведомления ({notifications.length})</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className="notification-item"
              style={{ borderLeftColor: getNotificationColor(notif.type) }}
            >
              <div className="notification-icon" style={{ color: getNotificationColor(notif.type) }}>
                {getNotificationIcon(notif.type)}
              </div>
              <div className="notification-content">
                <h4>{notif.title}</h4>
                <p>{notif.message}</p>
                <span className="notification-time">{formatTime(notif.time)}</span>
              </div>
              <button 
                className="notification-close"
                onClick={() => removeNotification(notif.id)}
              >
                ✕
              </button>
            </div>
          ))
        ) : (
          <div className="empty-notifications">
            <p>Нет уведомлений</p>
          </div>
        )}
      </div>

      <div className="notification-footer">
        <button className="settings-link">⚙️ Настройки уведомлений</button>
        {notifications.length > 0 && (
          <button 
            className="clear-all-link"
            onClick={() => setNotifications([])}
          >
            Очистить все
          </button>
        )}
      </div>
    </div>
  )
}

export default NotificationCenter