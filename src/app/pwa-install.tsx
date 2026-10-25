'use client'

import { useEffect, useState } from 'react'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstall() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)
  const [isPrompting, setIsPrompting] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
        .catch(error => console.error('Pendaftaran PWA gagal:', error))
    }
    const onInstall = (event: Event) => {
      event.preventDefault()
      if (!window.matchMedia('(display-mode: standalone)').matches) setInstallEvent(event as InstallEvent)
    }
    const onInstalled = () => setInstallEvent(null)
    window.addEventListener('beforeinstallprompt', onInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!installEvent || isPrompting) return
    setIsPrompting(true)
    try {
      await installEvent.prompt()
      await installEvent.userChoice
    } catch (error) {
      console.error('Pemasangan PWA belum berhasil:', error)
    } finally {
      setInstallEvent(null)
      setIsPrompting(false)
    }
  }

  if (!installEvent) return null
  return <button type="button" className="install-button" onClick={install} disabled={isPrompting} aria-label="Pasang aplikasi FieldObserver"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></svg><span>{isPrompting ? 'Memasang…' : 'Pasang aplikasi'}</span></button>
}
