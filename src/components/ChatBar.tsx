import { useState, useRef, useEffect } from 'react'

interface ChatBarProps {
  placeholder?: string
  onSend: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
  variant?: 'hero' | 'compact'
  suggestions?: { emoji?: string; label: string; prompt: string }[]
}

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

export default function ChatBar({
  placeholder = 'What are you working toward?',
  onSend,
  disabled = false,
  autoFocus = false,
  variant = 'hero',
  suggestions,
}: ChatBarProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isHero = variant === 'hero'

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (!textareaRef.current) return
    textareaRef.current.style.height = 'auto'
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
  }, [value])

  const handleSend = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') {
      setValue('')
      textareaRef.current?.blur()
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    onSend(prompt)
  }

  if (!isHero) {
    return (
      <div className="w-full group">
        <div className="flex flex-col bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#38383A] rounded-2xl shadow-sm focus-within:shadow-lg focus-within:border-gray-300 dark:focus-within:border-[#48484A] transition-all duration-300 overflow-hidden">
          <div className="relative flex items-center px-2 py-1.5 min-h-[56px]">
            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233] shrink-0">
              <PlusIcon size={20} />
            </button>
            
            <textarea
              ref={textareaRef}
              className="flex-1 px-2 pt-[11px] pb-[5px] text-[14px] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366] outline-none resize-none transition-all min-h-[36px] max-h-[120px] leading-tight"
              placeholder={placeholder}
              rows={1}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="flex items-center gap-1 px-1 shrink-0">
              <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233]">
                <MicIcon size={20} />
              </button>
              
              <button
                onClick={handleSend}
                disabled={!value.trim() || disabled}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  value.trim() && !disabled
                    ? 'bg-gray-900 dark:bg-[#F5F5F5] text-white dark:text-gray-900 shadow-md shadow-black/10'
                    : 'bg-gray-100 dark:bg-[#323233] text-gray-300 dark:text-[#48484A] cursor-not-allowed'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto group">
      <div className="flex flex-col bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#38383A] rounded-[28px] shadow-sm focus-within:shadow-xl focus-within:border-gray-300 dark:focus-within:border-[#48484A] transition-all duration-300 overflow-hidden">
        <div className="relative flex items-center px-2 py-2 min-h-[64px]">
          <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233] shrink-0">
            <PlusIcon size={20} />
          </button>
          
          <textarea
            ref={textareaRef}
            className="flex-1 px-2 pt-3.5 pb-1.5 text-[16px] bg-transparent text-gray-900 dark:text-[#F5F5F5] placeholder:text-gray-400 dark:placeholder:text-[#636366] outline-none resize-none transition-all min-h-[44px] max-h-[200px] leading-tight"
            placeholder={placeholder}
            rows={1}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <div className="flex items-center gap-1 px-1 shrink-0">
            <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233]">
              <MicIcon size={20} />
            </button>
            
            <button
              onClick={handleSend}
              disabled={!value.trim() || disabled}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                value.trim() && !disabled
                  ? 'bg-gray-900 dark:bg-[#F5F5F5] text-white dark:text-gray-900 shadow-lg shadow-black/10'
                  : 'bg-gray-100 dark:bg-[#323233] text-gray-300 dark:text-[#48484A] cursor-not-allowed'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-8 justify-center animate-fade-in">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s.prompt)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-gray-500 dark:text-[#98989D] bg-white dark:bg-[#2C2C2E] hover:bg-gray-50 dark:hover:bg-[#38383A] hover:text-gray-800 dark:hover:text-[#F5F5F5] rounded-full transition-all border border-gray-200 dark:border-[#38383A] shadow-sm active:scale-95"
            >
              {s.emoji && <span className="text-sm">{s.emoji}</span>}
              {!s.emoji && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="shrink-0 opacity-60">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
