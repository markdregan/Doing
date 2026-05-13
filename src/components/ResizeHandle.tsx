import { useCallback, useEffect } from 'react'

interface ResizeHandleProps {
  containerRef: React.RefObject<HTMLElement | null>
  position?: 'left' | 'right'
  minWidth?: number
  maxWidth?: number
  storageKey?: string
  defaultWidth?: number
}

export default function ResizeHandle({
  containerRef,
  position = 'right',
  minWidth = 180,
  maxWidth = 600,
  storageKey,
  defaultWidth = 240,
}: ResizeHandleProps) {
  useEffect(() => {
    if (!containerRef.current) return
    const saved = storageKey ? localStorage.getItem(storageKey) : null
    containerRef.current.style.width = `${saved ? parseInt(saved, 10) : defaultWidth}px`
  }, [containerRef, storageKey, defaultWidth])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return

    const startX = e.clientX
    const startWidth = el.getBoundingClientRect().width

    const handleMouseMove = (e: MouseEvent) => {
      const delta = position === 'right' ? e.clientX - startX : startX - e.clientX
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
      el.style.width = `${newWidth}px`
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (storageKey && el) {
        localStorage.setItem(storageKey, String(Math.round(el.getBoundingClientRect().width)))
      }
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [containerRef, position, minWidth, maxWidth, storageKey])

  return (
    <div
      onMouseDown={handleMouseDown}
      className="w-[5px] cursor-col-resize hover:bg-indigo-400/20 active:bg-indigo-400/30 transition-colors shrink-0 relative group"
    >
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full bg-transparent group-hover:bg-indigo-400/30 transition-colors" />
    </div>
  )
}
