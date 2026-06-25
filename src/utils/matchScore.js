/**
 * Прозрачный скоринг «матча» для диплома: правила фиксированы и показываются пользователю.
 * Не ML — линейная комбинация совпадений по тексту профиля и полям вакансии.
 */
export function computeVacancyMatch(user, job) {
  const reasons = []
  let score = 35

  reasons.push('База 35 баллов из 99 — затем добавляются совпадения по профилю и вакансии.')

  const profileText = `${user?.skills || ''} ${user?.specialization || ''} ${user?.desiredPosition || ''}`.toLowerCase()
  const jobText = `${job?.title || ''} ${job?.description || ''} ${job?.requirements || ''}`.toLowerCase()

  const skillTokens = profileText
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index)

  const matchedSkills = skillTokens.filter((token) => token.length > 1 && jobText.includes(token))
  const skillBonus = Math.min(35, matchedSkills.length * 8)
  score += skillBonus
  if (matchedSkills.length > 0) {
    const preview = matchedSkills.slice(0, 4).join(', ')
    reasons.push(`+${skillBonus} баллов за навыки и ключевые слова: ${preview}${matchedSkills.length > 4 ? '…' : ''}.`)
  } else if (!skillTokens.length) {
    reasons.push('Подсказка: добавьте навыки в профиле — матч станет точнее.')
  }

  const city = (user?.city || '').trim()
  const loc = (job?.location || '').toLowerCase()
  const typeLower = String(job?.type || '').toLowerCase()
  const remoteLike =
    typeLower.includes('удал') ||
    typeLower.includes('remote') ||
    loc.includes('удал')

  if (city && loc.includes(city.toLowerCase())) {
    score += 15
    reasons.push('+15 баллов: город вакансии совпадает с городом в профиле.')
  } else if (remoteLike) {
    score += 10
    reasons.push('+10 баллов: удалённый формат или «удалённо» в типе/локации.')
  }

  const desired = (user?.desiredPosition || '').trim()
  if (desired && (job?.title || '').toLowerCase().includes(desired.toLowerCase())) {
    score += 15
    reasons.push('+15 баллов: название вакансии пересекается с желаемой должностью.')
  }

  if (job?.startupStage === 'growth') {
    score += 5
    reasons.push('+5 баллов: стадия Growth в «пульсе стартапа».')
  }

  const percent = Math.max(1, Math.min(99, score))
  return { percent, reasons }
}
