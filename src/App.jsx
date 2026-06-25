import React, { useEffect, useState } from 'react'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import UserDashboard from './components/UserDashboard'
import EmployerDashboard from './components/EmployerDashboard'
import AdminDashboard from './components/AdminDashboard'
import UserAgreements from './components/UserAgreements'
import { normalizeUserType } from './utils/userRoles'
import { fetchSessionUser } from './utils/authSession'
import { clearAuthStorage } from './utils/authToken'
import './styles/App.css'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [userType, setUserType] = useState(null)
  /** null — главный экран (лендинг); 'login' | 'register' — форма авторизации */
  const [authMode, setAuthMode] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [hashRoute, setHashRoute] = useState(window.location.hash || '')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const u = await fetchSessionUser()
        if (!cancelled && u) {
          const nt = normalizeUserType(u.type)
          setCurrentUser({ ...u, type: nt })
          setUserType(nt)
        }
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => setHashRoute(window.location.hash || '')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const handleLogin = (email, name, type, fullUser) => {
    const normalizedType = normalizeUserType(type ?? fullUser?.type)
    setCurrentUser({
      ...fullUser,
      email,
      name,
      type: normalizedType,
    })
    setUserType(normalizedType)
  }

  const handleLogout = () => {
    clearAuthStorage()
    setCurrentUser(null)
    setUserType(null)
    setAuthMode(null)
  }

  const getAppData = () => {
    return {
      users: JSON.parse(localStorage.getItem('found2work_users') || '[]'),
      vacancies: JSON.parse(localStorage.getItem('found2work_vacancies') || '[]'),
      applications: JSON.parse(localStorage.getItem('found2work_applications') || '[]'),
      reports: JSON.parse(localStorage.getItem('found2work_reports') || '[]')
    }
  }

  if (!authReady) {
    return (
      <div className="app-auth-loading">
        <p>Проверка сессии…</p>
      </div>
    )
  }

  if (!currentUser) {
    if (hashRoute === '#/agreements') {
      return (
        <UserAgreements
          onBack={() => {
            window.location.hash = ''
            setAuthMode(null)
          }}
        />
      )
    }
    if (!authMode) {
      return <LandingPage onOpenAuth={(mode) => setAuthMode(mode)} />
    }
    return (
      <Login
        onLogin={handleLogin}
        initialMode={authMode}
        showHero={false}
        onBack={() => setAuthMode(null)}
      />
    )
  }

  // В зависимости от типа пользователя показываем разный интерфейс
  return (
    <div className="app">
      <header className="header">
        <div className="header-container">
          <h1 className="logo">Found2Work</h1>
          <div className="user-info">
            <span className="user-type">
              {userType === 'user' ? 'Соискатель' : userType === 'employer' ? 'Работодатель' : 'Администратор'}
            </span>
            <span className="user-email">{currentUser.email}</span>
            <button onClick={handleLogout} className="logout-btn">Выход</button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {userType === 'user' && (
          <UserDashboard 
            user={currentUser} 
            onRefreshData={getAppData}
          />
        )}
        {userType === 'employer' && (
          <EmployerDashboard 
            user={currentUser}
            onRefreshData={getAppData}
          />
        )}
        {userType === 'admin' && (
          <AdminDashboard 
            user={currentUser}
            onRefreshData={getAppData}
          />
        )}
      </main>
    </div>
  )
}

export default App
