import { useState, useEffect } from 'react'
import {
  collection, getCountFromServer, getDocs,
  query, where, orderBy, limit,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { Link } from 'react-router-dom'
import { INQUIRY_STATUS } from '@/firebase/services/inquiryService'
import { auditLogService } from '@/firebase/services/auditLogService'
import styles from './DashboardPage.module.css'

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function actionLabel(action, entity) {
  const a = { create: 'creó', update: 'actualizó', delete: 'eliminó', login: 'inició sesión', logout: 'cerró sesión', publish: 'publicó', archive: 'archivó', upload: 'subió archivo en', setting: 'cambió configuración de' }
  const e = { products: 'producto', categories: 'categoría', banners: 'banner', media: 'media', messages: 'mensaje', gallery: 'galería', siteConfig: 'configuración' }
  return `${a[action] ?? action} ${e[entity] ?? entity}`
}

export default function DashboardPage() {
  const [stats,    setStats]    = useState(null)
  const [messages, setMessages] = useState([])
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)

  const today = new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    async function load() {
      try {
        const [published, draft, archived, cats, pending, answered, bannersActive, gallery, mediaSnap, msgSnap, logData] = await Promise.all([
          getCountFromServer(query(collection(db, 'products'), where('status', '==', 'published'))),
          getCountFromServer(query(collection(db, 'products'), where('status', '==', 'draft'))),
          getCountFromServer(query(collection(db, 'products'), where('status', '==', 'archived'))),
          getCountFromServer(collection(db, 'categories')),
          getCountFromServer(query(collection(db, 'messages'), where('status', '==', INQUIRY_STATUS.PENDING))),
          getCountFromServer(query(collection(db, 'messages'), where('status', '==', INQUIRY_STATUS.ANSWERED))),
          getCountFromServer(query(collection(db, 'banners'),  where('active', '==', true))),
          getCountFromServer(collection(db, 'gallery')),
          getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'messages'), where('status', '==', INQUIRY_STATUS.PENDING), orderBy('createdAt', 'desc'), limit(5))),
          auditLogService.getRecent(10),
        ])
        const orphans = mediaSnap.docs.filter(d => !(d.data().usedBy?.length > 0)).length
        setStats({
          published:     published.data().count,
          draft:         draft.data().count,
          archived:      archived.data().count,
          categories:    cats.data().count,
          pending:       pending.data().count,
          answered:      answered.data().count,
          bannersActive: bannersActive.data().count,
          gallery:       gallery.data().count,
          orphans,
        })
        setMessages(msgSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLogs(logData)
      } catch (e) {
        console.error(e)
        setStats({ published: 0, draft: 0, archived: 0, categories: 0, pending: 0, answered: 0, bannersActive: 0, gallery: 0, orphans: 0 })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = stats ? [
    { label: 'Publicados',        value: stats.published,     to: '/admin/productos',      icon: BoxIcon,     color: 'mauve' },
    { label: 'Borradores',        value: stats.draft,         to: '/admin/productos',      icon: DraftIcon,   color: 'neutral' },
    { label: 'Categorías',        value: stats.categories,    to: '/admin/categorias',     icon: TagIcon,     color: 'rose' },
    { label: 'Banners activos',   value: stats.bannersActive, to: '/admin/banners',        icon: ImageIcon,   color: 'beige' },
    { label: 'Consultas nuevas',  value: stats.pending,       to: '/admin/mensajes',       icon: MailIcon,    color: stats.pending > 0 ? 'alert' : 'beige' },
    { label: 'Galería',           value: stats.gallery,       to: '/admin/galeria',        icon: GalleryIcon, color: 'rose' },
  ] : []

  const quickActions = [
    { label: 'Nuevo producto',       to: '/admin/productos',      icon: PlusIcon,    desc: 'Agregar al catálogo' },
    { label: 'Nueva categoría',      to: '/admin/categorias',     icon: TagIcon,     desc: 'Organizar productos' },
    { label: 'Editar banners',       to: '/admin/banners',        icon: ImageIcon,   desc: 'Portadas del sitio' },
    { label: 'Mensajes',             to: '/admin/mensajes',       icon: MailIcon,    desc: stats?.pending > 0 ? `${stats.pending} sin responder` : 'Bandeja de entrada' },
    { label: 'Biblioteca de medios', to: '/admin/media',          icon: MediaIcon,   desc: stats?.orphans > 0 ? `${stats.orphans} sin usar` : 'Gestión de archivos' },
    { label: 'Configuración',        to: '/admin/configuracion',  icon: SettingsIcon,desc: 'Tienda y apariencia' },
  ]

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>{greet()} 👋</h1>
          <p className={styles.sub}>Panel de administración · <span className={styles.dateChip}>{today}</span></p>
        </div>
        <Link to="/" target="_blank" className={styles.viewSiteBtn}>
          <ExternalIcon /> Ver sitio
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className={`skeleton ${styles.statCardSkeleton}`} />)
          : statCards.map(card => (
              <Link key={card.label} to={card.to} className={`${styles.statCard} ${styles[card.color]}`}>
                <div className={styles.statTop}>
                  <card.icon className={styles.statIcon} />
                  <span className={styles.statValue}>{card.value}</span>
                </div>
                <span className={styles.statLabel}>{card.label}</span>
              </Link>
            ))
        }
      </div>

      {/* ── Inventory breakdown ── */}
      {stats && (
        <div className={styles.inventoryBar}>
          <span className={styles.invLabel}>Inventario de productos</span>
          <div className={styles.invSegments}>
            {[
              { label: 'Publicados', count: stats.published,  cls: 'segPublished' },
              { label: 'Borradores', count: stats.draft,      cls: 'segDraft' },
              { label: 'Archivados', count: stats.archived,   cls: 'segArchived' },
            ].map(s => {
              const total = stats.published + stats.draft + stats.archived || 1
              return (
                <div
                  key={s.label}
                  className={`${styles.segment} ${styles[s.cls]}`}
                  style={{ width: `${Math.round((s.count / total) * 100)}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              )
            })}
          </div>
          <div className={styles.invLegend}>
            {[
              { label: 'Publicados', count: stats.published,  cls: 'segPublished' },
              { label: 'Borradores', count: stats.draft,      cls: 'segDraft' },
              { label: 'Archivados', count: stats.archived,   cls: 'segArchived' },
            ].map(s => (
              <span key={s.label} className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles[s.cls]}`} />
                {s.label} ({s.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Two-column panel ── */}
      <div className={styles.panels}>

        {/* Recent messages */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}><MailIcon className={styles.panelIcon} /> Consultas pendientes</h2>
            <Link to="/admin/mensajes" className={styles.panelLink}>Ver todas →</Link>
          </div>
          {loading ? (
            <div className={styles.panelEmpty}><div className={`skeleton ${styles.skRow}`} /><div className={`skeleton ${styles.skRow}`} /></div>
          ) : messages.length === 0 ? (
            <div className={styles.panelEmpty}>
              <CheckCircleIcon className={styles.emptyIcon} />
              <p>No hay consultas pendientes</p>
            </div>
          ) : (
            <ul className={styles.msgList}>
              {messages.map(m => (
                <li key={m.id} className={styles.msgItem}>
                  <div className={styles.msgAvatar}>{(m.name?.[0] ?? '?').toUpperCase()}</div>
                  <div className={styles.msgBody}>
                    <span className={styles.msgName}>{m.name}</span>
                    <span className={styles.msgText}>{m.message?.slice(0, 80)}{m.message?.length > 80 ? '…' : ''}</span>
                    <span className={styles.msgDate}>{fmtDate(m.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Activity log */}
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}><ActivityIcon className={styles.panelIcon} /> Actividad reciente</h2>
          </div>
          {loading ? (
            <div className={styles.panelEmpty}><div className={`skeleton ${styles.skRow}`} /><div className={`skeleton ${styles.skRow}`} /></div>
          ) : logs.length === 0 ? (
            <div className={styles.panelEmpty}><p>Sin actividad registrada</p></div>
          ) : (
            <ul className={styles.logList}>
              {logs.map(l => (
                <li key={l.id} className={styles.logItem}>
                  <span className={`${styles.logDot} ${styles['act_' + l.action]}`} />
                  <div className={styles.logBody}>
                    <span className={styles.logAction}>{actionLabel(l.action, l.entity)}</span>
                    <span className={styles.logMeta}>{l.userEmail?.split('@')[0]} · {fmtDate(l.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      {/* ── Quick actions ── */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
        <div className={styles.quickGrid}>
          {quickActions.map(a => (
            <Link key={a.label} to={a.to} className={styles.actionCard}>
              <a.icon className={styles.actionIcon} />
              <span className={styles.actionLabel}>{a.label}</span>
              <span className={styles.actionDesc}>{a.desc}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}

function BoxIcon({ className })      { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function DraftIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function TagIcon({ className })      { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function ImageIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function GalleryIcon({ className })  { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="12" width="7" height="9" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/></svg> }
function MailIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function MediaIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function SettingsIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function PlusIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function ExternalIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> }
function ActivityIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> }
function CheckCircleIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
