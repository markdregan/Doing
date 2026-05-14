import { useState, useRef, useEffect, useCallback } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import type { ChatAttachment } from '../types'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface ChatBarProps {
  placeholder?: string
  onSend: (text: string, attachments?: ChatAttachment[]) => void
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
  )
}

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

function MicRecordingIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
      <circle cx="12" cy="12" r="11" strokeDasharray="4 3" />
    </svg>
  )
}

function AttachmentIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function XIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function FileIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function AttachmentChips({ attachments, onRemove }: { attachments: ChatAttachment[]; onRemove: (index: number) => void }) {
  if (attachments.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
      {attachments.map((att, i) => (
        <div
          key={`${att.name}-${i}`}
          className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-[#323233] rounded-md border border-gray-200 dark:border-[#38383A] max-w-[200px] group/chip"
        >
          {att.mimeType.startsWith('image/') ? (
            <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-[#48484A]">
              <img
                src={att.dataUrl}
                alt={att.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : att.mimeType === 'application/pdf' ? (
            <FileIcon size={14} />
          ) : (
            <AttachmentIcon size={14} />
          )}
          <span className="text-[11px] text-gray-500 dark:text-[#98989D] truncate flex-1 min-w-0">
            {att.name}
          </span>
          <button
            onClick={() => onRemove(i)}
            aria-label={`Remove ${att.name}`}
            className="text-gray-300 dark:text-[#636366] hover:text-gray-600 dark:hover:text-[#98989D] transition-colors flex-shrink-0 opacity-0 group-hover/chip:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
          >
            <XIcon size={10} />
          </button>
        </div>
      ))}
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File "${file.name}" exceeds the 10MB size limit`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type,
        dataUrl: reader.result as string,
      })
    }
    reader.onerror = () => reject(new Error(`Failed to read "${file.name}"`))
    reader.readAsDataURL(file)
  })
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
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)
  const isHero = variant === 'hero'

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const handleTranscript = useCallback((text: string) => {
    setValue(prev => prev + text)
  }, [])

  const handleMicError = useCallback((err: string) => {
    if (err === 'not-allowed') {
      setError('Microphone access denied')
    } else if (err === 'no-speech') {
      setError(null) // silent on no-speech, just stop
    } else {
      setError(`Mic error: ${err}`)
    }
  }, [])

  const { isRecording, supported, startRecording, stopRecording } = useSpeechRecognition(
    handleTranscript,
    handleMicError
  )

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

  // Clear error after a timeout
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(t)
  }, [error])

  const handleSend = () => {
    const text = value.trim()
    if ((!text && attachments.length === 0) || disabled) return

    // Stop recording if active
    if (isRecording) {
      stopRecording()
    }

    onSend(text, attachments.length > 0 ? attachments : undefined)
    setValue('')
    setAttachments([])
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
      if (isRecording) {
        stopRecording()
      }
      setValue('')
      setAttachments([])
      textareaRef.current?.blur()
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    onSend(prompt)
  }

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording()
    } else {
      setError(null)
      startRecording()
    }
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const results: ChatAttachment[] = []
    const fileErrors: string[] = []

    try {
      for (const file of Array.from(files)) {
        try {
          const attachment = await readFileAsDataUrl(file)
          if (mountedRef.current) {
            results.push(attachment)
          }
        } catch (err) {
          fileErrors.push(err instanceof Error ? err.message : `Failed to read ${file.name}`)
        }
      }

      if (mountedRef.current) {
        setAttachments(prev => [...prev, ...results])

        if (fileErrors.length > 0) {
          setError(fileErrors.join('. '))
        }

        // Reset the input so re-selecting the same file triggers onChange
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch {
      // Unexpected error (e.g. iteration failure) — ignore silently
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const isSendable = value.trim().length > 0 || attachments.length > 0

  if (!isHero) {
    return (
      <div className="w-full group">
        <div className="flex flex-col bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#38383A] rounded-2xl shadow-sm focus-within:shadow-lg focus-within:border-gray-300 dark:focus-within:border-[#48484A] transition-all duration-300 overflow-hidden">
          <AttachmentChips attachments={attachments} onRemove={removeAttachment} />

          <div className="relative flex items-center px-2 py-1.5 min-h-[56px]">
            <button
              onClick={handleAttachClick}
              aria-label="Attach file"
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233] shrink-0"
            >
              <PlusIcon size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

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
              {supported && (
                <button
                  onClick={handleMicClick}
                  className={`w-10 h-10 flex items-center justify-center transition-colors rounded-full ${
                    isRecording
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20 mic-recording'
                      : 'text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#323233]'
                  }`}
                  title={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicRecordingIcon size={20} /> : <MicIcon size={20} />}
                </button>
              )}

              <button
                onClick={handleSend}
                disabled={!isSendable || disabled}
                aria-label="Send message"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isSendable && !disabled
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

          {error && (
            <div className="px-3 pb-2">
              <p className="text-[11px] text-red-400 dark:text-[#F48FB1]">{error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto group">
      <div className="flex flex-col bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#38383A] rounded-[28px] shadow-sm focus-within:shadow-xl focus-within:border-gray-300 dark:focus-within:border-[#48484A] transition-all duration-300 overflow-hidden">
        <AttachmentChips attachments={attachments} onRemove={removeAttachment} />

        <div className="relative flex items-center px-2 py-2 min-h-[64px]">
          <button
            onClick={handleAttachClick}
            aria-label="Attach file"
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-[#323233] shrink-0"
          >
            <PlusIcon size={20} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

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
            {supported && (
              <button
                onClick={handleMicClick}
                className={`w-10 h-10 flex items-center justify-center transition-colors rounded-full ${
                  isRecording
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20 mic-recording'
                    : 'text-gray-400 hover:text-gray-600 dark:text-[#636366] dark:hover:text-[#98989D] hover:bg-gray-50 dark:hover:bg-[#323233]'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                {isRecording ? <MicRecordingIcon size={20} /> : <MicIcon size={20} />}
              </button>
            )}

            <button
              onClick={handleSend}
              disabled={!isSendable || disabled}
              aria-label="Send message"
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isSendable && !disabled
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

        {error && (
          <div className="px-4 pb-2">
            <p className="text-[11px] text-red-400 dark:text-[#F48FB1]">{error}</p>
          </div>
        )}
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
