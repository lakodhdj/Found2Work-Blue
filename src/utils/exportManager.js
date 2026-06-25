// Экспорт данных в CSV
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('Нет данных для exporte')
    return
  }

  // Получить заголовки из первого объекта
  const headers = Object.keys(data[0])
  
  // Создать CSV контент
  let csvContent = headers.join(',') + '\n'
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header]
      // Экранировать значения содержащие запятые или кавычки
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })
    csvContent += values.join(',') + '\n'
  })

  // Создать blob и download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

// Экспорт пользователей
export const exportUsers = (users) => {
  const exportData = users.map(u => ({
    Email: u.email,
    'Имя/Компания': u.name,
    Тип: u.type === 'user' ? 'Соискатель' : u.type === 'employer' ? 'Работодатель' : 'Админ',
    'Дата регистрации': new Date(u.createdAt).toLocaleDateString('ru-RU'),
    Статус: u.blocked ? 'Заблокирован' : 'Активен',
    Город: u.city || 'Не указано'
  }))
  exportToCSV(exportData, 'users_export')
}

// Экспорт вакансий
export const exportVacancies = (vacancies, users) => {
  const exportData = vacancies.map(v => {
    const employer = users.find(u => u.id === v.employerId)
    return {
      'Должность': v.title,
      'Компания': v.company,
      'Зарплата': v.salary,
      'Локация': v.location,
      'Тип': v.type,
      'Статус': v.status,
      'Откликов': v.applications || 0,
      'Просмотров': v.views || 0,
      'Работодатель': employer ? employer.email : 'Неизвестно',
      'Дата создания': new Date(v.createdAt).toLocaleDateString('ru-RU')
    }
  })
  exportToCSV(exportData, 'vacancies_export')
}

// Экспорт заявок
export const exportApplications = (applications, users, vacancies) => {
  const exportData = applications.map(app => {
    const applicant = users.find(u => u.id === app.userId)
    const vacancy = vacancies.find(v => v.id === app.vacancyId)
    return {
      'Должность': vacancy ? vacancy.title : 'Неизвестно',
      'Кандидат': applicant ? applicant.name : 'Неизвестно',
      'Email соискателя': applicant ? applicant.email : 'Неизвестно',
      'Статус': app.status,
      'Сообщение': app.message,
      'Дата подачи': new Date(app.createdAt).toLocaleDateString('ru-RU')
    }
  })
  exportToCSV(exportData, 'applications_export')
}

// Экспорт статистики
export const exportStatistics = (stats, timestamp) => {
  const reportData = [
    {
      'Метрика': 'Всего пользователей',
      'Значение': stats.totalUsers
    },
    {
      'Метрика': 'Соискателей',
      'Значение': stats.jobSeekers
    },
    {
      'Метрика': 'Работодателей',
      'Значение': stats.employers
    },
    {
      'Метрика': 'Активных вакансий',
      'Значение': stats.activeJobs
    },
    {
      'Метрика': 'Всего вакансий',
      'Значение': stats.totalJobs
    },
    {
      'Метрика': 'Всего заявок',
      'Значение': stats.totalApplications
    },
    {
      'Метрика': 'Общие просмотры',
      'Значение': stats.totalViews
    },
    {
      'Метрика': 'Дата отчёта',
      'Значение': timestamp || new Date().toLocaleDateString('ru-RU')
    }
  ]
  exportToCSV(reportData, `statistics_${timestamp ? timestamp.replace(/\//g, '-') : 'report'}`)
}

// Генерировать простой текстовый отчёт
export const generateTextReport = (title, content) => {
  const text = `${title}\n${'='.repeat(title.length)}\n\nДата: ${new Date().toLocaleString('ru-RU')}\n\n${content}`
  
  const blob = new Blob([text], { type: 'text/plain' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `report_${Date.now()}.txt`
  link.click()
}

// Печать страницы
export const printReport = (elementId) => {
  const printWindow = window.open('', '', 'width=800,height=600')
  const element = document.getElementById(elementId)
  
  if (element) {
    printWindow.document.write(element.innerHTML)
    printWindow.document.close()
    printWindow.print()
  }
}
