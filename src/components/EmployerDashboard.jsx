import React, { useState, useEffect } from 'react'
import { createVacancy, getEmployerVacancies, updateVacancy } from '../utils/vacancyManager'
import UserProfile from './UserProfile'
import ApplicationsViewer from './ApplicationsViewer'
import ChatPanel from './ChatPanel'
import VacancyDetails from './VacancyDetails'
import '../styles/Dashboard.css'

function EmployerDashboard({ user, onRefreshData }) {
  const pulseLabels = {
    stage: { idea: 'Idea', mvp: 'MVP', growth: 'Growth' },
    pace: { calm: 'Спокойный', balanced: 'Сбалансированный', fast: 'Очень быстрый' }
  }

  const [showNewVacancy, setShowNewVacancy] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedVacancy, setSelectedVacancy] = useState(null)
  const [editingVacancy, setEditingVacancy] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [chatPreset, setChatPreset] = useState(null)
  const [vacancies, setVacancies] = useState([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState(null)
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    salary: '',
    location: '',
    company: user.name,
    type: 'Полная занятость',
    startupStage: 'mvp',
    teamPace: 'balanced',
    workStyle: 'flexible'
  })

  useEffect(() => {
    const loadVacancies = async () => {
      try {
        setLoading(true)
        const data = await getEmployerVacancies(user.id)
        setVacancies(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error loading vacancies:', error)
        setVacancies([])
      } finally {
        setLoading(false)
      }
    }
    
    loadVacancies()
  }, [user.id])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const reloadVacancies = async () => {
    const data = await getEmployerVacancies(user.id)
    setVacancies(Array.isArray(data) ? data : [])
  }

  const handleAddVacancy = async (e) => {
    e.preventDefault()
    if (newJob.title && newJob.description && newJob.salary) {
      try {
        const result = await createVacancy(user.id, newJob)
        
        if (result.success) {
          showNotification('Вакансия отправлена на проверку администратору')
          setNewJob({
            title: '',
            description: '',
            salary: '',
            location: '',
            company: user.name,
            type: 'Полная занятость',
            startupStage: 'mvp',
            teamPace: 'balanced',
            workStyle: 'flexible'
          })
          setShowNewVacancy(false)
          
          await reloadVacancies()
        } else {
          showNotification('Ошибка при создании вакансии', 'error')
        }
      } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error')
        console.error('Error creating vacancy:', error)
      }
    } else {
      showNotification('Заполните все обязательные поля', 'error')
    }
  }

  const handleToggleVacancy = async (vacancy) => {
    if (vacancy.moderationStatus !== 'approved') {
      showNotification('Сначала дождитесь одобрения вакансии администратором', 'error')
      return
    }
    const isActive = vacancy.status === 'active'
    const question = isActive
      ? 'Вы уверены, что хотите приостановить эту вакансию?'
      : 'Запустить вакансию снова?'
    if (window.confirm(question)) {
      try {
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
          status: isActive ? 'closed' : 'active'
        })
        showNotification(isActive ? 'Вакансия приостановлена' : 'Вакансия снова запущена')
        
        await reloadVacancies()
      } catch (error) {
        showNotification('Ошибка при изменении статуса', 'error')
        console.error('Error updating vacancy status:', error)
      }
    }
  }

  const stats = {
    total: vacancies.length,
    active: vacancies.filter(v => v.status === 'active' && v.moderationStatus === 'approved').length,
    totalApplications: vacancies.reduce((sum, v) => sum + (v.applications || 0), 0),
    totalViews: vacancies.reduce((sum, v) => sum + (v.views || 0), 0)
  }

  const moderationLabel = (vacancy) => {
    if (vacancy.moderationStatus === 'pending') return 'На проверке'
    if (vacancy.moderationStatus === 'rejected') return 'Отклонена'
    return vacancy.status === 'active' ? 'Активна' : 'Приостановлена'
  }

  const handleUpdateVacancy = async (vacancyData) => {
    try {
      await updateVacancy(vacancyData.id, {
        title: vacancyData.title,
        description: vacancyData.description,
        salary: vacancyData.salary,
        location: vacancyData.location,
        company: vacancyData.company || user.name,
        type: vacancyData.type,
        requirements: vacancyData.requirements || '',
        startupStage: vacancyData.startupStage || 'mvp',
        teamPace: vacancyData.teamPace || 'balanced',
        workStyle: vacancyData.workStyle || 'flexible',
        status: vacancyData.status || 'active'
      })
      showNotification('Вакансия обновлена')
      setEditingVacancy(null)
      await reloadVacancies()
    } catch (error) {
      showNotification('Ошибка при обновлении вакансии', 'error')
    }
  }

  return (
    <div className="dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <h2>Панель работодателя</h2>
        <div className="header-actions">
          <button 
            className="profile-toggle"
            onClick={() => setShowProfileModal(true)}
          >
            Профиль
          </button>
          <button 
            className="new-vacancy-btn"
            onClick={() => setShowNewVacancy(!showNewVacancy)}
          >
            Опубликовать вакансию
          </button>
          <button
            className="new-vacancy-btn"
            onClick={() => setShowChat(true)}
          >
            Сообщения
          </button>
        </div>
      </div>

      {showProfileModal && (
        <UserProfile user={user} onClose={() => setShowProfileModal(false)} />
      )}

      {showNewVacancy && (
        <div className="new-vacancy-form">
          <h3>Создание новой вакансии</h3>
          <form onSubmit={handleAddVacancy}>
            <div className="form-row">
              <div className="form-group">
                <label>Должность *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                  placeholder="Например: React Developer"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Зарплата *</label>
                <input
                  type="text"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                  placeholder="Например: $80,000 - $120,000"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Локация</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                  placeholder="Город или 'Удалённо'"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Тип занятости</label>
                <select 
                  value={newJob.type}
                  onChange={(e) => setNewJob({...newJob, type: e.target.value})}
                  className="filter-select"
                >
                  <option value="Полная занятость">Полная занятость</option>
                  <option value="Неполный день">Неполный день</option>
                  <option value="Контракт">Контракт</option>
                  <option value="Удалённо">Удалённо</option>
                  <option value="Гибридно">Гибридно</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Описание вакансии *</label>
              <textarea
                value={newJob.description}
                onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                placeholder="Опишите требования к кандидату и обязанности..."
                className="form-textarea"
                rows="5"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Стадия стартапа</label>
                <select
                  value={newJob.startupStage}
                  onChange={(e) => setNewJob({...newJob, startupStage: e.target.value})}
                  className="filter-select"
                >
                  <option value="idea">Idea</option>
                  <option value="mvp">MVP</option>
                  <option value="growth">Growth</option>
                </select>
              </div>
              <div className="form-group">
                <label>Темп команды</label>
                <select
                  value={newJob.teamPace}
                  onChange={(e) => setNewJob({...newJob, teamPace: e.target.value})}
                  className="filter-select"
                >
                  <option value="calm">Спокойный</option>
                  <option value="balanced">Сбалансированный</option>
                  <option value="fast">Очень быстрый</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">Опубликовать</button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => setShowNewVacancy(false)}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stats-section">
        <div className="stat-card">
          <h4>Всего вакансий</h4>
          <p className="stat-number">{stats.total}</p>
        </div>
        <div className="stat-card">
          <h4>Активных</h4>
          <p className="stat-number">{stats.active}</p>
        </div>
        <div className="stat-card">
          <h4>Откликов</h4>
          <p className="stat-number">{stats.totalApplications}</p>
        </div>
        <div className="stat-card">
          <h4>Просмотров</h4>
          <p className="stat-number">{stats.totalViews}</p>
        </div>
      </div>

      <h3 className="section-title">Мои вакансии</h3>
      <div className="vacancies-list">
        {vacancies.length > 0 ? (
          vacancies.map(vacancy => (
              <div key={vacancy.id} className="vacancy-card">
              <div className="vacancy-header">
                <div className="job-header-main">
                  <h4 className="vacancy-title">{vacancy.title}</h4>
                  <div className={`job-salary-badge ${vacancy.salary ? '' : 'is-empty'}`}>
                    <span className="job-salary-label">Зарплата</span>
                    <span className="job-salary-value">{vacancy.salary || 'Не указана'}</span>
                  </div>
                </div>
                <span className={`status-badge ${vacancy.status.toLowerCase()}`}>
                  {moderationLabel(vacancy)}
                </span>
              </div>
              {vacancy.moderationComment && (
                <p className="vacancy-description" style={{ marginTop: '0.4rem', color: '#92400e' }}>
                  Комментарий модератора: {vacancy.moderationComment}
                </p>
              )}

              <p className="vacancy-location">{vacancy.location}</p>
              <div className="job-pulse">
                <span className="pulse-chip">Стадия: {pulseLabels.stage[vacancy.startupStage] || 'MVP'}</span>
                <span className="pulse-chip">Темп: {pulseLabels.pace[vacancy.teamPace] || 'Сбалансированный'}</span>
              </div>
              <p className="vacancy-description">{vacancy.description.substring(0, 120)}...</p>

              <div className="vacancy-stats">
                <span>Откликов: {vacancy.applications || 0}</span>
                <span>Просмотров: {vacancy.views || 0}</span>
                <span>{new Date(vacancy.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>

              <div className="vacancy-actions">
                <button 
                  className="edit-btn"
                  onClick={() => setSelectedVacancy(vacancy)}
                >
                  Заявки ({vacancy.applications || 0})
                </button>
                <button
                  className="view-btn"
                  onClick={() => setEditingVacancy(vacancy)}
                >
                  Редактировать
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleToggleVacancy(vacancy)}
                  disabled={vacancy.moderationStatus !== 'approved'}
                >
                  {vacancy.status === 'active' ? 'Приостановить' : 'Запустить'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>У вас ещё нет вакансий. Опубликуйте первую вакансию.</p>
          </div>
        )}
      </div>

      {selectedVacancy && (
        <ApplicationsViewer 
          vacancyId={selectedVacancy.id}
          vacancyTitle={selectedVacancy.title}
          onClose={() => setSelectedVacancy(null)}
          onStartChat={(conversation) => {
            setSelectedVacancy(null)
            setChatPreset(conversation)
            setShowChat(true)
          }}
        />
      )}
      {editingVacancy && (
        <VacancyDetails
          vacancy={editingVacancy}
          onClose={() => setEditingVacancy(null)}
          onUpdate={handleUpdateVacancy}
          isEmployer={true}
        />
      )}
      {showChat && (
        <ChatPanel
          user={user}
          preselectedConversation={chatPreset}
          onClose={() => {
            setShowChat(false)
            setChatPreset(null)
          }}
        />
      )}
    </div>
  )
}

export default EmployerDashboard
