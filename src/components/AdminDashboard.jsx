import React, { useState, useEffect } from 'react'
import { getAllUsers, blockUser as blockUserAPI } from '../utils/userManager'
import { getAllVacanciesAdmin, updateVacancy, deleteVacancy, moderateVacancy, getModerationLog } from '../utils/vacancyManager'
import { getAllApplications } from '../utils/applicationManager'
import UserProfile from './UserProfile'
import '../styles/Dashboard.css'

function AdminDashboard({ user, onRefreshData }) {
  const [adminTab, setAdminTab] = useState('overview')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [appData, setAppData] = useState({ users: [], vacancies: [], applications: [] })
  const [userSearch, setUserSearch] = useState('')
  const [moderationLog, setModerationLog] = useState([])

  const loadData = async () => {
    try {
      setLoading(true)
      const [users, vacancies, applications] = await Promise.all([
        getAllUsers(),
        getAllVacanciesAdmin(),
        getAllApplications()
      ])

      setAppData({
        users: Array.isArray(users) ? users : [],
        vacancies: Array.isArray(vacancies) ? vacancies : [],
        applications: Array.isArray(applications) ? applications : []
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
      setAppData({ users: [], vacancies: [], applications: [] })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (adminTab !== 'moderation') return
    let cancelled = false
    getModerationLog().then((rows) => {
      if (!cancelled) setModerationLog(Array.isArray(rows) ? rows : [])
    })
    return () => {
      cancelled = true
    }
  }, [adminTab])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleBlockUser = async (targetUser) => {
    try {
      await blockUserAPI(targetUser.id, targetUser.blocked ? 0 : 1)
      showNotification(targetUser.blocked ? 'Пользователь разблокирован' : 'Пользователь заблокирован')
      const users = await getAllUsers()
      setAppData(prev => ({...prev, users: Array.isArray(users) ? users : []}))
    } catch (error) {
      showNotification('Ошибка при обновлении пользователя', 'error')
      console.error('Error blocking user:', error)
    }
  }

  const handleToggleVacancyStatus = async (vacancy) => {
    try {
      const nextStatus = vacancy.status === 'active' ? 'closed' : 'active'
      await updateVacancy(vacancy.id, {
        title: vacancy.title,
        description: vacancy.description,
        salary: vacancy.salary,
        location: vacancy.location,
        company: vacancy.company,
        type: vacancy.type,
        requirements: vacancy.requirements || '',
        startupStage: vacancy.startupStage || 'mvp',
        teamPace: vacancy.teamPace || 'balanced',
        workStyle: vacancy.workStyle || 'flexible',
        status: nextStatus
      })
      showNotification('Статус вакансии обновлён')
      const vacancies = await getAllVacanciesAdmin()
      setAppData((prev) => ({ ...prev, vacancies: Array.isArray(vacancies) ? vacancies : [] }))
    } catch (error) {
      showNotification('Ошибка обновления вакансии', 'error')
    }
  }

  const handleDeleteVacancy = async (vacancyId) => {
    try {
      await deleteVacancy(vacancyId)
      showNotification('Вакансия закрыта')
      const vacancies = await getAllVacanciesAdmin()
      setAppData((prev) => ({ ...prev, vacancies: Array.isArray(vacancies) ? vacancies : [] }))
    } catch (error) {
      showNotification('Ошибка удаления вакансии', 'error')
    }
  }

  const moderationLabelMap = {
    pending: 'На проверке',
    approved: 'Одобрена',
    rejected: 'Отклонена'
  }

  const handleModerationAction = async (vacancy, nextStatus) => {
    const comment = window.prompt(
      nextStatus === 'approved'
        ? 'Комментарий для работодателя (необязательно):'
        : 'Укажите причину отклонения:',
      vacancy.moderationComment || ''
    )
    if (nextStatus === 'rejected' && !comment?.trim()) {
      showNotification('Для отклонения укажите причину', 'error')
      return
    }
    try {
      await moderateVacancy(vacancy.id, nextStatus, comment || '')
      showNotification(
        nextStatus === 'approved' ? 'Вакансия одобрена' : 'Вакансия отклонена'
      )
      const vacancies = await getAllVacanciesAdmin()
      setAppData((prev) => ({ ...prev, vacancies: Array.isArray(vacancies) ? vacancies : [] }))
      const log = await getModerationLog()
      setModerationLog(Array.isArray(log) ? log : [])
    } catch (error) {
      showNotification('Ошибка модерации вакансии', 'error')
    }
  }

  // Расчёт статистики
  const stats = {
    totalUsers: appData.users ? appData.users.length : 0,
    totalJobs: appData.vacancies ? appData.vacancies.length : 0,
    totalApplications: appData.applications ? appData.applications.length : 0,
    totalViews: appData.vacancies ? appData.vacancies.reduce((sum, v) => sum + (v.views || 0), 0) : 0,
    jobSeekers: appData.users ? appData.users.filter(u => u.type === 'user' || u.type === 'seeker').length : 0,
    employers: appData.users ? appData.users.filter(u => u.type === 'employer').length : 0
  }

  // Получить последние пользователи
  const recentUsers = appData.users ? appData.users.slice(-5).reverse() : []

  const filteredUsers = appData.users
    .filter((u) => u.type !== 'admin')
    .filter((u) => {
      const query = userSearch.trim().toLowerCase()
      if (!query) return true
      return `${u.email} ${u.name}`.toLowerCase().includes(query)
    })

  if (loading) {
    return <div className="dashboard"><p>Загрузка данных админ-панели...</p></div>
  }

  return (
    <div className="dashboard admin-dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="dashboard-header">
        <h2>Панель администратора</h2>
        <button 
          className="profile-toggle"
          onClick={() => setShowProfileModal(true)}
        >
          Профиль
        </button>
      </div>

      {showProfileModal && (
        <UserProfile user={user} onClose={() => setShowProfileModal(false)} />
      )}

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setAdminTab('overview')}
        >
          Обзор
        </button>
        <button 
          className={`tab-btn ${adminTab === 'users' ? 'active' : ''}`}
          onClick={() => setAdminTab('users')}
        >
          Пользователи ({stats.totalUsers})
        </button>
        <button 
          className={`tab-btn ${adminTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setAdminTab('jobs')}
        >
          Вакансии ({stats.totalJobs})
        </button>
        <button 
          className={`tab-btn ${adminTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setAdminTab('moderation')}
        >
          История модерации
        </button>
      </div>

      {adminTab === 'overview' && (
        <div className="admin-section">
          <h3>Статистика платформы</h3>
          <div className="stats-grid">
            <div className="admin-stat">
              <p>Всего пользователей</p>
              <h2>{stats.totalUsers}</h2>
              <span className="trend">Из них: {stats.jobSeekers} соискателей, {stats.employers} работодателей</span>
            </div>
            <div className="admin-stat">
              <p>Всего вакансий</p>
              <h2>{stats.totalJobs}</h2>
              <span className="trend">Активные: {appData.vacancies ? appData.vacancies.filter(v => v.status === 'active').length : 0}</span>
            </div>
            <div className="admin-stat">
              <p>Откликов</p>
              <h2>{stats.totalApplications}</h2>
              <span className="trend">
                {appData.applications ? `${appData.applications.filter(a => a.status === 'accepted' || a.status === 'Принята').length} принято` : '0 принято'}
              </span>
            </div>
            <div className="admin-stat">
              <p>Просмотров</p>
              <h2>{stats.totalViews}</h2>
              <span className="trend">Средний рейтинг: 4.8/5</span>
            </div>
          </div>

          <h3 className="section-title">Последние пользователи</h3>
          <div className="activity-log">
            {recentUsers.length > 0 ? (
              recentUsers.map(u => (
                <div key={u.id} className="activity-item">
                  <span className="activity-time">
                    {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                  <p>
                    {u.type === 'user' || u.type === 'seeker' ? 'Соискатель' : 'Работодатель'}: {u.name} ({u.email})
                  </p>
                </div>
              ))
            ) : (
              <div className="activity-item">
                <p>Нет пользователей</p>
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'users' && (
        <div className="admin-section">
          <h3>Управление пользователями</h3>
          <div className="search-section">
            <input
              type="text"
              placeholder="Поиск по email или имени"
              className="search-input"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
          <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Имя</th>
                <th>Тип</th>
                <th>Дата присоединения</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.name}</td>
                    <td>{u.type === 'user' || u.type === 'seeker' ? 'Соискатель' : 'Работодатель'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <button 
                        className={`table-btn ${u.blocked ? 'view-btn' : 'delete-btn'}`}
                        onClick={() => handleBlockUser(u)}
                      >
                        {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    Пользователи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {adminTab === 'moderation' && (
        <div className="admin-section">
          <h3>История решений модерации</h3>
          <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Каждое одобрение или отклонение вакансии записывается в журнал — удобно для отчёта и защиты проекта.
          </p>
          <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Вакансия</th>
                <th>Компания</th>
                <th>Решение</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {moderationLog.length > 0 ? (
                moderationLog.map((row) => (
                  <tr key={row.id}>
                    <td>{new Date(row.createdAt).toLocaleString('ru-RU')}</td>
                    <td>{row.vacancyTitle || `ID ${row.vacancyId}`}</td>
                    <td>{row.vacancyCompany || '—'}</td>
                    <td>{moderationLabelMap[row.moderationStatus] || row.moderationStatus}</td>
                    <td>{row.moderationComment || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    Записей пока нет
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {adminTab === 'jobs' && (
        <div className="admin-section">
          <h3>Управление вакансиями</h3>
          <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Должность</th>
                <th>Компания</th>
                <th>Статус</th>
                <th>Откликов</th>
                <th>Просмотров</th>
                <th>Дата</th>
                <th>Модерация</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {appData.vacancies && appData.vacancies.length > 0 ? (
                appData.vacancies.map((v) => (
                  <tr key={v.id}>
                    <td>{v.title}</td>
                    <td>{v.company}</td>
                    <td>
                      <span className="status-label" style={{
                        background: v.status === 'active' ? '#dcfce7' : '#fee2e2',
                        color: v.status === 'active' ? '#166534' : '#991b1b'
                      }}>
                        {v.status === 'active' ? 'Активна' : 'Закрыта'}
                      </span>
                    </td>
                    <td>{v.applications || 0}</td>
                    <td>{v.views || 0}</td>
                    <td>{new Date(v.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td>
                      <span className="status-label" style={{
                        background: v.moderationStatus === 'approved' ? '#dcfce7' : v.moderationStatus === 'pending' ? '#fef3c7' : '#fee2e2',
                        color: v.moderationStatus === 'approved' ? '#166534' : v.moderationStatus === 'pending' ? '#92400e' : '#991b1b'
                      }}>
                        {moderationLabelMap[v.moderationStatus] || v.moderationStatus}
                      </span>
                      {v.moderationComment && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#6b7280' }}>
                          {v.moderationComment}
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="table-btn edit-btn" onClick={() => handleModerationAction(v, 'approved')}>
                        Одобрить
                      </button>
                      <button className="table-btn delete-btn" onClick={() => handleModerationAction(v, 'rejected')}>
                        Отклонить
                      </button>
                      <button className="table-btn view-btn" onClick={() => handleToggleVacancyStatus(v)}>
                        {v.status === 'active' ? 'Закрыть' : 'Открыть'}
                      </button>
                      <button className="table-btn delete-btn" onClick={() => handleDeleteVacancy(v.id)}>
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    Вакансии не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboard
