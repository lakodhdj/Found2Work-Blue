import React, { useEffect, useMemo, useState } from 'react'
import { getUserApplications } from '../utils/applicationManager'
import { getAllVacancies, getSavedJobs, saveJob, unsaveJob } from '../utils/vacancyManager'
import { computeVacancyMatch } from '../utils/matchScore'
import {
  getBlockedEmployers,
  blockEmployer,
  unblockEmployer,
  getHiddenVacancies,
  hideVacancy,
  unhideVacancy
} from '../utils/seekerPreferences'
import UserProfile from './UserProfile'
import VacancyDetails from './VacancyDetails'
import ChatPanel from './ChatPanel'
import '../styles/Dashboard.css'

function canonEmploymentType(type) {
  const map = {
    'full-time': 'Полная занятость',
    'part-time': 'Неполный день',
    contract: 'Контракт',
    remote: 'Удалённо',
    hybrid: 'Гибридно'
  }
  return map[type] || type
}

function UserDashboard({ user }) {
  const pulseLabels = {
    stage: { idea: 'Idea', mvp: 'MVP', growth: 'Growth' },
    pace: { calm: 'Спокойный', balanced: 'Сбалансированный', fast: 'Очень быстрый' }
  }

  const employmentTypeLabels = {
    'full-time': 'Полная занятость',
    'part-time': 'Неполный день',
    contract: 'Контракт',
    remote: 'Удалённо',
    hybrid: 'Гибридно'
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [filterType, setFilterType] = useState('')
  const [salaryFrom, setSalaryFrom] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showVacancyDetails, setShowVacancyDetails] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatPreset, setChatPreset] = useState(null)
  const [selectedVacancy, setSelectedVacancy] = useState(null)
  const [jobs, setJobs] = useState([])
  const [savedJobs, setSavedJobs] = useState([])
  const [userApplications, setUserApplications] = useState([])
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [blockedEmployers, setBlockedEmployers] = useState([])
  const [hiddenVacancyIds, setHiddenVacancyIds] = useState([])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const loadData = async () => {
    const [vacancies, applications, saved, blocked, hidden] = await Promise.all([
      getAllVacancies(),
      getUserApplications(user.id),
      getSavedJobs(user.id),
      getBlockedEmployers(user.id),
      getHiddenVacancies(user.id)
    ])
    setJobs(Array.isArray(vacancies) ? vacancies : [])
    setUserApplications(Array.isArray(applications) ? applications : [])
    setSavedJobs((saved || []).map((item) => item.vacancyId))
    setBlockedEmployers((blocked || []).map(Number))
    setHiddenVacancyIds((hidden || []).map(Number))
  }

  useEffect(() => {
    loadData()
  }, [user.id])

  const hasApplied = (jobId) => userApplications.some((app) => app.vacancyId === jobId)

  const parseSalary = (value) => {
    if (!value) return 0
    const numbers = String(value).match(/\d+/g)
    return numbers ? Number(numbers[0]) : 0
  }

  const visibleJobs = useMemo(() => {
    const blocked = new Set(blockedEmployers.map(Number))
    const hidden = new Set(hiddenVacancyIds.map(Number))
    return jobs.filter((job) => !blocked.has(Number(job.employerId)) && !hidden.has(Number(job.id)))
  }, [jobs, blockedEmployers, hiddenVacancyIds])

  const recommendations = useMemo(() => {
    const skills = `${user.skills || ''} ${user.specialization || ''}`.toLowerCase()
    if (!skills.trim()) return visibleJobs.slice(0, 4)
    return visibleJobs
      .filter((job) => {
        const source = `${job.title} ${job.description} ${job.requirements || ''}`.toLowerCase()
        return skills.split(',').some((item) => item.trim() && source.includes(item.trim()))
      })
      .slice(0, 6)
  }, [visibleJobs, user.skills, user.specialization])

  const baseFilteredJobs = useMemo(() => {
    return visibleJobs.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
      const matchLocation = !filterLocation || job.location.toLowerCase().includes(filterLocation.toLowerCase())
      const canon = canonEmploymentType(job.type)
      const matchType = !filterType || canon === filterType || job.type === filterType
      const matchSalary = !salaryFrom || parseSalary(job.salary) >= Number(salaryFrom)
      return matchSearch && matchLocation && matchType && matchSalary
    })
  }, [visibleJobs, searchTerm, filterLocation, filterType, salaryFrom])

  const filteredJobs = useMemo(() => {
    if (activeTab === 'saved') {
      return baseFilteredJobs.filter((job) => savedJobs.includes(job.id))
    }
    if (activeTab === 'recommended') {
      const ids = new Set(recommendations.map((job) => job.id))
      return baseFilteredJobs.filter((job) => ids.has(job.id))
    }
    return baseFilteredJobs
  }, [activeTab, baseFilteredJobs, savedJobs, recommendations])

  const toggleSaveJob = async (jobId) => {
    if (savedJobs.includes(jobId)) {
      await unsaveJob(user.id, jobId)
      setSavedJobs((prev) => prev.filter((id) => id !== jobId))
      showNotification('Вакансия удалена из избранного')
      return
    }
    await saveJob(user.id, jobId)
    setSavedJobs((prev) => [...prev, jobId])
    showNotification('Вакансия добавлена в избранное')
  }

  const handleHideVacancy = async (job) => {
    const res = await hideVacancy(user.id, job.id)
    if (res.success !== false && !res.error) {
      setHiddenVacancyIds((prev) => [...new Set([...prev, Number(job.id)])])
      showNotification('Вакансия скрыта из ленты')
    } else showNotification(res.error || 'Не удалось скрыть', 'error')
  }

  const handleBlockCompany = async (job) => {
    const eid = Number(job.employerId)
    if (!eid) {
      showNotification('Не удалось определить работодателя', 'error')
      return
    }
    const res = await blockEmployer(user.id, eid)
    if (res.success !== false && !res.error) {
      setBlockedEmployers((prev) => [...new Set([...prev, eid])])
      showNotification(`Все вакансии «${job.company}» скрыты`)
    } else showNotification(res.error || 'Ошибка', 'error')
  }

  return (
    <div className="dashboard">
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="dashboard-header">
        <h2>Вакансии</h2>
        <div className="header-actions">
          <button className="profile-toggle" onClick={() => setShowProfileModal(true)}>
            Профиль
          </button>
          <button className="new-vacancy-btn" onClick={() => setShowChat(true)}>
            Сообщения
          </button>
        </div>
      </div>

      {showProfileModal && (
        <UserProfile user={user} onClose={() => setShowProfileModal(false)} />
      )}

      {showVacancyDetails && selectedVacancy && (
        <VacancyDetails
          vacancy={selectedVacancy}
          onClose={() => {
            setShowVacancyDetails(false)
            setSelectedVacancy(null)
          }}
          isEmployer={false}
          user={user}
          onApplySuccess={loadData}
          hasApplied={hasApplied(selectedVacancy.id)}
          onStartChat={(conversation) => {
            setShowVacancyDetails(false)
            setSelectedVacancy(null)
            setChatPreset(conversation)
            setShowChat(true)
          }}
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

      <div className="applications-filter">
        <button className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          Все
        </button>
        <button className={`filter-btn ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
          Избранное ({savedJobs.length})
        </button>
        <button
          className={`filter-btn ${activeTab === 'recommended' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommended')}
        >
          Рекомендации ({recommendations.length})
        </button>
      </div>

      <div className="search-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Поиск по должности или компании"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <input
            type="text"
            placeholder="Город"
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="search-input"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="">Тип занятости</option>
            <option value="Полная занятость">Полная занятость</option>
            <option value="Неполный день">Неполный день</option>
            <option value="Контракт">Контракт</option>
            <option value="Удалённо">Удалённо</option>
            <option value="Гибридно">Гибридно</option>
          </select>
          <input
            type="number"
            min="0"
            placeholder="Зарплата от"
            value={salaryFrom}
            onChange={(e) => setSalaryFrom(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="results-count">
          Найдено вакансий: <strong>{filteredJobs.length}</strong>
        </div>

        <details className="seeker-hidden-panel">
          <summary>
            Скрытые вакансии и компании ({hiddenVacancyIds.length + blockedEmployers.length})
          </summary>
          <div className="seeker-hidden-panel-body">
            {hiddenVacancyIds.length === 0 && blockedEmployers.length === 0 ? (
              <p className="seeker-hidden-empty">Пока ничего не скрыто.</p>
            ) : (
              <>
                {hiddenVacancyIds.map((id) => {
                  const title = jobs.find((j) => Number(j.id) === id)?.title || `Вакансия #${id}`
                  return (
                    <div key={`h-${id}`} className="seeker-hidden-row">
                      <span>{title}</span>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={async () => {
                          await unhideVacancy(user.id, id)
                          setHiddenVacancyIds((prev) => prev.filter((x) => x !== id))
                          showNotification('Вакансия снова в ленте')
                        }}
                      >
                        Вернуть
                      </button>
                    </div>
                  )
                })}
                {blockedEmployers.map((eid) => {
                  const sample = jobs.find((j) => Number(j.employerId) === eid)
                  const label = sample?.company || `Работодатель #${eid}`
                  return (
                    <div key={`b-${eid}`} className="seeker-hidden-row">
                      <span>Вся компания: {label}</span>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={async () => {
                          await unblockEmployer(user.id, eid)
                          setBlockedEmployers((prev) => prev.filter((x) => x !== eid))
                          showNotification('Компания снова показывается')
                        }}
                      >
                        Разблокировать
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </details>
      </div>

      <div className="jobs-list">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => {
            const { percent, reasons } = computeVacancyMatch(user, job)
            return (
            <div key={job.id} className="job-card">
              <div className="job-header">
                <div className="job-header-main">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                  <div className={`job-salary-badge ${job.salary ? '' : 'is-empty'}`}>
                    <span className="job-salary-label">Зарплата</span>
                    <span className="job-salary-value">{job.salary || 'Не указана'}</span>
                  </div>
                </div>
                <button
                  className={`save-btn ${savedJobs.includes(job.id) ? 'saved' : ''}`}
                  onClick={() => toggleSaveJob(job.id)}
                  title={savedJobs.includes(job.id) ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  {savedJobs.includes(job.id) ? '★' : '☆'}
                </button>
              </div>

              <p className="job-description">{job.description}</p>

              <div className="job-pulse">
                <span className="pulse-chip">Стадия: {pulseLabels.stage[job.startupStage] || 'MVP'}</span>
                <span className="pulse-chip">Темп: {pulseLabels.pace[job.teamPace] || 'Сбалансированный'}</span>
              </div>

              <div className="match-score">
                Матч профиля: <strong>{percent}%</strong>{' '}
                <span className="match-transparent-hint" title="Правила скоринга прозрачны — см. разбор ниже">
                  (прозрачный скоринг)
                </span>
              </div>
              <ul className="match-breakdown">
                {reasons.slice(0, 4).map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>

              <div className="job-meta">
                <span className="meta-item">{job.location}</span>
                <span className="meta-item">{employmentTypeLabels[job.type] || job.type}</span>
              </div>

              <div className="job-actions job-actions-split">
                <button className="details-btn" onClick={() => {
                  setSelectedVacancy(job)
                  setShowVacancyDetails(true)
                }}>
                  Подробнее
                </button>
                <div className="job-secondary-actions">
                  <button type="button" className="link-btn" onClick={() => handleHideVacancy(job)}>
                    Скрыть вакансию
                  </button>
                  <button type="button" className="link-btn" onClick={() => handleBlockCompany(job)}>
                    Скрыть компанию
                  </button>
                </div>
              </div>
            </div>
            )
          })
        ) : (
          <div className="no-results">
            <p>Вакансии не найдены. Попробуйте изменить условия фильтрации.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserDashboard
