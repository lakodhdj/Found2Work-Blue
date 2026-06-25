import React, { useMemo, useState } from 'react'
import { applyForVacancy } from '../utils/applicationManager'
import { computeVacancyMatch } from '../utils/matchScore'

function VacancyDetails({
  vacancy,
  onClose,
  onUpdate,
  isEmployer = false,
  user = null,
  onApplySuccess = null,
  hasApplied = false,
  onStartChat = null
}) {
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

  const [isEditing, setIsEditing] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [editedData, setEditedData] = useState(vacancy)
  const [applicationForm, setApplicationForm] = useState({
    coverLetter: ''
  })
  const [applySuccess, setApplySuccess] = useState(false)

  const matchInfo = useMemo(() => {
    if (isEmployer || !user) return null
    return computeVacancyMatch(user, vacancy)
  }, [isEmployer, user, vacancy])

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedData)
    }
    setIsEditing(false)
  }

  const handleChange = (field, value) => {
    setEditedData({...editedData, [field]: value})
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!user) return
    
    try {
      const result = await applyForVacancy(user.id, vacancy.id, applicationForm.coverLetter)
      if (result.success) {
        setApplySuccess(true)
        setTimeout(() => {
          if (onApplySuccess) onApplySuccess()
          onClose()
        }, 1500)
      } else {
        alert('Ошибка при отправке заявки: ' + (result.error || 'Неизвестная ошибка'))
      }
    } catch (error) {
      alert('Ошибка при отправке заявки: ' + error.message)
      console.error('Apply error:', error)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Редактирование' : 'Детали вакансии'}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {isEditing ? (
            // Режим редактирования
            <div className="vacancy-edit-form">
              <div className="form-group">
                <label>Должность *</label>
                <input
                  type="text"
                  value={editedData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Зарплата *</label>
                  <input
                    type="text"
                    value={editedData.salary}
                    onChange={(e) => handleChange('salary', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Локация</label>
                  <input
                    type="text"
                    value={editedData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Тип занятости</label>
                <select 
                  value={editedData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="filter-select"
                >
                  <option value="Полная занятость">Полная занятость</option>
                  <option value="Неполный день">Неполный день</option>
                  <option value="Контракт">Контракт</option>
                  <option value="Удалённо">Удалённо</option>
                  <option value="Гибридно">Гибридно</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Стадия стартапа</label>
                  <select
                    value={editedData.startupStage || 'mvp'}
                    onChange={(e) => handleChange('startupStage', e.target.value)}
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
                    value={editedData.teamPace || 'balanced'}
                    onChange={(e) => handleChange('teamPace', e.target.value)}
                    className="filter-select"
                  >
                    <option value="calm">Спокойный</option>
                    <option value="balanced">Сбалансированный</option>
                    <option value="fast">Очень быстрый</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Описание *</label>
                <textarea
                  value={editedData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="form-textarea"
                  rows="6"
                />
              </div>

              <div className="form-group">
                <label>Требования к кандидату</label>
                <textarea
                  value={editedData.requirements || ''}
                  onChange={(e) => handleChange('requirements', e.target.value)}
                  className="form-textarea"
                  rows="4"
                  placeholder="Список требований, разделённые новой строкой..."
                />
              </div>

              <div className="form-actions">
                <button className="submit-btn" onClick={handleSave}>Сохранить</button>
                <button className="cancel-btn" onClick={() => setIsEditing(false)}>Отмена</button>
              </div>
            </div>
          ) : (
            // Режим просмотра
            <div className="vacancy-view">
              <div className="vacancy-title-section">
                <h2>{vacancy.title}</h2>
                <p className="vacancy-company">{vacancy.company}</p>
              </div>

              <div className="vacancy-meta-full">
                <div className="meta-box meta-box-salary">
                  <span className="meta-label">Зарплата</span>
                  <span className="meta-value">{vacancy.salary || 'Не указана'}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Локация</span>
                  <span className="meta-value">{vacancy.location}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Тип занятости</span>
                  <span className="meta-value">{employmentTypeLabels[vacancy.type] || vacancy.type}</span>
                </div>
                <div className="meta-box">
                  <span className="meta-label">Статус</span>
                  <span className="meta-value" style={{
                    color: vacancy.status === 'Активна' ? '#10b981' : '#ef4444'
                  }}>
                    {vacancy.status}
                  </span>
                </div>
              </div>

              <div className="job-pulse">
                <span className="pulse-chip">Стадия: {pulseLabels.stage[vacancy.startupStage] || 'MVP'}</span>
                <span className="pulse-chip">Темп: {pulseLabels.pace[vacancy.teamPace] || 'Сбалансированный'}</span>
              </div>

              {matchInfo && (
                <div className="match-detail-box">
                  <h4>Матч с вашим профилем: {matchInfo.percent}%</h4>
                  <p className="match-algo-note">
                    Алгоритм простой и прозрачный: суммируются баллы за совпадение навыков с текстом вакансии,
                    город или удалённый формат, совпадение с желаемой должностью и небольшой фактор стадии стартапа.
                    Это не машинное обучение — правила фиксированы в коде.
                  </p>
                  <ul className="match-breakdown">
                    {matchInfo.reasons.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="stats-full">
                <div className="stat-box">
                  <h4>Просмотры</h4>
                  <p>{vacancy.views || 0}</p>
                </div>
                <div className="stat-box">
                  <h4>Откликов</h4>
                  <p>{vacancy.applications || 0}</p>
                </div>
                <div className="stat-box">
                  <h4>Опубликована</h4>
                  <p>{new Date(vacancy.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <div className="description-section">
                <h4>Описание вакансии</h4>
                <p>{vacancy.description}</p>
              </div>

              {vacancy.requirements && (
                <div className="requirements-section">
                  <h4>Требования</h4>
                  <ul>
                    {vacancy.requirements.split('\n').map((req, idx) => (
                      req.trim() && <li key={idx}>{req.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isEmployer && (
                <div className="vacancy-actions-full">
                  <button className="edit-btn" onClick={() => setIsEditing(true)}>Редактировать</button>
                  <button className="cancel-btn" onClick={onClose}>Закрыть</button>
                </div>
              )}

              {!isEmployer && (
                <div className="apply-section">
                  {!isApplying ? (
                    <div className="apply-buttons">
                      {hasApplied ? (
                        <button className="apply-btn" disabled style={{opacity: 0.6}}>
                          ✓ Вы уже откликнулись на эту вакансию
                        </button>
                      ) : (
                        <button 
                          className="apply-btn"
                          onClick={() => setIsApplying(true)}
                        >
                          Откликнуться
                        </button>
                      )}
                      <button
                        className="details-btn"
                        onClick={() => onStartChat?.({
                          partnerId: Number(vacancy.employerId),
                          partnerName: vacancy.company,
                          vacancyId: Number(vacancy.id),
                          vacancyTitle: vacancy.title,
                          vacancyCompany: vacancy.company
                        })}
                      >
                        Написать работодателю
                      </button>
                      <button className="details-btn" onClick={onClose}>Закрыть</button>
                    </div>
                  ) : (
                    <form onSubmit={handleApply} className="apply-form">
                      {applySuccess && (
                        <div className="apply-success">Ваша заявка отправлена работодателю</div>
                      )}
                      
                      <div className="form-group">
                        <label>Сопроводительное письмо (опционально)</label>
                        <textarea
                          value={applicationForm.coverLetter}
                          onChange={(e) => setApplicationForm({...applicationForm, coverLetter: e.target.value})}
                          placeholder="Расскажите работодателю, почему вас интересует именно эта позиция..."
                          className="form-textarea"
                          rows="5"
                        />
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="submit-btn">Отправить заявку</button>
                        <button 
                          type="button"
                          className="cancel-btn"
                          onClick={() => setIsApplying(false)}
                        >
                          Отмена
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VacancyDetails
