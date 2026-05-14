import { useState, useEffect } from 'react'

interface DemoOverlayProps {
  onDismiss: () => void
}

export default function DemoOverlay({ onDismiss }: DemoOverlayProps) {
  const [visible, setVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) {
        setVisible(false)
        setTimeout(onDismiss, 300)
      }
    }, 8000)
    return () => clearTimeout(timer)
  }, [dismissed, onDismiss])

  const handleDismiss = () => {
    if (dismissed) return
    setDismissed(true)
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 cursor-pointer ${
        visible ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
      }`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#38383A] p-8 max-w-md mx-4 transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <path d="M12 19v3" />
            <path d="M8 23h8" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-[#F5F5F5] text-center mb-3">
          Welcome to Doing
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#98989D] text-center leading-relaxed mb-6">
          Your agent prepared this demo project while you were away.
          Everything you see — the tasks, checklists, and research notes — was
          created autonomously by your AI agent.
        </p>
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#D1D1D6]">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[11px] text-blue-600 dark:text-blue-400 font-bold shrink-0">1</span>
            <span>Explore the demo project to see what your agent can do</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#D1D1D6]">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[11px] text-blue-600 dark:text-blue-400 font-bold shrink-0">2</span>
            <span>Your agent is actively working — check the activity feed</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-[#D1D1D6]">
            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[11px] text-blue-600 dark:text-blue-400 font-bold shrink-0">3</span>
            <span>When you're ready, create your first real goal</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="w-full py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-[#F5F5F5] dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-[#E5E5EA] transition-colors"
        >
          Got it — show me around
        </button>
        <p className="text-[11px] text-gray-400 dark:text-[#636366] text-center mt-3">
          Click anywhere to dismiss
        </p>
      </div>
    </div>
  )
}
