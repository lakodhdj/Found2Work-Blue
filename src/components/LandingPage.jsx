import React, { useEffect, useState } from 'react'
import { getAllVacancies } from '../utils/vacancyManager'
import { MarketingHero } from './MarketingHero'

function LandingPage({ onOpenAuth }) {
  const [vacancies, setVacancies] = useState([])

  useEffect(() => {
    const loadVacancies = async () => {
      const data = await getAllVacancies()
      setVacancies(Array.isArray(data) ? data.slice(0, 8) : [])
    }
    loadVacancies()
  }, [])

  return (
    <div className="landing-page">
      <header className="landing-topbar">
        <div className="landing-topbar-inner">
          <div className="landing-logo">Found2Work</div>
          <div className="landing-topbar-actions">
            <button className="hero-btn secondary" onClick={() => onOpenAuth('login')}>Войти</button>
            <button className="hero-btn primary" onClick={() => onOpenAuth('register')}>Регистрация</button>
          </div>
        </div>
      </header>

      <MarketingHero
        showActions
        onOpenLogin={() => onOpenAuth('login')}
        onOpenRegister={() => onOpenAuth('register')}
      />

      <section className="landing-section">
        <div className="landing-feature-grid">
          <article className="landing-feature-card">
            <h3>Фокус на стартапы</h3>
            <p>Только роли с быстрым ростом и влиянием на продукт.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Прямой контакт</h3>
            <p>Соискатель и работодатель общаются напрямую в чате платформы.</p>
          </article>
          <article className="landing-feature-card">
            <h3>Проверка вакансий</h3>
            <p>Каждая новая вакансия проходит модерацию перед публикацией.</p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <h2>Актуальные вакансии стартапов</h2>
        <div className="landing-vacancies">
          {vacancies.length > 0 ? (
            vacancies.map((vacancy) => (
              <div key={vacancy.id} className="landing-vacancy-card">
                <h3>{vacancy.title}</h3>
                <p className="company">{vacancy.company}</p>
                <div className={`job-salary-badge ${vacancy.salary ? '' : 'is-empty'}`}>
                  <span className="job-salary-label">Зарплата</span>
                  <span className="job-salary-value">{vacancy.salary || 'Не указана'}</span>
                </div>
                <p className="description">{vacancy.description}</p>
                <div className="meta">
                  <span>{vacancy.location}</span>
                  <span>{vacancy.type}</span>
                </div>
                <button className="hero-btn primary small" onClick={() => onOpenAuth('register')}>
                  Отправить заявку
                </button>
              </div>
            ))
          ) : (
            <p>Сейчас вакансии обновляются. Проверьте чуть позже.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default LandingPage
