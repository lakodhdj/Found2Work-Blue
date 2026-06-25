import React, { useState } from 'react'
import '../styles/Login.css'

function PasswordReset({ onBack }) {
  const [step, setStep] = useState(1) // 1: email, 2: verification, 3: new password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleEmailSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Введите email')
      return
    }

    const users = JSON.parse(localStorage.getItem('found2work_users') || '[]')
    if (!users.some(u => u.email === email)) {
      setError('Пользователь с таким email не найден')
      return
    }

    setSuccess('Если этот email зарегистрирован, вам отправлена инструкция')
    setStep(2)
  }

  const handleCodeSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!code) {
      setError('Введите код подтверждения')
      return
    }

    // В реальном приложении здесь была бы проверка кода
    if (code !== '123456') {
      setError('Неверный код подтверждения')
      return
    }

    setStep(3)
  }

  const handlePasswordReset = (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || !confirmPassword) {
      setError('Заполните все поля')
      return
    }

    if (newPassword.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    // Обновить пароль в localStorage
    const users = JSON.parse(localStorage.getItem('found2work_users') || '[]')
    const hashPassword = (password) => {
      let hash = 0
      for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
      }
      return Math.abs(hash).toString(16)
    }

    const userIndex = users.findIndex(u => u.email === email)
    if (userIndex !== -1) {
      users[userIndex].passwordHash = hashPassword(newPassword)
      localStorage.setItem('found2work_users', JSON.stringify(users))
      
      setSuccess('Пароль успешно изменён! Перенаправляем на вход...')
      setTimeout(() => {
        onBack()
      }, 2000)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-logo">Found2Work</h1>
          <p className="login-subtitle">Восстановление пароля</p>
        </div>

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="login-form">
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
              Введите email вашего аккаунта
            </p>
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

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="login-btn">Отправить инструкцию</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleCodeSubmit} className="login-form">
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
              Мы отправили код подтверждения на {email}
            </p>
            <div className="form-group">
              <label htmlFor="code">Код подтверждения</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Например: 123456"
                className="form-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">Подтвердить</button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handlePasswordReset} className="login-form">
            <p style={{ textAlign: 'center', marginBottom: '1rem', color: '#6b7280' }}>
              Введите новый пароль
            </p>

            <div className="form-group">
              <label htmlFor="new-pwd">Новый пароль</label>
              <input
                id="new-pwd"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-pwd">Подтвердите пароль</label>
              <input
                id="confirm-pwd"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="login-btn">Изменить пароль</button>
          </form>
        )}

        <p className="signup-hint">
          <button 
            type="button"
            onClick={onBack}
            className="signup-link"
          >
            ← Вернуться к входу
          </button>
        </p>
      </div>
    </div>
  )
}

export default PasswordReset
