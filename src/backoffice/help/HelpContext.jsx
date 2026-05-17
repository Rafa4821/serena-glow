import { createContext, useContext, useState, useEffect } from 'react'

const HelpCtx = createContext(true)

export function HelpProvider({ children }) {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('sg_admin_help') !== 'false'
  )

  useEffect(() => {
    const handler = () => setEnabled(localStorage.getItem('sg_admin_help') !== 'false')
    window.addEventListener('sg_help_change', handler)
    return () => window.removeEventListener('sg_help_change', handler)
  }, [])

  return <HelpCtx.Provider value={enabled}>{children}</HelpCtx.Provider>
}

export const useHelpEnabled = () => useContext(HelpCtx)
