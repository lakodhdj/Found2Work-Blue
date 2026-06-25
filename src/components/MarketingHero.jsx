import React from 'react'

/** Тексты позиционирования — над формой входа или на отдельном лендинге */
export function MarketingHero({ showActions = false, onOpenLogin, onOpenRegister }) {
  return (
    <section className="hero marketing-hero-embedded">
      <div className="hero-content">
        <p className="hero-badge">Платформа трудоустройства в стартапы</p>
        <h1>Found2Work</h1>
        <p className="hero-subtitle">
          Находите вакансии в стартапах, где ваш вклад влияет на продукт с первого дня.
        </p>
        {showActions && (onOpenLogin || onOpenRegister) && (
          <div className="hero-actions">
            {onOpenLogin && (
              <button type="button" className="hero-btn primary" onClick={onOpenLogin}>
                Войти
              </button>
            )}
            {onOpenRegister && (
              <button type="button" className="hero-btn secondary" onClick={onOpenRegister}>
                Зарегистрироваться
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
