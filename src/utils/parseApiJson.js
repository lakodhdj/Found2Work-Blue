/** Читает тело ответа как JSON; если пришла HTML (502 и т.д.) — понятная ошибка */
export async function parseApiJson(response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    if (text.trimStart().toLowerCase().startsWith('<!doctype') || text.trimStart().startsWith('<html')) {
      throw new Error(
        'Сервер вернул HTML вместо данных API (часто это nginx 502: backend был перезапущен). В Docker выполните: docker compose up -d --build frontend'
      )
    }
    throw new Error(`Ответ не JSON (HTTP ${response.status}). ${text.slice(0, 120)}`)
  }
}
