import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { inquiryService, INQUIRY_STATUS } from '@/firebase/services/inquiryService'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './MessagesPage.module.css'

const STATUS_TABS = [
  { value: '',                      label: 'Todos' },
  { value: INQUIRY_STATUS.PENDING,  label: 'Pendientes' },
  { value: INQUIRY_STATUS.ANSWERED, label: 'Respondidos' },
  { value: INQUIRY_STATUS.ARCHIVED, label: 'Archivados' },
]

const STATUS_META = {
  [INQUIRY_STATUS.PENDING]:  { label: 'Pendiente',   cls: 'statusPending'  },
  [INQUIRY_STATUS.ANSWERED]: { label: 'Respondido',  cls: 'statusAnswered' },
  [INQUIRY_STATUS.ARCHIVED]: { label: 'Archivado',   cls: 'statusArchived' },
}

export default function MessagesPage() {
  const [messages,     setMessages]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selected,     setSelected]     = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search,       setSearch]       = useState('')
  const [notes,        setNotes]        = useState('')
  const [savingNotes,  setSavingNotes]  = useState(false)
  const [showDetail,   setShowDetail]   = useState(false)

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
    } catch { showToast('Error al actualizar.', 'error') }
  }

  async function handleMarkUnread(id) {
    try {
      await inquiryService.markUnread(id)
      if (selected?.id === id) setSelected(s => ({ ...s, read: false }))
      showToast('Marcado como no leído.', 'success')
    } catch { showToast('Error al actualizar.', 'error') }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este mensaje? Esta acción no se puede deshacer.')) return
    try {
      await inquiryService.delete(id)
      if (selected?.id === id) { setSelected(null); setShowDetail(false) }
      showToast('Mensaje eliminado.', 'success')
    } catch { showToast('Error al eliminar.', 'error') }
  }

  async function handleSaveNotes() {
    if (!selected) return
    setSavingNotes(true)
    try {
      await inquiryService.saveNotes(selected.id, notes)
      setSelected(s => ({ ...s, notes }))
      showToast('Notas guardadas.', 'success')
    } catch { showToast('Error al guardar notas.', 'error') }
    finally { setSavingNotes(false) }
  }

  function openMessage(msg) {
    setSelected(msg)
    setNotes(msg.notes ?? '')
    setShowDetail(true)
    if (!msg.read) inquiryService.markRead(msg.id)
  }

  function exportCSV() {
    const rows = [
      ['Nombre', 'Email', 'Teléfono', 'Mensaje', 'Estado', 'Notas', 'Fecha'],
      ...filtered.map(m => [
        m.name ?? '', m.email ?? '', m.phone ?? '',
        (m.message ?? '').replace(/\n/g, ' '),
        STATUS_META[m.status]?.label ?? m.status,
        (m.notes ?? '').replace(/\n/g, ' '),
        formatDate(m.createdAt),
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `mensajes-${new Date().toISOString().slice(0,10)}.csv` })
    a.click(); URL.revokeObjectURL(url)
  }

  const filtered = messages
    .filter(m => statusFilter ? m.status === statusFilter : true)
    .filter(m => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) ||
             m.message?.toLowerCase().includes(q) || m.phone?.toLowerCase().includes(q)
    })

  const counts = {
    total:    messages.length,
    pending:  messages.filter(m => m.status === INQUIRY_STATUS.PENDING).length,
    answered: messages.filter(m => m.status === INQUIRY_STATUS.ANSWERED).length,
    archived: messages.filter(m => m.status === INQUIRY_STATUS.ARCHIVED).length,
    unread:   messages.filter(m => !m.read).length,
  }

  const tabCounts = {
    '': counts.unread,
    [INQUIRY_STATUS.PENDING]:  counts.pending,
    [INQUIRY_STATUS.ANSWERED]: counts.answered,
  }

  const waMsg = selected ? encodeURIComponent(`Hola ${selected.name}, te contactamos desde Serena Glow en relación a tu consulta.`) : ''
  const waUrl = selected?.phone ? `https://wa.me/${selected.phone.replace(/\D/g,'')}?text=${waMsg}` : null

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Mensajes</h1>
          <p className={adminStyles.pageSub}>{counts.total} mensajes · {counts.unread} sin leer</p>
        </div>
        <button onClick={exportCSV} className={adminStyles.btnSecondary} disabled={filtered.length === 0}>
          <DownloadIcon className={styles.btnIcon} /> Exportar CSV
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        {[
          { label: 'Pendientes',  value: counts.pending,  cls: 'stripPending',  to: INQUIRY_STATUS.PENDING  },
          { label: 'Respondidos', value: counts.answered, cls: 'stripAnswered', to: INQUIRY_STATUS.ANSWERED },
          { label: 'Archivados',  value: counts.archived, cls: '',              to: INQUIRY_STATUS.ARCHIVED },
          { label: 'Sin leer',    value: counts.unread,   cls: 'stripUnread',   to: ''                       },
        ].map(s => (
          <button key={s.label} className={`${styles.stripStat} ${styles[s.cls] ?? ''}`} onClick={() => setStatusFilter(s.to)}>
            <span className={styles.stripValue}>{s.value}</span>
            <span className={styles.stripLabel}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(tab.value)}
            >
              {tab.label}
              {(tabCounts[tab.value] ?? 0) > 0 && (
                <span className={`${styles.tabBadge} ${statusFilter === tab.value ? styles.tabBadgeActive : ''}`}>
                  {tabCounts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o mensaje…"
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* ── Layout ── */}
      <div className={`${styles.layout} ${showDetail ? styles.layoutDetail : ''}`}>

        {/* List */}
        <div className={styles.list}>
          {loading ? (
            <div className={adminStyles.loadingRow}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className={adminStyles.emptyState}>
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay mensajes en esta categoría.'}
            </div>
          ) : filtered.map(msg => (
            <div
              key={msg.id}
              className={`${styles.msgRow} ${!msg.read ? styles.unread : ''} ${selected?.id === msg.id ? styles.active : ''}`}
              onClick={() => openMessage(msg)}
            >
              <div className={styles.msgAvatar}>{(msg.name?.[0] ?? '?').toUpperCase()}</div>
              <div className={styles.msgContent}>
                <div className={styles.msgMeta}>
                  <span className={styles.msgName}>{msg.name}</span>
                  <span className={styles.msgDate}>{formatDate(msg.createdAt)}</span>
                </div>
                <p className={styles.msgPreview}>{msg.message}</p>
                <div className={styles.msgRowFooter}>
                  <span className={`${styles.statusBadge} ${styles[STATUS_META[msg.status]?.cls]}`}>
                    {STATUS_META[msg.status]?.label ?? msg.status}
                  </span>
                  {msg.email && <span className={styles.msgEmailHint}>{msg.email}</span>}
                </div>
              </div>
              {!msg.read && <span className={styles.dot} />}
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className={styles.detail}>
          {selected ? (
            <>
              <button className={styles.backBtn} onClick={() => { setShowDetail(false); setSelected(null) }}>
                ← Volver
              </button>

              {/* Name + status */}
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleWrap}>
                  <div className={styles.detailAvatar}>{(selected.name?.[0] ?? '?').toUpperCase()}</div>
                  <div>
                    <h2 className={styles.detailName}>{selected.name}</h2>
                    <span className={`${styles.statusBadge} ${styles[STATUS_META[selected.status]?.cls]}`}>
                      {STATUS_META[selected.status]?.label ?? selected.status}
                    </span>
                  </div>
                </div>
                <button className={adminStyles.btnDelete} onClick={() => handleDelete(selected.id)}>Eliminar</button>
              </div>

              {/* Contact info */}
              <div className={styles.detailMeta}>
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className={styles.metaItem}>
                    <MailIcon className={styles.metaIcon} />{selected.email}
                  </a>
                )}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className={styles.metaItem}>
                    <PhoneIcon className={styles.metaIcon} />{selected.phone}
                  </a>
                )}
                <span className={styles.metaItem}>
                  <ClockIcon className={styles.metaIcon} />{formatDate(selected.createdAt)}
                </span>
              </div>

              {/* Message body */}
              <div className={styles.detailMsgBox}>
                <p className={styles.detailMsg}>{selected.message}</p>
              </div>

              {/* Status actions */}
              <div className={styles.actionRow}>
                {INQUIRY_STATUS.PENDING  !== selected.status && <button className={adminStyles.btnEdit}      onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.PENDING)}>Marcar pendiente</button>}
                {INQUIRY_STATUS.ANSWERED !== selected.status && <button className={adminStyles.btnEdit}      onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.ANSWERED)}>Marcar respondido</button>}
                {INQUIRY_STATUS.ARCHIVED !== selected.status && <button className={adminStyles.btnSecondary} onClick={() => handleSetStatus(selected.id, INQUIRY_STATUS.ARCHIVED)}>Archivar</button>}
                {selected.read && <button className={adminStyles.btnSecondary} onClick={() => handleMarkUnread(selected.id)}>Marcar no leído</button>}
              </div>

              {/* Reply buttons */}
              <div className={styles.replyRow}>
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className={styles.replyBtn}>
                    <MailIcon className={styles.replyIcon} /> Responder por email
                  </a>
                )}
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className={`${styles.replyBtn} ${styles.replyWa}`}>
                    <WaIcon className={styles.replyIcon} /> Responder por WhatsApp
                  </a>
                )}
              </div>

              {/* Internal notes */}
              <div className={styles.notesSection}>
                <p className={styles.notesLabel}><NoteIcon className={styles.notesLabelIcon} /> Notas internas</p>
                <textarea
                  className={styles.notesInput}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Agrega notas privadas sobre esta consulta…"
                  rows={3}
                />
                <button
                  className={adminStyles.btnEdit}
                  onClick={handleSaveNotes}
                  disabled={savingNotes || notes === (selected.notes ?? '')}
                >
                  {savingNotes ? 'Guardando…' : 'Guardar notas'}
                </button>
              </div>
            </>
          ) : (
            <div className={styles.detailEmpty}>
              <InboxIcon className={styles.emptyIcon} />
              <p>Selecciona un mensaje para verlo</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function MailIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function PhoneIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l.62-.87a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> }
function ClockIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function SearchIcon({ className })   { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function DownloadIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> }
function NoteIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function InboxIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg> }
function WaIcon({ className })       { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> }
