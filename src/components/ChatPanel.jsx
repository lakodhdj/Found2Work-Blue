import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getConversations, getMessageThread, sendMessage } from '../utils/messageManager'

function normalizeConversation(conv) {
  if (!conv) return null
  return {
    ...conv,
    partnerId: Number(conv.partnerId),
    vacancyId:
      conv.vacancyId !== undefined && conv.vacancyId !== null && conv.vacancyId !== ''
        ? Number(conv.vacancyId)
        : null
  }
}

function ChatPanel({ user, preselectedConversation = null, onClose }) {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(() => normalizeConversation(preselectedConversation))
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const threadRef = useRef(null)
  const selectedRef = useRef(selected)

  selectedRef.current = selected

  const selectedKey = useMemo(() => {
    if (!selected) return ''
    const vid = selected.vacancyId != null ? selected.vacancyId : 'none'
    return `${selected.partnerId}-${vid}`
  }, [selected])

  const loadConversations = async () => {
    const data = await getConversations(user.id)
    setConversations(Array.isArray(data) ? data : [])
  }

  const loadThread = async (conversation) => {
    if (!conversation || !Number(conversation.partnerId)) return
    const thread = await getMessageThread(
      user.id,
      conversation.partnerId,
      conversation.vacancyId != null ? conversation.vacancyId : null
    )
    setMessages(Array.isArray(thread) ? thread : [])
  }

  useEffect(() => {
    loadConversations()
  }, [user.id])

  useEffect(() => {
    const preset = normalizeConversation(preselectedConversation)
    if (preset && preset.partnerId) {
      setSelected(preset)
      loadThread(preset)
    }
  }, [
    preselectedConversation?.partnerId,
    preselectedConversation?.vacancyId,
    preselectedConversation?.vacancyTitle
  ])

  useEffect(() => {
    if (selected) {
      loadThread(selected)
    } else {
      setMessages([])
    }
  }, [selectedKey, user.id])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      loadConversations()
      const sel = selectedRef.current
      if (sel) loadThread(sel)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSend = async (e) => {
    e.preventDefault()
    const sel = selectedRef.current
    if (!sel || !text.trim()) return
    const pid = Number(sel.partnerId)
    const vid = sel.vacancyId != null && !Number.isNaN(Number(sel.vacancyId)) ? Number(sel.vacancyId) : null
    if (!pid || pid === Number(user.id)) return

    await sendMessage(user.id, pid, text, vid)
    setText('')
    await loadThread(sel)
    await loadConversations()
  }

  const pickConversation = (item) => {
    const norm = normalizeConversation(item)
    setSelected(norm)
    if (norm) loadThread(norm)
  }

  const isSeeker = user?.type === 'user' || user?.type === 'seeker'

  const selectedVacancyLabel = selected?.vacancyTitle || null
  const selectedCompanyLabel =
    selected?.vacancyCompany || selected?.partnerName || selected?.partnerEmail || null

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content chat-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Чат"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="chat-header-text">
            <h3>Сообщения</h3>
            {isSeeker && selected && (
              <p className="chat-header-subtitle">
                {selectedVacancyLabel
                  ? `Переписка по вакансии «${selectedVacancyLabel}»`
                  : `Диалог с ${selected.partnerName || selected.partnerEmail || 'работодателем'}`}
              </p>
            )}
          </div>
          <button type="button" className="chat-close-btn" onClick={onClose} aria-label="Закрыть чат">
            ×
          </button>
        </div>
        <div className="modal-body chat-layout">
          <div className="applications-list chat-conversations">
            {conversations.map((item) => {
              const norm = normalizeConversation(item)
              const itemKey = norm ? `${norm.partnerId}-${norm.vacancyId != null ? norm.vacancyId : 'none'}` : ''
              return (
                <button
                  key={`${item.id}-${itemKey}`}
                  type="button"
                  className={`application-card chat-conversation-item ${itemKey === selectedKey ? 'active' : ''}`}
                  onClick={() => pickConversation(item)}
                >
                  <p>
                    <strong>{item.partnerName || item.partnerEmail || `Пользователь #${item.partnerId}`}</strong>
                  </p>
                  {isSeeker ? (
                    item.vacancyTitle ? (
                      <p className="chat-vacancy-chip">Вакансия: {item.vacancyTitle}</p>
                    ) : (
                      <p className="chat-vacancy-chip chat-vacancy-chip--general">Общий диалог</p>
                    )
                  ) : (
                    <p className="app-message">{item.vacancyTitle || 'Общий диалог'}</p>
                  )}
                  <p className="app-date">{new Date(item.createdAt).toLocaleString('ru-RU')}</p>
                </button>
              )
            })}
            {conversations.length === 0 && <p className="chat-empty">Диалогов пока нет — напишите работодателю из карточки вакансии.</p>}
          </div>

          <div className="chat-thread-wrap">
            {isSeeker && selected && selectedVacancyLabel && (
              <div className="chat-vacancy-banner">
                <span className="chat-vacancy-banner-label">Вы пишете по вакансии</span>
                <strong className="chat-vacancy-banner-title">{selectedVacancyLabel}</strong>
                {selectedCompanyLabel && (
                  <span className="chat-vacancy-banner-company">{selectedCompanyLabel}</span>
                )}
              </div>
            )}
            <div ref={threadRef} className="applications-list chat-thread">
              {!selected && <p className="chat-empty">Выберите диалог слева или откройте чат из вакансии.</p>}
              {selected &&
                messages.map((msg) => (
                  <div key={msg.id} className={`chat-message-row ${msg.senderId === user.id ? 'me' : 'other'}`}>
                    <div className="chat-message-bubble">
                      <p className="chat-message-author">
                        {msg.senderId === user.id ? 'Вы' : msg.senderName || selected?.partnerName || 'Собеседник'}
                      </p>
                      <p className="app-message">{msg.text}</p>
                      <p className="app-date">{new Date(msg.createdAt).toLocaleString('ru-RU')}</p>
                    </div>
                  </div>
                ))}
              {selected && messages.length === 0 && (
                <p className="chat-empty">Пока нет сообщений — напишите первым.</p>
              )}
            </div>
            <form onSubmit={handleSend} className="search-filters chat-compose">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  selected
                    ? selectedVacancyLabel
                      ? `Сообщение по вакансии «${selectedVacancyLabel}»…`
                      : 'Введите сообщение…'
                    : 'Сначала выберите диалог'
                }
                className="search-input"
                rows={2}
                disabled={!selected}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend(e)
                  }
                }}
              />
              <button type="submit" className="submit-btn" disabled={!selected || !text.trim()}>
                Отправить
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
