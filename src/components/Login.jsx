import React, { useState } from 'react'
import { loginUser, registerUser } from '../utils/userManager'
import { MarketingHero } from './MarketingHero'
import '../styles/Login.css'

function Login({ onLogin, initialMode = 'login', onBack, showHero = true }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [userType, setUserType] = useState('user')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password) {
      setError('Email и пароль обязательны')
      return
    }

    if (!validateEmail(email)) {
      setError('Введите корректный email')
      return
    }

    try {
      const result = await loginUser(email, password)
      
      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess('Вход выполнен успешно!')
      setTimeout(() => {
        onLogin(result.user.email, result.user.name, result.user.type, result.user)
      }, 500)
    } catch (err) {
      setError('Ошибка при входе: ' + err.message)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !password || !confirmPassword || !name) {
      setError('Все поля обязательны')
      return
    }

    if (!validateEmail(email)) {
      setError('Введите корректный email')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (name.length < 2) {
      setError('Имя должно быть минимум 2 символа')
      return
    }

    if (!agreedToTerms) {
      setError('Подтвердите согласие с пользовательским соглашением')
      return
    }

    try {
      const result = await registerUser(email, password, name, userType, agreedToTerms)

      if (!result.success) {
        setError(result.error)
        return
      }

      setSuccess('Регистрация успешна! Входим в аккаунт…')
      setTimeout(() => {
        const u = result.user
        if (u && onLogin) {
          onLogin(u.email, u.name, u.type, u)
        }
      }, 400)
    } catch (err) {
      setError('Ошибка при регистрации: ' + err.message)
    }
  }

  return (
    <div className={`login-shell ${showHero ? 'login-shell--with-hero' : ''}`}>
      {showHero && <MarketingHero />}
      <div className="login-container">
      <div className="login-card" id="auth-form">
        {onBack && (
          <button type="button" className="auth-back-btn" onClick={onBack}>
            ← Назад
          </button>
        )}
        <div className="login-header">
          <h1 className="login-logo">Вход и регистрация</h1>
          <p className="login-subtitle">Платформа для поиска работы и публикации вакансий</p>
        </div>

        {!isRegister ? (
          <>
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="login-btn">Войти</button>

              <p className="signup-hint">
                Нет аккаунта? <button type="button" onClick={() => {
                  setIsRegister(true)
                  setError('')
                  setSuccess('')
                }} className="signup-link">Зарегистрируйтесь</button>
              </p>
            </form>

            <div className="demo-credentials">
              <p>Демо учётные данные:</p>
              <small>Соискатель: alex@example.com / password123</small>
              <small>Работодатель: hr@techcorp.com / password123</small>
              <small>Администратор: admin@found2work.com / admin123</small>
            </div>
          </>
        ) : (
          <>
            <h2 className="register-title">Регистрация</h2>

            <div className="user-type-selector">
              <label className={`type-btn ${userType === 'user' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  value="user" 
                  checked={userType === 'user'} 
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span>👤 Соискатель</span>
              </label>
              <label className={`type-btn ${userType === 'employer' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  value="employer" 
                  checked={userType === 'employer'} 
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span>🏢 Работодатель</span>
              </label>
            </div>

            <form onSubmit={handleRegister} className="login-form">
              <div className="form-group">
                <label htmlFor="name">Имя / Название компании *</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={userType === 'user' ? 'Иван Петров' : 'My Company LLC'}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Email *</label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Пароль (минимум 6 символов) *</label>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Подтвердите пароль *</label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <label className="checkbox-label terms-checkbox">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span>
                  Я принимаю условия{' '}
                  <a
                    className="signup-link"
                    href="#/agreements"
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    пользовательского соглашения
                  </a>
                </span>
              </label>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="login-btn">Зарегистрироваться</button>

              <p className="signup-hint">
                Уже зарегистрированы? <button type="button" onClick={() => {
                  setIsRegister(false)
                  setError('')
                  setSuccess('')
                  setPassword('')
                  setConfirmPassword('')
                  setName('')
                }} className="signup-link">Войдите</button>
              </p>
            </form>
          </>
        )}
      </div>
      </div>
    </div>
  )
}

export default Login
