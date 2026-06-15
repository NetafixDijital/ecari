import { useCallback, useEffect, useState } from 'react'

export function useFullscreen(targetId?: string) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const applyFullscreen = useCallback(
    (on: boolean) => {
      setIsFullscreen(on)
      document.body.classList.toggle('hs-fullscreen', on)

      if (on) {
        const el = (targetId ? document.getElementById(targetId) : null) ?? document.documentElement
        el.requestFullscreen?.().catch(() => undefined)
        return
      }

      document.body.classList.remove('hs-fullscreen')
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => undefined)
      }
    },
    [targetId],
  )

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev
      document.body.classList.toggle('hs-fullscreen', next)
      if (next) {
        const el = (targetId ? document.getElementById(targetId) : null) ?? document.documentElement
        el.requestFullscreen?.().catch(() => undefined)
      } else {
        document.body.classList.remove('hs-fullscreen')
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => undefined)
        }
      }
      return next
    })
  }, [targetId])

  useEffect(() => {
    let hadNativeFullscreen = false

    const onFullscreenChange = () => {
      const nativeOn = Boolean(document.fullscreenElement)
      if (nativeOn) {
        hadNativeFullscreen = true
        setIsFullscreen(true)
        document.body.classList.add('hs-fullscreen')
        return
      }

      if (hadNativeFullscreen) {
        hadNativeFullscreen = false
        setIsFullscreen(false)
        document.body.classList.remove('hs-fullscreen')
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.body.classList.remove('hs-fullscreen')
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => undefined)
      }
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setIsFullscreen((prev) => {
        if (!prev) return prev
        document.body.classList.remove('hs-fullscreen')
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => undefined)
        }
        return false
      })
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return { isFullscreen, toggleFullscreen, setFullscreen: applyFullscreen }
}
