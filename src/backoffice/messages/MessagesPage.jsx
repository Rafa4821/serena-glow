import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { inquiryService, INQUIRY_STATUS } from '@/firebase/services/inquiryService'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './MessagesPage.module.css'

const STATUS_TABS = [
  { value: '',                          label: 'Todos' },
  { value: INQUIRY_STATUS.PENDING,      label: 'Pendientes' },
  { value: INQUIRY_STATUS.ANSWERED,     label: 'Respondidos' },
  { value: INQUIRY_STATUS.ARCHIVED,     label: 'Archivados' },
]

export default function MessagesPage() {
  const [messages,    setMessages]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [statusFilter,setStatusFilter]= useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'messages'), orderBy('createdAt', 'desc')),
      snap => { setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    return unsub
  }, [])

  async function handleSetStatus(id, status) {
    try {
      await inquiryService.setStatus(id, status)
      if (selected?.id === id) setSelected(s => ({ ...s, status, read: true }))
      showToast('Estado actualizado.', 'success')
    } catch {
      showToast('Error al actualizar.', 'error')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    try {
      await inquiryService.delete(id)
      if (selected?.id === id) setSelected(null)
      showToast('Mensaje eliminado.', 'success')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  function openMessage(msg) {
    setSelected(msg)
    if (!msg.read) inquiryService.markRead(msg.id)
  }

  const filtered = statusFilter ? messages.filter(m => m.status === statusFilter) : messages
  const unread   = messages.filter(m => !m.read).length

  return (
    <div className={styles.page}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Mensajes</h1>
          <p className={adminStyles.pageSub}>{messages.length} mensajes · {unread} sin leer</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {tab.value === '' && unread > 0 && <span className={styles.tabBadge}>{unread}</span>}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        {/* List */}
        <div className={styles.list}>
          {loading ? (
            <div className={adminStyles.loadingRow}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className={adminStyles.emptyState}>No hay mensajes en esta categoría.</div>
          ) : (
            filtered.map(msg => (
              <div
                key={msg.id}
                className={`${styles.msgRow} ${!msg.read ? styles.unread : ''} ${selected?.id === msg.id ? styles.active : ''}`}
                onClick={() => openMessage(msg)}
              >
                <div className={styles.msgMeta}>
                  <span className={styles.msgName}>{msg.name}</span>
                  <span className={styles.msgDate}>{formatDate(msg.createdAt)}</span>
                </div>
                <p className={styles.msgPreview}>{msg.message}</p>
                {!msg.read && <span className={styles.dot} />}
              </div>
            ))
          )}
        </div>

        {/* Detail */}
        <div className={styles.detail}>
          {selected ? (
            <>
              <div className={styles.detailHeader}>
                <h2 className={styles.detailName}>{selected.name}</h2>
                <button className={adminStyles.btnDelete} onClick={() => handleDelete(selected.id)}>Eliminar</button>
              </div>
              <div className={styles.statusActions}>
                {INQUIRY_STATUS.PENDING  !== selected.status && <button className={adminStyles.btnEdit} onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.PENDING)}>Pendiente</button>}
                {INQUIRY_STATUS.ANSWERED !== selected.status && <button className={adminStyles.btnEdit} onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.ANSWERED)}>Respondido</button>}
                {INQUIRY_STATUS.ARCHIVED !== selected.status && <button className={adminStyles.btnSecondary} onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.ARCHIVED)}>Archivar</button>}
              </div>
              <div className={styles.detailMeta}>
                {selected.email && <a href={`mailto:${selected.email}`} className={styles.metaLink}>{selected.email}</a>}
                {selected.phone && <a href={`tel:${selected.phone}`} className={styles.metaLink}>{selected.phone}</a>}
                <span className={styles.metaDate}>{formatDate(selected.createdAt)}</span>
              </div>
              <p className={styles.detailMsg}>{selected.message}</p>
              {selected.email && (
                <a href={`mailto:${selected.email}`} className={adminStyles.btnPrimary} style={{ display: 'inline-block', textDecoration: 'none' }}>
                  Responder por email
                </a>
              )}
            </>
          ) : (
            <div className={styles.detailEmpty}>Seleccioná un mensaje para verlo</div>
          )}
        </div>
      </div>
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
