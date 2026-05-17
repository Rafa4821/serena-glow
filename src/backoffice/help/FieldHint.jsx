import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useHelpEnabled } from './HelpContext'
import styles from './FieldHint.module.css'

/**
 * Inline ? tooltip — renders via portal so it's never clipped by parent overflow.
 * Positions above or below the button, clamped to viewport, with a dynamic arrow.
 * Usage: <label>Campo <FieldHint text="Explicación..." /></label>
 */
export default function FieldHint({ text }) {
  const enabled     = useHelpEnabled()
  const [open, setOpen]       = useState(false)
  const [visible, setVisible] = useState(false)
  const [pos,  setPos]        = useState({ top: 0, left: 0, placement: 'top', arrowLeft: 130 })
  const btnRef     = useRef(null)
  const tipRef     = useRef(null)

  /* Measure & position after tooltip mounts */
  useLayoutEffect(() => {
    if (!open) { setVisible(false); return }
    if (!btnRef.current || !tipRef.current) return

    const btn = btnRef.current.getBoundingClientRect()
    const tip = tipRef.current.getBoundingClientRect()
    const vw  = window.innerWidth
    const PAD = 14

    /* Horizontal: centre on button, clamp to viewport */
    let left = btn.left + btn.width / 2 - tip.width / 2
    left = Math.max(PAD, Math.min(left, vw - tip.width - PAD))

    /* Arrow: always points at button centre */
    const arrowLeft = Math.max(10, Math.min(
      (btn.left + btn.width / 2) - left,
      tip.width - 10
    ))

    /* Vertical: prefer above, fall back below */
    const placement = btn.top > tip.height + 18 ? 'top' : 'bottom'
    const top = placement === 'top'
      ? btn.top  - tip.height - 10
      : btn.bottom + 10

    setPos({ top, left, placement, arrowLeft })
    setVisible(true)
  }, [open])

  /* Close on outside click */
  useEffect(() => {
    if (!open) return
    const h = e => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  /* Close on Escape or scroll */
  useEffect(() => {
    if (!open) return
    const onKey    = e => { if (e.key === 'Escape') setOpen(false) }
    const onScroll = ()  => setOpen(false)
    document.addEventListener('keydown',  onKey)
    window  .addEventListener('scroll',   onScroll, { passive: true, capture: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      window  .removeEventListener('scroll',  onScroll, { capture: true })
    }
  }, [open])

  if (!enabled) return null

  return (
    <span className={styles.wrap}>
      <button
        ref={btnRef}
        type="button"
        className={`${styles.btn} ${open ? styles.btnActive : ''}`}
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        aria-label="Ayuda sobre este campo"
        tabIndex={-1}
      >?</button>

      {open && createPortal(
        <span
          ref={tipRef}
          role="tooltip"
          className={[
            styles.tooltip,
            styles[`place${pos.placement === 'top' ? 'Top' : 'Bottom'}`],
            visible ? styles.tooltipVisible : '',
          ].join(' ')}
          style={{
            top:  pos.top,
            left: pos.left,
            '--arrow-left': `${pos.arrowLeft}px`,
          }}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  )
}
