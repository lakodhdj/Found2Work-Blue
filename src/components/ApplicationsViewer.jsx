import React, { useState, useEffect } from 'react'
import { getVacancyApplications, updateApplicationStatus } from '../utils/applicationManager'

function ApplicationsViewer({ vacancyId, vacancyTitle, onClose, onStartChat }) {
  const [applications, setApplications] = useState([])
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadApplications = async () => {
      const vacancyApps = await getVacancyApplications(vacancyId)
      setApplications(vacancyApps)
    }
    loadApplications()
  }, [vacancyId])

  const filteredApplications = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.status === filterStatus)

  const handleStatusChange = (appId, newStatus) => {
    updateApplicationStatus(appId, newStatus)
    const updated = applications.map(app =>
      app.id === appId ? {...app, status: newStatus} : app
    )
    setApplications(updated)
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Принята':
        return '#10b981'
      case 'Отклонена':
        return '#ef4444'
      case 'На рассмотрении':
        return '#f59e0b'
      default:
        return '#6366f1'
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Заявки на вакансию: {vacancyTitle}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="applications-filter">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Все ({applications.length})
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'Новая' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Новая')}
            >
              Новые
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'На рассмотрении' ? 'active' : ''}`}
              onClick={() => setFilterStatus('На рассмотрении')}
            >
              На рассмотрении
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'Принята' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Принята')}
            >
              Принято
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'Отклонена' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Отклонена')}
            >
              Отклонено
            </button>
          </div>

          <div className="applications-list">
            {filteredApplications.length > 0 ? (
              filteredApplications.map(app => (
                <div key={app.id} className="application-card">
                  <div className="app-header">
                    <div>
                      <p className="app-applicant">{app.applicantName || `Соискатель #${app.userId}`}</p>
                      <p className="app-message">{app.coverLetter || 'Сопроводительное письмо не добавлено'}</p>
                      <p className="app-date">{app.applicantEmail}</p>
                    </div>
                    <select 
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="app-status-select"
                      style={{ borderColor: getStatusColor(app.status) }}
                    >
                      <option value="Новая">Новая</option>
                      <option value="На рассмотрении">На рассмотрении</option>
                      <option value="Принята">Принята</option>
                      <option value="Отклонена">Отклонена</option>
                    </select>
                  </div>
                  {app.applicantResumeFile && (
                    <button
                      className="details-btn"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = app.applicantResumeFile
                        link.download = app.applicantResumeFileName || 'resume.pdf'
                        link.click()
                      }}
                    >
                      Открыть резюме
                    </button>
                  )}
                  <button
                    className="edit-btn"
                    onClick={() => onStartChat?.({
                      partnerId: Number(app.userId),
                      partnerName: app.applicantName,
                      vacancyId: Number(app.vacancyId),
                      vacancyTitle
                    })}
                  >
                    Написать кандидату
                  </button>
                  <p className="app-date">Дата: {new Date(app.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>Заявок не найдено</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApplicationsViewer