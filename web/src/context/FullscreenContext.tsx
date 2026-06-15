import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useFullscreen } from '../hooks/useFullscreen'

type FullscreenContextValue = {
  isFullscreen: boolean
  toggleFullscreen: () => void
  setFullscreen: (on: boolean) => void
}

const FullscreenContext = createContext<FullscreenContextValue | null>(null)

const FULLSCREEN_TARGET_ID = 'appMainContent'

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const { isFullscreen, toggleFullscreen, setFullscreen } = useFullscreen(FULLSCREEN_TARGET_ID)

  const value = useMemo(
    () => ({
      isFullscreen,
      toggleFullscreen,
      setFullscreen,
    }),
    [isFullscreen, toggleFullscreen, setFullscreen],
  )

  return <FullscreenContext.Provider value={value}>{children}</FullscreenContext.Provider>
}

export function useFullscreenState() {
  const ctx = useContext(FullscreenContext)
  if (!ctx) {
    throw new Error('useFullscreenState must be used within FullscreenProvider')
  }
  return ctx
}
