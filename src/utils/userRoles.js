/** API и демо-данные могут отдавать соискателя как user или seeker */
export function isSeekerRole(type) {
  return type === 'user' || type === 'seeker'
}

/** Для состояния приложения всегда используем «user» для соискателя */
export function normalizeUserType(type) {
  return isSeekerRole(type) ? 'user' : type
}
