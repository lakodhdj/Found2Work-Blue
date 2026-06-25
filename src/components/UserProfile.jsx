import React, { useState } from 'react'
import { updateUserProfile } from '../utils/userManager'
import '../styles/Dashboard.css'

function UserProfile({ user, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    city: user.city || '',
    specialization: user.specialization || '',
    experience: user.experience || '',
    about: user.about || '',
    resumeFile: user.resumeFile || null,
    resumeFileName: user.resumeFileName || '',
    skills: user.skills || '',
    companySize: user.companySize || '',
    industry: user.industry || ''
  })
  const [resumeBuilder, setResumeBuilder] = useState({
    desiredPosition: user.desiredPosition || '',
    education: user.education || '',
    portfolio: user.portfolio || ''
  })

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData({
          ...formData,
          resumeFile: event.target.result,
          resumeFileName: file.name
        })
      }
      reader.readAsDataURL(file)
    } else {
      alert('Пожалуйста, загрузите PDF файл')
    }
  }

  const handleSave = async () => {
    const result = await updateUserProfile(user.id, { ...formData, ...resumeBuilder })
    if (result.success) {
      setSaveSuccess(true)
      setTimeout(() => {
        setIsEditing(false)
        setSaveSuccess(false)
      }, 2000)
    }
  }

  const downloadResume = () => {
    if (formData.resumeFile) {
      const link = document.createElement('a')
      link.href = formData.resumeFile
      link.download = formData.resumeFileName || 'resume.pdf'
      link.click()
    }
  }

  const clearResume = () => {
    setFormData({
      ...formData,
      resumeFile: null,
      resumeFileName: ''
    })
  }

  const exportResumeText = () => {
    const lines = [
      `Имя: ${formData.name}`,
      `Email: ${user.email}`,
      `Телефон: ${formData.phone || '-'}`,
      `Город: ${formData.city || '-'}`,
      `Желаемая должность: ${resumeBuilder.desiredPosition || '-'}`,
      `Опыт: ${formData.experience || '-'}`,
      `Специализация: ${formData.specialization || '-'}`,
      `Навыки: ${formData.skills || '-'}`,
      `Образование: ${resumeBuilder.education || '-'}`,
      `Портфолио: ${resumeBuilder.portfolio || '-'}`,
      '',
      'Обо мне:',
      formData.about || '-'
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${(formData.name || 'resume').replace(/\s+/g, '_')}_resume.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="profile-modal">
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h2>{user.type === 'user' ? 'Профиль соискателя' : user.type === 'employer' ? 'Профиль работодателя' : 'Профиль пользователя'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {saveSuccess && <div className="success-notification">✓ Профиль успешно обновлён!</div>}

        <div className="profile-form">
          {!isEditing ? (
            <div className="profile-view">
              <div className="profile-grid">
                <div className="profile-field">
                  <label>Имя</label>
                  <p>{formData.name}</p>
                </div>
                <div className="profile-field">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="profile-field">
                  <label>Телефон</label>
                  <p>{formData.phone || 'Не указано'}</p>
                </div>
                <div className="profile-field">
                  <label>Город</label>
                  <p>{formData.city || 'Не указано'}</p>
                </div>

                {user.type === 'user' && (
                  <>
                    <div className="profile-field">
                      <label>Специализация</label>
                      <p>{formData.specialization || 'Не указано'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Опыт работы</label>
                      <p>{formData.experience || 'Не указано'}</p>
                    </div>
                  </>
                )}

                {user.type === 'employer' && (
                  <>
                    <div className="profile-field">
                      <label>Размер компании</label>
                      <p>{formData.companySize || 'Не указано'}</p>
                    </div>
                    <div className="profile-field">
                      <label>Индустрия</label>
                      <p>{formData.industry || 'Не указано'}</p>
                    </div>
                  </>
                )}
              </div>

              {user.type === 'user' && (
                <>
                  <div className="profile-field full-width">
                    <label>Обо мне</label>
                    <p className="about-text">{formData.about || 'Не указано'}</p>
                  </div>

                  <div className="profile-field full-width">
                    <label>Навыки</label>
                    <p className="skills-text">{formData.skills || 'Не указано'}</p>
                  </div>

                  <div className="profile-field full-width">
                    <label>Резюме (PDF)</label>
                    {formData.resumeFile ? (
                      <div className="resume-section">
                        <p className="resume-file">{formData.resumeFileName}</p>
                        <button className="download-btn" onClick={downloadResume}>Скачать резюме</button>
                  <div className="profile-field full-width">
                    <label>Резюме на сайте</label>
                    <p>
                      Желаемая должность: {resumeBuilder.desiredPosition || 'Не указано'}
                    </p>
                    <p>
                      Образование: {resumeBuilder.education || 'Не указано'}
                    </p>
                    <p>
                      Портфолио: {resumeBuilder.portfolio || 'Не указано'}
                    </p>
                    <button className="details-btn" onClick={exportResumeText}>Скачать резюме (TXT)</button>
                  </div>
                      </div>
                    ) : (
                      <p style={{color: '#999'}}>Резюме не загружено</p>
                    )}
                  </div>
                </>
              )}

              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                Редактировать профиль
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}>
              <div className="form-group">
                <label>Имя *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+7 (900) 123-45-67"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Город</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Москва"
                    className="form-input"
                  />
                </div>
              </div>

              {user.type === 'user' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Специализация</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        placeholder="JavaScript Developer, Product Manager и т.д."
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>Опыт работы</label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        className="filter-select"
                      >
                        <option value="">Выберите</option>
                        <option value="Без опыта">Без опыта</option>
                        <option value="0-1 года">0-1 года</option>
                        <option value="1-3 года">1-3 года</option>
                        <option value="3-5 лет">3-5 лет</option>
                        <option value="5+ лет">5+ лет</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Навыки (через запятую)</label>
                    <input
                      type="text"
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="React, Node.js, SQL, ..."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Обо мне</label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({...formData, about: e.target.value})}
                      placeholder="Расскажите о себе, вашем опыте и интересующих вас позициях"
                      className="form-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="form-group">
                    <label>Загрузите резюме (PDF)</label>
                    <div className="file-upload-section">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="file-input"
                        id="resume-file"
                      />
                      <label htmlFor="resume-file" className="file-label">
                        {formData.resumeFileName ? formData.resumeFileName : 'Выберите PDF файл'}
                  <div className="form-group">
                    <label>Желаемая должность</label>
                    <input
                      type="text"
                      value={resumeBuilder.desiredPosition}
                      onChange={(e) => setResumeBuilder({ ...resumeBuilder, desiredPosition: e.target.value })}
                      placeholder="Например, Frontend Developer"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Образование</label>
                    <textarea
                      value={resumeBuilder.education}
                      onChange={(e) => setResumeBuilder({ ...resumeBuilder, education: e.target.value })}
                      placeholder="ВУЗ, курсы, сертификаты"
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Портфолио / ссылка</label>
                    <input
                      type="text"
                      value={resumeBuilder.portfolio}
                      onChange={(e) => setResumeBuilder({ ...resumeBuilder, portfolio: e.target.value })}
                      placeholder="https://..."
                      className="form-input"
                    />
                  </div>
                      </label>
                      {formData.resumeFileName && (
                        <button 
                          type="button" 
                          className="clear-file-btn"
                          onClick={clearResume}
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {user.type === 'employer' && (
                <>
                  <div className="form-group">
                    <label>Размер компании</label>
                    <select
                      value={formData.companySize}
                      onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                      className="filter-select"
                    >
                      <option value="">Выберите</option>
                      <option value="1-10">1-10 человек</option>
                      <option value="11-50">11-50 человек</option>
                      <option value="51-200">51-200 человек</option>
                      <option value="201-500">201-500 человек</option>
                      <option value="500+">500+ человек</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Индустрия</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      placeholder="IT, Образование, Медицина и т.д."
                      className="form-input"
                    />
                  </div>
                </>
              )}

              <div className="form-actions">
                <button type="submit" className="submit-btn">Сохранить</button>
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
